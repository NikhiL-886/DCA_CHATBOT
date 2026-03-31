import json
import os
from dotenv import load_dotenv

load_dotenv()

DATASET_PATH = os.getenv("DATASET_PATH", "./dataset.json")

def validate_dataset():
    if not os.path.exists(DATASET_PATH):
        print(f"{DATASET_PATH} not found!")
        return
    
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        print("Invalid dataset format. Expected a list of objects.")
        return

    invalid_rows = [
        idx for idx, item in enumerate(data)
        if not isinstance(item, dict) or "question" not in item or "answer" not in item
    ]

    if invalid_rows:
        print(f"Dataset has invalid rows at indexes: {invalid_rows[:10]}")
        return

    print(f"Dataset looks good. Loaded {len(data)} Q&A pairs.")

if __name__ == "__main__":
    validate_dataset()