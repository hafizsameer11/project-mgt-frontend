export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Project Manager' | 'Developer' | 'Business Developer' | 'Client';
  phone?: string;
  avatar?: string;
}

export interface Lead {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  source?: 'Facebook' | 'Upwork' | 'Fiverr' | 'Website' | 'Referral' | 'Other';
  estimated_budget?: number;
  lead_status: 'New' | 'In Progress' | 'Converted' | 'Lost';
  assigned_to?: number;
  assigned_user?: User;
  notes?: string;
  follow_up_date?: string;
  attachments?: string[];
  conversion_date?: string;
  converted_client_id?: number;
  project_id_after_conversion?: number;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: number;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
  assigned_bd?: number;
  assigned_bd_user?: User;
  status: 'Active' | 'Inactive';
  has_account?: boolean;
  projects?: Project[];
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  title: string;
  client_id?: number;
  client?: Client;
  budget?: number;
  description?: string;
  start_date?: string;
  end_date?: string;
  project_type?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  assigned_bd?: number;
  assigned_bd_user?: User;
  attachments?: string[];
  tags?: string[];
  repo_link?: string;
  server_url?: string;
  teams?: Team[];
  tasks?: Task[];
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  project_id?: number;
  project?: Project;
  assigned_to?: number;
  assigned_user?: User;
  created_by?: number;
  creator?: User;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Review';
  estimated_hours?: number;
  actual_time?: number;
  deadline?: string;
  attachments?: string[];
  task_type?: 'Today' | 'Tomorrow' | 'Next 2–3 Days' | 'This Week' | 'Next Week';
  requirements?: Requirement[];
  timers?: Array<{
    id: number;
    started_at?: string;
    paused_at?: string;
    stopped_at?: string;
    total_seconds: number;
    total_hours: number;
  }>;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: number;
  full_name: string;
  email?: string;
  phone?: string;
  role: string;
  payment_type?: 'salary' | 'project_based';
  salary_amount?: number;
  skills?: string[];
  joining_date?: string;
  notes?: string;
  user_id?: number;
  created_at: string;
  updated_at: string;
}

export interface DeveloperPayment {
  id: number;
  developer_id: number;
  project_id: number;
  total_assigned_amount?: number;
  amount_paid: number;
  payment_notes?: string;
  invoice_no?: string;
  remaining_amount?: number;
  status?: 'Paid' | 'Pending' | 'Partial';
  client_payment_status?: 'Fully Paid' | 'Partially Paid' | 'Unpaid';
}

export interface ClientPayment {
  id: number;
  client_id: number;
  project_id: number;
  invoice_no?: string;
  total_amount?: number;
  amount_paid: number;
  remaining_amount?: number;
  status: 'Paid' | 'Unpaid' | 'Partial';
  notes?: string;
  created_at: string;
  updated_at: string;
}

