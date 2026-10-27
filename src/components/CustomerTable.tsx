'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Languages,
  FileText,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { formatINR } from './MetricCards';

export interface CustomerItem {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  language: string;
  invoiceCount: number;
  outstandingAmount: number;
  totalBilled: number;
  createdAt: string;
}

interface CustomerTableProps {
  customers: CustomerItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
  onCreateInvoiceForCustomer: (customer: CustomerItem) => void;
}

export default function CustomerTable({
  customers,
  isLoading,
  onRefresh,
  onOpenCreateModal,
  onCreateInvoiceForCustomer,
}: CustomerTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredCustomers = customers.filter((c) => {
    return (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery)) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete customer "${name}" and all their invoices?`)) {
      return;
    }
    try {
      setDeletingId(id);
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Delete customer error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="clean-card p-4 sm:p-5 space-y-3.5">
      {/* Table Header Controls */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-serif text-base font-semibold text-[#f6f3eb] flex items-center gap-2">
            <Users className="h-4 w-4 text-[#ecc06f]" />
            Customer Directory
            <span className="rounded-full bg-[#11100e] border border-[#3a3834] px-2 py-0.5 text-[11px] font-mono text-[#c3beb7]">
              {filteredCustomers.length}
            </span>
          </h3>
          <p className="text-[11px] text-[#948e87]">
            Manage small business accounts, contact details, and outstanding balances
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreateModal}
            className="clean-btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="border-t border-[#3a3834] pt-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#948e87]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer by name or phone..."
            className="w-full rounded-full border border-[#3a3834] bg-[#11100e] pl-9 pr-3 py-1 text-xs text-[#f6f3eb] placeholder-[#6e6962] focus:border-white/30 focus:outline-none"
          />
        </div>
      </div>

      {/* Customers List / Table */}
      {isLoading ? (
        <div className="space-y-1.5 py-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-11 rounded-xl bg-[#282623] animate-pulse" />
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center rounded-2xl border border-dashed border-[#3a3834] bg-[#11100e] p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2e2617] text-[#ecc06f] mb-2 border border-[#594726]">
            <Sparkles className="h-4 w-4" />
          </div>
          <h4 className="text-xs font-semibold text-[#f6f3eb]">No customers found</h4>
          <p className="mt-1 text-[11px] text-[#948e87] max-w-sm">
            Say into microphone: &ldquo;Add customer Sunita Sharma with phone 9876543210&rdquo;
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#3a3834]">
          <table className="w-full text-left text-xs text-[#c3beb7]">
            <thead className="bg-[#11100e] border-b border-[#3a3834] text-[10px] font-semibold text-[#948e87] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 pl-3">Customer Name</th>
                <th className="py-2.5">Contact</th>
                <th className="py-2.5">Language</th>
                <th className="py-2.5">Invoices</th>
                <th className="py-2.5">Outstanding Balance</th>
                <th className="py-2.5 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3a3834] font-normal">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-[#282623]/50 transition-colors">
                  <td className="py-2.5 pl-3 font-medium text-[#f6f3eb]">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2e2617] text-[#ecc06f] text-[11px] font-bold border border-[#594726]">
                        {c.name.charAt(0)}
                      </span>
                      <span>{c.name}</span>
                    </div>
                  </td>

                  <td className="py-2.5">
                    {c.phone ? (
                      <div className="flex items-center gap-1 text-[11px] text-[#c3beb7]">
                        <Phone className="h-2.5 w-2.5 text-[#948e87]" />
                        <span>{c.phone}</span>
                      </div>
                    ) : (
                      <span className="text-[#6e6962] text-[11px]">—</span>
                    )}
                  </td>

                  <td className="py-2.5">
                    <span className="rounded-full bg-[#11100e] border border-[#3a3834] px-2 py-0.5 text-[10px] font-mono text-[#c3beb7]">
                      {c.language}
                    </span>
                  </td>

                  <td className="py-2.5 font-mono text-white">
                    {c.invoiceCount}
                  </td>

                  <td className="py-2.5 font-mono">
                    <span
                      className={`font-semibold ${
                        c.outstandingAmount > 0 ? 'text-[#ecc06f]' : 'text-[#68c99e]'
                      }`}
                    >
                      {formatINR(c.outstandingAmount)}
                    </span>
                  </td>

                  <td className="py-2.5 pr-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onCreateInvoiceForCustomer(c)}
                        className="flex items-center gap-1 rounded-full border border-[#3a3834] bg-[#11100e] px-2.5 py-0.5 text-[11px] font-medium text-[#c3beb7] hover:text-[#f6f3eb] hover:bg-[#282623] transition-colors"
                        title="New Invoice for this customer"
                      >
                        <FileText className="h-3 w-3 text-[#ecc06f]" />
                        <span>Bill</span>
                      </button>

                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        disabled={deletingId === c.id}
                        className="rounded-full border border-[#592f2a] bg-[#2e1b19]/60 p-1 text-[#e66f5c] hover:bg-[#2e1b19] transition-colors disabled:opacity-40"
                        title="Delete customer"
                      >
                        <Trash2 className="h-3 w-3" />
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
