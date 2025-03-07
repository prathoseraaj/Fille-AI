import os
import requests
from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

app = FastAPI()

GROQ_API_URL = "https://api.groq.com/v1/chat/completions"

@app.post("/chat/")
def chat_with_bot(user_query:dict):
    prompt = user_query.get("message", "")

    if not prompt :
        return "Prompt is required!"
      