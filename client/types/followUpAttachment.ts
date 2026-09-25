export interface FollowUpAttachment {
  _id: string;
  followUpId: string;
  taskId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}
