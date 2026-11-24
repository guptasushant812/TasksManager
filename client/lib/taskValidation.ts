export interface TaskFormData {
  title: string;
  description: string;
  givenBy: string;
  contactPerson?: string;
  priority?: string;
  workStatus?: string;
  date: string;
  dueDate?: string;
  reason?: string;
  remarks?: string;
  pendingReason?: string;
  inProgressReason?: string;
  completedRemarks?: string;
}

export function validateSingleField(
  field: string,
  value: string,
  allData?: Partial<TaskFormData>
): string | null {
  const trimmed = (value || '').trim();

  switch (field) {
    case 'title':
      if (!trimmed) return 'Title is required';
      if (trimmed.length < 3) return 'Title must be at least 3 characters';
      return null;

    case 'description':
      if (!trimmed) return 'Description is required';
      if (trimmed.length < 5) return 'Description must be at least 5 characters';
      return null;

    case 'givenBy':
      if (!trimmed) return 'Given By is required';
      if (trimmed.length < 2) return 'Given By must be at least 2 characters';
      return null;

    case 'contactPerson':
      if (trimmed.length > 0 && trimmed.length < 2) {
        return 'Contact person must be at least 2 characters';
      }
      return null;

    case 'date':
      if (!trimmed) return 'Task date is required';
      return null;

    case 'dueDate':
      if (trimmed && allData?.date && trimmed < allData.date) {
        return 'Cannot be before task date';
      }
      return null;

    case 'priority':
      if (!trimmed) return 'Priority is required';
      return null;

    case 'workStatus':
      if (!trimmed) return 'Work status is required';
      return null;

    case 'reason':
    case 'pendingReason':
    case 'inProgressReason':
      if (trimmed.length > 0 && trimmed.length < 5) {
        return 'Reason must be at least 5 characters';
      }
      return null;

    case 'remarks':
    case 'completedRemarks':
      if (trimmed.length > 0 && trimmed.length < 5) {
        return 'Remarks must be at least 5 characters';
      }
      return null;

    default:
      return null;
  }
}

export function validateTaskForm(data: Partial<TaskFormData>): Record<string, string> {
  const errors: Record<string, string> = {};

  const titleErr = validateSingleField('title', data.title || '', data);
  if (titleErr) errors.title = titleErr;

  const descErr = validateSingleField('description', data.description || '', data);
  if (descErr) errors.description = descErr;

  const givenByErr = validateSingleField('givenBy', data.givenBy || '', data);
  if (givenByErr) errors.givenBy = givenByErr;

  const contactErr = validateSingleField('contactPerson', data.contactPerson || '', data);
  if (contactErr) errors.contactPerson = contactErr;

  const dateErr = validateSingleField('date', data.date || '', data);
  if (dateErr) errors.date = dateErr;

  const dueDateErr = validateSingleField('dueDate', data.dueDate || '', data);
  if (dueDateErr) errors.dueDate = dueDateErr;

  const priorityErr = validateSingleField('priority', data.priority || '', data);
  if (priorityErr) errors.priority = priorityErr;

  const statusErr = validateSingleField('workStatus', data.workStatus || '', data);
  if (statusErr) errors.workStatus = statusErr;

  const pendingReasonVal = data.pendingReason !== undefined
    ? data.pendingReason
    : (data.workStatus === 'Pending' ? data.reason : '');
  const inProgressReasonVal = data.inProgressReason !== undefined
    ? data.inProgressReason
    : (data.workStatus === 'InProgress' ? data.reason : '');
  const completedRemarksVal = data.completedRemarks !== undefined
    ? data.completedRemarks
    : (data.workStatus === 'Completed' ? data.remarks : '');

  const pendingErr = validateSingleField('pendingReason', pendingReasonVal || '', data);
  if (pendingErr) {
    errors.pendingReason = pendingErr;
    if (data.workStatus === 'Pending') errors.reason = pendingErr;
  }

  const inProgressErr = validateSingleField('inProgressReason', inProgressReasonVal || '', data);
  if (inProgressErr) {
    errors.inProgressReason = inProgressErr;
    if (data.workStatus === 'InProgress') errors.reason = inProgressErr;
  }

  const completedErr = validateSingleField('completedRemarks', completedRemarksVal || '', data);
  if (completedErr) {
    errors.completedRemarks = completedErr;
    if (data.workStatus === 'Completed') errors.remarks = completedErr;
  }

  return errors;
}
