'use client';
import { FollowUpMethod, FOLLOW_UP_METHODS } from '@/types/followUp';
import { Phone, Mail, MessageCircle, FileText, Monitor, LayoutGrid } from 'lucide-react';

interface MethodBadgeProps {
  method: FollowUpMethod;
  methodOther?: string;
}

export default function MethodBadge({ method, methodOther }: MethodBadgeProps) {
  const meta = FOLLOW_UP_METHODS.find((m) => m.value === method);
  const label = method === 'Other' && methodOther ? methodOther : (meta?.label || method);
  
  const getIcon = () => {
    switch (method) {
      case 'Phone': return <Phone style={{ width: 12, height: 12 }} />;
      case 'Email': return <Mail style={{ width: 12, height: 12 }} />;
      case 'WhatsApp': return <MessageCircle style={{ width: 12, height: 12 }} />;
      case 'InPerson': return <FileText style={{ width: 12, height: 12 }} />;
      case 'Teams': 
      case 'GoogleMeet': return <Monitor style={{ width: 12, height: 12 }} />;
      default: return <LayoutGrid style={{ width: 12, height: 12 }} />;
    }
  };

  return (
    <span className="fu-method-badge" data-method={method.toLowerCase()}>
      {getIcon()}
      <span>{label}</span>
    </span>
  );
}
