from transformers import BertTokenizer, BertForSequenceClassification, Trainer, TrainingArguments
from sklearn.model_selection import train_test_split
from datasets import Dataset
from utils import load_cuad
import torch

# 1️⃣ Load CUAD dataset
df = load_cuad("data/CUADv1.json")
print("Loaded", len(df), "clauses")

# 2️⃣ Encode labels
labels = {l: i for i, l in enumerate(df["clause_type"].unique())}
df["label"] = df["clause_type"].map(labels)

# 3️⃣ Split into train and validation sets
train_df, val_df = train_test_split(df, test_size=0.2, random_state=42)

# 4️⃣ Load tokenizer
tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")

def tokenize(batch):
    return tokenizer(batch["text"], padding="max_length", truncation=True, max_length=128)

train_ds = Dataset.from_pandas(train_df)
val_ds = Dataset.from_pandas(val_df)

train_ds = train_ds.map(tokenize, batched=True)
val_ds = val_ds.map(tokenize, batched=True)

train_ds.set_format("torch", columns=["input_ids", "attention_mask", "label"])
val_ds.set_format("torch", columns=["input_ids", "attention_mask", "label"])

# 5️⃣ Load model
model = BertForSequenceClassification.from_pretrained(
    "bert-base-uncased",
    num_labels=len(labels)
)

# 6️⃣ Define training arguments
training_args = TrainingArguments(
    output_dir="models/clause_extractor",
    num_train_epochs=1,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    logging_dir="./logs",
    report_to=None  # None instead of "none"
)


# 7️⃣ Initialize Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_ds,
    eval_dataset=val_ds
)

# 8️⃣ Train
trainer.train()

# 9️⃣ Save the model
model.save_pretrained("models/clause_extractor")
tokenizer.save_pretrained("models/clause_extractor")

print("✅ Model training complete and saved in models/clause_extractor/")
