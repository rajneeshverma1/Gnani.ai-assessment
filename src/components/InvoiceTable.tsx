'use client';

import React, { useState } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Plus,
  Eye,
  Calendar,
  Sparkles,
  Phone,
} from 'lucide-react';
import { formatINR } from './MetricCards';

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone?: string | null;
  amount: number;
  currency: string;
  dueDate: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  notes?: string | null;
  sourceTranscript?: string | null;
  createdAt: string;
}

interface InvoiceTableProps {
  invoices: InvoiceItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
  onSelectInvoice: (inv: InvoiceItem) => void;
}

export default function InvoiceTable({
  invoices,
  isLoading,
  onRefresh,
  onOpenCreateModal,
  onSelectInvoice,
}: InvoiceTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.notes && inv.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleMarkPaid = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setUpdatingId(id);
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to update invoice:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#172b22] border border-[#295441] px-2.5 py-0.5 text-[11px] font-medium text-[#68c99e]">
            <CheckCircle2 className="h-3 w-3" />
            Paid
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#2e2617] border border-[#594726] px-2.5 py-0.5 text-[11px] font-medium text-[#ecc06f]">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#2e1b19] border border-[#592f2a] px-2.5 py-0.5 text-[11px] font-medium text-[#e66f5c]">
            <AlertCircle className="h-3 w-3" />
            Overdue
          </span>
        );
      case 'cancelled':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#1f1d1b] border border-[#3a3834] px-2.5 py-0.5 text-[11px] font-medium text-[#948e87]">
            <XCircle className="h-3 w-3" />
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="clean-card p-4 sm:p-5 space-y-3.5">
      {/* Table Header Controls */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-serif text-base font-semibold text-[#f6f3eb] flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#ecc06f]" />
            Invoices Management
            <span className="rounded-full bg-[#11100e] border border-[#3a3834] px-2 py-0.5 text-[11px] font-mono text-[#c3beb7]">
              {filteredInvoices.length}
            </span>
          </h3>
          <p className="text-[11px] text-[#948e87]">
            Track customer billings, due dates, and voice-generated invoices
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreateModal}
            className="clean-btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Tabs */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-t border-[#3a3834] pt-3">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1 text-xs">
          {['all', 'pending', 'paid', 'overdue', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`capitalize px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                statusFilter === st
                  ? 'bg-[#f6f3eb] text-[#161513] font-semibold shadow-sm'
                  : 'bg-[#11100e] text-[#948e87] hover:text-[#f6f3eb] border border-[#3a3834]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#948e87]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice or customer..."
            className="w-full rounded-full border border-[#3a3834] bg-[#11100e] pl-9 pr-3 py-1 text-xs text-[#f6f3eb] placeholder-[#6e6962] focus:border-white/30 focus:outline-none"
          />
        </div>
      </div>

      {/* Invoices List / Table */}
      {isLoading ? (
        <div className="space-y-1.5 py-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-11 rounded-xl bg-[#282623] animate-pulse" />
          ))}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center rounded-2xl border border-dashed border-[#3a3834] bg-[#11100e] p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2e2617] text-[#ecc06f] mb-2 border border-[#594726]">
            <Sparkles className="h-4 w-4" />
          </div>
          <h4 className="text-xs font-semibold text-[#f6f3eb]">No invoices found</h4>
          <p className="mt-1 text-[11px] text-[#948e87] max-w-sm">
            Say into microphone: &ldquo;Ravi Kumar ko 2500 ka invoice banao Friday tak&rdquo;
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#3a3834]">
          <table className="w-full text-left text-xs text-[#c3beb7]">
            <thead className="bg-[#11100e] border-b border-[#3a3834] text-[10px] font-semibold text-[#948e87] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 pl-3">Invoice #</th>
                <th className="py-2.5">Customer</th>
                <th className="py-2.5">Amount</th>
                <th className="py-2.5">Due Date</th>
                <th className="py-2.5">Status</th>
                <th className="py-2.5 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3a3834] font-normal">
              {filteredInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => onSelectInvoice(inv)}
                  className="hover:bg-[#282623]/50 transition-colors cursor-pointer group"
                >
                  <td className="py-2.5 pl-3 font-mono font-semibold text-white flex items-center gap-1.5">
                    <span>{inv.invoiceNumber}</span>
                    {inv.sourceTranscript && (
                      <span
                        title={`Voice command: "${inv.sourceTranscript}"`}
                        className="text-[10px] opacity-70"
                      >
                        🎙️
                      </span>
                    )}
                  </td>

                  <td className="py-2.5">
                    <div className="font-medium text-[#f6f3eb]">{inv.customerName}</div>
                    {inv.customerPhone && (
                      <div className="text-[10px] text-[#948e87] flex items-center gap-1 mt-0.5">
                        <Phone className="h-2 w-2" />
                        {inv.customerPhone}
                      </div>
                    )}
                  </td>

                  <td className="py-2.5 font-mono font-semibold text-white">
                    {formatINR(inv.amount)}
                  </td>

                  <td className="py-2.5 text-[#c3beb7]">
                    {inv.dueDate ? (
                      <div className="flex items-center gap-1 text-[11px]">
                        <Calendar className="h-3 w-3 text-[#948e87]" />
                        <span>{inv.dueDate}</span>
                      </div>
                    ) : (
                      <span className="text-[#6e6962] text-[11px]">Immediate</span>
                    )}
                  </td>

                  <td className="py-2.5">{getStatusBadge(inv.status)}</td>

                  <td className="py-2.5 pr-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {inv.status === 'pending' && (
                        <button
                          onClick={(e) => handleMarkPaid(inv.id, e)}
                          disabled={updatingId === inv.id}
                          className="rounded-full border border-[#295441] bg-[#172b22] px-2.5 py-0.5 text-[10px] font-semibold text-[#68c99e] hover:bg-[#1e3b2f] transition-colors disabled:opacity-40"
                          title="Mark this invoice as Paid"
                        >
                          Mark Paid
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectInvoice(inv);
                        }}
                        className="rounded-full border border-[#3a3834] bg-[#11100e] p-1.5 text-[#c3beb7] hover:text-white hover:bg-[#282623] transition-colors"
                        title="View GST Invoice"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
