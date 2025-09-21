// 1. Standard Firebase and Tooling Imports
import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import { onObjectFinalized } from "firebase-functions/v2/storage";
import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { BigQuery } from "@google-cloud/bigquery";
import { VertexAI, GenerateContentResult } from "@google-cloud/vertexai";


// 2. Express Imports for the Chat Agent
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";


// --- INITIALIZATION ---
admin.initializeApp();
const db = admin.firestore();
const bigquery = new BigQuery();


// --- CONFIGURATION ---
const PROJECT_ID = "genai-hackathon-aicommanders";
const LOCATION = "asia-south1";
const BIGQUERY_DATASET = "deal_analysis";
const BIGQUERY_TABLE = "analyses";


// --- EMULATOR SETTINGS ---
if (process.env.FUNCTIONS_EMULATOR === "true") {
    logger.info("Emulator detected! Connecting to local Firestore instance.");
    db.settings({ host: "localhost:8080", ssl: false });
}

// --- RBAC HELPER ---
/**
 * Checks if the calling user has the required role or is a general admin.
 * Throws an HttpsError if the user is not authorized.
 */
const ensureHasRole = async (uid: string, requiredRole: string) => {
    const user = await admin.auth().getUser(uid);
    const userRole = user.customClaims?.role as string | undefined;
    // Admins have all permissions. Otherwise, check for the specific role.
    if (userRole !== "admin" && userRole !== requiredRole) {
        throw new HttpsError("permission-denied", `You must have the '${requiredRole}' or 'admin' role to perform this action.`);
    }
};

// --- RBAC & BENCHMARKING FUNCTIONS ---

export const setUserRole = onCall({ region: LOCATION, cors: true }, async (request) => {
    if (!request.auth) { throw new HttpsError("unauthenticated", "You must be logged in."); }
    // Use the role checker to ensure the caller is an admin
    await ensureHasRole(request.auth.uid, "admin");

    const { targetUid, newRole } = request.data;
    if (!targetUid || !newRole) {
        throw new HttpsError("invalid-argument", "A 'targetUid' and 'newRole' must be provided.");
    }
    try {
        await admin.auth().setCustomUserClaims(targetUid, { role: newRole });
        logger.info(`Admin ${request.auth.uid} successfully set role '${newRole}' for user ${targetUid}`);
        return { success: true, message: `User role has been updated to ${newRole}.` };
    } catch (error) {
        logger.error("Error setting user role:", error);
        throw new HttpsError("internal", "Failed to set user role.");
    }
});

export const addBenchmarkData = onCall({ region: LOCATION, cors: true }, async (request) => {
    if (!request.auth) { throw new HttpsError("unauthenticated", "You must be logged in."); }
    // Check if user is an admin or a benchmarking_admin
    await ensureHasRole(request.auth.uid, "benchmarking_admin");

    const { industry, stage, arr } = request.data;
    if (!industry || !stage || arr === undefined) {
        throw new HttpsError("invalid-argument", "Industry, stage, and ARR are required.");
    }
    try {
        const benchmarkDoc = { ...request.data, addedBy: request.auth.uid, createdAt: FieldValue.serverTimestamp() };
        await db.collection("benchmarks").add(benchmarkDoc);
        return { success: true, message: "Benchmark data added successfully." };
    } catch (error) {
        logger.error("Error adding benchmark data:", error);
        throw new HttpsError("internal", "Failed to add benchmark data.");
    }
});

// --- STANDARD APPLICATION FUNCTIONS ---


export const createDeal = onCall({ region: LOCATION, cors: true }, async (request) => {
    if (!request.auth) { throw new HttpsError("unauthenticated", "You must be logged in."); }
    const { dealName } = request.data;
    if (!dealName) { throw new HttpsError("invalid-argument", "A 'dealName' must be provided."); }
    try {
        const dealData = { ownerId: request.auth.uid, dealName, status: "1_AwaitingUpload", createdAt: FieldValue.serverTimestamp() };
        const dealRef = await db.collection("deals").add(dealData);
        return { dealId: dealRef.id, message: "Deal created successfully." };
    } catch (error) {
        logger.error("Error creating Deal in Firestore:", error);
        throw new HttpsError("internal", "Firestore write failed while creating deal.");
    }
});


export const processUploadedFile = onObjectFinalized({ region: LOCATION }, async (event) => {
    const file = event.data;
    const filePath = file.name;
    const fileName = filePath?.split("/").pop();
    if (!filePath || !fileName) { return; }


    const pathParts = filePath.split("/");
    if (pathParts.length !== 4 || pathParts[0] !== "uploads") { return; }


    const userId = pathParts[1];
    const dealId = pathParts[2];


    try {
        await db.collection("deals").doc(dealId).collection("documents").add({ fileName, storagePath: filePath, uploadedAt: FieldValue.serverTimestamp() });
        await db.collection("deals").doc(dealId).update({ status: "2_Processing" });
        await runAnalysisLogic(dealId, userId);
    } catch (error) {
        logger.error(`Error processing file for deal ${dealId}:`, error);
        await db.collection("deals").doc(dealId).update({ status: "Error_Processing_Failed" }).catch();
    }
});


export const startComprehensiveAnalysis = onCall({ region: LOCATION, timeoutSeconds: 540, cors: true }, async (request) => {
    if (!request.auth) { throw new HttpsError("unauthenticated", "Authentication is required."); }
    const { dealId } = request.data;
    if (!dealId) { throw new HttpsError("invalid-argument", "A 'dealId' must be provided."); }
    try {
        return await runAnalysisLogic(dealId, request.auth.uid);
    } catch (error) {
        logger.error(`Error during HTTP-triggered analysis for deal ${dealId}:`, error);
        await db.collection("deals").doc(dealId).update({ status: "Error_Analysis_Failed" }).catch();
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new HttpsError("internal", "An error occurred during the analysis.", { details: errorMessage });
    }
});




async function runAnalysisLogic(dealId: string, uid: string) {
    logger.info(`Starting comprehensive analysis logic for deal ${dealId}...`);


    try {
        // --- BIGQUERY FIX PART 1: Get the deal document to access its name ---
        const dealDoc = await db.collection("deals").doc(dealId).get();
        if (!dealDoc.exists) {
            throw new Error(`Deal with ID ${dealId} not found.`);
        }
        const dealName = dealDoc.data()?.dealName || "Unknown Deal";


        const documentsSnapshot = await db.collection("deals").doc(dealId).collection("documents").get();
        if (documentsSnapshot.empty) { throw new Error(`No documents found for deal ${dealId}.`); }


        const documentPromises = documentsSnapshot.docs.map(async (doc) => {
            const { storagePath, fileName } = doc.data();
            const [fileBuffer] = await admin.storage().bucket().file(storagePath).download();


            if (fileName.endsWith(".pdf")) { return { type: "presentation", data: fileBuffer.toString("base64"), fileName, mimeType: "application/pdf" }; }
            if (fileName.endsWith(".pptx")) { return { type: "presentation", data: fileBuffer.toString("base64"), fileName, mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation" }; }

            let content = "";
            if (fileName.endsWith(".csv")) { content = parse(fileBuffer).join("\n"); }
            else if (fileName.endsWith(".xlsx")) {
                const workbook = XLSX.read(fileBuffer, { type: "buffer" });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                content = XLSX.utils.sheet_to_csv(worksheet);
            } else { content = fileBuffer.toString("utf-8"); }
            return { type: "text", data: content, fileName };
        });


        const processedDocuments = await Promise.all(documentPromises);
        const presentationParts = processedDocuments.filter((d) => d.type === "presentation" && d.mimeType).map((d) => ({ inline_data: { mime_type: d.mimeType!, data: d.data } }));
        const textContent = processedDocuments.filter((d) => d.type === "text").map((d) => `--- [START OF DOCUMENT: ${d.fileName}] ---\n${d.data}\n--- [END OF DOCUMENT: ${d.fileName}] ---`).join("\n\n");
        const benchmarkSnapshot = await db.collection("benchmarks").where("industry", "==", "SaaS").limit(10).get();
        const benchmarkData = benchmarkSnapshot.docs.map((doc) => doc.data());


        const prompt = `
            Act as a world-class venture capital analyst. Your task is to perform a comprehensive due diligence analysis of a startup based on a collection of provided documents (which may include pitch decks, financial models, etc.) and peer benchmark data.


            **Crucially, you must cross-reference information across all provided documents to check for inconsistencies.**


            Perform the following steps in order and structure your response in the specified JSON format.


            1.  **Metric Extraction & Calculation**:
                - Identify and extract key financial and traction metrics.
                - Understand concepts, not just keywords (e.g., "Lifetime Value" is LTV).
                - If a primary metric isn"t stated, calculate it from its components if possible (e.g., LTV = ARPU / Churn Rate).
                - For each metric, provide the "value" and the exact "source_quote" from the document that supports it. If calculated, explain in the "notes".


            2.  **SWOT Analysis**:
                - Based on the document, generate a concise Strengths, Weaknesses, Opportunities, and Threats analysis. Each should be a short bullet point.


            3.  **Risk Assessment**:
                - Analyze the document for common investment red flags: inflated or poorly defined market size (TAM/SAM/SOM), unrealistic growth projections, high churn, weak unit economics (LTV:CAC), or key metrics missing entirely.
                - List any identified risks as clear, concise strings in the "risk_flags" array.


            4.  **Benchmarking & Market Context**:
                - Compare the startup"s key metrics (especially ARR and LTV:CAC ratio) against the provided benchmark data.
                - In the "benchmarking_summary", state whether the startup is performing below, at, or above the median for its peers and provide brief context.


            5.  **Investment Memo Synthesis**:
                - **Executive Summary**: Write a brief, neutral, 2-3 sentence executive summary of the investment opportunity.
                - **Growth Potential**: Write a 2-3 sentence summary of the startup"s growth potential and strategy.
                - **Recommendation**: Provide a final "investment_recommendation" from one of the following options: "Strong Candidate", "Proceed with Caution", "Further Diligence Required", or "Pass".


            **RESPONSE FORMAT**:
            - Respond ONLY with a valid JSON object that strictly adheres to the schema below. Do not include any text or markdown formatting outside of the JSON structure.


            --- [BENCHMARK DATA FOR CONTEXT] ---
            ${JSON.stringify(benchmarkData)}


            --- [PROCESSED TEXT DOCUMENTS] ---
            ${textContent}


            **JSON SCHEMA**:
            {
              "metrics": {
                "arr": { "value": number | null, "source_quote": "string | null", "notes": "string | null" },
                "mrr": { "value": number | null, "source_quote": "string | null", "notes": "string | null" },
                "cac": { "value": number | null, "source_quote": "string | null", "notes": "string | null" },
                "ltv": { "value": number | null, "source_quote": "string | null", "notes": "string | null" },
                "ltv_cac_ratio": { "value": number | null, "source_quote": "string | null", "notes": "string | null" },
                "gross_margin": { "value": number | null, "source_quote": "string | null", "notes": "string | null" }
              },
              "swot_analysis": {
                "strengths": ["List of strengths."],
                "weaknesses": ["List of weaknesses."],
                "opportunities": ["List of opportunities."],
                "threats": ["List of threats."]
              },
              "risk_flags": ["List of identified risk factors."],
              "benchmarking_summary": "A one-sentence analysis comparing the startup to its peers.",
              "investment_memo": {
                "executive_summary": "A 2-3 sentence summary of the investment opportunity.",
                "growth_potential": "A 2-3 sentence summary of the startup's growth potential.",
                "investment_recommendation": "One of the four specified recommendation options."
              }
            }
        `;

        const allParts: ({ text: string } | { inline_data: { mime_type: string; data: string } })[] = [{ text: prompt }, ...presentationParts];
        if (textContent.trim().length > 0) allParts.push({ text: textContent });

        const requestBody = { contents: [{ role: "user", parts: allParts }] };
        const model = "gemini-1.5-flash-002";
        const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${model}:generateContent`;
        const credential = admin.credential.applicationDefault();
        const accessToken = await credential.getAccessToken();
        const response = await fetch(url, {
            method: "POST",
            headers: { "Authorization": `Bearer ${accessToken.access_token}`, "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });


        if (!response.ok) { throw new Error(`API call failed: ${await response.text()}`); }
        const responseData = await response.json();
        const jsonResponse = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!jsonResponse) { throw new Error("Gemini returned an invalid response."); }


        const extractedData = JSON.parse(jsonResponse.substring(jsonResponse.indexOf("{"), jsonResponse.lastIndexOf("}") + 1));
        const analysisDocument = { ...extractedData, sourceFiles: documentsSnapshot.docs.map((d) => d.data().fileName), analyzedAt: FieldValue.serverTimestamp(), dealId: dealId, createdBy: uid, version: "2.0" };
        const analysisRef = await db.collection("deals").doc(dealId).collection("analysis").add(analysisDocument);
        logger.info(`Analysis saved to Firestore for deal ${dealId}.`);


        const bqRow = {
            analysisId: analysisRef.id,
            dealId: dealId,
            dealName: dealName,
            createdBy: uid,
            analyzedAt: new Date().toISOString(),
            sourceFiles: documentsSnapshot.docs.map((d) => d.data().fileName),
            metrics_arr_value: extractedData.metrics?.arr?.value || null,
            metrics_arr_source: extractedData.metrics?.arr?.source_quote || null,
            metrics_mrr_value: extractedData.metrics?.mrr?.value || null,
            metrics_mrr_source: extractedData.metrics?.mrr?.source_quote || null,
            metrics_cac_value: extractedData.metrics?.cac?.value || null,
            metrics_cac_source: extractedData.metrics?.cac?.source_quote || null,
            metrics_ltv_value: extractedData.metrics?.ltv?.value || null,
            metrics_ltv_source: extractedData.metrics?.ltv?.source_quote || null,
            metrics_ltv_cac_ratio_value: extractedData.metrics?.ltv_cac_ratio?.value || null,
            metrics_ltv_cac_ratio_source: extractedData.metrics?.ltv_cac_ratio?.source_quote || null,
            metrics_gross_margin_value: extractedData.metrics?.gross_margin?.value || null,
            metrics_gross_margin_source: extractedData.metrics?.gross_margin?.source_quote || null,
            investment_recommendation: extractedData.investment_memo?.investment_recommendation || null,
            executive_summary: extractedData.investment_memo?.executive_summary || null,
            growth_potential: extractedData.investment_memo?.growth_potential || null,
            benchmarking_summary: extractedData.benchmarking_summary || null,
            strengths: extractedData.swot_analysis?.strengths || [],
            weaknesses: extractedData.swot_analysis?.weaknesses || [],
            opportunities: extractedData.swot_analysis?.opportunities || [],
            threats: extractedData.swot_analysis?.threats || [],
            risk_flags: extractedData.risk_flags || [],
        };


        await bigquery.dataset(BIGQUERY_DATASET).table(BIGQUERY_TABLE).insert([bqRow]);
        logger.info(`Analysis for deal ${dealId} successfully exported to BigQuery.`);

        await db.collection("deals").doc(dealId).update({ status: "4_Analyzed" });
        return { success: true, message: "Analysis completed successfully." };
    } catch (error) {
        throw error;
    }
}

// --- CROSS-DEAL COMPARISON FUNCTION ---

export const getComparisonData = onCall({ region: LOCATION, cors: true }, async (request) => {
    if (!request.auth) { throw new HttpsError("unauthenticated", "You must be logged in."); }
    const { dealIds } = request.data as { dealIds: string[] };
    if (!dealIds || !Array.isArray(dealIds) || dealIds.length === 0) {
        throw new HttpsError("invalid-argument", "An array of 'dealIds' must be provided.");
    }
    const comparisonPromises = dealIds.map(async (dealId) => {
        const dealDoc = await db.collection("deals").doc(dealId).get();
        const analysisQuery = await db.collection("deals").doc(dealId).collection("analysis").orderBy("analyzedAt", "desc").limit(1).get();
        return { dealId, dealName: dealDoc.data()?.dealName || "Unknown", analysis: analysisQuery.empty ? null : analysisQuery.docs[0].data() };
    });
    const comparisonData = await Promise.all(comparisonPromises);
    return { success: true, data: comparisonData };
});


// --- CHAT AGENT (EXPRESS APP) ---


const agentApp = express();
agentApp.use(cors({ origin: true }));
agentApp.use(bodyParser.json());


const vertex_ai = new VertexAI({ project: PROJECT_ID, location: "asia-south1" });
const generativeModel = vertex_ai.getGenerativeModel({ model: "gemini-1.5-flash-002" });


// --- UPDATED HELPER FUNCTIONS FOR RESPONSE FORMATTING ---


// Makes column names like 'metrics_arr_value' more human-readable -> 'ARR'
function formatHeader(header: string): string {
    return header.replace(/metrics_|_value|_source/g, " ").replace(/_/g, " ").trim().toUpperCase();
}


// Formats values, adding USD for known currency metrics
function formatValue(key: string, value: unknown): string {
    if (typeof value !== "number") {
        return String(value);
    }
    const currencyMetrics = ["arr", "mrr", "cac", "ltv"];
    if (currencyMetrics.some(metric => key.toLowerCase().includes(metric))) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            notation: "compact",
            maximumFractionDigits: 2
        }).format(value);
    }
    return value.toLocaleString();
}


// Main formatting logic with new single-value handling
function formatBigQueryResults(rows: Record<string, unknown>[]): string {
    if (!rows || rows.length === 0) return "No results found for your query.";


    // Handle single-value results with a conversational sentence
    if (rows.length === 1 && Object.keys(rows[0]).length === 1) {
        const key = Object.keys(rows[0])[0];
        const value = rows[0][key];
        
        // Handle count queries specifically
        if (key.includes("count") || key.startsWith("f0_")) {
            return `There are ${value} deals analyzed in the database.`;
        }
        
        const formattedValue = formatValue(key, value);
        const formattedKey = formatHeader(key);
        return `The ${formattedKey} is ${formattedValue}.`;
    }


    // Handle table results with formatted values
    const headers = Object.keys(rows[0]);
    const formattedHeaders = headers.map(formatHeader);
    const tableHeader = `| ${formattedHeaders.join(" | ")} |`;
    const separator = `| ${headers.map(() => "---").join(" | ")} |`;
    const tableRows = rows.map(row =>
        `| ${headers.map(header => formatValue(header, row[header])).join(" | ")} |`
    );


    return [tableHeader, separator, ...tableRows].join("\n");
}


// Helper for implementing retries with delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


agentApp.post("/chat", async (req, res) => {
    try {
        const { sessionId, message } = req.body;
        if (!sessionId || !message) {
            return res.status(400).json({ error: "sessionId and message are required" });
        }


        const sessionRef = db.collection("chat_sessions").doc(sessionId);
        await sessionRef.collection("messages").add({ role: "user", text: message, timestamp: FieldValue.serverTimestamp() });


        // --- INTENT CLASSIFICATION STEP ---
        const classificationPrompt = `
            Your task is to classify the user's intent. Respond with only one of two possible values: "data_query" or "insights_query".
            - "data_query": The user is asking for specific data points, numbers, or lists from their internal database (e.g., "What is the ARR for Test 1?", "List all deals").
            - "insights_query": The user is asking for general knowledge, trends, explanations, or information that requires up-to-date, external world knowledge (e.g., "What are the latest trends in the SaaS market?", "Explain LTV/CAC ratio").
            User message: "${message}"
            Intent:
        `;
        const intentResult = await generativeModel.generateContent(classificationPrompt);
        const intent = intentResult.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "insights_query";
        logger.info("User intent classified as:", { intent });


        let formattedResults = "";
        // eslint-disable-next-line prefer-const
        let sqlQuery = "N/A";

        if (intent === "data_query") {
            // --- ENHANCED PROMPT WITH MORE DETAIL AND GUARDRAILS ---
            const schema = `
          Table 1: \`genai-hackathon-aicommanders.deal_analysis.analyses\` (This table contains the user's private, analyzed deals).
          Key Columns & Common Synonyms:
          - dealName: STRING (The display name of the deal. Synonyms: "deal name", "company name")
          - metrics_arr_value: FLOAT (Annual Recurring Revenue in USD. Synonyms: "ARR", "annual revenue")
          - metrics_mrr_value: FLOAT (Monthly Recurring Revenue in USD. Synonyms: "MRR", "monthly revenue")
          - metrics_ltv_value: FLOAT (Customer Lifetime Value in USD. Synonyms: "LTV", "lifetime value")
          - metrics_ltv_cac_ratio_value: FLOAT (Ratio of LTV to Customer Acquisition Cost. Synonyms: "LTV/CAC ratio", "ltv cac")
          - investment_recommendation: STRING (e.g., "Strong Candidate", "Pass". Synonyms: "recommendation", "verdict")
          - strengths: STRING (REPEATED)
          - risk_flags: STRING (REPEATED. Synonyms: "risks", "flags", "red flags")


          Table 2: \`genai-hackathon-aicommanders.genhackathon.InvestmentVC\` (This table contains public, historical data about VC investments for benchmarking).
          Key Columns & Common Synonyms:
          - name: STRING (The official company name. Synonyms: "company", "organization")
          - market: STRING (The industry market, e.g., 'Hospitality', 'Education'. Synonyms: "industry", "sector")
          - funding_total_usd: FLOAT (Total venture funding in USD. Synonyms: "total funding", "investment")
        `;


            const prompt = `
            You are a world-class BigQuery SQL expert. Your task is to convert a natural language question into a single, valid BigQuery SQL query.
           
            RULES:
            1.  You have access to two tables. Use the following detailed schemas: ${schema}
            2.  You can join these tables on \`deal_analysis.analyses.dealName\` = \`genhackathon.InvestmentVC.name\`.
            3.  You MUST map natural language terms and acronyms to the correct technical column names based on the schema descriptions and synonyms. For example, if a user asks for "LTV", you must query the "metrics_ltv_value" column.
            4.  Prioritize querying the \`deal_analysis.analyses\` table if the question refers to the user's own deals (e.g., "Test 1", "my deals").
            5.  Respond ONLY with the raw SQL query. Do not include any other text, formatting, or explanations.


            Example 1 (Querying User's Deals with Synonym and Case-Insensitivity):
            Question: "What is the LTV for test 1?"
            SQL: SELECT metrics_ltv_value FROM \`genai-hackathon-aicommanders.deal_analysis.analyses\` WHERE LOWER(dealName) = 'test 1'


            Example 2 (Querying Public Data):
            Question: "list the top 5 companies in the Hospitality sector by total funding"
            SQL: SELECT name, funding_total_usd FROM \`genai-hackathon-aicommanders.genhackathon.InvestmentVC\` WHERE market = 'Hospitality' ORDER BY funding_total_usd DESC LIMIT 5


            Example 3 (Complex Join):
            Question: "compare the total funding of Test 1 with the average funding in its market"
            SQL: WITH DealMarket AS (SELECT T2.market FROM \`genai-hackathon-aicommanders.deal_analysis.analyses\` AS T1 JOIN \`genai-hackathon-aicommanders.genhackathon.InvestmentVC\` AS T2 ON T1.dealName = T2.name WHERE T1.dealName = 'Test 1') SELECT t1.dealName, t2.funding_total_usd, (SELECT AVG(funding_total_usd) FROM \`genai-hackathon-aicommanders.genhackathon.InvestmentVC\` WHERE market = (SELECT market FROM DealMarket)) as average_market_funding FROM \`genai-hackathon-aicommanders.deal_analysis.analyses\` AS t1 JOIN \`genai-hackathon-aicommanders.genhackathon.InvestmentVC\` AS t2 ON t1.dealName = t2.name WHERE t1.dealName = 'Test 1'


            ---
            Now, convert the following question based on all the rules above:
            Question: "${message}"
            SQL:
        `;
            // --- RETRY LOGIC STARTS HERE ---
            let llmResp: GenerateContentResult | undefined;
            const maxRetries = 3;
            let attempt = 0;
            let lastError: Error | null = null;


            while (attempt < maxRetries) {
                try {
                    llmResp = await generativeModel.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
                    break; // Success, exit loop
                } catch (err: unknown) {
                    lastError = err as Error;
                    // Specifically check for 429 Resource Exhausted error
                    if (lastError.message.includes("429")) {
                        attempt++;
                        if (attempt < maxRetries) {
                            const delayTime = Math.pow(2, attempt) * 1000; // 2s, 4s
                            logger.warn(`Rate limit hit. Retrying in ${delayTime / 1000}s...`);
                            await delay(delayTime);
                        }
                    } else {
                        // It's a different kind of error, don't retry
                        throw lastError;
                    }
                }
            }


            if (!llmResp) {
                logger.error("Failed to get response from Vertex AI after multiple retries.", { lastError });
                throw new HttpsError("unavailable", "The AI service is currently overloaded. Please try again later.");
            }
            // --- RETRY LOGIC ENDS HERE ---

            const sqlQuery = llmResp.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim().replace(/```sql|```/g, "") || "";


            if (!sqlQuery) {
                throw new Error("Could not generate a valid SQL query.");
            }

            const [rows] = await bigquery.query({ query: sqlQuery });
            const formattedResults = formatBigQueryResults(rows);


            await sessionRef.collection("messages").add({
                role: "assistant",
                sql: sqlQuery,
                result: formattedResults,
                timestamp: FieldValue.serverTimestamp(),
            });


            return res.json({
                sql: sqlQuery,
                result: rows,
                formatted: formattedResults,
            });


        } else {
            // --- Logic for Web-Grounded Insights ---
            const insightsPrompt = `
                Act as an expert investment analyst. The user is asking for market insights or explanations.
                Answer the following question in a comprehensive, well-structured, and helpful way.
                Use your general knowledge and the provided search results to formulate your answer.
                Format your response using Markdown.
                Question: "${message}"
            `;

            const groundedResult = await generativeModel.generateContent({
                contents: [{ role: "user", parts: [{ text: insightsPrompt }] }],
                tools: [{ "googleSearchRetrieval": {} }] // Enable Google Search grounding
            });


            formattedResults = groundedResult.response.candidates?.[0]?.content?.parts?.[0]?.text || "I was unable to find any information on that topic.";
        }


        // --- Store and Respond ---
        await sessionRef.collection("messages").add({
            role: "assistant", sql: sqlQuery, result: formattedResults, timestamp: FieldValue.serverTimestamp(),
        });


        return res.json({ sql: sqlQuery, formatted: formattedResults });
    }

    catch (err: unknown) {
        const error = err as Error;
        logger.error("Chat Agent Error:", error.message, { originalError: err });
        // Return a more specific error if it's the one we handled
        if (error instanceof HttpsError && (error as HttpsError).code === "unavailable") {
            return res.status(503).json({ error: error.message });
        }
        return res.status(500).json({ error: "Sorry, I encountered an error processing your request." });
    }
});


// CORRECTED: Export the Express app by wrapping it in onRequest.
// This creates a single, regionally-aware HTTP endpoint for the agent.
export const chatAgent = onRequest({ region: "asia-south1" }, agentApp);

// Export enhanced chat agent with RAG and Agent Builder
export { enhancedChatAgent } from "./enhanced-chat-agent.js";

