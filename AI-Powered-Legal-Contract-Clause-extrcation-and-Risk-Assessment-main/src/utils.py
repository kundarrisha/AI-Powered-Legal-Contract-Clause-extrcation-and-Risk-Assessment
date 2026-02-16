import json
import pandas as pd

def load_cuad(file_path="data/CUADv1.json"):
    """
    Load CUAD dataset and convert it to a DataFrame
    with 'text' (clause text) and 'clause_type' (label).
    """
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    rows = []

    for contract in data["data"]:
        for para in contract["paragraphs"]:
            context = para["context"]
            for qa in para["qas"]:
                clause_type = qa["question"]  # use question as label
                for ans in qa["answers"]:
                    text = ans["text"]
                    rows.append({"text": text, "clause_type": clause_type})

    df = pd.DataFrame(rows)
    return df
