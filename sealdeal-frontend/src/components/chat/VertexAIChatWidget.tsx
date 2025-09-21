import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Bot, ExternalLink, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface VertexAIChatWidgetProps {
  dataStoreId?: string;
  location?: string;
  projectId?: string;
  onMessagesChange?: (hasMessages: boolean) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sql?: string;
  formatted?: string;
}

export function VertexAIChatWidget({
  dataStoreId = "deal-analysis-datastore",
  location = "global",
  projectId = "genai-hackathon-aicommanders",
  onMessagesChange
}: VertexAIChatWidgetProps) {
  const { user } = useAuth();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Notify parent component when messages change
  useEffect(() => {
    onMessagesChange?.(messages.length > 0);
  }, [messages.length, onMessagesChange]);

  // Configuration for the chat
  const chatConfig = {
    projectId,
    dataStoreId,
    location,
    // Using our Firebase Functions chatAgent endpoint
    apiEndpoint: 'https://asia-south1-genai-hackathon-aicommanders.cloudfunctions.net/chatAgent/chat'
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !user) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Create a temporary session ID for this chat
      const sessionId = 'vertex-ai-session-' + Date.now();
      
      const response = await fetch(chatConfig.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message: inputMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.formatted || data.result || 'I received your query but couldn\'t process it properly.',
          timestamp: new Date(),
          sql: data.sql,
          formatted: data.formatted
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: '❌ I encountered an error processing your request. Please try again or rephrase your question.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sampleQueries = [
    "How many deals are analyzed?",
    "Show me all strong candidate deals",
    "What are the risks for Test 1?",
    "Compare ARR across all deals"
  ];

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="flex flex-row items-center gap-3 pb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-lg">Deal Flow AI Analyst</CardTitle>
          <p className="text-sm text-muted-foreground">
            Powered by Vertex AI Search & BigQuery
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open('https://console.cloud.google.com/vertex-ai/search', '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Configure
        </Button>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Messages Area */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <Bot className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Deal Flow AI Analyst</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ask me anything about your deal analysis data. I can query metrics, recommendations, and insights from BigQuery.
                </p>
                
                <div className="grid grid-cols-1 gap-2">
                  {sampleQueries.map((query, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setInputMessage(query)}
                    >
                      {query}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm">{message.content}</div>
                    {message.sql && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs opacity-70">SQL Query</summary>
                        <code className="block mt-1 text-xs bg-black/10 p-2 rounded overflow-x-auto">
                          {message.sql}
                        </code>
                      </details>
                    )}
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Analyzing your query...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your deals... (e.g., 'Show me all strong candidates')"
            disabled={isLoading || !user}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading || !user}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Data Source: BigQuery • {dataStoreId}</span>
            <span>Location: {location}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced ChatPage with Vertex AI integration
export function EnhancedChatPage() {
  const [hasMessages, setHasMessages] = useState(false);

  return (
    <div className="h-full p-6">
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">AI Deal Flow Analyst</h1>
          <p className="text-muted-foreground">
            Conversational AI powered by Vertex AI Search with your BigQuery deal data
          </p>
        </div>
        
        <div className="flex-1">
          <VertexAIChatWidget onMessagesChange={setHasMessages} />
        </div>
        
        {!hasMessages && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sample Queries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>• "How many deals are analyzed?"</p>
                  <p>• "Show me all strong candidate deals"</p>
                  <p>• "What are the key risks for Test 1?"</p>
                  <p>• "Compare ARR values across deals"</p>
                  <p>• "Which deals have the highest LTV/CAC ratio?"</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>• <strong>Financial Metrics:</strong> ARR, MRR, LTV, CAC</p>
                  <p>• <strong>Analysis:</strong> SWOT, Risk Assessment</p>
                  <p>• <strong>Recommendations:</strong> Investment decisions</p>
                  <p>• <strong>Benchmarking:</strong> Market comparisons</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}