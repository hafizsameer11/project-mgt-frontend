import { useEffect, useState, useRef } from 'react';
import { chatService, ChatMessage, Conversation } from '../services/chatService';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Send, MessageCircle, Users, Briefcase } from 'lucide-react';

export default function Chat() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<number>(0);

  useEffect(() => {
    fetchConversations();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser || selectedProject) {
      setMessages([]);
      lastMessageIdRef.current = 0;
      fetchMessages();
      startPolling();
    }
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, [selectedUser, selectedProject]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await chatService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedUser && !selectedProject) return;
    try {
      const receiverId = selectedUser?.id;
      const projectId = selectedProject?.id;
      const data = await chatService.getMessages(receiverId, projectId, lastMessageIdRef.current);
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
      if (!selectedUser && !selectedProject) return;
      await fetchMessages();
      pollingRef.current = setTimeout(poll, 2000); // Poll every 2 seconds
    };
    poll();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || (!selectedUser && !selectedProject)) return;

    try {
      const receiverId = selectedUser?.id;
      const projectId = selectedProject?.id;
      const message = await chatService.sendMessage(newMessage, receiverId, projectId);
      setMessages(prev => {
        const updated = [...prev, message].sort((a, b) => a.id - b.id);
        lastMessageIdRef.current = Math.max(...updated.map(m => m.id));
        return updated;
      });
      setNewMessage('');
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSelectUser = (user: any) => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
    }
    setSelectedUser(user);
    setSelectedProject(null);
    setMessages([]);
    lastMessageIdRef.current = 0;
  };

  const handleSelectProject = (project: any) => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
    }
    setSelectedProject(project);
    setSelectedUser(null);
    setMessages([]);
    lastMessageIdRef.current = 0;
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Chat
        </h1>
        <p className="text-gray-600">Communicate with your team members</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-250px)]">
        {/* Conversations/Users List */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-white">
            <h3 className="font-semibold text-gray-900">Conversations</h3>
          </div>
          <div className="overflow-y-auto h-[calc(100%-60px)]">
            {conversations.map((conv, index) => {
              const isProject = conv.type === 'project' || conv.project;
              const isSelected = isProject 
                ? selectedProject?.id === conv.project?.id
                : selectedUser?.id === conv.user?.id;
              
              if (isProject && !conv.project) return null;
              if (!isProject && !conv.user) return null;
              
              return (
                <div
                  key={isProject ? `project-${conv.project?.id}` : `user-${conv.user?.id}`}
                  onClick={() => isProject ? handleSelectProject(conv.project) : handleSelectUser(conv.user)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-indigo-50 border-indigo-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {isProject ? (
                        <>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white">
                            <Briefcase className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{conv.project?.title}</p>
                            <p className="text-xs text-gray-500">Project Chat</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {conv.user?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{conv.user?.name}</p>
                            <p className="text-xs text-gray-500">{conv.user?.role}</p>
                          </div>
                        </>
                      )}
                    </div>
                    {conv.unread_count > 0 && (
                      <Badge variant="danger">{conv.unread_count}</Badge>
                    )}
                  </div>
                  {conv.last_message && (
                    <p className="text-sm text-gray-600 mt-2 truncate">
                      {isProject && conv.last_message.sender ? (
                        <span className="font-medium">{conv.last_message.sender.name}: </span>
                      ) : null}
                      {conv.last_message.message}
                    </p>
                  )}
                </div>
              );
            })}
            {conversations.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No conversations yet</p>
              </div>
            )}
          </div>
        </Card>

        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col">
            {selectedUser || selectedProject ? (
              <>
                <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-white">
                  {selectedProject ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{selectedProject.title}</p>
                        <p className="text-xs text-gray-500">Project Team Chat</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{selectedUser.name}</p>
                        <p className="text-xs text-gray-500">{selectedUser.role}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.sender_id === user?.id;
                    const isProjectChat = selectedProject !== null;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOwn
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {isProjectChat && !isOwn && message.sender && (
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
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={selectedProject ? "Type a message to the team..." : "Type a message..."}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={!newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

