import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { useGetRecentChatMessages, useSendChatMessage } from '@/hooks/useQueries';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PlayerStatsModal from './PlayerStatsModal';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [selectedPlayerPrincipal, setSelectedPlayerPrincipal] = useState<string | null>(null);
  const { data: messages = [], isLoading, error } = useGetRecentChatMessages();
  const sendMessageMutation = useSendChatMessage();
  const { identity } = useInternetIdentity();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const currentUserPrincipal = identity?.getPrincipal().toString();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle mobile keyboard visibility
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      // Scroll to bottom when keyboard appears/disappears
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;

    const messageToSend = message.trim();
    setMessage('');

    try {
      await sendMessageMutation.mutateAsync(messageToSend);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message on error
      setMessage(messageToSend);
    }
  };

  const formatTimestamp = (timestamp: bigint): string => {
    const date = new Date(Number(timestamp) / 1000000); // Convert nanoseconds to milliseconds
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatPrincipal = (principal: string): string => {
    if (principal.length <= 12) return principal;
    return `${principal.slice(0, 6)}...${principal.slice(-4)}`;
  };

  const handlePlayerClick = (principal: string) => {
    setSelectedPlayerPrincipal(principal);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col">
        {/* Fully opaque dark overlay with backdrop blur */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-sky-900/95 to-sky-800/95 backdrop-blur-lg"
          onClick={onClose}
        />

        {/* Close button - top right */}
        <div className="relative z-10 flex justify-end p-4 sm:p-6">
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all shadow-lg hover:shadow-xl"
            aria-label="Close chat"
          >
            <X className="h-6 w-6 text-white drop-shadow-md" />
          </button>
        </div>

        {/* Messages container - scrollable area */}
        <div 
          ref={messagesContainerRef}
          className="relative flex-1 overflow-y-auto px-4 sm:px-6 pb-4"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          <div className="max-w-3xl mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <div className="text-center space-y-3">
                  <Loader2 className="h-12 w-12 animate-spin text-white/80 mx-auto" />
                  <p className="text-white/80 text-sm">Loading messages...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center space-y-4">
                <div className="bg-red-500/10 backdrop-blur-sm rounded-full p-6">
                  <svg 
                    className="h-16 w-16 text-red-300" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-semibold text-white drop-shadow-md">Unable to load chat</p>
                  <p className="text-sm text-white/70 mt-1">Please try again later</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center space-y-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-full p-6">
                  <svg 
                    className="h-16 w-16 text-white/60" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-semibold text-white drop-shadow-md">No messages yet</p>
                  <p className="text-sm text-white/70 mt-1">Be the first to say hello!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-2">
                {messages.map((msg, index) => {
                  const isOwnMessage = msg.sender.toString() === currentUserPrincipal;
                  
                  return (
                    <div
                      key={index}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] sm:max-w-[60%] ${
                          isOwnMessage
                            ? 'bg-gradient-to-br from-sky-400 to-sky-600'
                            : 'bg-white/95'
                        } backdrop-blur-sm rounded-2xl p-3 shadow-lg hover:shadow-xl transition-all`}
                      >
                        {!isOwnMessage && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                              {formatPrincipal(msg.sender.toString()).slice(0, 2).toUpperCase()}
                            </div>
                            <button
                              onClick={() => handlePlayerClick(msg.sender.toString())}
                              className="text-xs font-mono text-sky-700 font-semibold hover:text-sky-900 hover:underline transition-colors cursor-pointer"
                            >
                              {formatPrincipal(msg.sender.toString())}
                            </button>
                          </div>
                        )}
                        <p className={`text-sm break-words leading-relaxed ${
                          isOwnMessage ? 'text-white' : 'text-gray-800'
                        }`}>
                          {msg.content}
                        </p>
                        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mt-1`}>
                          <span className={`text-xs ${
                            isOwnMessage ? 'text-white/70' : 'text-gray-500'
                          }`}>
                            {formatTimestamp(msg.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input container - fixed at bottom */}
        <div className="relative z-10 bg-gradient-to-t from-sky-900/80 to-sky-800/80 backdrop-blur-md border-t border-white/20 shadow-2xl">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <Input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                maxLength={200}
                disabled={sendMessageMutation.isPending}
                className="flex-1 bg-white/95 backdrop-blur-sm border-white/30 focus:border-sky-300 focus:ring-sky-300 rounded-full px-5 py-3 text-base shadow-lg"
                autoComplete="off"
              />
              <Button
                type="submit"
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="bg-gradient-to-b from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 text-white shadow-lg rounded-full px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </form>
            <p className="text-xs text-white/60 mt-2 text-center">
              {message.length}/200 characters
            </p>
          </div>
        </div>
      </div>

      {/* Player Stats Modal */}
      {selectedPlayerPrincipal && (
        <PlayerStatsModal
          isOpen={!!selectedPlayerPrincipal}
          onClose={() => setSelectedPlayerPrincipal(null)}
          playerPrincipal={selectedPlayerPrincipal}
        />
      )}
    </>
  );
};

export default ChatModal;
