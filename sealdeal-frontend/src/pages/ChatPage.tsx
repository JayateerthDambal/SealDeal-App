import { useEffect, useRef, useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../hooks/useAuth';
import { EnhancedChatPage } from '../components/chat/VertexAIChatWidget';
import { ChatMessage } from '../components/chat/ChatMessage';
import { ChatInput } from '../components/chat/ChatInput';
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ScrollArea } from '../components/ui/ScrollArea';
import { 
  Menu, 
  X, 
  Bot, 
  Sparkles, 
  BarChart3, 
  Database,
  Brain
} from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../types/chat';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function ChatPage() {
  const { user, isLoading: authLoading } = useAuth();
  const {
    currentSession,
    sessions,
    isLoading,
    isTyping,
    createNewSession,
    sendMessage,
    switchSession,
    currentAgent
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [useVertexAI] = useState(true); // Default to Vertex AI
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen to messages for current session
  useEffect(() => {
    if (!currentSession) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, 'chat_sessions', currentSession.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const sessionMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          role: data.role,
          content: data.text || data.content,
          timestamp: data.timestamp?.toDate() || new Date(),
          metadata: data.metadata
        } as ChatMessageType;
      });
      setMessages(sessionMessages);
    });

    return () => unsubscribe();
  }, [currentSession]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content, currentSession?.id);
  };

  const handleNewSession = async () => {
    try {
      console.log('Starting new session, user:', user);
      if (!user) {
        console.error('No user when creating session');
        return;
      }
      await createNewSession();
    } catch (error) {
      console.error('Failed to create new session:', error);
    }
  };

  // const agentCapabilities = currentAgent?.capabilities || [];

  // If using Vertex AI, render the enhanced chat page
  if (useVertexAI) {
    return <EnhancedChatPage />;
  }

  if (!currentSession && sessions.length === 0) {
    return (
      <div className="flex h-full">
        <ChatSidebar
          sessions={sessions}
          currentSession={currentSession}
          currentAgent={currentAgent}
          onSessionSelect={switchSession}
          onNewSession={handleNewSession}
          isCollapsed={!sidebarOpen}
        />
        
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">
                Welcome to SealDeal AI Assistant
              </CardTitle>
              <p className="text-muted-foreground">
                Your AI-powered investment analysis companion
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Get instant insights on your investment data with AI-powered analysis
                </p>
                
                <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Financial Metrics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    <span>Deal Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    <span>Market Insights</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleNewSession} 
                  size="lg" 
                  className="gap-2"
                  disabled={authLoading || !user}
                >
                  <Sparkles className="w-4 h-4" />
                  {authLoading ? 'Loading...' : 'Start Your First Conversation'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-16'} transition-all duration-300 flex-shrink-0`}>
        <ChatSidebar
          sessions={sessions}
          currentSession={currentSession}
          currentAgent={currentAgent}
          onSessionSelect={switchSession}
          onNewSession={handleNewSession}
          isCollapsed={!sidebarOpen}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b bg-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-8 w-8"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <div>
                <h1 className="font-semibold">
                  {currentAgent?.name || 'AI Assistant'}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {currentSession?.title || 'New Conversation'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {messages.length} messages
            </Badge>
            {isTyping && (
              <Badge variant="secondary" className="text-xs animate-pulse">
                AI is thinking...
              </Badge>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bot className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-medium mb-2">SealDeal AI Assistant</h3>
                <p className="text-sm mb-6">
                  Ask me anything about your deals, market insights, or investment analysis.
                </p>
                <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                  {[
                    "How many deals are analyzed?",
                    "Show me deal names and recommendations", 
                    "What are the ARR values for all deals?",
                    "Compare financial metrics across deals"
                  ].map((query, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleSendMessage(query)}
                    >
                      {query}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isLatest={index === messages.length - 1}
                  />
                ))}
                
                {/* Typing indicator */}
                {isTyping && (
                  <ChatMessage
                    message={{
                      id: 'typing',
                      role: 'assistant',
                      content: '',
                      timestamp: new Date(),
                      metadata: { isTyping: true }
                    }}
                  />
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t bg-card p-4">
          <div className="max-w-4xl mx-auto">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              disabled={!currentSession}
            />
          </div>
        </div>
      </div>
    </div>
  );
}