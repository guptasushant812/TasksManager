'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Task } from '@/types/task';
import { apiFetch } from '@/lib/api';
import { formatDate } from '@/lib/dates';
import { Search, LayoutDashboard, CheckCircle2, Clock, AlertCircle, Calendar, User, UserPlus } from 'lucide-react';

interface PublicStatusData {
  today: { count: number; tasks: Task[] };
  pending: { count: number; tasks: Task[] };
  completed: { count: number; tasks: Task[] };
}

export default function PublicStatusPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicStatusData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'today' | 'pending' | 'completed'>('today');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const result = await apiFetch<PublicStatusData>(`/api/public/status/${token}`);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid link or access denied.');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchStatus();
  }, [token]);

  if (loading) {
    return (
      <div className="public-layout">
        <aside className="public-sidebar">
          <div style={{ height: '64px', padding: '0 24px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="skeleton" style={{ width: 140, height: 24 }} />
          </div>
          <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
             <div className="skeleton" style={{ width: '100%', height: 42 }} />
             <div className="skeleton" style={{ width: '100%', height: 42 }} />
             <div className="skeleton" style={{ width: '100%', height: 42 }} />
          </div>
        </aside>
        <main className="public-main">
          <div className="skeleton" style={{ width: '40%', height: 40, marginBottom: 16 }} />
          <div className="skeleton" style={{ width: '20%', height: 20, marginBottom: 48 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="skeleton" style={{ width: '100%', height: 160, borderRadius: 'var(--radius-lg)' }} />
            <div className="skeleton" style={{ width: '100%', height: 160, borderRadius: 'var(--radius-lg)' }} />
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div className="card animate-slide-up" style={{ padding: 40, textAlign: 'center', maxWidth: 400 }}>
          <AlertCircle style={{ width: 48, height: 48, color: 'var(--high)', margin: '0 auto 16px' }} />
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>Access Denied</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>{error || 'Link unavailable or expired.'}</p>
        </div>
      </div>
    );
  }

  // Filter tasks based on search
  const rawTasks = data[activeTab].tasks;
  const activeTasks = rawTasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    (t.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.contactPerson || '').toLowerCase().includes(search.toLowerCase())
  );
  
  const activeTitle = activeTab === 'today' ? "Today's Focus" : activeTab === 'pending' ? "Pending Queue" : "Completed Tasks";

  return (
    <div className="public-layout">
      
      {/* Sidebar Navigation */}
      <aside className="public-sidebar">
        <div style={{ height: '64px', padding: '0 24px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, background: 'var(--text-primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-base)' }}>
              <LayoutDashboard style={{ width: 14, height: 14 }} />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Project Status
            </span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px' }}>
          
          <div style={{ padding: '0 12px', marginBottom: 12, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Categories
          </div>

          <nav className="public-sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <SidebarButton 
              label="Today's Focus" 
              icon={<Clock style={{ width: 14, height: 14 }} />}
              count={data.today.count} 
              active={activeTab === 'today'} 
              onClick={() => setActiveTab('today')} 
              indicatorColor="var(--inprogress)"
            />
            <SidebarButton 
              label="Pending Queue" 
              icon={<AlertCircle style={{ width: 14, height: 14 }} />}
              count={data.pending.count} 
              active={activeTab === 'pending'} 
              onClick={() => setActiveTab('pending')} 
              indicatorColor="var(--pending)"
            />
            <SidebarButton 
              label="Completed Tasks" 
              icon={<CheckCircle2 style={{ width: 14, height: 14 }} />}
              count={data.completed.count} 
              active={activeTab === 'completed'} 
              onClick={() => setActiveTab('completed')} 
              indicatorColor="var(--completed)"
            />
          </nav>

          <div style={{ marginTop: 40, padding: '0 12px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12 }}>
              Overview
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg-elevated)', padding: 12, borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--text-primary)' }}>
                <Calendar style={{ width: 14, height: 14 }} />
                <strong>{formatDate(new Date())}</strong>
              </div>
              <div>This is a public, read-only view of the project. Details are minimized for privacy.</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="public-main">
        <header className="animate-fade-in" style={{ marginBottom: 32, paddingBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px', color: 'var(--text-primary)' }}>
              {activeTitle}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
              Showing {activeTasks.length} task{activeTasks.length !== 1 ? 's' : ''} in this category.
            </p>
          </div>
          
          {/* Search Bar */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
            <Search style={{ position: 'absolute', left: 12, top: 9, width: 14, height: 14, color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input" 
              placeholder="Search tasks..." 
              style={{ paddingLeft: 34, background: 'var(--bg-surface)' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        <section className="animate-slide-up" key={activeTab}>
          <TaskList tasks={activeTasks} emptyMessage={`No tasks found in ${activeTitle.toLowerCase()}.`} />
        </section>
      </main>
    </div>
  );
}

function SidebarButton({ label, icon, count, active, onClick, indicatorColor }: { label: string; icon: React.ReactNode; count: number; active: boolean; onClick: () => void; indicatorColor: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: active ? 'var(--bg-elevated)' : 'transparent',
        border: '1px solid',
        borderColor: active ? 'var(--border)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 500,
        transition: 'all 0.15s',
        textAlign: 'left'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--bg-hover)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: active ? indicatorColor : 'var(--text-muted)' }}>{icon}</span>
        {label}
      </div>
      {count > 0 && (
        <span style={{ 
          background: active ? indicatorColor : 'var(--bg-elevated)', 
          color: active ? '#fff' : 'var(--text-secondary)',
          padding: '2px 8px', 
          borderRadius: 999, 
          fontSize: 11,
          fontWeight: 600
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

function TaskList({ tasks, emptyMessage }: { tasks: Task[]; emptyMessage: string }) {
  if (tasks.length === 0) {
    return (
      <div className="card" style={{ padding: '64px 24px', color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', borderStyle: 'dashed' }}>
        <AlertCircle style={{ width: 32, height: 32, margin: '0 auto 16px', opacity: 0.3 }} />
        <div style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {tasks.map((task, index) => (
        <div 
          key={task._id} 
          className="card"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            transition: 'all 0.3s',
            animation: `slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s forwards`,
            opacity: 0,
            borderLeft: `4px solid ${
              task.workStatus === 'Completed' ? 'var(--completed)' : 
              task.workStatus === 'InProgress' ? 'var(--inprogress)' : 'var(--pending)'
            }`
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, letterSpacing: '-0.01em' }}>
                {task.title}
              </h3>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {task.givenBy && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', padding: '4px 10px', borderRadius: 'var(--radius-sm)' }}>
                    <UserPlus style={{ width: 12, height: 12, color: 'var(--text-muted)' }} />
                    <span>Given by: <strong style={{ color: 'var(--text-primary)' }}>{task.givenBy}</strong></span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', padding: '4px 10px', borderRadius: 'var(--radius-sm)' }}>
                  <Calendar style={{ width: 12, height: 12, color: 'var(--text-muted)' }} />
                  <span>Created: <strong style={{ color: 'var(--text-primary)' }}>{formatDate(task.createdAt)}</strong></span>
                </div>
                {task.dueDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', padding: '4px 10px', borderRadius: 'var(--radius-sm)' }}>
                    <Clock style={{ width: 12, height: 12, color: 'var(--high)' }} />
                    <span>Due: <strong style={{ color: 'var(--text-primary)' }}>{formatDate(task.dueDate)}</strong></span>
                  </div>
                )}
                {task.contactPerson && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', padding: '4px 10px', borderRadius: 'var(--radius-sm)' }}>
                    <User style={{ width: 12, height: 12, color: 'var(--text-muted)' }} />
                    <span>Contact: <strong style={{ color: 'var(--text-primary)' }}>{task.contactPerson}</strong></span>
                  </div>
                )}
              </div>
            </div>
            
            <Badge status={task.workStatus} />
          </div>
          
          {task.description && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {task.description}
            </p>
          )}

          {(task.reason || task.remarks) && (
            <div style={{ 
              marginTop: 8, 
              padding: '12px 16px', 
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              borderLeft: `2px solid ${task.reason ? 'var(--pending)' : 'var(--completed)'}`,
              fontSize: 13, 
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              display: 'flex', flexDirection: 'column', gap: 6
            }}>
              {task.reason && <div><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Reason:</span> {task.reason}</div>}
              {task.remarks && <div><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Remarks:</span> {task.remarks}</div>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Badge({ status }: { status: string }) {
  let color = 'var(--text-muted)';
  let bg = 'var(--border)';

  if (status === 'Completed') { color = 'var(--completed)'; bg = 'var(--completed-bg)'; }
  if (status === 'InProgress') { color = 'var(--inprogress)'; bg = 'var(--inprogress-bg)'; }
  if (status === 'Pending') { color = 'var(--pending)'; bg = 'var(--pending-bg)'; }

  return (
    <span style={{ 
      background: bg, 
      color, 
      padding: '4px 10px', 
      borderRadius: 'var(--radius-full)', 
      fontSize: 11, 
      fontWeight: 600, 
      letterSpacing: '0.04em', 
      textTransform: 'uppercase',
      flexShrink: 0
    }}>
      {status === 'InProgress' ? 'In Progress' : status}
    </span>
  );
}
