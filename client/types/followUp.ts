export type FollowUpMethod = 'Phone' | 'WhatsApp' | 'Email' | 'InPerson' | 'Teams' | 'GoogleMeet' | 'Other';

export const FOLLOW_UP_METHODS: { value: FollowUpMethod; label: string; icon: string }[] = [
  { value: 'Phone',      label: 'Phone Call',  icon: '📞' },
  { value: 'WhatsApp',   label: 'WhatsApp',    icon: '💬' },
  { value: 'Email',      label: 'Email',       icon: '📧' },
  { value: 'InPerson',   label: 'In-Person',   icon: '🤝' },
  { value: 'Teams',      label: 'MS Teams',    icon: '💻' },
  { value: 'GoogleMeet', label: 'Google Meet',  icon: '🎥' },
  { value: 'Other',      label: 'Other',       icon: '📝' },
];

import { FollowUpAttachment } from './followUpAttachment';

export interface FollowUp {
  _id: string;
  taskId: string;
  followUpNumber: number;
  followUpDate: string;
  method: FollowUpMethod;
  methodOther: string;
  contactPerson: string;
  communicated: string;
  responseReceived: string;
  notes: string;
  nextAction: string;
  nextFollowUpDate: string | null;
  isDeleted: boolean;
  deletedReason: string;
  createdAt: string;
  updatedAt: string;
  attachments?: FollowUpAttachment[];
}

export interface FollowUpFormData {
  followUpDate: string;
  method: FollowUpMethod;
  methodOther: string;
  contactPerson: string;
  communicated: string;
  responseReceived: string;
  notes: string;
  nextAction: string;
  nextFollowUpDate: string;
}

export interface FollowUpSummary {
  count: number;
  lastDate: string | null;
  lastMethod: string | null;
  lastCommunicated: string | null;
  lastResponse: string | null;
  nextFollowUpDate: string | null;
  isOverdue: boolean;
}
