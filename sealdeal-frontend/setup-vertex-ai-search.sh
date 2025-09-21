#!/bin/bash

# Setup Vertex AI Search and Conversation for Deal Flow Analysis
# Following the bigquery-chatbot-integration.md documentation

PROJECT_ID="genai-hackathon-aicommanders"
LOCATION="global"
APP_NAME="deal-flow-analyst"
DATA_STORE_ID="deal-analysis-datastore"

echo "🚀 Setting up Vertex AI Search and Conversation..."
echo "📊 Project: $PROJECT_ID"
echo "🗂️  BigQuery Table: projects/$PROJECT_ID/datasets/deal_analysis/tables/analyses"

# Enable required APIs
echo "📡 Enabling Vertex AI APIs..."
gcloud services enable discoveryengine.googleapis.com --project=$PROJECT_ID
gcloud services enable dialogflow.googleapis.com --project=$PROJECT_ID
gcloud services enable aiplatform.googleapis.com --project=$PROJECT_ID

echo "✅ APIs enabled successfully!"
echo ""
echo "🔗 Manual Setup Required:"
echo "   1. Open Vertex AI Console: https://console.cloud.google.com/vertex-ai/search"
echo "   2. Click '+ New App' and select 'Search' type"
echo "   3. Name your app: '$APP_NAME'"
echo "   4. Create a data store with:"
echo "      - Data Source: BigQuery"
echo "      - Table URI: projects/$PROJECT_ID/datasets/deal_analysis/tables/analyses"
echo "      - Data Store ID: $DATA_STORE_ID"
echo ""
echo "📋 BigQuery Table Schema includes:"
echo "   - dealName, dealId, investment_recommendation"
echo "   - metrics_arr_value, metrics_mrr_value, metrics_ltv_value"  
echo "   - executive_summary, growth_potential, benchmarking_summary"
echo "   - strengths, weaknesses, opportunities, threats, risk_flags"
echo ""
echo "🧪 Test Queries to try:"
echo "   - 'How many deals are analyzed?'"
echo "   - 'Show me all strong candidate deals'"
echo "   - 'What are the key risks for deal X?'"
echo "   - 'Compare ARR values across deals'"
echo ""
echo "🔗 After setup, get the integration code from:"
echo "   Vertex AI Console > Your App > Integrate tab"