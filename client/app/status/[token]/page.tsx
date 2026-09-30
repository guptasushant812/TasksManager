'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Task } from '@/types/task';
import { apiFetch } from '@/lib/api';
import { formatDate } from '@/lib/dates';
import { Search, LayoutDashboard, CheckCircle2, Clock, AlertCircle, Calendar, User, UserPlus, Sun, Moon, ShieldCheck } from 'lucide-react';

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
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    try {
      const darkActive = document.documentElement.classList.contains('dark');
      setIsDark(darkActive);
    } catch {}
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.theme = 'light';
    }
    window.dispatchEvent(new Event('storage'));
  };

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
          <div style={{ height: '64px', padding: '0 20px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
            <div className="skeleton" style={{ width: 140, height: 24, borderRadius: 6 }} />
          </div>
          <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="skeleton" style={{ width: '100%', height: 42, borderRadius: 6 }} />
            <div className="skeleton" style={{ width: '100%', height: 42, borderRadius: 6 }} />
            <div className="skeleton" style={{ width: '100%', height: 42, borderRadius: 6 }} />
          </div>
        </aside>
        <main className="public-main">
          <div className="skeleton" style={{ width: '40%', height: 36, marginBottom: 12, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: '25%', height: 18, marginBottom: 36, borderRadius: 4 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="skeleton" style={{ width: '100%', height: 140, borderRadius: 'var(--radius-lg, 8px)' }} />
            <div className="skeleton" style={{ width: '100%', height: 140, borderRadius: 'var(--radius-lg, 8px)' }} />
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: 16 }}>
        <div className="card animate-slide-up" style={{ padding: '40px 32px', textAlign: 'center', maxWidth: 420, width: '100%', border: '1px solid var(--border)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--high-bg, #fee2e2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--high)' }}>
            <AlertCircle style={{ width: 28, height: 28 }} />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Access Restricted</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
            {error || 'This public status link is inactive, private, or has expired.'}
          </p>
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
        {/* Sidebar Header with Theme Switcher */}
        <div style={{ height: '64px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
              <LayoutDashboard style={{ width: 16, height: 16 }} />
            </div>
            <div>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', display: 'block', lineHeight: 1.2 }}>
                Project Status
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                Live Feed
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              width: 32,
              height: 32,
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            {isDark ? <Sun style={{ width: 14, height: 14, color: '#f59e0b' }} /> : <Moon style={{ width: 14, height: 14, color: 'var(--text-primary)' }} />}
          </button>
        </div>

        {/* Sidebar Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 14px' }}>
          
          <div style={{ padding: '0 8px', marginBottom: 10, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Categories
          </div>

          <nav className="public-sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SidebarButton 
              label="Today's Focus" 
              icon={<Clock style={{ width: 15, height: 15 }} />}
              count={data.today.count} 
              active={activeTab === 'today'} 
              onClick={() => setActiveTab('today')} 
              indicatorColor="var(--inprogress)"
            />
            <SidebarButton 
              label="Pending Queue" 
              icon={<AlertCircle style={{ width: 15, height: 15 }} />}
              count={data.pending.count} 
              active={activeTab === 'pending'} 
              onClick={() => setActiveTab('pending')} 
              indicatorColor="var(--pending)"
            />
            <SidebarButton 
              label="Completed Tasks" 
              icon={<CheckCircle2 style={{ width: 15, height: 15 }} />}
              count={data.completed.count} 
              active={activeTab === 'completed'} 
              onClick={() => setActiveTab('completed')} 
              indicatorColor="var(--completed)"
            />
          </nav>

          <div style={{ marginTop: 32, padding: '0 4px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 }}>
              Status Information
            </div>
            <div style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md, 8px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', fontWeight: 600 }}>
                <Calendar style={{ width: 14, height: 14, color: 'var(--accent)' }} />
                <span>{formatDate(new Date())}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 11 }}>
                <ShieldCheck style={{ width: 13, height: 13, color: 'var(--completed)' }} />
                <span>Read-only view • Minimized for privacy</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="public-main">
        <header className="animate-fade-in" style={{ marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 6px', color: 'var(--text-primary)' }}>
              {activeTitle}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, fontWeight: 500 }}>
              Showing {activeTasks.length} task{activeTasks.length !== 1 ? 's' : ''} in this view.
            </p>
          </div>
          
          {/* Search Bar */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
            <Search style={{ position: 'absolute', left: 12, top: 10, width: 15, height: 15, color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input" 
              placeholder="Search tasks..." 
              style={{
                width: '100%',
                paddingLeft: 36,
                paddingRight: 12,
                height: 38,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md, 6px)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
              }}
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
      type="button"
      onClick={onClick}
      style={{
        padding: '10px 12px',
        borderRadius: 'var(--radius-md, 6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: active ? 'var(--bg-hover)' : 'transparent',
        border: '1px solid',
        borderColor: active ? 'var(--border)' : 'transparent',
        boxShadow: active ? `inset 3px 0 0 ${indicatorColor}` : 'none',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        transition: 'all 0.15s ease',
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
        <span>{label}</span>
      </div>
      {count > 0 && (
        <span style={{ 
          background: active ? indicatorColor : 'var(--bg-hover)', 
          color: active ? '#ffffff' : 'var(--text-primary)',
          border: active ? 'none' : '1px solid var(--border)',
          padding: '2px 8px', 
          borderRadius: 999, 
          fontSize: 11,
          fontWeight: 700
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
      <div className="card" style={{ padding: '64px 24px', color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', border: '1px dashed var(--border)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg, 8px)' }}>
        <AlertCircle style={{ width: 36, height: 36, margin: '0 auto 16px', opacity: 0.4, color: 'var(--text-muted)' }} />
        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 15 }}>{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {tasks.map((task, index) => {
        const statusAccentColor = 
          task.workStatus === 'Completed' ? 'var(--completed)' : 
          task.workStatus === 'InProgress' ? 'var(--inprogress)' : 'var(--pending)';

        return (
          <div 
            key={task._id} 
            className="card"
            style={{
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderLeft: `4px solid ${statusAccentColor}`,
              borderRadius: 'var(--radius-lg, 8px)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              animation: `slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.04}s forwards`,
              opacity: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <h3 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {task.title}
                </h3>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: 12, color: 'var(--text-secondary)' }}>
                  {task.givenBy && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', padding: '4px 10px', borderRadius: 'var(--radius-sm, 6px)' }}>
                      <UserPlus style={{ width: 12, height: 12, color: 'var(--text-muted)' }} />
                      <span>Given by: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{task.givenBy}</strong></span>
                    </div>
                  )}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', padding: '4px 10px', borderRadius: 'var(--radius-sm, 6px)' }}>
                    <Calendar style={{ width: 12, height: 12, color: 'var(--text-muted)' }} />
                    <span>Created: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatDate(task.createdAt)}</strong></span>
                  </div>
                  {task.dueDate && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', padding: '4px 10px', borderRadius: 'var(--radius-sm, 6px)' }}>
                      <Clock style={{ width: 12, height: 12, color: 'var(--high)' }} />
                      <span>Due: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatDate(task.dueDate)}</strong></span>
                    </div>
                  )}
                  {task.contactPerson && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', padding: '4px 10px', borderRadius: 'var(--radius-sm, 6px)' }}>
                      <User style={{ width: 12, height: 12, color: 'var(--text-muted)' }} />
                      <span>Contact: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{task.contactPerson}</strong></span>
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
                marginTop: 4, 
                padding: '12px 14px', 
                background: 'var(--bg-hover)',
                borderRadius: 'var(--radius-md, 6px)',
                border: '1px solid var(--border)',
                borderLeft: `3px solid ${task.reason ? 'var(--pending)' : 'var(--completed)'}`,
                fontSize: 13, 
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                display: 'flex', flexDirection: 'column', gap: 6
              }}>
                {task.reason && (
                  <div><strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Reason:</strong> {task.reason}</div>
                )}
                {task.remarks && (
                  <div><strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Remarks:</strong> {task.remarks}</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Badge({ status }: { status: string }) {
  let color = 'var(--text-secondary)';
  let bg = 'var(--bg-hover)';
  let border = 'var(--border)';

  if (status === 'Completed') {
    color = 'var(--completed)';
    bg = 'var(--completed-bg)';
    border = 'rgba(34, 197, 94, 0.3)';
  } else if (status === 'InProgress') {
    color = 'var(--inprogress)';
    bg = 'var(--inprogress-bg)';
    border = 'rgba(37, 99, 235, 0.3)';
  } else if (status === 'Pending') {
    color = 'var(--pending)';
    bg = 'var(--pending-bg)';
    border = 'rgba(234, 179, 8, 0.3)';
  }

  return (
    <span style={{ 
      background: bg, 
      color, 
      border: `1px solid ${border}`,
      padding: '4px 10px', 
      borderRadius: 'var(--radius-full, 9999px)', 
      fontSize: 11, 
      fontWeight: 700, 
      letterSpacing: '0.04em', 
      textTransform: 'uppercase',
      flexShrink: 0
    }}>
      {status === 'InProgress' ? 'In Progress' : status}
    </span>
  );
}
