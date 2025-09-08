import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onObjectFinalized } from "firebase-functions/v2/storage";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";


import { parse } from "csv-parse/sync";
import * as Excel from "exceljs";


admin.initializeApp();
const db = admin.firestore();


// TODO: Use ENV later.
const PROJECT_ID = "genai-hackathon-aicommanders";
const LOCATION = "asia-south1";


if (process.env.FUNCTIONS_EMULATOR === "true") {
    logger.info("Emulator detected! Connecting to local Firestore instance.");
    db.settings({ host: "localhost:8080", ssl: false });
}


// createDeal function remains the same.
export const createDeal = onCall({ region: LOCATION }, async (request) => {
    if (!request.auth) { throw new HttpsError("unauthenticated", "You must be logged in."); }
    const dealName = request.data.dealName;
    if (!dealName) { throw new HttpsError("invalid-argument", "A 'dealName' must be provided."); }
    try {
        const dealData = {
            ownerId: request.auth.uid, dealName, status: "1_Uploaded",
            createdAt: FieldValue.serverTimestamp(),
        };
        const dealRef = await db.collection("deals").add(dealData);
        return { dealId: dealRef.id, message: "Deal created successfully." };
    } catch (error) {
        console.error("Error creating deal:", error);
        throw new HttpsError("internal", "Firestore write failed.");
    }
});


// linkDocumentToDeal function remains the same.
export const linkDocumentToDeal = onObjectFinalized({ region: LOCATION }, async (event) => {
    const file = event.data;
    const filePath = file.name;
    const fileName = filePath?.split("/").pop();
    if (!filePath || !fileName) { return; }
    const pathParts = filePath.split("/");
    if (pathParts.length !== 4) { return; }
    const dealId = pathParts[2];
    try {
        await db.collection("deals").doc(dealId).collection("documents").add({
            fileName, storagePath: filePath,
            uploadedAt: FieldValue.serverTimestamp(),
        });
        logger.info(`Successfully linked ${fileName} to deal ${dealId}`);
    } catch (error) {
        console.error(`Error linking document to deal ${dealId}:`, error);
    }
});




// --- UPGRADED AI FUNCTION ---
/**
 * A user-triggered function to perform a comprehensive analysis on ALL
 * documents associated with a deal, now with expanded file type support.
 */
export const startComprehensiveAnalysis = onCall({ region: LOCATION, timeoutSeconds: 540 }, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "You must be logged in to start an analysis.");
    }
    const { dealId } = request.data;
    if (!dealId) {
        throw new HttpsError("invalid-argument", "A 'dealId' must be provided.");
    }


    logger.info(`Starting comprehensive analysis for deal ${dealId}...`);
    await db.collection("deals").doc(dealId).update({ status: "2_Processing" });


    try {
        // Step 1: Fetch and process all documents for the deal
        const documentsSnapshot = await db.collection("deals").doc(dealId).collection("documents").get();
        if (documentsSnapshot.empty) {
            throw new Error("No documents found for this deal.");
        }


        const documentPromises = documentsSnapshot.docs.map(async (doc) => {
            const { storagePath, fileName } = doc.data();
            const [fileBuffer] = await admin.storage().bucket().file(storagePath).download();

            // --- EXPANDED FILE TYPE HANDLING ---
            if (fileName.endsWith('.pdf')) {
                return { type: 'presentation', data: fileBuffer.toString('base64'), fileName, mimeType: 'application/pdf' };
            } else if (fileName.endsWith('.pptx')) {
                return { type: 'presentation', data: fileBuffer.toString('base64'), fileName, mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
            } else {
                let content = "";
                if (fileName.endsWith('.csv')) {
                    content = parse(fileBuffer).join('\n');
                } else if (fileName.endsWith('.xlsx')) {
                    const workbook = new Excel.Workbook();
                    // DEFINITIVE FIX: Use a type assertion to resolve the incompatibility.
                    await workbook.xlsx.load(fileBuffer as Buffer);
                    const worksheet = workbook.worksheets[0];
                    const csvData: string[] = [];
                    worksheet.eachRow((row) => {
                        csvData.push((row.values as Excel.CellValue[]).slice(1).join(','));
                    });
                    content = csvData.join('\n');
                } else if (fileName.endsWith('.json')) {
                    content = JSON.stringify(JSON.parse(fileBuffer.toString('utf-8')));
                } else {
                    content = fileBuffer.toString('utf-8');
                }
                return { type: 'text', data: content, fileName };
            }
        });


        const processedDocuments = await Promise.all(documentPromises);


        // Step 2: Prepare the content for Gemini
        const presentationParts = processedDocuments
            .filter(d => d.type === 'presentation')
            .map(d => ({ inline_data: { mime_type: d.mimeType, data: d.data } }));

        const textContent = processedDocuments
            .filter(d => d.type === 'text')
            .map(d => `--- [START OF DOCUMENT: ${d.fileName}] ---\n${d.data}\n--- [END OF DOCUMENT: ${d.fileName}] ---`)
            .join('\n\n');


        // Step 3: Fetch Benchmark Data
        const benchmarkSnapshot = await db.collection("benchmarks").where("industry", "==", "SaaS").limit(10).get();
        const benchmarkData = benchmarkSnapshot.docs.map((doc) => doc.data());
        logger.info(`Fetched ${benchmarkData.length} benchmark comparables.`);


        // Step 4: Construct the Advanced AI Prompt
        const prompt = `
            Act as a world-class venture capital analyst. Your task is to perform a comprehensive due diligence analysis of a startup based on a collection of provided documents (which may include pitch decks, financial models, etc.) and peer benchmark data.


            **Crucially, you must cross-reference information across all provided documents to check for inconsistencies.**


            Perform the following steps in order and structure your response in the specified JSON format.


            1.  **Metric Extraction & Calculation**:
                - Identify and extract key financial and traction metrics.
                - Understand concepts, not just keywords (e.g., "Lifetime Value" is LTV).
                - If a primary metric isn't stated, calculate it from its components if possible (e.g., LTV = ARPU / Churn Rate).
                - For each metric, provide the 'value' and the exact 'source_quote' from the document that supports it. If calculated, explain in the 'notes'.


            2.  **SWOT Analysis**:
                - Based on the document, generate a concise Strengths, Weaknesses, Opportunities, and Threats analysis. Each should be a short bullet point.


            3.  **Risk Assessment**:
                - Analyze the document for common investment red flags: inflated or poorly defined market size (TAM/SAM/SOM), unrealistic growth projections, high churn, weak unit economics (LTV:CAC), or key metrics missing entirely.
                - List any identified risks as clear, concise strings in the 'risk_flags' array.


            4.  **Benchmarking & Market Context**:
                - Compare the startup's key metrics (especially ARR and LTV:CAC ratio) against the provided benchmark data.
                - In the 'benchmarking_summary', state whether the startup is performing below, at, or above the median for its peers and provide brief context.


            5.  **Investment Memo Synthesis**:
                - **Executive Summary**: Write a brief, neutral, 2-3 sentence executive summary of the investment opportunity.
                - **Growth Potential**: Write a 2-3 sentence summary of the startup's growth potential and strategy.
                - **Recommendation**: Provide a final 'investment_recommendation' from one of the following options: "Strong Candidate", "Proceed with Caution", "Further Diligence Required", or "Pass".


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

        const allParts = [{ text: prompt }, ...presentationParts];
        if (textContent.trim().length > 0) {
            allParts.push({ text: textContent });
        }

        const requestBody = { contents: [{ role: "user", parts: allParts }] };
        console.log(PROJECT_ID);

        const model = "gemini-1.5-flash-002";
        const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${model}:generateContent`;
        console.log(url)

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


        const startIndex = jsonResponse.indexOf('{');
        const endIndex = jsonResponse.lastIndexOf('}');
        const jsonString = jsonResponse.substring(startIndex, endIndex + 1);
        const extractedData = JSON.parse(jsonString);


        // Ensure BigQuery-compatible data structure
        const analysisDocument = {
            ...extractedData,
            sourceFiles: documentsSnapshot.docs.map(d => d.data().fileName),
            analyzedAt: FieldValue.serverTimestamp(),
            dealId: dealId, // Add dealId for BigQuery joins
            createdBy: request.auth.uid,
            version: "1.0",
            // Flatten nested objects for BigQuery compatibility
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
            strengths_count: extractedData.swot_analysis?.strengths?.length || 0,
            weaknesses_count: extractedData.swot_analysis?.weaknesses?.length || 0,
            opportunities_count: extractedData.swot_analysis?.opportunities?.length || 0,
            threats_count: extractedData.swot_analysis?.threats?.length || 0,
            risk_flags_count: extractedData.risk_flags?.length || 0
        };
        
        const analysisRef = await db.collection("deals").doc(dealId).collection("analysis").add(analysisDocument);
        
        // Also add to a top-level analytics collection for easier BigQuery access
        await db.collection("analytics").doc(analysisRef.id).set({
            ...analysisDocument,
            analysisId: analysisRef.id,
            collectionPath: `deals/${dealId}/analysis/${analysisRef.id}`
        });
        await db.collection("deals").doc(dealId).update({ status: "4_Analyzed" });


        return { success: true, message: "Analysis completed successfully." };


    } catch (error) {
        console.error("Error during comprehensive analysis:", error);
        await db.collection("deals").doc(dealId).update({ status: "Error_Analysis_Failed" });
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new HttpsError("internal", "An error occurred during the analysis.", { details: errorMessage });
    }
});




// --- BIGQUERY SYNC FUNCTIONS ---

/**
 * Backfill existing analysis data to BigQuery-compatible format
 */
export const backfillAnalyticsToBigQuery = onCall({ region: LOCATION }, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "You must be logged in to backfill analytics.");
    }

    try {
        // Get all deals
        const dealsSnapshot = await db.collection("deals").get();
        let processedCount = 0;
        
        for (const dealDoc of dealsSnapshot.docs) {
            const dealId = dealDoc.id;
            const dealData = dealDoc.data();
            
            // Get all analysis documents for this deal
            const analysisSnapshot = await db.collection("deals").doc(dealId).collection("analysis").get();
            
            for (const analysisDoc of analysisSnapshot.docs) {
                const analysisData = analysisDoc.data();
                const analysisId = analysisDoc.id;
                
                // Create BigQuery-compatible document
                const bigQueryDoc = {
                    ...analysisData,
                    analysisId: analysisId,
                    dealId: dealId,
                    dealName: dealData.dealName || null,
                    ownerId: dealData.ownerId || null,
                    collectionPath: `deals/${dealId}/analysis/${analysisId}`,
                    backfilledAt: FieldValue.serverTimestamp(),
                    // Flatten nested objects for BigQuery
                    metrics_arr_value: analysisData.metrics?.arr?.value || null,
                    metrics_arr_source: analysisData.metrics?.arr?.source_quote || null,
                    metrics_mrr_value: analysisData.metrics?.mrr?.value || null,
                    metrics_mrr_source: analysisData.metrics?.mrr?.source_quote || null,
                    metrics_cac_value: analysisData.metrics?.cac?.value || null,
                    metrics_cac_source: analysisData.metrics?.cac?.source_quote || null,
                    metrics_ltv_value: analysisData.metrics?.ltv?.value || null,
                    metrics_ltv_source: analysisData.metrics?.ltv?.source_quote || null,
                    metrics_ltv_cac_ratio_value: analysisData.metrics?.ltv_cac_ratio?.value || null,
                    metrics_ltv_cac_ratio_source: analysisData.metrics?.ltv_cac_ratio?.source_quote || null,
                    metrics_gross_margin_value: analysisData.metrics?.gross_margin?.value || null,
                    metrics_gross_margin_source: analysisData.metrics?.gross_margin?.source_quote || null,
                    investment_recommendation: analysisData.investment_memo?.investment_recommendation || null,
                    executive_summary: analysisData.investment_memo?.executive_summary || null,
                    growth_potential: analysisData.investment_memo?.growth_potential || null,
                    strengths_count: analysisData.swot_analysis?.strengths?.length || 0,
                    weaknesses_count: analysisData.swot_analysis?.weaknesses?.length || 0,
                    opportunities_count: analysisData.swot_analysis?.opportunities?.length || 0,
                    threats_count: analysisData.swot_analysis?.threats?.length || 0,
                    risk_flags_count: analysisData.risk_flags?.length || 0
                };
                
                // Add to top-level analytics collection
                await db.collection("analytics").doc(analysisId).set(bigQueryDoc, { merge: true });
                processedCount++;
            }
        }
        
        logger.info(`Successfully backfilled ${processedCount} analysis documents to BigQuery format.`);
        return { success: true, message: `Backfilled ${processedCount} analysis documents.`, processedCount };
        
    } catch (error) {
        console.error("Error during backfill:", error);
        throw new HttpsError("internal", "Failed to backfill analytics data.");
    }
});

/**
 * Get analytics data optimized for BigQuery queries
 */
export const getAnalyticsForBigQuery = onCall({ region: LOCATION }, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "You must be logged in to access analytics.");
    }
    
    try {
        const { limit = 100, startAfter = null, dealId = null } = request.data;
        
        let query = db.collection("analytics").orderBy("analyzedAt", "desc").limit(limit);
        
        if (startAfter) {
            const startAfterDoc = await db.collection("analytics").doc(startAfter).get();
            if (startAfterDoc.exists) {
                query = query.startAfter(startAfterDoc);
            }
        }
        
        if (dealId) {
            query = query.where("dealId", "==", dealId);
        }
        
        const snapshot = await query.get();
        const analytics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        return { success: true, analytics, count: analytics.length };
        
    } catch (error) {
        console.error("Error fetching analytics:", error);
        throw new HttpsError("internal", "Failed to fetch analytics data.");
    }
});

// --- NEW BENCHMARKING FUNCTION ---
/**
 * Allows an authorized user to add a new document to the benchmarks collection.
 */
export const addBenchmarkData = onCall({ region: LOCATION }, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "You must be logged in to add benchmark data.");
    }

    const { industry, stage, arr, mrr, cac, ltv } = request.data;
    if (!industry || !stage || arr === undefined) {
        throw new HttpsError("invalid-argument", "Missing required benchmark fields.");
    }


    try {
        const benchmarkDoc = {
            industry, stage, arr, mrr, cac, ltv,
            ltv_cac_ratio: (ltv && cac) ? ltv / cac : null,
            source: "Manual Contributor",
            addedBy: request.auth.uid,
            createdAt: FieldValue.serverTimestamp(),
        };
        await db.collection("benchmarks").add(benchmarkDoc);
        logger.info("Successfully added new benchmark data.", { data: benchmarkDoc });
        return { success: true, message: "Benchmark data added." };
    } catch (error) {
        console.error("Error adding benchmark data:", error);
        throw new HttpsError("internal", "Could not add benchmark data to Firestore.");
    }
});





