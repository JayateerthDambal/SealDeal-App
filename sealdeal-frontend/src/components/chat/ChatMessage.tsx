import React from 'react';
import { ChatMessage as ChatMessageType } from '../../types/chat';
import { Avatar, AvatarFallback } from '../ui/Avatar';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Copy, Database, BarChart3, User, Bot } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

interface ChatMessageProps {
  message: ChatMessageType;
  isLatest?: boolean;
}

export function ChatMessage({ message, isLatest }: ChatMessageProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Message content copied successfully",
    });
  };

  const copySQL = () => {
    if (message.metadata?.sql) {
      navigator.clipboard.writeText(message.metadata.sql);
      toast({
        title: "SQL copied",
        description: "SQL query copied to clipboard",
      });
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isUser = message.role === 'user';
  const isTyping = message.metadata?.isTyping;

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      {/* Avatar */}
      <Avatar className="w-8 h-8 mt-1">
        <AvatarFallback className={isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={`flex-1 max-w-[70%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <Card className={`${isUser ? 'bg-primary text-primary-foreground' : 'bg-card'} shadow-sm`}>
          <CardContent className="p-3">
            {isTyping ? (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-100"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-200"></div>
                </div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            ) : (
              <>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {message.content.includes('|') && message.content.includes('---') ? (
                    // Render tables
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        {message.content.split('\n').map((line, i) => {
                          if (line.includes('|')) {
                            const cells = line.split('|').filter(cell => cell.trim());
                            return (
                              <tr key={i} className={line.includes('---') ? 'hidden' : ''}>
                                {cells.map((cell, j) => (
                                  <td key={j} className="px-2 py-1 border">
                                    {cell.trim()}
                                  </td>
                                ))}
                              </tr>
                            );
                          }
                          return null;
                        })}
                      </table>
                    </div>
                  ) : (
                    // Regular text with line breaks
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>

                {/* Metadata badges */}
                {message.metadata && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {message.metadata.queryType === 'data' && (
                      <Badge variant="outline" className="text-xs">
                        <Database className="w-3 h-3 mr-1" />
                        Data Query
                      </Badge>
                    )}
                    {message.metadata.queryType === 'insights' && (
                      <Badge variant="outline" className="text-xs">
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Market Insights
                      </Badge>
                    )}
                    {message.metadata.sql && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={copySQL}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy SQL
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Timestamp and actions */}
        <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span>{formatTimestamp(message.timestamp)}</span>
          {!isUser && !isTyping && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => copyToClipboard(message.content)}
            >
              <Copy className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}