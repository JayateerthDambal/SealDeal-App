import { useState } from 'react';
import agenticonWhite from '@/assets/agent-seal-icon-white.png';
import ChatWindow from '@/components/chat/ChatWindow';
import { X } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';


export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  return (
    <>
      {/* The floating button */}
      <div className="fixed bottom-6 right-6 z-50">
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                      onClick={() => setIsOpen(!isOpen)}
                      // Removed animate-pulse and hover:animate-none
                      className="h-24 w-24 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-2xl hover:scale-110 transition-transform duration-200 flex items-center justify-center"
                      aria-label="Toggle Chat"
                    >
                      {isOpen ? (
                        <X className="h-12 w-12" />
                      ) : (
                        // Increased icon size within the button
                        <img src={agenticonWhite} alt="Agent Seal" className="h-20 w-20" />
                      )}
                    </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="mb-2">
                    <p>Chat with Agent Seal</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </div>

      {/* The chat window container */}
      <div
        className={`fixed z-50 transition-all duration-300 ease-in-out
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          ${isMaximized
            ? 'bottom-0 right-0 w-full h-full md:bottom-6 md:right-6 md:w-2/3 md:h-[calc(100%-6rem)] rounded-none md:rounded-xl'
            : `bottom-32 right-6 w-[400px] h-[600px] rounded-xl ${isOpen ? '' : 'translate-y-10'}`
          }
        `}
      >
        {isOpen && (
            <ChatWindow
                isMaximized={isMaximized}
                onToggleMaximize={() => setIsMaximized(!isMaximized)}
            />
        )}
      </div>
    </>
  );
}

