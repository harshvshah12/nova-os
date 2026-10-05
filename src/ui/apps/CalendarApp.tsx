// ============================================================================
// NOVA OS — CALENDAR & CLOCK UTILITY APPLICATION
// Desktop calendar, interactive analog/digital clock, timer, and event manager
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Timer, 
  Plus, 
  Trash2, 
  CheckCircle2,
  Bell
} from 'lucide-react';
import { useOsStore } from '../../store/osStore';

interface EventItem {
  id: string;
  title: string;
  time: string;
  category: 'academic' | 'kernel' | 'personal';
  completed: boolean;
}

const DEFAULT_EVENTS: EventItem[] = [
  { id: '1', title: 'OS Project Viva & Architectural Demo', time: '10:00 AM', category: 'academic', completed: false },
  { id: '2', title: 'NOVA Kernel v2.5 Production Build Check', time: '02:30 PM', category: 'kernel', completed: true },
  { id: '3', title: 'Review 4KB Paging & Banker Algorithm Benchmarks', time: '04:15 PM', category: 'academic', completed: false },
  { id: '4', title: 'Portfolio Projects Synchronized to GitHub', time: '06:00 PM', category: 'personal', completed: false },
];

export const CalendarApp: React.FC = () => {
  const { simulationTime } = useOsStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'calendar' | 'timer'>('calendar');
  const [events, setEvents] = useState<EventItem[]>(DEFAULT_EVENTS);
  const [newEventTitle, setNewEventTitle] = useState('');
  
  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Clock tick
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const handle = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(handle);
  }, []);

  // Timer tick
  useEffect(() => {
    let interval: any = null;
    if (timerActive) {
      interval = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const addEvent = () => {
    if (!newEventTitle.trim()) return;
    const item: EventItem = {
      id: Date.now().toString(),
      title: newEventTitle.trim(),
      time: '12:00 PM',
      category: 'personal',
      completed: false,
    };
    setEvents([...events, item]);
    setNewEventTitle('');
  };

  const toggleEvent = (id: string) => {
    setEvents(events.map(e => e.id === id ? { ...e, completed: !e.completed } : e));
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full w-full bg-[#080C14] text-slate-200 flex flex-col md:flex-row overflow-hidden text-xs font-sans">
      {/* Left Column: Calendar & Time Header */}
      <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-white/5 overflow-y-auto p-4 space-y-4">
        {/* Clock & View Switcher */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D1424] border border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-mono text-lg font-bold text-white tracking-wider">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-[10px] text-slate-400">
                {time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1 rounded text-xs transition-all ${
                activeTab === 'calendar' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setActiveTab('timer')}
              className={`px-3 py-1 rounded text-xs transition-all ${
                activeTab === 'timer' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Timer
            </button>
          </div>
        </div>

        {activeTab === 'calendar' ? (
          <div className="space-y-3">
            {/* Month Header Navigation */}
            <div className="flex items-center justify-between px-2">
              <span className="font-semibold text-sm text-slate-200">
                {monthNames[month]} {year}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days Grid Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-slate-500 font-semibold py-1">
              <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
            </div>

            {/* Days Grid Cells */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2 text-slate-700 select-none">
                  -
                </div>
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isToday =
                  dayNum === new Date().getDate() &&
                  month === new Date().getMonth() &&
                  year === new Date().getFullYear();

                return (
                  <div
                    key={`day-${dayNum}`}
                    className={`p-2 rounded-lg transition-all cursor-pointer ${
                      isToday
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                        : 'hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    {dayNum}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Stopwatch / Timer Mode */
          <div className="p-6 rounded-xl bg-[#0D1424] border border-white/5 flex flex-col items-center justify-center space-y-4">
            <Timer className="w-8 h-8 text-cyan-400" />
            <div className="font-mono text-4xl font-bold tracking-widest text-white">
              {formatTimer(timerSeconds)}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTimerActive(!timerActive)}
                className={`px-4 py-1.5 rounded-lg font-medium text-xs transition-all ${
                  timerActive
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-cyan-500 text-slate-950 font-bold'
                }`}
              >
                {timerActive ? 'Pause' : 'Start Timer'}
              </button>
              <button
                onClick={() => {
                  setTimerActive(false);
                  setTimerSeconds(0);
                }}
                className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Events & Agenda */}
      <div className="w-full md:w-80 p-4 bg-[#0A0F1D] flex flex-col space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <span className="font-semibold text-slate-300 flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-cyan-400" /> System Agenda
          </span>
          <span className="text-[10px] text-slate-500 font-mono">{events.length} items</span>
        </div>

        {/* Add Event Form */}
        <div className="flex gap-1.5">
          <input
            type="text"
            placeholder="Add reminder..."
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addEvent()}
            className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 text-xs"
          />
          <button
            onClick={addEvent}
            className="p-2 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Event List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {events.map((evt) => (
            <div
              key={evt.id}
              className={`p-2.5 rounded-lg border transition-all flex items-start justify-between gap-2 ${
                evt.completed
                  ? 'bg-black/20 border-white/5 opacity-60'
                  : 'bg-[#0D1424] border-white/5'
              }`}
            >
              <div className="flex items-start gap-2 flex-1">
                <button
                  onClick={() => toggleEvent(evt.id)}
                  className={`mt-0.5 rounded transition-colors ${
                    evt.completed ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs truncate ${evt.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {evt.title}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                    <span>{evt.time}</span>
                    <span className="capitalize px-1.5 py-0.2 rounded bg-white/5">{evt.category}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => deleteEvent(evt.id)}
                className="text-slate-500 hover:text-rose-400 transition-colors p-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
