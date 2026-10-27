'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Navbar from '@/components/Navbar';
import MetricCards from '@/components/MetricCards';
import VoiceConsole from '@/components/VoiceConsole';
import InvoiceTable, { InvoiceItem } from '@/components/InvoiceTable';
import CustomerTable, { CustomerItem } from '@/components/CustomerTable';
import RemindersList, { ReminderItem } from '@/components/RemindersList';
import VoiceHistoryTable, { VoiceEventItem } from '@/components/VoiceHistoryTable';
import CreateInvoiceModal from '@/components/CreateInvoiceModal';
import CreateCustomerModal from '@/components/CreateCustomerModal';
import InvoiceViewModal from '@/components/InvoiceViewModal';
import {
  FileText,
  Users,
  Bell,
  Layers,
  RefreshCw,
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
  const [language, setLanguage] = useState<'hi-IN' | 'en-IN' | 'hinglish'>('hi-IN');
  const [activeTab, setActiveTab] = useState<'invoices' | 'customers' | 'reminders' | 'history'>('invoices');

  // Modals state
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [preselectedCustomer, setPreselectedCustomer] = useState<CustomerItem | null>(null);
  const [isReseeding, setIsReseeding] = useState(false);

  // SWR Hooks for live data
  const { data: statsData, mutate: mutateStats, isLoading: statsLoading } = useSWR('/api/stats', fetcher);
  const { data: invoicesData, mutate: mutateInvoices, isLoading: invoicesLoading } = useSWR('/api/invoices', fetcher);
  const { data: customersData, mutate: mutateCustomers, isLoading: customersLoading } = useSWR('/api/customers', fetcher);
  const { data: remindersData, mutate: mutateReminders, isLoading: remindersLoading } = useSWR('/api/reminders/upcoming', fetcher);
  const { data: historyData, mutate: mutateHistory, isLoading: historyLoading } = useSWR('/api/voice/history', fetcher);

  // Re-fetch all data after a voice command or update
  const refreshAll = () => {
    mutateStats();
    mutateInvoices();
    mutateCustomers();
    mutateReminders();
    mutateHistory();
  };

  const handleReseed = async () => {
    try {
      setIsReseeding(true);
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        refreshAll();
      }
    } catch (err) {
      console.error('Failed to reseed:', err);
    } finally {
      setIsReseeding(false);
    }
  };

  const handleCreateInvoiceForCustomer = (customer: CustomerItem) => {
    setPreselectedCustomer(customer);
    setIsCreateInvoiceOpen(true);
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      });
      refreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  const invoices: InvoiceItem[] = invoicesData?.invoices || [];
  const customers: CustomerItem[] = customersData?.customers || [];
  const reminders: ReminderItem[] = remindersData?.reminders || [];
  const historyEvents: VoiceEventItem[] = historyData?.events || [];
  const stats = statsData?.stats || null;

  return (
    <div className="min-h-screen bg-[#161513] text-[#f6f3eb] flex flex-col font-sans paper-grain">
      {/* Top Navbar */}
      <Navbar
        language={language}
        onLanguageChange={setLanguage}
        onReseed={handleReseed}
        isReseeding={isReseeding}
      />

      {/* Main Workspace Ground */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 space-y-3.5">
        {/* KPI & AI Latency Metrics */}
        <MetricCards stats={stats} isLoading={statsLoading} />

        {/* Hero Voice Command Console */}
        <VoiceConsole language={language} onActionComplete={refreshAll} />

        {/* Tab Navigation for Business Records (TryClean pill segmented bar) */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3a3834] pb-2.5">
            <div className="flex items-center gap-1.5 rounded-full border border-[#3a3834] bg-[#11100e] p-1">
              {/* Tab 1: Invoices */}
              <button
                onClick={() => setActiveTab('invoices')}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                  activeTab === 'invoices'
                    ? 'bg-[#f6f3eb] text-[#161513] shadow-sm'
                    : 'text-[#c3beb7] hover:text-[#f6f3eb]'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Invoices</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${activeTab === 'invoices' ? 'bg-[#161513]/10 text-[#161513]' : 'bg-[#1f1d1b] text-[#948e87]'}`}>
                  {invoices.length}
                </span>
              </button>

              {/* Tab 2: Customers */}
              <button
                onClick={() => setActiveTab('customers')}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                  activeTab === 'customers'
                    ? 'bg-[#f6f3eb] text-[#161513] shadow-sm'
                    : 'text-[#c3beb7] hover:text-[#f6f3eb]'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Customers</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${activeTab === 'customers' ? 'bg-[#161513]/10 text-[#161513]' : 'bg-[#1f1d1b] text-[#948e87]'}`}>
                  {customers.length}
                </span>
              </button>

              {/* Tab 3: Reminders */}
              <button
                onClick={() => setActiveTab('reminders')}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                  activeTab === 'reminders'
                    ? 'bg-[#f6f3eb] text-[#161513] shadow-sm'
                    : 'text-[#c3beb7] hover:text-[#f6f3eb]'
                }`}
              >
                <Bell className="h-3.5 w-3.5" />
                <span>Reminders</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${activeTab === 'reminders' ? 'bg-[#161513]/10 text-[#161513]' : 'bg-[#2e2617] text-[#ecc06f]'}`}>
                  {reminders.length}
                </span>
              </button>

              {/* Tab 4: Voice Audit History */}
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                  activeTab === 'history'
                    ? 'bg-[#f6f3eb] text-[#161513] shadow-sm'
                    : 'text-[#c3beb7] hover:text-[#f6f3eb]'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Voice History</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${activeTab === 'history' ? 'bg-[#161513]/10 text-[#161513]' : 'bg-[#1f1d1b] text-[#948e87]'}`}>
                  {historyEvents.length}
                </span>
              </button>
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={refreshAll}
              className="flex items-center gap-1.5 rounded-full border border-[#3a3834] bg-[#1f1d1b] px-3 py-1 text-xs font-medium text-[#c3beb7] hover:text-[#f6f3eb] hover:border-white/20 transition-all"
              title="Refresh dashboard data"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Active Tab View */}
          {activeTab === 'invoices' && (
            <InvoiceTable
              invoices={invoices}
              isLoading={invoicesLoading}
              onRefresh={refreshAll}
              onOpenCreateModal={() => {
                setPreselectedCustomer(null);
                setIsCreateInvoiceOpen(true);
              }}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerTable
              customers={customers}
              isLoading={customersLoading}
              onRefresh={refreshAll}
              onOpenCreateModal={() => setIsCreateCustomerOpen(true)}
              onCreateInvoiceForCustomer={handleCreateInvoiceForCustomer}
            />
          )}

          {activeTab === 'reminders' && (
            <RemindersList
              reminders={reminders}
              isLoading={remindersLoading}
              onRefresh={refreshAll}
            />
          )}

          {activeTab === 'history' && (
            <VoiceHistoryTable
              events={historyEvents}
              isLoading={historyLoading}
              onRefresh={refreshAll}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#3a3834] bg-[#11100e] py-4 text-center text-[11px] text-[#948e87]">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            Vyapar Voice • Great Indian AI Internship Challenge • November 2026
          </p>
          <p className="flex items-center gap-2">
            <span>Prisma v2.5 STT</span> • <span>Evon v3.3 LLM</span> • <span>Timbre v2.5 TTS</span>
          </p>
        </div>
      </footer>

      {/* Modals */}
      <CreateInvoiceModal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        customers={customers}
        preselectedCustomer={preselectedCustomer}
        onSuccess={refreshAll}
      />

      <CreateCustomerModal
        isOpen={isCreateCustomerOpen}
        onClose={() => setIsCreateCustomerOpen(false)}
        onSuccess={refreshAll}
      />

      <InvoiceViewModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onMarkPaid={handleMarkPaid}
      />
    </div>
  );
}
