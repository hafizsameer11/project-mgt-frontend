import api from './api';

export interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id?: number;
  project_id?: number;
  message: string;
  type: 'private' | 'group';
  is_read: boolean;
  sender?: { id: number; name: string; email: string };
  receiver?: { id: number; name: string; email: string };
  project?: { id: number; title: string };
  created_at: string;
}

export interface Conversation {
  type?: 'private' | 'project';
  user?: { id: number; name: string; email: string; role: string };
  project?: { id: number; title: string; client?: any };
  last_message: ChatMessage;
  unread_count: number;
  last_message_time: string;
}

export const chatService = {
  async getConversations() {
    const response = await api.get<Conversation[]>('/chat/conversations');
    return response.data;
  },

  async getUsers() {
    const response = await api.get('/chat/users');
    return response.data;
  },

  async getMessages(receiverId?: number, projectId?: number, lastMessageId: number = 0) {
    const params: any = { last_message_id: lastMessageId };
    if (receiverId) params.receiver_id = receiverId;
    if (projectId) params.project_id = projectId;
    
    const response = await api.get<ChatMessage[]>('/chat/messages', { params });
    return response.data;
  },

  async sendMessage(message: string, receiverId?: number, projectId?: number) {
    const data: any = { message };
    if (receiverId) data.receiver_id = receiverId;
    if (projectId) data.project_id = projectId;
    
    const response = await api.post<ChatMessage>('/chat/send', data);
    return response.data;
  },

  async getProjectChats() {
    const response = await api.get('/chat/project-chats');
    return response.data;
  },
};

