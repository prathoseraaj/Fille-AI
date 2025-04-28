[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/release/python-380/) [![React Native](https://img.shields.io/badge/React%20Native-20232A?logo=react&logoColor=61DAFB)](https://reactnative.dev/) [![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)


# Fille AI - Women's Health Chatbot

## Overview

Fille AI is an AI-powered chatbot focused on women's health, providing clear, factual, and supportive responses. It leverages an existing dataset and sentence embeddings to enhance response relevance while integrating Groq AI for natural conversation. The mobile application is built with React Native for ease of use, and Node.js is used for managing real-time chat with doctors when needed.

## Features

- Built with React Native for mobile accessibility
- Uses the altaidevorg/women-health-mini dataset for knowledge enhancement
- Implements SentenceTransformer for semantic similarity matching
- Integrates Groq AI for generating human-like responses
- Backend powered by Node.js for real-time communication with certified doctors
- Supports real-time chat functionality for escalated health concerns

## Technologies Used

- **React Native** (Mobile Application)
- **Node.js** (Server for real-time chat)
- **FastAPI** (Bot API)
- **Python**
- **Sentence Transformers** (all-MiniLM-L6-v2)
- **Datasets Library**
- **Groq AI API**
- **Socket.io** (for real-time chat)
- **Requests**
- **NumPy**
- **dotenv**

## Installation

### Prerequisites

- Node.js and npm installed
- Python 3.8+ installed
- React Native environment set up

### Steps

#### For Mobile App

1. Clone the repository:
   ```bash
   git clone https://github.com/Fille-AI.git
   cd your-repository
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React Native app:
   ```bash
   npm start
   ```

#### For Backend (Bot API + Real-time server)

1. Create and activate a virtual environment:
   ```bash
   python -m venv env
   source env/bin/activate  # On Windows use `env\Scripts\activate`
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set environment variables:
   Create a `.env` file:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. Start the FastAPI server:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

5. Start the Node.js real-time server:
   ```bash
   cd server
   node server.js
   ```

## How It Works

1. Users interact with the chatbot through the React Native app.
2. The chatbot fetches a relevant response using Sentence Transformers and Groq AI.
3. If the chatbot cannot satisfy the query, it automatically connects the user to a certified doctor via real-time chat (handled by the Node.js server and Socket.io).

## API Endpoints (Bot Interaction)

- **Endpoint**: `/chat/`
- **Method**: POST
- **Request Body**:
  ```json
  {
      "message": "Your user query here"
  }
  ```
- **Response**:
  ```json
  {
      "response": "Chatbot's response"
  }
  ```

## Project Background

### Inspiration
The idea behind Fille AI was to create an accessible, AI-driven health assistant specifically for women's health needs, offering quick answers and a pathway to real medical consultation when needed.

### What It Does
- Responds to women's health queries with evidence-based information
- Uses real-time matching and AI response generation to maintain relevance
- Connects users to certified doctors for real-time consultations if necessary

### How We Built It
- FastAPI was used for the chatbot backend
- Node.js and Socket.io were used for the real-time doctor chat server
- React Native was used to build a simple, mobile-friendly user interface
- SentenceTransformer and Groq AI were integrated for intelligent responses

### Challenges We Faced
- Ensuring high-quality, accurate, and supportive responses
- Optimizing chatbot responsiveness while integrating Groq AI and similarity search
- Managing smooth and secure real-time communication with doctors

### Accomplishments
- Successfully integrated AI-driven conversation with real doctor support
- Built a complete mobile solution using React Native
- Designed a scalable architecture combining FastAPI, Node.js, and React Native

## Future Enhancements

- Expanding the health knowledge base
- Adding multilingual support
- Improving security and privacy for sensitive health information
- Building voice-chat features for accessibility
- Deploying servers for better availability and scaling across geographies

## License

[MIT License](LICENSE)

## License
This project is licensed under the MIT License.

