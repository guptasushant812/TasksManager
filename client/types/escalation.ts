export interface EscalationSettings {
  _id?: string;
  threshold: number;
  enabled: boolean;
  managerEmail: string;
  hodEmail: string;
  dyhodEmail: string;
  ccEmail: string;
  createdAt?: string;
  updatedAt?: string;
}
