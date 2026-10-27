'use client';

import React, { useState } from 'react';
import { X, Users, Check, AlertCircle, Loader2 } from 'lucide-react';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCustomerModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCustomerModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('hi-IN');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Customer name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create customer');
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
        <div className="flex items-center justify-between border-b border-[#3a3834] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2e2617] text-[#ecc06f] border border-[#594726]">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold text-[#f6f3eb]">Add New Customer</h3>
              <p className="text-[11px] text-[#948e87]">Add an SMB client to your billing directory</p>
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
          <div>
            <label className="block text-[11px] font-medium text-[#c3beb7] mb-1">
              Customer / Business Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Anand Sharma Traders"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[#3a3834] bg-[#11100e] px-3 py-2 text-xs text-[#f6f3eb] placeholder-[#6e6962] focus:border-white/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#c3beb7] mb-1">Phone Number</label>
            <input
              type="text"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-[#3a3834] bg-[#11100e] px-3 py-2 text-xs text-[#f6f3eb] placeholder-[#6e6962] focus:border-white/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#c3beb7] mb-1">Email Address</label>
            <input
              type="email"
              placeholder="anand@sharmatraders.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[#3a3834] bg-[#11100e] px-3 py-2 text-xs text-[#f6f3eb] placeholder-[#6e6962] focus:border-white/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#c3beb7] mb-1">Preferred Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-xl border border-[#3a3834] bg-[#11100e] px-3 py-2 text-xs text-[#f6f3eb] focus:border-white/30 focus:outline-none"
            >
              <option value="hi-IN">🇮🇳 हिन्दी (Hindi)</option>
              <option value="en-IN">🇮🇳 English (India)</option>
            </select>
          </div>

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
              <span>Add Customer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
