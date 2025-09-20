import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Send, Code, Maximize2, Minimize2 } from 'lucide-react';
import { chatWithAgent } from '../../firebase/functions';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import agenticonDark from '../../assets/agent-seal-icon-dark.png';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sql?: string;
}

interface ChatWindowProps {
    isMaximized: boolean;
    onToggleMaximize: () => void;
}

export default function ChatWindow({ isMaximized, onToggleMaximize }: ChatWindowProps) {
  const { user } = useAuth();
  
  // New: Default greeting message
  const initialMessage: Message = {
    id: 'initial-greeting',
    role: 'assistant',
    text: `Hello, ${user?.displayName || user?.email?.split('@')[0] || 'Analyst'}! I'm Agent Seal, your personal data analyst. How can I help you today? \n\nYou can ask me questions like:\n* "What is the ARR for Test 8?"\n* "List all deals with a 'Pass' recommendation."`
  };
  
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(uuidv4());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const userMessage: Message = { id: uuidv4(), role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatWithAgent({ sessionId, message: input });
      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        text: result.formatted,
        sql: result.sql !== 'N/A' ? result.sql : undefined,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        text: `Sorry, I encountered an error: ${error.message}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col shadow-2xl rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
            <img src={agenticonDark} alt="Agent Seal" className="h-10 w-10" />
            <div>
              <CardTitle>Agent Seal</CardTitle>
              <p className="text-sm text-muted-foreground">Your personal data analyst</p>
            </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onToggleMaximize}>
            {isMaximized ? <Minimize2 className="h-5 w-5"/> : <Maximize2 className="h-5 w-5"/>}
            <span className="sr-only">Toggle window size</span>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pr-2">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && <img src={agenticonDark} className="h-8 w-8 rounded-full" />}
              <div className={`rounded-lg p-3 max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                <div className="prose prose-sm dark:prose-invert text-foreground">
                   <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
                {msg.sql && (
                  <details className="mt-2">
                      <summary className="text-xs cursor-pointer flex items-center gap-1 text-muted-foreground hover:text-foreground">
                        <Code className="h-3 w-3" /> View SQL Query
                      </summary>
                      <pre className="mt-1 text-xs bg-black/80 text-white p-2 rounded-md overflow-x-auto">
                        <code>{msg.sql}</code>
                      </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
           {isLoading && (
            <div className="flex items-start gap-3">
              <img src={agenticonDark} className="h-8 w-8 rounded-full" />
              <div className="rounded-lg p-3 bg-secondary animate-pulse">
                <div className="h-2 w-4 bg-muted-foreground/50 rounded-full"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Input 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your deals..." 
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

