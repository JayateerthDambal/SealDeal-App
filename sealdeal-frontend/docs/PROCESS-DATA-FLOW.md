# AI Analyst - Process Flow & Data Flow

## Current Process Flow (As Built)

### **Step 1: User Creates Deal**
```
User Input → Firebase Auth Check → Create Deal Record → Store in Firestore
```

### **Step 2: Document Upload** 
```
Drag & Drop Files → Firebase Storage Upload → Eventarc Trigger → Cloud Function
```
**Issues**: Eventarc permissions broken - documents don't auto-link to deals

### **Step 3: Document Analysis**
```
User Clicks "Analyze" → startComprehensiveAnalysis Function → 
Download from Storage → Send to Gemini → Process Response → Store Results
```

### **Step 4: Display Results**
```
Firestore Listener → Real-time UI Update → Show Analysis Results
```

---

## Target Data Flow (Full Google AI Stack)

### **Enhanced Process Flow**

```
1. UPLOAD
   User uploads files → Firebase Storage → Eventarc trigger

2. PROCESS  
   Cloud Function → Cloud Vision (OCR) → Extract text/tables
   
3. ANALYZE
   Combined text → Gemini AI → Structured analysis
   
4. BENCHMARK
   Extract metrics → BigQuery lookup → Compare to industry data
   
5. STORE
   Results → Firestore (real-time) + BigQuery (analytics)
   
6. DISPLAY
   Dashboard shows results + risk flags + benchmarks
   
7. CHAT
   User asks questions → Agent Builder → Query BigQuery → Response
```

---

## Detailed Data Flow

### **Document Processing Pipeline**

**Input**: PDF, Excel, PPT, Email
↓
**Cloud Vision API**: 
- OCR for scanned documents
- Table extraction from spreadsheets
- Text recognition from images
↓
**Preprocessing**:
- Combine OCR text with original text
- Structure data by document type
- Clean and normalize content
↓
**Gemini AI Analysis**:
- Industry-specific prompts
- Extract financial metrics
- Identify risks and opportunities
- Generate executive summary
↓
**Structured Output**:
```json
{
  "dealName": "TechCorp Inc",
  "metrics": {
    "arr": {"value": 2500000, "confidence": 0.95, "source": "Financial Model, Sheet 2"},
    "cac": {"value": 250, "confidence": 0.87, "source": "Pitch Deck, Slide 12"}
  },
  "risks": [
    {"flag": "High CAC", "severity": "medium", "explanation": "CAC of $250 is above industry median of $180"}
  ],
  "recommendation": "Proceed with caution - strong traction but unit economics need improvement"
}
```

### **Benchmarking Data Flow**

**BigQuery Tables**:
```sql
-- Industry benchmarks by stage and sector
benchmarks: {
  industry: "SaaS",
  stage: "Series A", 
  median_arr: 1200000,
  median_cac: 180,
  median_ltv: 2400
}

-- Deal analysis results
deal_analysis: {
  deal_id: "deal123",
  metrics: {...},
  benchmark_percentiles: {...}
}
```

**Comparison Logic**:
```
Deal Metrics → Query Relevant Benchmarks → Calculate Percentiles → 
Generate Insights ("95th percentile growth" or "Below median efficiency")
```

### **Conversational AI Flow**

**Agent Builder Setup**:
```
BigQuery Connection → Knowledge Base (benchmarks + deal data) → 
Natural Language Understanding → SQL Generation → Response Formatting
```

**Query Examples**:
- "How does TechCorp compare to other SaaS deals?"
- "What are the main risks for this investment?"
- "Show me all deals with CAC > $300"

---

## Technical Implementation

### **Firebase Functions Architecture**

1. **`linkDocumentToDeal`** (Storage Trigger)
   - Triggered when file uploaded
   - Links document to deal record
   - **Status**: Broken (Eventarc permissions)

2. **`startComprehensiveAnalysis`** (HTTP Callable)
   - User-triggered analysis
   - Downloads all deal documents
   - Calls Gemini AI for analysis
   - **Status**: Working but needs enhancement

3. **`syncToBigQuery`** (New - Firestore Trigger)
   - Auto-sync analysis results to BigQuery
   - Enable portfolio-level analytics
   - **Status**: Needs implementation

### **Data Storage Strategy**

**Firestore** (Real-time app data):
```
deals/{dealId} → {
  dealName, ownerId, status, createdAt
}

deals/{dealId}/documents/{docId} → {
  fileName, storagePath, uploadedAt
}

deals/{dealId}/analysis/{analysisId} → {
  metrics, risks, recommendations, analyzedAt
}
```

**BigQuery** (Analytics & benchmarking):
```
-- Benchmark reference data
industry_benchmarks: industry, stage, metric_name, median_value, p75_value

-- Deal analysis for querying  
deal_metrics: deal_id, deal_name, industry, stage, arr, cac, ltv, risk_score

-- Portfolio analytics
portfolio_summary: firm_id, total_deals, avg_arr, success_rate
```

---

## Current System Gaps

### **Missing Components**
1. ❌ **Cloud Vision Integration** - No OCR for scanned documents
2. ❌ **BigQuery Setup** - No benchmarking data
3. ❌ **Agent Builder** - No conversational interface
4. ❌ **Document Auto-linking** - Eventarc permissions broken

### **Performance Issues**
1. **Large File Processing**: Current system may timeout on 50+ page documents
2. **No Caching**: Re-processes same document types repeatedly  
3. **No Batch Processing**: Processes files sequentially vs. parallel

### **Data Quality Issues**
1. **No Validation**: Extracted metrics not cross-checked for consistency
2. **No Confidence Scoring**: Can't tell how reliable the analysis is
3. **No Error Handling**: Fails silently on malformed documents

---

## Hackathon Implementation Priority

### **Day 1 (Critical Path)**
1. Fix Eventarc permissions for document linking
2. Enable Cloud Vision API
3. Test end-to-end: Upload → Link → Analyze → Display

### **Day 2 (Enhancement)**  
1. Add Cloud Vision OCR to document processing
2. Improve Gemini prompts for structured output
3. Add confidence scoring to metrics

### **Day 3 (Intelligence)**
1. Create BigQuery benchmark database
2. Add benchmark comparison logic
3. Implement risk flag detection

### **Day 7-9 (Conversational AI)**
1. Setup Agent Builder with BigQuery connection
2. Create knowledge base with benchmarks
3. Implement chat interface

---

## Success Metrics for Data Flow

### **Performance Targets**
- **Upload to Analysis**: <2 minutes for 50-page PDF
- **OCR Accuracy**: >95% for standard business documents  
- **Benchmark Matching**: 100% of SaaS deals get industry comparison
- **Query Response**: <3 seconds for conversational AI

### **Data Quality Targets**
- **Metric Extraction**: >90% accuracy on financial metrics
- **Risk Detection**: Identify 3+ risk flags per deal
- **Consistency Check**: Flag contradictions across documents
- **Confidence Scoring**: Provide reliability score for each metric

This data flow creates a sophisticated AI analyst that can process complex startup documents and provide institutional-quality investment analysis at scale.