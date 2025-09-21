#!/bin/bash

# Setup script for Vertex AI Search and Agent Builder
# This script creates the necessary data stores and search engines

PROJECT_ID="genai-hackathon-aicommanders"
LOCATION="global"
DATASTORE_ID="sealdeal-deals-datastore"
ENGINE_ID="sealdeal-search-engine"

echo "🚀 Setting up Vertex AI Search for SealDeal..."

# Enable required APIs
echo "📡 Enabling required Google Cloud APIs..."
gcloud services enable discoveryengine.googleapis.com --project=$PROJECT_ID
gcloud services enable aiplatform.googleapis.com --project=$PROJECT_ID

# Create BigQuery data store
echo "📊 Creating BigQuery data store..."
gcloud alpha discovery-engine data-stores create \
  --data-store-id=$DATASTORE_ID \
  --display-name="SealDeal Investment Data" \
  --industry-vertical=GENERIC \
  --solution-types=SOLUTION_TYPE_SEARCH \
  --content-config=CONTENT_REQUIRED \
  --location=$LOCATION \
  --project=$PROJECT_ID

# Import BigQuery data
echo "📈 Importing deal data from BigQuery..."
gcloud alpha discovery-engine data-stores import documents \
  --data-store=$DATASTORE_ID \
  --location=$LOCATION \
  --project=$PROJECT_ID \
  --bigquery-source-project-id=$PROJECT_ID \
  --bigquery-source-dataset-id=deal_analysis \
  --bigquery-source-table-id=analyses

# Create search engine
echo "🔍 Creating search engine..."
gcloud alpha discovery-engine engines create \
  --engine-id=$ENGINE_ID \
  --display-name="SealDeal Investment Search" \
  --solution-type=SOLUTION_TYPE_SEARCH \
  --search-tier=SEARCH_TIER_ENTERPRISE \
  --search-add-ons=SEARCH_ADD_ON_LLM \
  --data-store-ids=$DATASTORE_ID \
  --location=$LOCATION \
  --project=$PROJECT_ID

echo "✅ Vertex AI Search setup complete!"
echo ""
echo "📋 Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  Data Store ID: $DATASTORE_ID" 
echo "  Engine ID: $ENGINE_ID"
echo "  Location: $LOCATION"
echo ""
echo "🔗 Access your search engine at:"
echo "  https://console.cloud.google.com/gen-app-builder/engines"
echo ""
echo "⚡ You can now test search queries using the enhanced chat agent!"