# Things to Do for MVP

This document outlines the necessary tasks to get the SealDeal platform to a Minimum Viable Product (MVP) state.

## Backend (Firebase Cloud Functions)

- **`createDeal` Function:**
  - [ ] Ensure the Cloud Function correctly creates a new deal document in Firestore with the `ownerId` and initial `status`.

- **`startComprehensiveAnalysis` Function (Core Logic):**
  - [ ] Create an HTTP-triggered function that accepts a `dealId`.
  - [ ] Fetch all document paths for the given deal from Cloud Storage.
  - [ ] **For each document:**
    - [ ] Call Cloud Vision AI API to perform OCR and extract raw text.
    - [ ] Call the Vertex AI (Gemini Pro) API with the "Structuring" prompt to convert the text into a structured JSON object.
    - [ ] Call the Vertex AI (Gemini Pro) API with the "Risk Analysis" prompt to identify red flags from the structured data.
    - [ ] Call the Vertex AI (Gemini Pro) API with the "Summarization" prompt to generate the executive summary and recommendation.
  - [ ] Aggregate the analysis from all documents for the deal.
  - [ ] Save the complete, aggregated analysis to the `/deals/{dealId}/analysis` sub-collection in Firestore.
  - [ ] Update the status of the parent deal document (e.g., to 'Analyzed').

- **`handleEmailIngestion` Function:**
  - [ ] Set up a third-party service (e.g., SendGrid Inbound Parse) to receive emails and trigger a Cloud Function.
  - [ ] In the function, parse the incoming email to extract the sender, subject, and attachments.
  - [ ] Create a new deal in Firestore based on the email details.
  - [ ] Upload the email attachments to the corresponding deal's folder in Cloud Storage.
  - [ ] (Optional) Automatically trigger the `startComprehensiveAnalysis` function for the new deal.

## Frontend (React App)

- **Dashboard UI/UX:**
  - [ ] Convert the current deal list into a Kanban board with columns representing deal statuses (e.g., 'Screening', 'Uploaded', 'Analyzing', 'Analyzed', 'Passed').
  - [ ] Implement drag-and-drop functionality to move deals between columns and update their status in Firestore.

- **Analysis Display:**
  - [ ] Add a loading indicator that is displayed while the `startComprehensiveAnalysis` function is running.
  - [ ] Ensure all fields from the `AnalysisData` type are being displayed correctly and gracefully handle missing data.

- **Collaboration Features:**
  - [ ] Create a `Comments` component.
  - [ ] Add a sub-collection for `comments` under each deal in Firestore.
  - [ ] Implement a simple form to add new comments to a deal.
  - [ ] Display comments in real-time on the analysis page.

## GCP & Firebase Configuration

- **IAM & Permissions:**
  - [ ] Ensure the service account for your Cloud Functions has the necessary roles/permissions for Vertex AI, Cloud Vision AI, Cloud Storage, and Firestore.

- **Firestore Security Rules:**
  - [ ] Refine the security rules to ensure users can only read/write their own deals and associated data.
  - [ ] Add rules for the new `comments` sub-collection.

- **BigQuery Integration:**
  - [ ] Create the `deals_analytics` dataset and the `deals` table in BigQuery with the schema defined in `planning.md`.
  - [ ] Set up a Firestore to BigQuery Export extension (or a custom Cloud Function trigger) to automatically sync new analysis data.

- **Conversational AI (Agent Builder):**
  - [ ] Create a new agent in Vertex AI Search and Conversation.
  - [ ] Connect the agent to your BigQuery `deals` table as a data store.
  - [ ] Embed the chat widget into the frontend application.

## Deployment

- [ ] Deploy all Firebase Cloud Functions.
- [ ] Deploy all Firestore security rules and indexes.
- [ ] Deploy the React application to Firebase Hosting.
