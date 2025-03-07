import os
import requests
import pandas as pd
from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

df = pd.read_json("hf://datasets/altaidevorg/women-health-mini/women-health-mini.jsonl", lines=True)

app = FastAPI()

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

@app.post("/chat/")
def chat_with_bot(user_query:dict):
    prompt = user_query.get("message", "")

    if not prompt :
        return "Prompt is required!"
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama3-70b-8192",  
        "messages": [{"role": "user", "content": prompt}]
    }

    response = requests.post(GROQ_API_URL, json=payload, headers=headers)

    if response.status_code == 200:
        bot_reply = response.json()["choices"][0]["message"]["content"]
        return {
            "response": bot_reply
        }

    else:
        return "error in fetching the data from groq AI"

if __name__ == "__main__" :
     import uvicorn
     uvicorn.run(app, host="0.0.0.0", port=8000)