import React, { useState, useRef } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Send, Paperclip, Mic, BarChart3, Database, TrendingUp, Scale } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const quickActions = [
  {
    id: 'analyze-portfolio',
    label: 'Analyze Portfolio',
    icon: BarChart3,
    prompt: 'Give me an overview of my portfolio performance'
  },
  {
    id: 'top-deals',
    label: 'Top Deals',
    icon: TrendingUp,
    prompt: 'Show me the top performing deals by investment recommendation'
  },
  {
    id: 'market-data',
    label: 'Market Data',
    icon: Database,
    prompt: 'What are the average ARR values across all my deals?'
  },
  {
    id: 'compare-deals',
    label: 'Compare Deals',
    icon: Scale,
    prompt: 'Help me compare deals with similar metrics'
  }
];

export function ChatInput({ onSendMessage, isLoading = false, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      setShowQuickActions(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    onSendMessage(prompt);
    setShowQuickActions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      {showQuickActions && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">
              Quick Actions
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  variant="ghost"
                  className="justify-start h-auto p-3 hover:bg-primary/5"
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={isLoading || disabled}
                >
                  <action.icon className="w-4 h-4 mr-2 text-primary" />
                  <span className="text-sm">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? "AI is thinking..." : "Ask me anything about your deals..."}
              disabled={isLoading || disabled}
              className="pr-12 min-h-[44px] resize-none"
            />
            
            {/* Attachment button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              disabled={isLoading || disabled}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </div>

          {/* Send button */}
          <Button
            type="submit"
            disabled={!message.trim() || isLoading || disabled}
            className="h-[44px] px-4"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>

          {/* Voice input button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-[44px] w-[44px] p-0"
            disabled={isLoading || disabled}
          >
            <Mic className="w-4 h-4" />
          </Button>
        </div>

        {/* Input suggestions */}
        {message.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-2">
            <Card className="shadow-lg">
              <CardContent className="p-2">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs cursor-pointer">
                    Press Enter to send
                  </Badge>
                  <Badge variant="secondary" className="text-xs cursor-pointer">
                    Shift + Enter for new line
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </form>

      {/* Typing indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-current rounded-full animate-bounce delay-100"></div>
            <div className="w-1 h-1 bg-current rounded-full animate-bounce delay-200"></div>
          </div>
          <span>AI is analyzing your request...</span>
        </div>
      )}
    </div>
  );
}