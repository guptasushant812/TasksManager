import { FollowUpSummary } from './followUp';

export type Priority = 'High' | 'Medium' | 'Low';
export type WorkStatus = 'InProgress' | 'Pending' | 'Completed';

export interface Task {
  _id: string;
  userId: string | null;
  taskId: string;
  title: string;
  description: string;
  givenBy: string;
  contactPerson: string;
  priority: Priority;
  workStatus: WorkStatus;
  reason: string;
  remarks: string;
  inProgressReason?: string;
  pendingReason?: string;
  completedRemarks?: string;
  date: string; // ISO string from API
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  followUpSummary?: FollowUpSummary;
}

export interface TaskDraft {
  id?: string;
  title: string;
  description: string;
  givenBy: string;
  contactPerson: string;
  priority: Priority | '';
  workStatus: WorkStatus | '';
  reason: string;
  remarks: string;
  inProgressReason?: string;
  pendingReason?: string;
  completedRemarks?: string;
  date: string;
  dueDate: string;
}

export interface Summary {
  inProgress: number;
  pending: number;
  completed: number;
  total: number;
  overdueFollowUps?: number;
  escalatedTasks?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface TasksResponse {
  data: Task[];
  pagination: Pagination;
}

export interface TaskFilters {
  search?: string;
  status?: WorkStatus | '';
  priority?: Priority | '';
  givenBy?: string;
  year?: string;
  month?: string;
  weekStart?: string;
  weekIndex?: number;
  day?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  hasFollowUps?: string;
}
