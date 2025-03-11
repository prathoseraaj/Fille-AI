# Fille AI - Women's Health Chatbot

## Overview
Fille AI is a chatbot specialized in women's health, providing clear, factual, and supportive responses. It leverages an existing dataset and sentence embeddings to enhance response relevance while integrating Groq AI for generating responses.

## Features
- Uses the **altaidevorg/women-health-mini** dataset for knowledge enhancement.
- Implements **SentenceTransformer** for similarity matching.
- Integrates **Groq AI** for generating chatbot responses.
- Built using **FastAPI** with **CORS middleware** for API accessibility.
- Supports **real-time chat functionality** for users.

## Technologies Used
- Python
- FastAPI
- Sentence Transformers (all-MiniLM-L6-v2)
- Datasets Library
- Groq AI API
- Requests
- NumPy
- Uvicorn
- dotenv

## Installation
### Prerequisites
Ensure you have Python installed (version 3.8+ recommended).

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repository-url.git
   cd your-repository
   ```
2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv env
   source env/bin/activate  # On Windows use `env\Scripts\activate`
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables:
   - Create a `.env` file in the root directory.
   - Add your Groq API key:
     ```
     GROQ_API_KEY=your_api_key_here
     ```

## Running the Application
Run the FastAPI server using Uvicorn:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Endpoints
### 1. Chat with Bot
**Endpoint:** `/chat/`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
      "message": "Your user query here"
  }
  ```
- **Response:**
  ```json
  {
      "response": "Chatbot's response"
  }
  ```

## How It Works
1. User sends a message via `/chat/` endpoint.
2. The chatbot finds a relevant response from the dataset using Sentence Transformers.
3. A structured prompt is created with context and sent to Groq AI.
4. The AI generates a refined response, which is returned to the user.

## Inspiration
The idea for Fille AI was inspired by the need for an accessible, AI-driven assistant to provide support and information on women's health topics. Many people seek health advice online, and this chatbot aims to deliver accurate and compassionate responses in a conversational manner.

## What It Does
Fille AI responds to user queries related to women's health, providing evidence-based information and guidance. It enhances user experience by retrieving relevant knowledge from an existing dataset and improving response quality using Groq AI.

## How We Built It
- We used **FastAPI** to develop the chatbot backend.
- The **altaidevorg/women-health-mini** dataset was used to provide an initial knowledge base.
- **SentenceTransformer** was used for similarity matching to retrieve relevant responses.
- The chatbot integrates **Groq AI** to generate human-like responses.
- The API is hosted locally and can be deployed to a cloud platform for scalability.

## Challenges We Ran Into
- Fine-tuning the relevance of responses to ensure accuracy and helpfulness.
- Optimizing response times while integrating with the Groq AI API.
- Ensuring that responses remain professional, factual, and supportive.
- Handling variations in user queries and maintaining consistency in chatbot behavior.

## Accomplishments That We're Proud Of
- Successfully integrating **Groq AI** with a structured chatbot framework.
- Implementing similarity matching using **SentenceTransformer** for better response accuracy.
- Creating a robust API that can be extended for future improvements.
- Providing an engaging and informative chatbot experience for users.

## What We Learned
- How to leverage **pre-trained NLP models** for real-time chat applications.
- The importance of **data-driven response selection** in chatbot development.
- Best practices for integrating external AI APIs like **Groq AI**.
- Optimizing API performance and improving chatbot response generation.

## What's Next for Fille Bot
- Expanding the chatbot's knowledge base with more datasets for broader coverage.
- Implementing **multilingual support** to reach a wider audience.
- Developing a **mobile-friendly UI** for better accessibility.
- Enhancing security and privacy measures to protect user data.
- Exploring **voice-based interactions** for a more natural user experience.

## License
This project is licensed under the MIT License.

## Contributions
Feel free to open issues or submit pull requests to improve the chatbot.
