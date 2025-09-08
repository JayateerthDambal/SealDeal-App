# Project Brief: AI Startup Analyst Platform
Project Goal: To build an AI-powered platform that ingests unstructured startup materials (pitch decks, emails), analyzes them using Google's AI services, and generates structured, actionable investment memos for venture capitalists.

Contact: [Your Name/Email]
Version: 1.0
Date: 2025-09-02

1. Core Problem Statement
Venture capital investors are overwhelmed by the high volume of unstructured data they receive from startups. Sifting through pitch decks, call transcripts, and email updates is a manual, time-consuming, and inconsistent process. This leads to missed opportunities and overlooked risks. This platform will automate the initial analysis, acting as an AI-powered associate to surface key insights and red flags instantly.

2. Core Features
Automated Data Ingestion:

Web-based drag-and-drop uploader for files (PDFs, PPTX, etc.).

Dedicated email address for forwarding founder communications.

AI-Powered Deal Memo Generation:

Automated extraction and structuring of key startup data (Team, Market, Traction, etc.).

AI-driven risk analysis to flag inconsistencies and concerns.

Concise, investor-ready summaries and recommendations.

Collaborative Deal Flow Dashboard:

Visual Kanban board to track deals through the investment pipeline.

Real-time commenting, tagging, and scoring on deal memos for team collaboration.

Conversational AI Analyst:

A chat interface allowing investors to ask natural language questions about their entire deal flow portfolio.

3. Mandated Technology Stack
Frontend: HTML, CSS, JavaScript (Hosted on Firebase Hosting).

Backend & Glue: Cloud Functions for serverless processing.

Database (Operational): Firebase Firestore for real-time, document-based storage.

Database (Analytical): BigQuery for storing structured data for complex queries and trend analysis.

Storage: Cloud Storage for raw file uploads.

User Management: Firebase Authentication.

AI - Document Processing: Cloud Vision AI API (for OCR).

AI - Core Logic & Analysis: Vertex AI with the Gemini Pro model.

AI - Conversational Interface: Agent Builder (Vertex AI Search and Conversation).

4. High-Level Architecture & Data Flow
Ingestion: A user uploads a file via the Firebase web app or forwards an email. The file lands in Cloud Storage.

Trigger: A Cloud Function is triggered by the new file in Cloud Storage.

Processing:

The function calls Cloud Vision AI to OCR the document and extract raw text.

The function then makes a series of chained calls to the Gemini model on Vertex AI:

Structure: Converts raw text into a structured JSON object.

Analyze: Takes the structured JSON and generates risk flags.

Summarize: Takes the JSON and risks to create a final summary and recommendation.

Storage: The final, enriched JSON object is saved to Firebase Firestore for real-time app access and simultaneously streamed to BigQuery for analytical workloads.

Presentation:

The Firebase Hosting web app listens to Firestore in real-time to display the deal memo and Kanban boards.

The embedded Agent Builder chat widget queries the BigQuery data store to answer user questions.

5. Required Data Models
5.1. Firestore Document: /deals/{dealId}
{
  "companyName": "string",
  "oneLiner": "string",
  "sector": "string",
  "ingestionDate": "timestamp",
  "status": "string", // e.g., 'Screening', 'First Call', 'Passed'
  "structuredData": {
    "team": [ { "name": "string", "experience": "string" } ],
    "problem": "string",
    "solution": "string",
    "marketSize": { "tam": "string", "sam": "string" },
    "traction": [ { "metric": "string", "value": "string", "sourcePage": "number" } ],
    "businessModel": "string"
  },
  "aiAnalysis": {
    "riskFlags": [ { "risk": "string", "severity": "string", "explanation": "string" } ],
    "recommendation": "string", // 'Strong Pass', 'Leaning Invest', etc.
    "summary": "string"
  },
  "sourceInfo": {
    "fileName": "string",
    "storagePath": "string"
  }
}

Sub-collection for comments: /deals/{dealId}/comments/{commentId}

5.2. BigQuery Table: deals_analytics.deals
A flattened version of the Firestore document for efficient SQL querying.

dealId (STRING)

companyName (STRING)

sector (STRING)

ingestionDate (TIMESTAMP)

status (STRING)

mrr (INTEGER) // Example of a flattened, typed metric

tam (STRING)

founder_count (INTEGER)

risk_count_high (INTEGER)

6. AI/ML Prompt Engineering Instructions
Prompt 1: Structuring
Model: Gemini Pro (via Vertex AI)

Persona: "You are a meticulous Venture Capital Analyst."

Task: "Extract the following information from the provided text and format it as a JSON object. Adhere strictly to the provided schema. If a field is not found, use null."

Input: Raw OCR text from Cloud Vision.

Output: structuredData JSON object.

Prompt 2: Risk Analysis
Model: Gemini Pro (via Vertex AI)

Persona: "You are a skeptical and experienced VC Partner."

Task: "Analyze the provided structured data. Identify potential red flags such as market size inflation, team gaps, unrealistic projections, or inconsistent metrics. Output a JSON array of risk objects, each with 'risk', 'severity' (Low, Medium, High), and 'explanation'."

Input: structuredData JSON object.

Output: riskFlags JSON array.

Prompt 3: Summarization
Model: Gemini Pro (via Vertex AI)

Persona: "You are a VC Principal writing a concise deal memo for the investment committee."

Task: "Synthesize the structured data and risk analysis into a final memo. Provide a 2-3 sentence executive summary and a final recommendation ('Strong Pass', 'Leaning Pass', 'Leaning Invest', 'Strong Invest')."

Input: structuredData JSON and riskFlags array.

Output: summary and recommendation strings.
