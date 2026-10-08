export interface RecipientItem {
  email: string;
  tag: string;
}

export interface EscalationSettings {
  _id?: string;
  threshold: number;
  enabled: boolean;
  toRecipients?: RecipientItem[];
  ccRecipients?: RecipientItem[];
  bccRecipients?: RecipientItem[];
  // Legacy fields preserved for backward compatibility
  managerEmail?: string;
  hodEmail?: string;
  dyhodEmail?: string;
  ccEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}
