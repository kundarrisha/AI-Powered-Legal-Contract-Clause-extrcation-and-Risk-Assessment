from transformers import BertTokenizer, BertForSequenceClassification, Trainer
from datasets import Dataset
from sklearn.metrics import accuracy_score
import torch
import pandas as pd
from src.utils import load_cuad

# 1️⃣ Load CUAD dataset
df = load_cuad("data/CUADv1.json")
print("Loaded", len(df), "clauses")

# 2️⃣ Encode labels (must match training)
labels = {l: i for i, l in enumerate(df["clause_type"].unique())}
df["label"] = df["clause_type"].map(labels)

# 3️⃣ Split train/val (same as before)
from sklearn.model_selection import train_test_split
_, val_df = train_test_split(df, test_size=0.2, random_state=42)

# 4️⃣ Load tokenizer and model
tokenizer = BertTokenizer.from_pretrained("models/clause_extractor")
model = BertForSequenceClassification.from_pretrained("models/clause_extractor")

# 5️⃣ Tokenize validation set
def tokenize(batch):
    return tokenizer(batch["text"], padding="max_length", truncation=True, max_length=128)

val_ds = Dataset.from_pandas(val_df)
val_ds = val_ds.map(tokenize, batched=True)
val_ds.set_format("torch", columns=["input_ids", "attention_mask", "label"])

# 6️⃣ Define metrics
def compute_metrics(pred):
    labels = pred.label_ids
    preds = pred.predictions.argmax(-1)
    return {"accuracy": accuracy_score(labels, preds)}

# 7️⃣ Initialize Trainer
trainer = Trainer(
    model=model,
    compute_metrics=compute_metrics
)

# 8️⃣ Evaluate
metrics = trainer.evaluate(eval_dataset=val_ds)
print("Validation metrics:", metrics)
