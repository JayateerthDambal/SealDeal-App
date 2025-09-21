import React from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ScrollArea } from '../ui/ScrollArea';
import { 
  Plus, 
  MessageCircle, 
  Trash2, 
  Bot, 
  BarChart3, 
  Database, 
  TrendingUp, 
  Scale,
  Settings
} from 'lucide-react';
import { ChatSession, ChatAgent } from '../../types/chat';

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  currentAgent: ChatAgent | null;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession?: (sessionId: string) => void;
  isCollapsed?: boolean;
}

export function ChatSidebar({
  sessions,
  currentSession,
  currentAgent,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  isCollapsed = false
}: ChatSidebarProps) {

  const getSessionPreview = (session: ChatSession) => {
    const lastMessage = session.messages[session.messages.length - 1];
    if (!lastMessage) return 'New conversation';
    return lastMessage.content.length > 50 
      ? lastMessage.content.substring(0, 50) + '...'
      : lastMessage.content;
  };

  const formatSessionTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'analysis': return BarChart3;
      case 'data': return Database;
      case 'insights': return TrendingUp;
      case 'comparison': return Scale;
      default: return MessageCircle;
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-16 border-r bg-card flex flex-col items-center py-4 gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewSession}
          className="h-10 w-10"
        >
          <Plus className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 flex flex-col gap-1 overflow-hidden">
          {sessions.slice(0, 8).map((session) => (
            <Button
              key={session.id}
              variant={currentSession?.id === session.id ? "default" : "ghost"}
              size="icon"
              onClick={() => onSessionSelect(session.id)}
              className="h-10 w-10 relative"
            >
              <MessageCircle className="h-4 w-4" />
              {session.messages.length > 0 && (
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full text-[10px] text-primary-foreground flex items-center justify-center">
                  {Math.min(session.messages.length, 9)}
                </div>
              )}
            </Button>
          ))}
        </div>

        <Button variant="ghost" size="icon" className="h-10 w-10">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 border-r bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">AI Assistant</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewSession}
            className="h-8 w-8"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Current Agent Info */}
        {currentAgent && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">{currentAgent.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {currentAgent.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {currentAgent.capabilities.slice(0, 2).map((capability) => {
                  const Icon = getCategoryIcon(capability.category);
                  return (
                    <Badge key={capability.id} variant="secondary" className="text-xs">
                      <Icon className="w-3 h-3 mr-1" />
                      {capability.name}
                    </Badge>
                  );
                })}
                {currentAgent.capabilities.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{currentAgent.capabilities.length - 2} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs">Start chatting to see your history</p>
            </div>
          ) : (
            sessions.map((session) => (
              <Card
                key={session.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  currentSession?.id === session.id 
                    ? 'bg-primary/10 border-primary/30' 
                    : 'hover:bg-accent'
                }`}
                onClick={() => onSessionSelect(session.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate mb-1">
                        {session.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {getSessionPreview(session)}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatSessionTime(session.updatedAt)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {session.messages.length} msgs
                        </Badge>
                      </div>
                    </div>
                    
                    {onDeleteSession && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button variant="outline" className="w-full justify-start" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  );
}