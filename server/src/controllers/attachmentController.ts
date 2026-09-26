import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import FollowUpAttachment from '../models/FollowUpAttachment';
import FollowUp from '../models/FollowUp';

const uploadDir = path.join(__dirname, '../../uploads');

export async function uploadAttachments(req: Request, res: Response, next: NextFunction) {
  try {
    const { taskId, followUpId } = req.params;
    
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    const followUp = await FollowUp.findById(followUpId);
    if (!followUp) {
      res.status(404).json({ error: 'Follow-up not found' });
      return;
    }

    const attachments = [];
    for (const file of req.files) {
      const attachment = new FollowUpAttachment({
        followUpId,
        taskId,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        data: file.buffer,
      });
      await attachment.save();
      const attObj = attachment.toObject();
      delete attObj.data;
      attachments.push(attObj);
    }

    res.status(201).json(attachments);
  } catch (err) {
    next(err);
  }
}

export async function listAttachments(req: Request, res: Response, next: NextFunction) {
  try {
    const { followUpId } = req.params;
    const attachments = await FollowUpAttachment.find({ followUpId }).select('-data').sort({ createdAt: 1 }).lean();
    res.json({ data: attachments });
  } catch (err) {
    next(err);
  }
}

export async function downloadAttachment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const attachment = await FollowUpAttachment.findById(id);
    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    if (attachment.data) {
      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);
      res.send(attachment.data);
    } else {
      const filePath = path.join(uploadDir, attachment.storedName || '');
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: 'File not found on disk or database' });
        return;
      }
      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);
      res.sendFile(filePath);
    }
  } catch (err) {
    next(err);
  }
}

export async function deleteAttachment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const attachment = await FollowUpAttachment.findByIdAndDelete(id);
    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    if (attachment.storedName) {
      const filePath = path.join(uploadDir, attachment.storedName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({ message: 'Attachment deleted' });
  } catch (err) {
    next(err);
  }
}
