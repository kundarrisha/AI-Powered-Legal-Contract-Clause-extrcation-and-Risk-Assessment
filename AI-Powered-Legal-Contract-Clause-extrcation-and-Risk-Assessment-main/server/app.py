from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import base64
import io
import os
import re
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
from PyPDF2 import PdfReader
import numpy as np

# ----------------------
# Data Models
# ----------------------
class InlineData(BaseModel):
    data: str
    mimeType: Optional[str] = "application/octet-stream"

class FileContent(BaseModel):
    inlineData: InlineData

class ClauseOut(BaseModel):
    clauseText: str
    clauseType: str
    riskLevel: str
    justification: str

class AnalysisReportOut(BaseModel):
    executiveSummary: str
    overallRiskScore: float
    clauses: List[ClauseOut]

# ----------------------
# FastAPI setup
# ----------------------
app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health/")
def health():
    try:
        _ = getattr(model, 'config', None)
        model_loaded = True
    except Exception:
        model_loaded = False
    return {"ok": True, "model_loaded": model_loaded}

# ----------------------
# Load your trained model & tokenizer
# ----------------------
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models', 'clause_extractor')

if not os.path.isdir(MODEL_DIR):
    raise RuntimeError(f"Model directory not found at {MODEL_DIR}")

print("Loading trained model from:", MODEL_DIR)

tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR, trust_remote_code=True)
model.eval()

# Extract label mappings from model config
num_labels = model.config.num_labels if hasattr(model.config, 'num_labels') else 0

# Try to get label names from config, otherwise create generic ones
if hasattr(model.config, 'id2label') and model.config.id2label:
    id2label = model.config.id2label
else:
    id2label = {i: f"LABEL_{i}" for i in range(num_labels)}

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)
print(f"Model loaded on device: {device}, num_labels={num_labels}")

# Define clause type patterns for better classification
CLAUSE_PATTERNS = {
    "termination": ["terminat", "cancel", "end of agreement", "dissolution"],
    "payment": ["payment", "fee", "price", "cost", "compensation", "remuneration"],
    "liability": ["liab", "indemnif", "damages", "loss", "harm"],
    "confidentiality": ["confidential", "non-disclos", "proprietary", "secret"],
    "intellectual_property": ["intellectual property", "patent", "copyright", "trademark", "ip rights"],
    "warranty": ["warrant", "represent", "guarantee"],
    "dispute": ["dispute", "arbitrat", "litigation", "governing law", "jurisdiction"],
    "term": ["term", "duration", "period", "renewal", "expiration"],
    "assignment": ["assign", "transfer", "change of control"],
    "limitation": ["limitation", "exclusion", "disclaim"],
}

# ----------------------
# Helper functions
# ----------------------
def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        texts = [page.extract_text() or '' for page in reader.pages]
        return '\n'.join(texts)
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return ''

def split_into_clauses(text: str) -> List[str]:
    """Improved clause splitting to get meaningful segments"""
    if not text:
        return []
    
    # Normalize whitespace
    text = re.sub(r"\r\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    
    # First split by double newlines (paragraphs)
    paragraphs = re.split(r"\n\s*\n+", text)
    
    clauses = []
    for para in paragraphs:
        para = para.strip()
        
        # Split long paragraphs by sentences if they're too long
        if len(para) > 500:
            # Split by period followed by space and capital letter
            sentences = re.split(r'\.(?=\s+[A-Z])', para)
            
            current_chunk = ""
            for sent in sentences:
                sent = sent.strip()
                if not sent:
                    continue
                    
                # Add to current chunk
                if current_chunk:
                    current_chunk += ". " + sent
                else:
                    current_chunk = sent
                
                # If chunk is good size, add it
                if len(current_chunk) >= 100:
                    clauses.append(current_chunk.strip())
                    current_chunk = ""
            
            # Add remaining
            if current_chunk and len(current_chunk) >= 50:
                clauses.append(current_chunk.strip())
        else:
            # Use paragraph as-is if it's a good size
            if len(para) >= 50:
                clauses.append(para)
    
    print(f"Split text into {len(clauses)} clauses")
    return clauses

def classify_clause_by_content(text: str) -> tuple[str, float]:
    """Classify clause based on keyword matching as fallback"""
    text_lower = text.lower()
    
    scores = {}
    for clause_type, keywords in CLAUSE_PATTERNS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            scores[clause_type] = score
    
    if scores:
        best_type = max(scores.items(), key=lambda x: x[1])
        confidence = min(0.95, 0.6 + (best_type[1] * 0.1))  # Scale confidence
        return best_type[0], confidence
    
    return "general", 0.3

def predict_clause_type(text: str) -> tuple[str, float]:
    """Predict clause type using model and keyword fallback"""
    # Truncate very long text
    if len(text) > 512:
        text = text[:512]
    
    try:
        inputs = tokenizer(text, padding=True, truncation=True, max_length=128, return_tensors='pt')
        inputs = {k: v.to(device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=-1)
            
            # Get top prediction
            confidence, pred_id = torch.max(probs, dim=-1)
            confidence = float(confidence.item())
            pred_id = int(pred_id.item())
            
            # Get label name
            model_label = id2label.get(pred_id, f"LABEL_{pred_id}")
            
            # If model gives generic label or low confidence, use keyword matching
            if model_label.startswith("LABEL_") or confidence < 0.5:
                keyword_type, keyword_conf = classify_clause_by_content(text)
                # Blend confidences
                final_conf = (confidence * 0.3) + (keyword_conf * 0.7)
                return keyword_type, final_conf
            
            return model_label.lower(), confidence
    except Exception as e:
        print(f"Prediction error: {e}, using keyword fallback")
        return classify_clause_by_content(text)

def map_label_to_risk(label: str, confidence: float) -> str:
    """Map clause type to risk level"""
    ll = label.lower()
    
    # High risk clauses
    high_risk = [
        "termination", "terminat", "liability", "liab", "indemnif",
        "confidential", "penalty", "liquidated", "non-compete",
        "exclusivity", "assignment", "change of control"
    ]
    
    # Medium risk clauses
    medium_risk = [
        "payment", "fee", "intellectual", "ip", "warranty", "warrant",
        "dispute", "arbitrat", "governing", "limitation", "disclaim",
        "term", "renewal"
    ]
    
    # Check high risk
    if any(keyword in ll for keyword in high_risk):
        return "High" if confidence > 0.4 else "Medium"
    
    # Check medium risk
    if any(keyword in ll for keyword in medium_risk):
        return "Medium" if confidence > 0.3 else "Low"
    
    # Default to low
    return "Low"

# ----------------------
# Main analyze endpoint
# ----------------------
@app.post("/analyze/", response_model=AnalysisReportOut)
async def analyze(file_content: FileContent):
    try:
        b64 = file_content.inlineData.data
        mime = file_content.inlineData.mimeType or "application/octet-stream"
        file_bytes = base64.b64decode(b64)

        # Extract text
        text = ""
        if "pdf" in mime.lower():
            text = extract_text_from_pdf_bytes(file_bytes)
        else:
            try:
                text = file_bytes.decode("utf-8")
            except Exception:
                text = file_bytes.decode("latin-1")

        if not text:
            raise HTTPException(status_code=400, detail="Could not extract text from uploaded file")

        print(f"Extracted {len(text)} characters from file")

        # Split into clauses & analyze
        clauses = split_into_clauses(text)
        
        if not clauses:
            raise HTTPException(status_code=400, detail="No valid clauses found in document")
        
        out_clauses = []
        high_count = medium_count = low_count = 0

        for i, clause in enumerate(clauses):
            clause_type, confidence = predict_clause_type(clause)
            risk = map_label_to_risk(clause_type, confidence)
            
            if risk == "High": 
                high_count += 1
            elif risk == "Medium": 
                medium_count += 1
            else: 
                low_count += 1
            
            # Truncate for display
            display_text = clause if len(clause) <= 400 else clause[:397] + "..."
            
            # Create better justification
            risk_reason = ""
            if risk == "High":
                risk_reason = "This clause contains provisions that may significantly impact your obligations or rights."
            elif risk == "Medium":
                risk_reason = "This clause requires attention and may have moderate implications."
            else:
                risk_reason = "This appears to be a standard clause with lower risk."
            
            out_clauses.append({
                "clauseText": display_text,
                "clauseType": clause_type.replace("_", " ").title(),
                "riskLevel": risk,
                "justification": f"{risk_reason} Classified as '{clause_type.replace('_', ' ').title()}' (confidence: {confidence:.0%})."
            })
            
            print(f"Clause {i+1}: {clause_type} | Risk: {risk} | Confidence: {confidence:.2%}")

        total = max(1, len(clauses))
        # Calculate risk score: High=1.0, Medium=0.5, Low=0.0
        overall_score = round((high_count*1.0 + medium_count*0.5)/total*100, 1)
        
        summary = (
            f"Analyzed {len(out_clauses)} clauses from contract. "
            f"Risk Distribution: {high_count} High-Risk, {medium_count} Medium-Risk, {low_count} Low-Risk. "
            f"Recommend careful review of high-risk clauses before signing."
        )

        print(f"✓ Analysis complete: Score={overall_score}, High={high_count}, Med={medium_count}, Low={low_count}")

        return {
            "executiveSummary": summary,
            "overallRiskScore": overall_score,
            "clauses": out_clauses
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error during analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")