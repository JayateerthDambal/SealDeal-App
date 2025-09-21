export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    sql?: string;
    queryType?: 'data' | 'insights';
    dealId?: string;
    isTyping?: boolean;
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
  context?: {
    activeDeals?: string[];
    lastQuery?: string;
    preferences?: {
      responseLength: 'brief' | 'detailed';
      includeData: boolean;
    };
  };
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  icon: string;
  examples: string[];
  category: 'analysis' | 'data' | 'insights' | 'comparison';
}

export interface ChatAgent {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  capabilities: AgentCapability[];
  systemPrompt: string;
  isActive: boolean;
}