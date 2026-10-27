'use client';

import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Phone,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { formatINR } from './MetricCards';

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

interface RemindersListProps {
  reminders: ReminderItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onOpenCreateReminderModal?: () => void;
}

export default function RemindersList({
  reminders,
  isLoading,
}: RemindersListProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const handleMarkComplete = (id: string) => {
    setCompletedIds((prev) => new Set(prev).add(id));
  };

  return (
    <div className="clean-card p-4 sm:p-5 space-y-3.5">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-[#3a3834] pb-3">
        <div>
          <h3 className="font-serif text-base font-semibold text-[#f6f3eb] flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#ecc06f]" />
            Upcoming Due-Date Reminders
            <span className="rounded-full bg-[#2e2617] border border-[#594726] px-2.5 py-0.5 text-[11px] font-mono text-[#ecc06f]">
              Next 7 Days ({reminders.length})
            </span>
          </h3>
          <p className="text-[11px] text-[#948e87]">
            Automated payment notifications scheduled for pending customer invoices
          </p>
        </div>
      </div>

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
          <h4 className="text-xs font-semibold text-[#f6f3eb]">No upcoming reminders</h4>
          <p className="mt-1 text-[11px] text-[#948e87] max-w-sm">
            Say into microphone: &ldquo;Ravi Kumar ko Friday ko reminder set karo&rdquo;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {reminders.map((rem) => {
            const isDone = completedIds.has(rem.id);
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
                    onClick={() => handleMarkComplete(rem.id)}
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
  );
}
