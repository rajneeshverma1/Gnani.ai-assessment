'use client';

import React, { useState } from 'react';
import { X, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import { CustomerItem } from './CustomerTable';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: CustomerItem[];
  preselectedCustomer?: CustomerItem | null;
  onSuccess: () => void;
}

export default function CreateInvoiceModal({
  isOpen,
  onClose,
  customers,
  preselectedCustomer,
  onSuccess,
}: CreateInvoiceModalProps) {
  const [customerId, setCustomerId] = useState<string>(preselectedCustomer?.id || '');
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [status, setStatus] = useState<'pending' | 'paid'>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive invoice amount.');
      return;
    }

    if (!customerId && !newCustomerName.trim()) {
      setError('Please select an existing customer or enter a new customer name.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId || undefined,
          customerName: !customerId ? newCustomerName.trim() : undefined,
          amount: numAmount,
          dueDate: dueDate || undefined,
          status,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create invoice');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#3a3834] bg-[#1f1d1b] p-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3a3834] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2e2617] text-[#ecc06f] border border-[#594726]">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold text-[#f6f3eb]">Create New Invoice</h3>
              <p className="text-[11px] text-[#948e87]">Manual invoice entry & ledger update</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-[#948e87] hover:bg-[#282623] hover:text-[#f6f3eb] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#592f2a] bg-[#2e1b19] p-2.5 text-xs text-[#e66f5c]">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#e66f5c]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3.5 space-y-3 text-xs">
          {/* Customer Selection */}
          <div>
            <label className="block text-[11px] font-medium text-[#c3beb7] mb-1">Customer</label>
            <select
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                if (e.target.value) setNewCustomerName('');
              }}
              className="w-full rounded-xl border border-[#3a3834] bg-[#11100e] px-3 py-2 text-xs text-[#f6f3eb] focus:border-white/30 focus:outline-none"
            >
              <option value="">-- Select Existing Customer or Type Below --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>

            {!customerId && (
              <div className="mt-1.5">
                <input
                  type="text"
                  placeholder="Or enter new customer name (e.g. Ramesh Chandra)"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-[#3a3834] bg-[#11100e] px-3 py-2 text-xs text-[#f6f3eb] placeholder-[#6e6962] focus:border-white/30 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Amount and Due Date */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-[#c3beb7] mb-1">Amount (₹ INR)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="2500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-[#3a3834] bg-[#11100e] px-3 py-2 text-xs text-[#f6f3eb] placeholder-[#6e6962] focus:border-white/30 focus:outline-none font-mono font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#c3beb7] mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-[#3a3834] bg-[#11100e] px-3 py-2 text-xs text-[#f6f3eb] focus:border-white/30 focus:outline-none"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-medium text-[#c3beb7] mb-1">Status</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`flex-1 rounded-full border py-1.5 text-center text-xs font-semibold transition-all ${
                  status === 'pending'
                    ? 'border-[#594726] bg-[#2e2617] text-[#ecc06f]'
                    : 'border-[#3a3834] bg-[#11100e] text-[#948e87]'
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setStatus('paid')}
                className={`flex-1 rounded-full border py-1.5 text-center text-xs font-semibold transition-all ${
                  status === 'paid'
                    ? 'border-[#295441] bg-[#172b22] text-[#68c99e]'
                    : 'border-[#3a3834] bg-[#11100e] text-[#948e87]'
                }`}
              >
                Paid
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-medium text-[#c3beb7] mb-1">Items / Description</label>
            <textarea
              rows={2}
              placeholder="e.g. Electrical fittings, PVC conduits, hardware supplies..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-[#3a3834] bg-[#11100e] px-3 py-2 text-xs text-[#f6f3eb] placeholder-[#6e6962] focus:border-white/30 focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="mt-4 flex justify-end gap-2 border-t border-[#3a3834] pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#3a3834] bg-[#11100e] px-4 py-1.5 text-xs font-medium text-[#c3beb7] hover:text-[#f6f3eb] hover:bg-[#282623] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="clean-btn-primary flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              <span>Create Invoice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
