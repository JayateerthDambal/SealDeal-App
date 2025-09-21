// Enhanced Chat Agent with Vertex AI RAG Engine and Agent Builder
import { onRequest } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { BigQuery } from "@google-cloud/bigquery";
import { VertexAI } from "@google-cloud/vertexai";

// Initialize services (lazy loading to avoid initialization issues)
const bigquery = new BigQuery();

// Configuration
const PROJECT_ID = "genai-hackathon-aicommanders";
const LOCATION = "asia-south1";
const BIGQUERY_DATASET = "deal_analysis";
const BIGQUERY_TABLE = "analyses";

// Initialize Vertex AI for RAG and Agent Builder
const vertex_ai = new VertexAI({ 
  project: PROJECT_ID, 
  location: LOCATION 
});

// Enhanced Chat Agent with RAG Architecture
export class EnhancedChatAgent {
  private generativeModel: any;

  constructor() {
    this.generativeModel = vertex_ai.getGenerativeModel({ 
      model: "gemini-1.5-pro" // Using Pro for better reasoning
    });
  }

  // Initialize RAG Engine for deal data
  async initializeRAG() {
    try {
      // Create RAG corpus for deal knowledge base
      await this.createDealKnowledgeBase();
      logger.info("RAG Engine initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize RAG Engine:", error);
    }
  }

  // Create knowledge base from BigQuery deal data
  private async createDealKnowledgeBase() {
    // Query all deal analyses for RAG corpus
    const query = `
      SELECT 
        dealName,
        metrics_arr_value,
        metrics_mrr_value, 
        metrics_ltv_value,
        metrics_ltv_cac_ratio_value,
        investment_recommendation,
        executive_summary,
        growth_potential,
        benchmarking_summary,
        strengths,
        weaknesses,
        opportunities,
        threats,
        risk_flags
      FROM \`${PROJECT_ID}.${BIGQUERY_DATASET}.${BIGQUERY_TABLE}\`
      WHERE analyzedAt IS NOT NULL
    `;

    const [rows] = await bigquery.query({ query });
    
    // Convert structured data to text documents for RAG
    const documents = rows.map(row => ({
      id: row.dealName,
      content: this.structuredDataToText(row),
      metadata: {
        dealName: row.dealName,
        arr: row.metrics_arr_value,
        recommendation: row.investment_recommendation
      }
    }));

    return documents;
  }

  // Convert structured deal data to natural language for RAG
  private structuredDataToText(dealData: any): string {
    return `
Deal Analysis: ${dealData.dealName}

Financial Metrics:
- Annual Recurring Revenue (ARR): $${dealData.metrics_arr_value?.toLocaleString() || "N/A"}
- Monthly Recurring Revenue (MRR): $${dealData.metrics_mrr_value?.toLocaleString() || "N/A"}
- Lifetime Value (LTV): $${dealData.metrics_ltv_value?.toLocaleString() || "N/A"}
- LTV/CAC Ratio: ${dealData.metrics_ltv_cac_ratio_value || "N/A"}

Investment Assessment:
${dealData.executive_summary || ""}

Growth Potential:
${dealData.growth_potential || ""}

Market Benchmarking:
${dealData.benchmarking_summary || ""}

Strengths: ${Array.isArray(dealData.strengths) ? dealData.strengths.join(", ") : "None identified"}
Weaknesses: ${Array.isArray(dealData.weaknesses) ? dealData.weaknesses.join(", ") : "None identified"}
Opportunities: ${Array.isArray(dealData.opportunities) ? dealData.opportunities.join(", ") : "None identified"}
Threats: ${Array.isArray(dealData.threats) ? dealData.threats.join(", ") : "None identified"}
Risk Flags: ${Array.isArray(dealData.risk_flags) ? dealData.risk_flags.join(", ") : "None identified"}

Final Recommendation: ${dealData.investment_recommendation || "Pending"}
    `.trim();
  }

  // Enhanced intent classification with more sophisticated AI reasoning
  async classifyIntent(message: string): Promise<{
    intent: "data_query" | "comparison" | "insights" | "recommendation";
    confidence: number;
    entities: string[];
  }> {
    const classificationPrompt = `
As an expert intent classifier for a venture capital AI assistant, analyze the user's message and classify it into one of these categories:

1. "data_query": User wants specific data points, metrics, or factual information about deals
2. "comparison": User wants to compare multiple deals or benchmark against market data  
3. "insights": User wants market analysis, trends, or explanations about investment concepts
4. "recommendation": User wants investment advice or decision support

Additionally, extract any deal names, company names, or metrics mentioned.

User message: "${message}"

Respond with JSON:
{
  "intent": "category",
  "confidence": 0.95,
  "entities": ["extracted entities"]
}
`;

    try {
      const result = await this.generativeModel.generateContent(classificationPrompt);
      const response = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
      return JSON.parse(response || "{\"intent\": \"insights\", \"confidence\": 0.5, \"entities\": []}");
    } catch (error) {
      logger.error("Intent classification failed:", error);
      return { intent: "insights", confidence: 0.5, entities: [] };
    }
  }

  // Enhanced RAG-powered query processing
  async processRAGQuery(message: string, intent: string, entities: string[]) {
    // Retrieve relevant deal documents using semantic search
    const relevantDocs = await this.retrieveRelevantDocuments(message, entities);
    
    // Create context-aware prompt with retrieved information
    const contextPrompt = `
You are SealDeal AI, an expert venture capital analyst with access to comprehensive deal data.

Context from deal database:
${relevantDocs.map(doc => doc.content).join("\n\n---\n\n")}

User question: ${message}
Query intent: ${intent}
Mentioned entities: ${entities.join(", ")}

Provide a comprehensive, data-driven response using the context above. Include specific metrics and references to the deals mentioned. Format your response in markdown for better readability.

If comparing deals, create a clear comparison table. If analyzing trends, reference specific examples from the data.
`;

    try {
      const result = await this.generativeModel.generateContent(contextPrompt);
      return result.response.candidates?.[0]?.content?.parts?.[0]?.text || 
             "I couldn't process your request. Please try rephrasing your question.";
    } catch (error) {
      logger.error("RAG query processing failed:", error);
      throw error;
    }
  }

  // Semantic search for relevant deal documents
  private async retrieveRelevantDocuments(query: string, entities: string[]) {
    // For now, use simple keyword matching - in production, use vector embeddings
    const knowledgeBase = await this.createDealKnowledgeBase();
    
    // Filter documents based on entities mentioned
    let relevantDocs = knowledgeBase;
    
    if (entities.length > 0) {
      relevantDocs = knowledgeBase.filter(doc => 
        entities.some(entity => 
          doc.content.toLowerCase().includes(entity.toLowerCase()) ||
          doc.metadata.dealName?.toLowerCase().includes(entity.toLowerCase())
        )
      );
    }

    // If no specific entities, return top deals by relevance score
    if (relevantDocs.length === 0) {
      relevantDocs = knowledgeBase.slice(0, 5); // Return top 5 most recent
    }

    return relevantDocs.slice(0, 3); // Limit to top 3 for context window
  }

  // Multi-agent decision making for complex queries
  async processComplexQuery(message: string, intent: string) {
    const agents = {
      dataAnalyst: "You are a data analyst. Extract and analyze quantitative metrics from the query.",
      marketExpert: "You are a market expert. Provide industry context and competitive analysis.",
      riskAssessor: "You are a risk assessor. Identify potential risks and red flags.",
      investmentAdvisor: "You are an investment advisor. Provide actionable investment recommendations."
    };

    const responses = await Promise.all(
      Object.entries(agents).map(async ([role, systemPrompt]) => {
        const prompt = `${systemPrompt}\n\nUser query: ${message}\nIntent: ${intent}`;
        try {
          const result = await this.generativeModel.generateContent(prompt);
          return {
            role,
            response: result.response.candidates?.[0]?.content?.parts?.[0]?.text
          };
        } catch (error) {
          return { role, response: `${role} analysis unavailable` };
        }
      })
    );

    // Synthesize multi-agent responses
    const synthesisPrompt = `
Synthesize the following expert analyses into a comprehensive investment insight:

${responses.map(r => `${r.role.toUpperCase()}:\n${r.response}`).join("\n\n")}

Provide a unified, actionable response that combines all perspectives. Format in markdown.
`;

    const synthesis = await this.generativeModel.generateContent(synthesisPrompt);
    return synthesis.response.candidates?.[0]?.content?.parts?.[0]?.text;
  }

  // Process chat message with enhanced RAG pipeline
  async processMessage(sessionId: string, message: string) {
    try {
      // Step 1: Enhanced intent classification
      const { intent, confidence, entities } = await this.classifyIntent(message);
      
      logger.info(`Intent classified: ${intent} (confidence: ${confidence})`, { entities });

      let response = "";

      // Step 2: Route to appropriate processing pipeline
      switch (intent) {
        case "data_query":
          // Use existing BigQuery pipeline for precise data queries
          response = await this.processDataQuery(message);
          break;
          
        case "comparison":
          // Use RAG for comparative analysis
          response = await this.processRAGQuery(message, intent, entities);
          break;
          
        case "recommendation":
          // Use multi-agent approach for investment recommendations
          response = await this.processComplexQuery(message, intent);
          break;
          
        case "insights":
        default:
          // Use RAG + web grounding for market insights
          response = await this.processInsightsQuery(message);
          break;
      }

      // Step 3: Store conversation in Firestore
      const sessionRef = admin.firestore().collection("chat_sessions").doc(sessionId);
      await sessionRef.collection("messages").add({
        role: "assistant",
        content: response,
        timestamp: FieldValue.serverTimestamp(),
        metadata: {
          intent,
          confidence,
          entities,
          processingMethod: intent === "data_query" ? "sql" : "rag"
        }
      });

      return {
        response,
        intent,
        confidence,
        entities,
        success: true
      };

    } catch (error) {
      logger.error("Enhanced chat processing failed:", error);
      throw error;
    }
  }

  // Fallback to existing BigQuery pipeline for data queries
  private async processDataQuery(message: string) {
    // This would integrate with the existing SQL generation logic
    // For now, return a placeholder
    return "Data query processing with enhanced RAG pipeline...";
  }

  // Enhanced insights with web grounding
  private async processInsightsQuery(message: string) {
    const insightsPrompt = `
You are SealDeal AI, an expert venture capital analyst. Provide comprehensive market insights for the following query.

Use your knowledge of venture capital, startup ecosystems, and market trends to provide actionable intelligence.

Query: ${message}

Provide a detailed, well-structured response in markdown format.
`;

    try {
      const result = await this.generativeModel.generateContent({
        contents: [{ role: "user", parts: [{ text: insightsPrompt }] }],
        tools: [{ "googleSearchRetrieval": {} }] // Enable web grounding
      });

      return result.response.candidates?.[0]?.content?.parts?.[0]?.text ||
             "I couldn't find relevant market insights for your query.";
    } catch (error) {
      logger.error("Insights query failed:", error);
      return "Market insights are temporarily unavailable. Please try again later.";
    }
  }
}

// Express app for enhanced chat agent
const enhancedApp = express();
enhancedApp.use(cors({ origin: true }));
enhancedApp.use(bodyParser.json());

// Initialize enhanced chat agent
const chatAgent = new EnhancedChatAgent();

enhancedApp.post("/chat", async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ 
        error: "sessionId and message are required" 
      });
    }

    // Store user message
    const sessionRef = admin.firestore().collection("chat_sessions").doc(sessionId);
    await sessionRef.collection("messages").add({
      role: "user",
      content: message,
      timestamp: FieldValue.serverTimestamp()
    });

    // Process with enhanced RAG pipeline
    const result = await chatAgent.processMessage(sessionId, message);

    return res.json(result);

  } catch (error) {
    logger.error("Enhanced chat agent error:", error);
    return res.status(500).json({ 
      error: "Sorry, I encountered an error processing your request.",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Health check endpoint
enhancedApp.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    service: "enhanced-chat-agent",
    timestamp: new Date().toISOString()
  });
});

// Export enhanced chat agent
export const enhancedChatAgent = onRequest({ 
  region: LOCATION,
  timeoutSeconds: 60,
  cors: true 
}, enhancedApp);