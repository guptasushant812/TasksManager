'use client';
import { useCallback } from 'react';
import { Task } from '@/types/task';
import { FollowUpFormData } from '@/types/followUp';
import { useFollowUps } from '@/hooks/useFollowUps';
import FollowUpForm from './FollowUpForm';

interface FollowUpAddModalProps {
  task: Task;
  onClose: () => void;
  onSaved: () => void;
}

export default function FollowUpAddModal({ task, onClose, onSaved }: FollowUpAddModalProps) {
  const { createFollowUp, uploadAttachments } = useFollowUps(task._id);

  const handleSave = useCallback(
    async (data: FollowUpFormData, files: File[]) => {
      const savedFollowUp = await createFollowUp(data, files && files.length > 0);
      if (files && files.length > 0) {
        await uploadAttachments(savedFollowUp._id, files);
      }
      onSaved();
      onClose();
    },
    [createFollowUp, uploadAttachments, onSaved, onClose]
  );

  return (
    <FollowUpForm
      key={task._id}
      defaultContactPerson={task.contactPerson || ''}
      onSave={handleSave}
      onCancel={onClose}
    />
  );
}
