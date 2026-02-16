import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

MODEL_DIR = "models/clause_extractor"

tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
model.eval()

text = " Obligation of parties to contracts. Effect of refusal to accept offer of performance.Effect of refusal of party to perform promise wholly. "
inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
with torch.no_grad():
    logits = model(**inputs).logits
    pred = torch.argmax(logits, dim=-1).item()

print("Predicted class index:", pred)
