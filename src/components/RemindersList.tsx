'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
  Bell,
  Clock,
  Phone,
  CheckCircle2,
  Sparkles,
  Calendar,
  Volume2,
  Plus,
  Trash2,
  Check,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { formatINR } from './MetricCards';
import { playReminderChime, playAlertPing } from '@/lib/audioTone';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface ReminderItem {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string | null;
  amount: number;
  invoiceStatus: string;
  remindAt: string;
  channel: string;
  status: string;
  createdAt: string;
}

export interface ScheduleTaskItem {
  id: string;
  time_slot: string;
  task_title: string;
  category: string;
  priority: string;
  is_completed: boolean;
  remind_at?: string | null;
  created_at: string;
}

interface RemindersListProps {
  reminders: ReminderItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function RemindersList({
  reminders,
  isLoading,
  onRefresh,
}: RemindersListProps) {
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'invoices'>('timeline');
  const [completedReminderIds, setCompletedReminderIds] = useState<Set<string>>(new Set());
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [playedTone, setPlayedTone] = useState(false);

  // New task form state
  const [newTimeSlot, setNewTimeSlot] = useState('11:00 AM - 12:30 PM');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newCategory, setNewCategory] = useState('calls');
  const [newPriority, setNewPriority] = useState('high');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Fetch daily schedule tasks
  const { data: scheduleData, mutate: mutateSchedule } = useSWR('/api/schedule', fetcher);
  const tasks: ScheduleTaskItem[] = scheduleData?.tasks || [];

  const handleTestChime = () => {
    playReminderChime();
    setPlayedTone(true);
    setTimeout(() => setPlayedTone(false), 1500);
  };

  const handleToggleTaskCompletion = async (task: ScheduleTaskItem) => {
    try {
      playAlertPing();
      await fetch('/api/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          is_completed: !task.is_completed,
        }),
      });
      mutateSchedule();
    } catch (e) {
      console.error('Failed to toggle task:', e);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await fetch(`/api/schedule?id=${id}`, { method: 'DELETE' });
      mutateSchedule();
    } catch (e) {
      console.error('Failed to delete task:', e);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTimeSlot.trim()) return;

    try {
      setIsSubmittingTask(true);
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time_slot: newTimeSlot.trim(),
          task_title: newTaskTitle.trim(),
          category: newCategory,
          priority: newPriority,
        }),
      });

      if (res.ok) {
        playReminderChime();
        setShowAddTaskModal(false);
        setNewTaskTitle('');
        mutateSchedule();
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to add schedule task:', err);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleDismissInvoiceReminder = (id: string) => {
    playAlertPing();
    setCompletedReminderIds((prev) => new Set(prev).add(id));
  };

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'billing':
        return 'text-[#68c99e] bg-[#172b22] border-[#295441]';
      case 'calls':
        return 'text-[#ecc06f] bg-[#2e2617] border-[#594726]';
      case 'vendor':
        return 'text-[#e66f5c] bg-[#2e1b19] border-[#592f2a]';
      case 'accounts':
        return 'text-[#f6f3eb] bg-[#282623] border-[#3a3834]';
      default:
        return 'text-[#c3beb7] bg-[#1f1d1b] border-[#3a3834]';
    }
  };

  return (
    <div className="clean-card p-4 sm:p-5 space-y-4">
      {/* Top Header & Sub-Tab Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#3a3834] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-base font-semibold text-[#f6f3eb] flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#ecc06f]" />
              Daily Planner & Routine Reminders
            </h3>
            <span className="rounded-full bg-[#11100e] border border-[#3a3834] px-2 py-0.5 text-[11px] font-mono text-[#ecc06f]">
              Gnani AI Voice
            </span>
          </div>
          <p className="text-[11px] text-[#948e87]">
            Time-slotted business routine with audible single-tone message chimes and customer reminders
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Test Chime Tone Button */}
          <button
            onClick={handleTestChime}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              playedTone
                ? 'border-[#68c99e] bg-[#172b22] text-[#68c99e] scale-105'
                : 'border-[#594726] bg-[#2e2617] text-[#ecc06f] hover:bg-[#3a2f1b]'
            }`}
            title="Play single-tone message reminder chime"
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>{playedTone ? 'Chime Played!' : 'Test Reminder Chime'}</span>
          </button>

          {/* Add Task Button */}
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="clean-btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs: Timeline vs Invoice Due Reminders */}
      <div className="flex items-center gap-2 border-b border-[#3a3834] pb-2 text-xs">
        <button
          onClick={() => setActiveSubTab('timeline')}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition-colors ${
            activeSubTab === 'timeline'
              ? 'bg-[#f6f3eb] text-[#161513] font-semibold'
              : 'text-[#948e87] hover:text-[#f6f3eb]'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Daily Schedule Timeline ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('invoices')}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition-colors ${
            activeSubTab === 'invoices'
              ? 'bg-[#f6f3eb] text-[#161513] font-semibold'
              : 'text-[#948e87] hover:text-[#f6f3eb]'
          }`}
        >
          <Bell className="h-3.5 w-3.5" />
          <span>Invoice Due Reminders ({reminders.length})</span>
        </button>
      </div>

      {/* TAB 1: DAILY SCHEDULE TIMELINE */}
      {activeSubTab === 'timeline' && (
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center rounded-2xl border border-dashed border-[#3a3834] bg-[#11100e] p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2e2617] text-[#ecc06f] mb-2 border border-[#594726]">
                <Sparkles className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-semibold text-[#f6f3eb]">No daily schedule items yet</h4>
              <p className="mt-1 text-[11px] text-[#948e87] max-w-sm">
                Say into microphone: &ldquo;मुझे आज का काम प्लान करने में मदद करो&rdquo; to auto-generate your time-blocked day!
              </p>
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="mt-3 clean-btn-secondary px-3.5 py-1 text-xs"
              >
                + Add Custom Routine Task
              </button>
            </div>
          ) : (
            <div className="relative pl-4 border-l border-[#3a3834] space-y-3 my-2">
              {tasks.map((task, idx) => (
                <div
                  key={task.id}
                  className={`relative rounded-xl border p-3.5 transition-all group ${
                    task.is_completed
                      ? 'border-[#295441]/50 bg-[#172b22]/20 opacity-70'
                      : 'border-[#3a3834] bg-[#11100e] hover:border-[#594726]'
                  }`}
                >
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-[23px] top-4 h-3.5 w-3.5 rounded-full border-2 border-[#161513] ${
                      task.is_completed
                        ? 'bg-[#68c99e]'
                        : idx === 0
                        ? 'bg-[#ecc06f] animate-pulse'
                        : 'bg-[#948e87]'
                    }`}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {/* Time Slot Badge */}
                        <span className="font-mono text-xs font-bold text-[#ecc06f] bg-[#2e2617] border border-[#594726] px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Clock className="h-3 w-3 text-[#ecc06f]" />
                          {task.time_slot}
                        </span>

                        {/* Category Badge */}
                        <span
                          className={`font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${getCategoryColor(
                            task.category
                          )}`}
                        >
                          {task.category}
                        </span>

                        {task.priority === 'high' && (
                          <span className="text-[10px] text-[#e66f5c] font-medium flex items-center gap-0.5">
                            <AlertCircle className="h-3 w-3" />
                            Priority
                          </span>
                        )}
                      </div>

                      {/* Task Title */}
                      <p
                        className={`text-sm font-medium ${
                          task.is_completed
                            ? 'line-through text-[#6e6962]'
                            : 'text-[#f6f3eb]'
                        }`}
                      >
                        {task.task_title}
                      </p>
                    </div>

                    {/* Actions on Task */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {/* Play Chime Button */}
                      <button
                        onClick={() => playReminderChime()}
                        className="flex items-center gap-1 rounded-full border border-[#3a3834] bg-[#1f1d1b] px-2.5 py-1 text-[11px] text-[#c3beb7] hover:text-[#ecc06f] hover:border-[#594726] transition-colors"
                        title="Ring message reminder chime"
                      >
                        <Volume2 className="h-3 w-3 text-[#ecc06f]" />
                        <span>Chime</span>
                      </button>

                      {/* Complete Checkbox Toggle */}
                      <button
                        onClick={() => handleToggleTaskCompletion(task)}
                        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          task.is_completed
                            ? 'bg-[#172b22] text-[#68c99e] border border-[#295441]'
                            : 'border border-[#3a3834] bg-[#1f1d1b] text-[#c3beb7] hover:text-white'
                        }`}
                      >
                        <Check className="h-3 w-3" />
                        <span>{task.is_completed ? 'Done' : 'Mark Done'}</span>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-[#6e6962] hover:text-[#e66f5c] p-1 transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INVOICE DUE REMINDERS */}
      {activeSubTab === 'invoices' && (
        <div>
          {isLoading ? (
            <div className="space-y-1.5 py-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-[#282623] animate-pulse" />
              ))}
            </div>
          ) : reminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center rounded-2xl border border-dashed border-[#3a3834] bg-[#11100e] p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2e2617] text-[#ecc06f] mb-2 border border-[#594726]">
                <Sparkles className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-semibold text-[#f6f3eb]">No upcoming invoice reminders</h4>
              <p className="mt-1 text-[11px] text-[#948e87] max-w-sm">
                Say into microphone: &ldquo;Ravi Kumar ko Friday ko reminder set karo&rdquo;
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {reminders.map((rem) => {
                const isDone = completedReminderIds.has(rem.id);
                const dateStr = new Date(rem.remindAt).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                });

                return (
                  <div
                    key={rem.id}
                    className={`rounded-xl border p-3 transition-colors ${
                      isDone
                        ? 'border-[#295441] bg-[#172b22]/30 opacity-60'
                        : 'border-[#3a3834] bg-[#11100e] hover:border-[#594726]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-white">
                        {rem.invoiceNumber}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-[#ecc06f]">
                        {formatINR(rem.amount)}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-[#f6f3eb]">{rem.customerName}</span>
                      {rem.customerPhone && (
                        <span className="text-[10px] text-[#948e87] flex items-center gap-1">
                          <Phone className="h-2.5 w-2.5" />
                          {rem.customerPhone}
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-[#3a3834] pt-2 text-[11px]">
                      <div className="flex items-center gap-1 text-[#c3beb7]">
                        <Clock className="h-3 w-3 text-[#ecc06f]" />
                        <span>{dateStr}</span>
                      </div>

                      <button
                        onClick={() => handleDismissInvoiceReminder(rem.id)}
                        className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                          isDone
                            ? 'text-[#68c99e] bg-[#172b22]'
                            : 'border border-[#3a3834] bg-[#1f1d1b] text-[#c3beb7] hover:text-white hover:bg-[#282623]'
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3 text-[#68c99e]" />
                        <span>{isDone ? 'Completed' : 'Dismiss'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="clean-card max-w-md w-full p-5 space-y-4 border-[#3a3834] bg-[#161513] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#3a3834] pb-2.5">
              <h4 className="font-serif text-base font-semibold text-[#f6f3eb] flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#ecc06f]" />
                Add Daily Routine Task
              </h4>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="text-[#948e87] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-[#948e87] mb-1">Time Slot (e.g. 10:00 AM - 11:30 AM)</label>
                <input
                  type="text"
                  value={newTimeSlot}
                  onChange={(e) => setNewTimeSlot(e.target.value)}
                  placeholder="e.g. 11:30 AM - 01:00 PM"
                  required
                  className="w-full rounded-lg border border-[#3a3834] bg-[#11100e] px-3 py-2 text-xs text-[#f6f3eb] focus:border-white/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#948e87] mb-1">Task Title / What to do</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Call Ravi Kumar to collect pending payment"
                  required
                  className="w-full rounded-lg border border-[#3a3834] bg-[#11100e] px-3 py-2 text-xs text-[#f6f3eb] focus:border-white/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-[#948e87] mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-lg border border-[#3a3834] bg-[#11100e] px-3 py-2 text-xs text-[#f6f3eb] focus:border-white/30 focus:outline-none"
                  >
                    <option value="billing">Billing & Invoices</option>
                    <option value="calls">Customer Calls</option>
                    <option value="vendor">Vendor & Stock</option>
                    <option value="accounts">Accounts & Cash</option>
                    <option value="general">General Routine</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[#948e87] mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full rounded-lg border border-[#3a3834] bg-[#11100e] px-3 py-2 text-xs text-[#f6f3eb] focus:border-white/30 focus:outline-none"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#3a3834]">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="clean-btn-secondary px-3.5 py-1.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  className="clean-btn-primary px-4 py-1.5 text-xs font-semibold"
                >
                  {isSubmittingTask ? 'Saving...' : 'Add to Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
