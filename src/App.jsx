import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, Sun, Moon, ChevronDown, Check, X,
  ChevronLeft, Calendar, Play, Pause, Settings, Bell, HelpCircle,
  Share2, BarChart3, Trophy, ArrowUpRight, Send, Clock, User, Sparkles,
  Timer, Edit3, RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';

import balloonsImg from './assets/balloons.png';
import pandaImg from './assets/panda.png';
import profileImg from './assets/profile.png';

const API_BASE = import.meta.env.DEV ? 'http://localhost:5001/api' : '/api';

/* ── tiny SVG logo ── */
const ShieldLogo = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="14" fill="#18181b"/>
    <path d="M16 8 C11 10, 9 14, 9 18 C12 20, 14 22, 16 24 C18 22, 20 20, 23 18 C23 14, 21 10, 16 8Z" fill="#a78bfa" opacity="0.9"/>
    <circle cx="16" cy="16" r="3" fill="white"/>
  </svg>
);
const TodoIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12h6"/></svg>
);

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  /* Focus Mode */
  const [focusTime, setFocusTime] = useState(7200);
  const [focusMin, setFocusMin] = useState(120);
  const [breakMin, setBreakMin] = useState(20);
  const [timerRunning, setTimerRunning] = useState(false);
  const [autoBreaks, setAutoBreaks] = useState(true);
  const [focusActive, setFocusActive] = useState(false);   // visible "session active" state
  const timerRef = useRef(null);

  /* Modal */
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', status: 'Todo', priority: 'Medium', due_date: '', project: 'Odama Website' });

  /* ── Data ── */
  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      const r = await fetch(`${API_BASE}/tasks`);
      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: r.statusText }));
        console.error('Failed to fetch tasks:', err);
        showToast('Failed to load tasks', 'error');
        setTasks([]);
        return;
      }
      const data = await r.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      showToast('Failed to load tasks', 'error');
      setTasks([]);
    } finally { setLoading(false); }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  /* ── Timer ── */
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setFocusTime(p => {
          if (p <= 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            setFocusActive(false);
            confetti({ particleCount: 130, spread: 80 });
            showToast('🎉 Focus session complete!');
            return 0;
          }
          return p - 1;
        });
      }, 1000);
    } else if (timerRef.current) clearInterval(timerRef.current);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  const fmt = s => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const startSession = () => {
    if (!timerRunning) {
      if (focusTime === 0) setFocusTime(focusMin * 60);
      setTimerRunning(true);
      setFocusActive(true);
      showToast('⏱ Focus session started!');
    }
  };

  const pauseSession = () => {
    setTimerRunning(false);
    showToast('Session paused');
  };

  const resetSession = () => {
    setTimerRunning(false);
    setFocusActive(false);
    setFocusTime(focusMin * 60);
    showToast('Timer reset');
  };

  const saveFocusConfig = () => {
    setFocusTime(focusMin * 60);
    setTimerRunning(false);
    setFocusActive(false);
    showToast('✅ Timer settings saved!');
  };

  /* ── CRUD ── */
  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', status: 'Todo', priority: 'Medium', due_date: '', project: 'Odama Website' });
    setModalOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({ title: t.title, description: t.description, status: t.status, priority: t.priority, due_date: t.due_date, project: t.project });
    setModalOpen(true);
  };

  const saveTask = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { showToast('Title is required', 'error'); return; }
    const body = { ...form, due_date: form.due_date || new Date().toISOString().split('T')[0] };
    try {
      if (editing) {
        const r = await fetch(`${API_BASE}/tasks/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (r.ok) { const u = await r.json(); setTasks(ts => ts.map(t => t.id === editing.id ? u : t)); showToast('✅ Task updated!'); }
      } else {
        const r = await fetch(`${API_BASE}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (r.ok) { const n = await r.json(); setTasks(ts => [...ts, n]); showToast('✅ Task created!'); }
      }
      setModalOpen(false);
    } catch { showToast('Save failed', 'error'); }
  };

  const deleteTask = async (id) => {
    try { await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' }); setTasks(ts => ts.filter(t => t.id !== id)); showToast('🗑 Task deleted'); }
    catch { showToast('Delete failed', 'error'); }
  };

  const toggleComplete = async (task) => {
    const next = task.status === 'Completed' ? 'Todo' : 'Completed';
    try {
      const r = await fetch(`${API_BASE}/tasks/${task.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) });
      if (r.ok) {
        const u = await r.json();
        setTasks(ts => ts.map(t => t.id === task.id ? u : t));
        if (next === 'Completed') confetti({ particleCount: 40, spread: 50, origin: { y: 0.85 } });
        showToast(next === 'Completed' ? '✅ Task completed!' : 'Task reopened');
      }
    } catch { showToast('Update failed', 'error'); }
  };

  /* ── Priority badge ── */
  const badge = (p) => {
    const m = {
      High:   { dot: '#f59e0b', text: '#d97706', bg: '#fef3c7' },
      Medium: { dot: '#3b82f6', text: '#2563eb', bg: '#dbeafe' },
      Low:    { dot: '#22c55e', text: '#16a34a', bg: '#dcfce7' },
    };
    const c = m[p] || m.Medium;
    return (
      <span style={{ background: c.bg, color: c.text }} className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-[3px] rounded-full select-none">
        <span style={{ background: c.dot }} className="w-[6px] h-[6px] rounded-full" />
        {p}
      </span>
    );
  };

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="min-h-screen flex p-5 gap-5" style={{ background: '#eeeef0', fontFamily: "'Inter', -apple-system, system-ui, sans-serif" }}>

      {/* ═══════ LEFT SIDEBAR ═══════ */}
      <aside className="w-[240px] flex-shrink-0 rounded-[24px] flex flex-col justify-between p-5 shadow-sm" style={{ background: '#fff', border: '1px solid #e8e8ea' }}>
        <div>
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-2.5">
              <ShieldLogo />
              <span className="font-bold text-[17px] tracking-[-0.3px]" style={{ color: '#18181b' }}>BetterTasks</span>
            </div>
            <button className="p-0.5 hover:opacity-70 transition-opacity" style={{ color: '#9ca3af' }}><ChevronLeft size={16} /></button>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[1.2px] mb-3 px-1" style={{ color: '#9ca3af' }}>Main Menu</p>
          <nav className="space-y-0.5 mb-6">
            <SidebarBtn icon={<TodoIcon />} label="To-do" active />
            <SidebarBtn icon={<Share2 size={17} />} label="Share My Impact" trailing={<span className="text-[9px] font-bold px-2 py-[2px] rounded-full" style={{ background: '#f3f4f6', color: '#9ca3af', border: '1px solid #e5e7eb' }}>OFF</span>} />
            <SidebarBtn icon={<BarChart3 size={17} />} label="Analytics" />
            <SidebarBtn icon={<Trophy size={17} />} label="Leaderboard" />
          </nav>

          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[10px] font-bold uppercase tracking-[1.2px]" style={{ color: '#9ca3af' }}>Lists</p>
            <button onClick={openCreate} className="w-[18px] h-[18px] rounded-full flex items-center justify-center hover:scale-110 transition-transform" style={{ background: '#7c3aed' }}>
              <Plus size={10} color="white" strokeWidth={3} />
            </button>
          </div>
          <div className="mb-2">
            <button className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-sm font-semibold hover:bg-[#fafafa] transition-colors" style={{ color: '#6b7280' }}>
              <span className="flex items-center gap-2.5"><ChevronDown size={14} /><span>Projects</span></span>
              <span className="flex items-center gap-2" style={{ color: '#c4c4c8' }}><Plus size={13} /><Trash2 size={13} /></span>
            </button>
            <div className="pl-7 space-y-2.5 mt-1.5">
              <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: '#3f3f46' }}>🔥 Odama Website</div>
              <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: '#3f3f46' }}>🏀 Dribbble</div>
            </div>
          </div>

          <div className="mt-6 rounded-[20px] p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}>
            <h4 className="font-bold text-[13px] text-white mb-1">Upgrade plan</h4>
            <p className="text-[11px] leading-[1.5] mb-3" style={{ color: 'rgba(255,255,255,0.75)' }}>Unlock your personal to-do workspace, share your impact with multiple people and much more.</p>
            <button className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
              <ArrowUpRight size={14} style={{ color: '#7c3aed' }} />
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-3" style={{ borderTop: '1px solid #f3f4f6' }}>
          <SidebarBtn icon={<Send size={15} />} label="Invites" small />
          <SidebarBtn icon={<HelpCircle size={15} />} label="FAQs" small />
          <div className="flex rounded-2xl p-[3px]" style={{ background: '#f3f4f6' }}>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-[7px] rounded-[14px] text-[12px] font-semibold shadow-sm transition-colors" style={{ background: '#fff', color: '#18181b' }}><Sun size={13} /> Light</button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-[7px] rounded-[14px] text-[12px] font-semibold transition-colors" style={{ color: '#9ca3af' }}><Moon size={13} /> Dark</button>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <img src={profileImg} alt="" className="w-9 h-9 rounded-full object-cover" style={{ border: '1px solid #e8e8ea' }} />
              <div>
                <p className="font-bold text-[12px]" style={{ color: '#18181b' }}>Pristia Candra</p>
                <p className="text-[10px]" style={{ color: '#9ca3af' }}>Nameless panda #112</p>
              </div>
            </div>
            <ChevronDown size={14} className="rotate-180" style={{ color: '#9ca3af' }} />
          </div>
        </div>
      </aside>

      {/* ═══════ CENTER COLUMN ═══════ */}
      <main className="flex-1 flex flex-col gap-5 min-w-0">

        {/* Row 1 */}
        <div className="grid grid-cols-2 gap-5">
          <div className="rounded-[24px] p-5 shadow-sm" style={{ background: '#fff', border: '1px solid #e8e8ea' }}>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-[22px] font-bold tracking-[-0.5px] m-0" style={{ color: '#18181b' }}>Good Morning, Pristia!</h1>
                <p className="text-[13px] mt-1" style={{ color: '#9ca3af' }}>What do you plan to do today?</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex -space-x-1.5 mb-1.5">
                  {['🐷','🐸','🐯','🦊'].map((e, i) => (
                    <span key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]" style={{ background: ['#fecdd3','#bbf7d0','#fde68a','#e9d5ff'][i], border: '2px solid #fff' }}>{e}</span>
                  ))}
                </div>
                <p className="text-[11px] font-bold" style={{ color: '#18181b' }}>Odama Studio</p>
                <div className="flex items-center gap-1 mt-0.5"><User size={10} style={{ color: '#9ca3af' }} /><span className="text-[10px] font-semibold" style={{ color: '#9ca3af' }}>1.354</span></div>
              </div>
            </div>
          </div>
          <div className="rounded-[24px] p-5 shadow-sm flex items-center justify-between" style={{ background: '#fff', border: '1px solid #e8e8ea' }}>
            <div className="flex items-center gap-3.5">
              <img src={pandaImg} alt="" className="w-11 h-11 rounded-full object-cover" />
              <div>
                <p className="font-bold text-[13px]" style={{ color: '#18181b' }}>Nameless Pada #245</p>
                <p className="text-[12px]" style={{ color: '#9ca3af' }}>Microsoft</p>
              </div>
            </div>
            <div className="text-right pl-5" style={{ borderLeft: '1px solid #f3f4f6' }}>
              <div className="flex items-center justify-end gap-1 mb-1"><span className="text-[11px]" style={{ color: '#9ca3af' }}>Overall Impact Score :</span><span className="text-[11px] font-bold" style={{ color: '#18181b' }}>10%</span></div>
              <div className="flex items-center justify-end gap-1"><span className="text-[11px]" style={{ color: '#9ca3af' }}>Ideal Session Length :</span><span className="text-[11px] font-bold" style={{ color: '#18181b' }}>120 min</span></div>
            </div>
          </div>
        </div>

        {/* Row 2: Task Card */}
        <div className="rounded-[24px] p-5 shadow-sm flex-1 flex flex-col" style={{ background: '#fff', border: '1px solid #e8e8ea' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[18px] font-bold m-0" style={{ color: '#18181b' }}>Today's Task</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={focusActive ? pauseSession : startSession}
                className="flex items-center gap-2 px-4 py-[8px] rounded-xl text-[12px] font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: focusActive ? (timerRunning ? '#dc2626' : '#f59e0b') : '#18181b' }}
              >
                {focusActive ? (timerRunning ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Resume</>) : <><Clock size={14} /> Focus Mode</>}
                {focusActive && <span className="ml-1 font-mono text-[11px] tabular-nums">{fmt(focusTime)}</span>}
              </button>
              <button className="flex items-center gap-2 px-4 py-[8px] rounded-xl text-[12px] font-semibold transition-colors hover:bg-[#f9fafb] active:scale-95" style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#3f3f46' }}>
                <Sparkles size={14} style={{ color: '#f59e0b' }} /> AI Assist
              </button>
            </div>
          </div>

          <div className="flex-1">
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: '#f9fafb' }} />)}</div>
            ) : tasks.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: '#f3f4f6' }}>
                  <Clock size={28} style={{ color: '#c4c4c8' }} />
                </div>
                <p className="text-[14px] font-semibold" style={{ color: '#6b7280' }}>No tasks yet</p>
                <p className="text-[12px]" style={{ color: '#9ca3af' }}>Click "Add Task" below to create your first task</p>
                <button onClick={openCreate} className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 rounded-xl text-[12px] font-bold text-white transition-all hover:opacity-90 active:scale-95" style={{ background: '#7c3aed' }}>
                  <Plus size={14} /> Create Task
                </button>
              </div>
            ) : (
              <div className="space-y-0.5">
                {tasks.map(task => (
                  <div key={task.id} className="group flex items-center justify-between py-3 px-3 rounded-2xl transition-colors" style={{ cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleComplete(task)}
                        className="w-[18px] h-[18px] rounded flex-shrink-0 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                        style={{ border: task.status === 'Completed' ? 'none' : '1.5px solid #d1d5db', background: task.status === 'Completed' ? '#22c55e' : 'transparent', cursor: 'pointer' }}
                      >
                        {task.status === 'Completed' && <Check size={11} color="white" strokeWidth={3} />}
                      </button>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.8px] mb-[2px]" style={{ color: '#9ca3af' }}>{task.project}</p>
                        <p className={`text-[14px] font-semibold ${task.status === 'Completed' ? 'line-through' : ''}`} style={{ color: task.status === 'Completed' ? '#9ca3af' : '#18181b' }}>{task.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {badge(task.priority)}
                      <button onClick={() => openEdit(task)} className="transition-all hover:scale-110 active:scale-95" style={{ color: '#c4c4c8', cursor: 'pointer' }} title="Edit task">
                        <ChevronDown size={16} />
                      </button>
                      <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95" style={{ color: '#c4c4c8', cursor: 'pointer' }} title="Delete task">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom action bar */}
          <div className="flex items-center gap-2.5 pt-4 mt-2" style={{ borderTop: '1px solid #f3f4f6' }}>
            <button
              onClick={startSession}
              className="px-4 py-[7px] rounded-xl text-[12px] font-semibold transition-all hover:bg-[#f9fafb] active:scale-95"
              style={{ border: '1px solid #e5e7eb', color: '#6b7280', background: '#fff', cursor: 'pointer' }}
            >
              Start Session
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-4 py-[7px] rounded-xl text-[12px] font-semibold transition-all hover:bg-[#f9fafb] active:scale-95"
              style={{ border: '1px solid #e5e7eb', color: '#6b7280', background: '#fff', cursor: 'pointer' }}
            >
              <Plus size={13} /> Add Task
            </button>
            <button className="ml-auto transition-opacity hover:opacity-70" style={{ color: '#c4c4c8', cursor: 'pointer' }}>
              <HelpCircle size={16} />
            </button>
          </div>
        </div>
      </main>

      {/* ═══════ RIGHT COLUMN ═══════ */}
      <aside className="w-[300px] flex-shrink-0 flex flex-col gap-5">

        {/* Focus Mode Card */}
        <div className="rounded-[24px] p-5 shadow-sm" style={{ background: '#18181b' }}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-[16px] text-white m-0">Focus Mode</h3>
            <button onClick={resetSession} className="p-1.5 rounded-lg transition-colors hover:bg-[#3f3f46]" style={{ background: '#27272a', cursor: 'pointer' }} title="Reset timer">
              <Settings size={15} style={{ color: '#71717a' }} />
            </button>
          </div>
          <p className="text-[11px] mb-4" style={{ color: '#71717a' }}>Stay focused for</p>

          <div className="flex items-center justify-between mb-5">
            <span className="text-[42px] font-extrabold tracking-[2px] text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fmt(focusTime)}
            </span>
            <button
              onClick={timerRunning ? pauseSession : startSession}
              className="flex items-center gap-1.5 px-3.5 py-[7px] rounded-full text-[11px] font-bold transition-all hover:bg-[#f3f4f6] active:scale-95"
              style={{ background: '#fff', color: '#18181b', cursor: 'pointer' }}
            >
              {timerRunning ? <Pause size={11} fill="#18181b" /> : <Play size={11} fill="#18181b" />}
              {timerRunning ? 'Take a Break' : 'Start Focus'}
            </button>
          </div>

          <div className="flex items-center justify-between mb-4 pt-4" style={{ borderTop: '1px solid #27272a' }}>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-medium" style={{ color: '#a1a1aa' }}>Auto Breaks</span>
              <HelpCircle size={11} style={{ color: '#52525b' }} />
            </div>
            <button
              onClick={() => { setAutoBreaks(!autoBreaks); showToast(autoBreaks ? 'Auto breaks off' : 'Auto breaks on'); }}
              className="w-[36px] h-[20px] rounded-full p-[2px] flex transition-all"
              style={{ background: autoBreaks ? '#7c3aed' : '#3f3f46', justifyContent: autoBreaks ? 'flex-end' : 'flex-start', cursor: 'pointer' }}
            >
              <span className="w-4 h-4 rounded-full bg-white transition-all" />
            </button>
          </div>

          {/* Duration inputs — EDITABLE */}
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <div className="rounded-xl p-2.5" style={{ background: '#27272a' }}>
              <label className="text-[9px] font-bold uppercase tracking-[0.5px] block mb-1" style={{ color: '#71717a' }}>Focused duration</label>
              <div className="flex items-center justify-between">
                <input
                  type="number"
                  min="1"
                  max="480"
                  value={focusMin}
                  onChange={e => setFocusMin(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-[12px] font-semibold text-white bg-transparent border-none outline-none"
                  style={{ appearance: 'textfield' }}
                />
                <span className="text-[11px] mr-1 flex-shrink-0" style={{ color: '#71717a' }}>min</span>
                <Clock size={13} style={{ color: '#52525b' }} className="flex-shrink-0" />
              </div>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: '#27272a' }}>
              <label className="text-[9px] font-bold uppercase tracking-[0.5px] block mb-1" style={{ color: '#71717a' }}>Break duration</label>
              <div className="flex items-center justify-between">
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={breakMin}
                  onChange={e => setBreakMin(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-[12px] font-semibold text-white bg-transparent border-none outline-none"
                  style={{ appearance: 'textfield' }}
                />
                <span className="text-[11px] mr-1 flex-shrink-0" style={{ color: '#71717a' }}>min</span>
                <Calendar size={13} style={{ color: '#52525b' }} className="flex-shrink-0" />
              </div>
            </div>
          </div>

          <button
            onClick={saveFocusConfig}
            className="w-full py-2.5 rounded-xl text-[12px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', cursor: 'pointer' }}
          >
            Save
          </button>
        </div>

        {/* Balloon image */}
        <div className="flex-1 rounded-[24px] overflow-hidden shadow-sm group" style={{ border: '1px solid #e8e8ea', minHeight: '200px' }}>
          <img src={balloonsImg} alt="Cappadocia" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
      </aside>

      {/* ═══════ MODAL ═══════ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="w-full max-w-[420px] rounded-[24px] p-6 shadow-xl relative animate-in" style={{ background: '#fff', animation: 'modalIn 0.2s ease-out' }}>
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-full transition-colors" style={{ color: '#9ca3af', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <X size={18} />
            </button>
            <h3 className="font-bold text-[17px] mb-5" style={{ color: '#18181b' }}>{editing ? 'Edit Task' : 'Create New Task'}</h3>

            <form onSubmit={saveTask} className="space-y-3.5">
              <FormField label="Title">
                <input required placeholder="e.g. Build Login Page" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="modal-input" />
              </FormField>
              <FormField label="Description">
                <textarea rows={2} placeholder="Describe your task..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="modal-input" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Status">
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="modal-input">
                    <option>Todo</option><option>In Progress</option><option>Completed</option>
                  </select>
                </FormField>
                <FormField label="Priority">
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="modal-input">
                    <option>Low</option><option>Medium</option><option>High</option>
                  </select>
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Due Date">
                  <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="modal-input" />
                </FormField>
                <FormField label="Project">
                  <select value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} className="modal-input">
                    <option>Odama Website</option><option>Dribbble</option>
                  </select>
                </FormField>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:bg-[#f9fafb] active:scale-95" style={{ border: '1px solid #e5e7eb', color: '#6b7280', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90 active:scale-95" style={{ background: '#7c3aed', cursor: 'pointer' }}>{editing ? 'Save Changes' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[60] flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg transition-all" style={{ background: toast.type === 'error' ? '#ef4444' : '#18181b', color: '#fff', animation: 'toastIn 0.3s ease-out' }}>
          <Bell size={15} />
          <span className="text-[13px] font-semibold">{toast.msg}</span>
        </div>
      )}

      {/* Animations & modal input styles */}
      <style>{`
        .modal-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          font-size: 13px;
          color: #18181b;
          background: #fff;
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          cursor: text;
        }
        .modal-input:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.08);
        }
        .modal-input::placeholder { color: #c4c4c8; }
        textarea.modal-input { resize: none; }
        select.modal-input { cursor: pointer; }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] { -moz-appearance: textfield; }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ─── Sidebar button component ─── */
function SidebarBtn({ icon, label, active, trailing, small }) {
  return (
    <button
      className={`w-full flex items-center justify-between gap-3 rounded-xl transition-colors ${small ? 'px-2.5 py-1.5' : 'px-2.5 py-2'}`}
      style={{ background: active ? '#f5f5f7' : 'transparent', color: active ? '#18181b' : '#6b7280', fontWeight: active ? 600 : 500, fontSize: '13px', cursor: 'pointer' }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#fafafa'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span className="flex items-center gap-2.5" style={{ color: active ? '#18181b' : '#9ca3af' }}>
        {icon}
        <span style={{ color: active ? '#18181b' : '#6b7280' }}>{label}</span>
      </span>
      {trailing}
    </button>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold mb-1" style={{ color: '#9ca3af' }}>{label}</label>
      {children}
    </div>
  );
}
