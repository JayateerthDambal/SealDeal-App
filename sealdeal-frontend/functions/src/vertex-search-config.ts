// Vertex AI Search Configuration for Deal Data
import { logger } from "firebase-functions";

export interface SearchConfig {
  projectId: string;
  location: string;
  dataStoreId: string;
  engineId: string;
}

export class VertexAISearch {
  private config: SearchConfig;

  constructor(config: SearchConfig) {
    this.config = config;
  }

  // Create a search data store for deal analyses
  async createDealDataStore() {
    const dataStoreName = `projects/${this.config.projectId}/locations/${this.config.location}/dataStores/${this.config.dataStoreId}`;
    
    try {
      logger.info(`Creating Vertex AI Search data store: ${dataStoreName}`);
      
      // This would create a BigQuery-backed data store
      const dataStoreConfig = {
        displayName: "SealDeal Investment Data",
        industryVertical: "GENERIC",
        solutionTypes: ["SOLUTION_TYPE_SEARCH"],
        contentConfig: "CONTENT_REQUIRED",
        // BigQuery source configuration
        documentProcessingConfig: {
          defaultParsingConfig: {
            digitalParsingConfig: {}
          }
        }
      };

      return dataStoreConfig;
    } catch (error) {
      logger.error("Failed to create data store:", error);
      throw error;
    }
  }

  // Create search engine with deal-specific ranking
  async createSearchEngine() {
    const engineName = `projects/${this.config.projectId}/locations/${this.config.location}/collections/default_collection/engines/${this.config.engineId}`;
    
    try {
      const engineConfig = {
        displayName: "SealDeal Investment Search",
        solutionType: "SOLUTION_TYPE_SEARCH",
        searchEngineConfig: {
          searchTier: "SEARCH_TIER_ENTERPRISE",
          searchAddOns: ["SEARCH_ADD_ON_LLM"]
        },
        dataStoreIds: [this.config.dataStoreId]
      };

      logger.info(`Creating search engine: ${engineName}`);
      return engineConfig;
    } catch (error) {
      logger.error("Failed to create search engine:", error);
      throw error;
    }
  }

  // Perform semantic search on deal data
  async searchDeals(query: string, filters?: Record<string, any>) {
    try {
      const searchRequest = {
        servingConfig: `projects/${this.config.projectId}/locations/${this.config.location}/dataStores/${this.config.dataStoreId}/servingConfigs/default_config`,
        query: query,
        pageSize: 10,
        queryExpansionSpec: {
          condition: "AUTO"
        },
        spellCorrectionSpec: {
          mode: "AUTO"
        },
        // Add deal-specific filters
        filter: this.buildSearchFilter(filters),
        boostSpec: {
          conditionBoostSpecs: [
            {
              condition: "investment_recommendation = 'Strong Candidate'",
              boost: 2.0
            },
            {
              condition: "metrics_arr_value > 1000000",
              boost: 1.5
            }
          ]
        }
      };

      return searchRequest;
    } catch (error) {
      logger.error("Search request failed:", error);
      throw error;
    }
  }

  // Build search filters for deal criteria
  private buildSearchFilter(filters?: Record<string, any>): string {
    if (!filters) return "";

    const filterConditions = [];

    if (filters.minARR) {
      filterConditions.push(`metrics_arr_value >= ${filters.minARR}`);
    }

    if (filters.recommendation) {
      filterConditions.push(`investment_recommendation = "${filters.recommendation}"`);
    }

    if (filters.dealNames && filters.dealNames.length > 0) {
      const dealNameFilter = filters.dealNames
        .map((name: string) => `dealName = "${name}"`)
        .join(" OR ");
      filterConditions.push(`(${dealNameFilter})`);
    }

    return filterConditions.join(" AND ");
  }

  // Extract insights from search results
  extractInsights(searchResults: any[]) {
    const insights = {
      totalResults: searchResults.length,
      strongCandidates: 0,
      averageARR: 0,
      topRisks: new Set<string>(),
      keyStrengths: new Set<string>()
    };

    let totalARR = 0;
    let arrCount = 0;

    searchResults.forEach(result => {
      const document = result.document;
      
      // Count strong candidates
      if (document?.investment_recommendation === "Strong Candidate") {
        insights.strongCandidates++;
      }

      // Calculate average ARR
      if (document?.metrics_arr_value) {
        totalARR += document.metrics_arr_value;
        arrCount++;
      }

      // Collect risks and strengths
      if (document?.risk_flags) {
        document.risk_flags.forEach((risk: string) => insights.topRisks.add(risk));
      }

      if (document?.strengths) {
        document.strengths.forEach((strength: string) => insights.keyStrengths.add(strength));
      }
    });

    if (arrCount > 0) {
      insights.averageARR = totalARR / arrCount;
    }

    return {
      ...insights,
      topRisks: Array.from(insights.topRisks).slice(0, 5),
      keyStrengths: Array.from(insights.keyStrengths).slice(0, 5)
    };
  }
}

// Default configuration for SealDeal
export const defaultSearchConfig: SearchConfig = {
  projectId: "genai-hackathon-aicommanders",
  location: "global", // Vertex AI Search uses global location
  dataStoreId: "sealdeal-deals-datastore",
  engineId: "sealdeal-search-engine"
};

export const vertexSearch = new VertexAISearch(defaultSearchConfig);