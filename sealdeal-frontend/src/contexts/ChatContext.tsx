import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChatSession, ChatMessage, ChatAgent } from '../types/chat';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebaseConfig';
import { collection, doc, onSnapshot, addDoc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';

interface ChatContextType {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isLoading: boolean;
  isTyping: boolean;
  createNewSession: (title?: string) => Promise<string>;
  sendMessage: (content: string, sessionId?: string) => Promise<void>;
  switchSession: (sessionId: string) => void;
  clearCurrentSession: () => void;
  agents: ChatAgent[];
  currentAgent: ChatAgent | null;
  setCurrentAgent: (agent: ChatAgent) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const defaultAgent: ChatAgent = {
  id: 'investment-advisor',
  name: 'SealDeal AI Assistant',
  description: 'Your AI-powered investment analysis companion',
  capabilities: [
    {
      id: 'deal-analysis',
      name: 'Deal Analysis',
      description: 'Analyze specific deals and provide investment insights',
      icon: 'BarChart3',
      examples: ['Analyze Deal XYZ', 'What are the key metrics for this deal?'],
      category: 'analysis'
    },
    {
      id: 'data-queries',
      name: 'Data Queries', 
      description: 'Query your deal database for specific information',
      icon: 'Database',
      examples: ['Show me all deals with ARR > $1M', 'List deals by investment recommendation'],
      category: 'data'
    },
    {
      id: 'market-insights',
      name: 'Market Insights',
      description: 'Get market trends and industry insights',
      icon: 'TrendingUp',
      examples: ['What are the current SaaS market trends?', 'Industry benchmarks for B2B companies'],
      category: 'insights'
    },
    {
      id: 'deal-comparison',
      name: 'Deal Comparison',
      description: 'Compare multiple deals side by side',
      icon: 'Scale',
      examples: ['Compare Deal A vs Deal B', 'Show me the best performing deals'],
      category: 'comparison'
    }
  ],
  systemPrompt: 'You are an expert investment advisor AI assistant.',
  isActive: true
};

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [agents] = useState<ChatAgent[]>([defaultAgent]);
  const [currentAgent, setCurrentAgent] = useState<ChatAgent | null>(defaultAgent);

  // Load chat sessions for the user
  useEffect(() => {
    if (!user) return;

    const sessionsQuery = query(
      collection(db, 'chat_sessions'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
      const userSessions = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        }))
        .filter(session => session.userId === user.uid) as ChatSession[];
      
      setSessions(userSessions);
      
      // Set current session to the most recent one if none is selected
      if (!currentSession && userSessions.length > 0) {
        setCurrentSession(userSessions[0]);
      }
    });

    return () => unsubscribe();
  }, [user, currentSession]);

  const createNewSession = async (title?: string): Promise<string> => {
    console.log('Creating new session, user:', user);
    if (!user) {
      console.error('No user found when creating session');
      throw new Error('User not authenticated');
    }

    try {
      const newSession = {
        userId: user.uid,
        title: title || `Chat ${new Date().toLocaleDateString()}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        messages: [],
        context: {
          activeDeals: [],
          preferences: {
            responseLength: 'detailed' as const,
            includeData: true
          }
        }
      };

      console.log('Creating session with data:', newSession);
      const docRef = await addDoc(collection(db, 'chat_sessions'), newSession);
      console.log('Session created successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  };

  const sendMessage = async (content: string, sessionId?: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    const targetSessionId = sessionId || currentSession?.id;
    if (!targetSessionId) {
      const newSessionId = await createNewSession();
      await sendMessage(content, newSessionId);
      return;
    }

    setIsLoading(true);
    setIsTyping(true);

    try {
      // Add user message to Firestore
      const userMessage = {
        role: 'user' as const,
        text: content,
        timestamp: serverTimestamp()
      };

      await addDoc(
        collection(db, 'chat_sessions', targetSessionId, 'messages'),
        userMessage
      );

      // Call the chat agent function
      const response = await fetch(
        'https://asia-south1-genai-hackathon-aicommanders.cloudfunctions.net/chatAgent/chat',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: targetSessionId,
            message: content
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Add assistant response to Firestore
      const assistantMessage = {
        role: 'assistant' as const,
        text: data.formatted || data.result || 'I apologize, but I encountered an error processing your request.',
        timestamp: serverTimestamp(),
        metadata: {
          sql: data.sql,
          queryType: data.sql ? 'data' : 'insights'
        }
      };

      await addDoc(
        collection(db, 'chat_sessions', targetSessionId, 'messages'),
        assistantMessage
      );

      // Update session timestamp
      await updateDoc(doc(db, 'chat_sessions', targetSessionId), {
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage = {
        role: 'assistant' as const,
        text: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: serverTimestamp(),
        metadata: {
          error: true
        }
      };

      await addDoc(
        collection(db, 'chat_sessions', targetSessionId, 'messages'),
        errorMessage
      );
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const switchSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
    }
  };

  const clearCurrentSession = () => {
    setCurrentSession(null);
  };

  const value: ChatContextType = {
    currentSession,
    sessions,
    isLoading,
    isTyping,
    createNewSession,
    sendMessage,
    switchSession,
    clearCurrentSession,
    agents,
    currentAgent,
    setCurrentAgent
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};