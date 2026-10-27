'use client';

import React from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';

interface MetricCardsProps {
  stats: {
    totalCustomers: number;
    totalInvoices: number;
    pendingInvoices: number;
    pendingAmount: number;
    paidInvoices: number;
    paidAmount: number;
    overdueInvoices: number;
    overdueAmount: number;
    totalAmountDue: number;
    totalBilled: number;
    upcomingRemindersCount: number;
    voiceAnalytics: {
      totalCommands: number;
      successRate: number;
      avgLatency: {
        sttMs: number;
        llmMs: number;
        ttsMs: number;
        totalMs: number;
      };
    };
  } | null;
  isLoading: boolean;
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function MetricCards({ stats, isLoading }: MetricCardsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-20 rounded-2xl border border-[#3a3834] bg-[#1f1d1b]/60 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* 4 Compact Financial & Customer KPI Cards (TryClean warm paper & cream style) */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {/* Total Customers */}
        <div className="clean-card p-3.5 hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-xs text-[#c3beb7]">
            <span className="font-medium">Total Customers</span>
            <Users className="h-3.5 w-3.5 text-[#f6f3eb]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#f6f3eb]">
              {stats.totalCustomers}
            </span>
            <span className="text-[11px] text-[#948e87]">SMB accounts</span>
          </div>
          <div className="mt-1 text-[11px] text-[#948e87] truncate">
            {stats.totalInvoices} invoices in directory
          </div>
        </div>

        {/* Pending Invoices */}
        <div className="clean-card p-3.5 hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#ecc06f]">Pending Invoices</span>
            <Clock className="h-3.5 w-3.5 text-[#ecc06f]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#f6f3eb]">
              {stats.pendingInvoices}
            </span>
            <span className="text-xs font-mono font-medium text-[#ecc06f]">
              {formatINR(stats.pendingAmount)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#948e87]">
            Awaiting customer payment
          </div>
        </div>

        {/* Paid Invoices */}
        <div className="clean-card p-3.5 hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#68c99e]">Paid Invoices</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-[#68c99e]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#f6f3eb]">
              {stats.paidInvoices}
            </span>
            <span className="text-xs font-mono font-medium text-[#68c99e]">
              {formatINR(stats.paidAmount)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#948e87]">
            Collected to merchant ledger
          </div>
        </div>

        {/* Amount Due (Warm Terracotta Highlight) */}
        <div className="clean-card p-3.5 border-[#592f2a] bg-[#1f1d1b] hover:border-[#e66f5c]/60 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#e66f5c]">Total Amount Due</span>
            <AlertCircle className="h-3.5 w-3.5 text-[#e66f5c]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#e66f5c]">
              {formatINR(stats.totalAmountDue)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-[#948e87]">
            <span>Overdue: {formatINR(stats.overdueAmount)} ({stats.overdueInvoices})</span>
            <span className="text-[#ecc06f]">{stats.upcomingRemindersCount} Reminders</span>
          </div>
        </div>
      </div>

      {/* AI Voice Performance & Latency Telemetry Bar */}
      <div className="rounded-xl border border-[#3a3834] bg-[#11100e] px-3.5 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-[#ecc06f]" />
            <span className="font-medium text-[#f6f3eb]">Gnani Telemetry:</span>
            <span className="rounded-full bg-[#172b22] px-2 py-0.5 text-[10px] font-semibold text-[#68c99e] border border-[#295441]">
              {stats.voiceAnalytics.successRate}% Success
            </span>
            <span className="text-[#948e87] text-[11px]">
              ({stats.voiceAnalytics.totalCommands} voice commands)
            </span>
          </div>

          {/* Monospace Latency Breakdown */}
          <div className="flex items-center gap-2.5 font-mono text-[11px] text-[#c3beb7]">
            <div>
              <span className="text-[#948e87]">Prisma: </span>
              <span className="text-[#68c99e] font-semibold">{stats.voiceAnalytics.avgLatency.sttMs}ms</span>
            </div>
            <span className="text-[#3a3834]">•</span>
            <div>
              <span className="text-[#948e87]">Evon: </span>
              <span className="text-[#ecc06f] font-semibold">{stats.voiceAnalytics.avgLatency.llmMs}ms</span>
            </div>
            <span className="text-[#3a3834]">•</span>
            <div>
              <span className="text-[#948e87]">Timbre: </span>
              <span className="text-[#dcd5c9] font-semibold">{stats.voiceAnalytics.avgLatency.ttsMs}ms</span>
            </div>
            <span className="text-[#3a3834]">•</span>
            <div>
              <span className="text-[#948e87]">Total: </span>
              <span className="text-[#f6f3eb] font-bold">{stats.voiceAnalytics.avgLatency.totalMs}ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
