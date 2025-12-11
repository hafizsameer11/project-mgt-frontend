import { useEffect, useState, useRef } from 'react';
import { chatService, ChatMessage } from '../services/chatService';
import { useAuthStore } from '../store/authStore';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Send } from 'lucide-react';

interface ProjectChatProps {
  projectId: number;
}

export default function ProjectChat({ projectId }: ProjectChatProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<number>(0);

  useEffect(() => {
    fetchMessages();
    startPolling();
    
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const data = await chatService.getMessages(undefined, projectId, lastMessageIdRef.current);
      if (data.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMessages = data.filter(m => !existingIds.has(m.id));
          const updated = [...prev, ...newMessages].sort((a, b) => a.id - b.id);
          lastMessageIdRef.current = Math.max(...updated.map(m => m.id));
          return updated;
        });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const startPolling = () => {
    const poll = async () => {
      await fetchMessages();
      pollingRef.current = setTimeout(poll, 2000);
    };
    poll();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const message = await chatService.sendMessage(newMessage, undefined, projectId);
      setMessages(prev => {
        const updated = [...prev, message].sort((a, b) => a.id - b.id);
        lastMessageIdRef.current = Math.max(...updated.map(m => m.id));
        return updated;
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-lg">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwn
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  {!isOwn && message.sender && (
                    <p className={`text-xs font-medium mb-1 ${isOwn ? 'text-indigo-100' : 'text-indigo-600'}`}>
                      {message.sender.name}
                    </p>
                  )}
                  <p className="text-sm">{message.message}</p>
                  <p className={`text-xs mt-1 ${isOwn ? 'text-indigo-100' : 'text-gray-500'}`}>
                    {new Date(message.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t bg-white rounded-b-lg">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message to the team..."
            className="flex-1"
          />
          <Button type="submit" disabled={!newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

