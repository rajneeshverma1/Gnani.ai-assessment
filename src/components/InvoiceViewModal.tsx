'use client';

import React from 'react';
import {
  X,
  Printer,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Mic,
} from 'lucide-react';
import { InvoiceItem } from './InvoiceTable';
import { formatINR } from './MetricCards';

interface InvoiceViewModalProps {
  invoice: InvoiceItem | null;
  onClose: () => void;
  onMarkPaid: (id: string) => void;
}

export default function InvoiceViewModal({
  invoice,
  onClose,
  onMarkPaid,
}: InvoiceViewModalProps) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const baseAmount = Math.round((invoice.amount / 1.18) * 100) / 100;
  const gstAmount = Math.round((invoice.amount - baseAmount) * 100) / 100;
  const cgst = Math.round((gstAmount / 2) * 100) / 100;
  const sgst = cgst;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl border border-[#3a3834] bg-[#1f1d1b] p-5 sm:p-6 shadow-2xl relative my-6">
        {/* Top Actions */}
        <div className="flex items-center justify-between border-b border-[#3a3834] pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-white">
              {invoice.invoiceNumber}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono uppercase font-semibold ${
                invoice.status === 'paid'
                  ? 'bg-[#172b22] text-[#68c99e] border border-[#295441]'
                  : 'bg-[#2e2617] text-[#ecc06f] border border-[#594726]'
              }`}
            >
              {invoice.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {invoice.status === 'pending' && (
              <button
                onClick={() => {
                  onMarkPaid(invoice.id);
                  onClose();
                }}
                className="rounded-full border border-[#295441] bg-[#172b22] px-3 py-1 text-xs font-semibold text-[#68c99e] hover:bg-[#1e3b2f] transition-colors"
              >
                Mark Paid
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-full border border-[#3a3834] bg-[#11100e] px-3 py-1 text-xs font-medium text-[#c3beb7] hover:text-[#f6f3eb] hover:bg-[#282623] transition-colors"
            >
              <Printer className="h-3 w-3" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-full p-1 text-[#948e87] hover:bg-[#282623] hover:text-[#f6f3eb] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Paper Area */}
        <div className="mt-4 rounded-xl bg-[#11100e] p-5 border border-[#3a3834] space-y-5 text-xs text-[#c3beb7] print:bg-white print:text-black">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-[#3a3834] pb-4 print:border-gray-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-base font-bold tracking-tight text-[#f6f3eb] print:text-black">
                  Vyapar<span className="text-[#ecc06f]">Voice</span>
                </span>
                <span className="rounded-full bg-[#282623] px-2 py-0.5 font-mono text-[9px] text-[#c3beb7] border border-[#3a3834] print:border-gray-300">
                  GST REGULAR
                </span>
              </div>
              <p className="mt-1 text-[11px] text-[#948e87] print:text-gray-600">
                Voice Billing & Ledger for Indian Enterprises
              </p>
              <p className="text-[10px] text-[#6e6962] print:text-gray-500">
                GSTIN: 29AABCU9603R1ZM • Bangalore, Karnataka
              </p>
            </div>

            <div className="text-right">
              <span className="font-serif text-sm font-bold text-[#ecc06f] tracking-wide">
                TAX INVOICE
              </span>
              <p className="font-mono text-xs font-semibold text-white print:text-black mt-0.5">
                {invoice.invoiceNumber}
              </p>
              <p className="text-[10px] text-[#948e87] print:text-gray-600">
                Date: {new Date(invoice.createdAt).toLocaleDateString('en-IN')}
              </p>
              {invoice.dueDate && (
                <p className="text-[10px] text-[#ecc06f] print:text-amber-700 font-medium">
                  Due: {invoice.dueDate}
                </p>
              )}
            </div>
          </div>

          {/* Voice Command Origin Banner */}
          {invoice.sourceTranscript && (
            <div className="rounded-xl border border-[#295441] bg-[#172b22]/40 p-2.5 print:border-gray-300 print:bg-gray-50">
              <div className="flex items-center gap-1.5 font-semibold text-[#68c99e] print:text-emerald-800 text-[11px]">
                <Mic className="h-3 w-3" />
                <span>Voice Command Origin (Prisma STT + Evon LLM)</span>
              </div>
              <p className="mt-0.5 font-mono text-[10px] text-[#c3beb7] print:text-gray-700 italic">
                &ldquo;{invoice.sourceTranscript}&rdquo;
              </p>
            </div>
          )}

          {/* Bill To Info */}
          <div className="grid grid-cols-2 gap-4 border-b border-[#3a3834] pb-4 print:border-gray-200">
            <div>
              <span className="text-[10px] font-semibold text-[#948e87] uppercase tracking-wider print:text-gray-600">
                Billed To:
              </span>
              <h4 className="mt-0.5 text-xs font-bold text-white print:text-black">
                {invoice.customerName}
              </h4>
              {invoice.customerPhone && (
                <p className="text-[11px] text-[#c3beb7] print:text-gray-600">
                  Phone: {invoice.customerPhone}
                </p>
              )}
              <p className="text-[10px] text-[#948e87] print:text-gray-600">Place of Supply: Karnataka (29)</p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-semibold text-[#948e87] uppercase tracking-wider print:text-gray-600">
                Payment Details:
              </span>
              <p className="mt-0.5 font-mono font-medium text-white print:text-black">Status: {invoice.status.toUpperCase()}</p>
              <p className="text-[10px] text-[#948e87] print:text-gray-600">Payment Terms: Net 15 Days</p>
              <p className="text-[10px] text-[#948e87] print:text-gray-600">UPI / IMPS / Cash</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#3a3834] text-[10px] text-[#948e87] uppercase print:border-gray-300 print:text-gray-600">
                <tr>
                  <th className="pb-1.5">Description</th>
                  <th className="pb-1.5 text-center">HSN/SAC</th>
                  <th className="pb-1.5 text-right">Taxable</th>
                  <th className="pb-1.5 text-right">GST (18%)</th>
                  <th className="pb-1.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3a3834]/60 print:divide-gray-200">
                <tr>
                  <td className="py-2.5 font-medium text-white print:text-black">
                    {invoice.notes || 'Commercial Goods & Services Billing'}
                  </td>
                  <td className="py-2.5 text-center text-[#948e87] print:text-gray-600 font-mono text-[11px]">
                    8471
                  </td>
                  <td className="py-2.5 text-right font-mono text-[11px]">{formatINR(baseAmount)}</td>
                  <td className="py-2.5 text-right font-mono text-[11px]">{formatINR(gstAmount)}</td>
                  <td className="py-2.5 text-right font-bold text-white print:text-black font-mono text-[11px]">
                    {formatINR(invoice.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary Breakdown */}
          <div className="flex justify-end border-t border-[#3a3834] pt-3 print:border-gray-300">
            <div className="w-56 space-y-1.5 text-xs">
              <div className="flex justify-between text-[#948e87] print:text-gray-600">
                <span>Taxable Value:</span>
                <span className="font-mono text-white print:text-black">{formatINR(baseAmount)}</span>
              </div>
              <div className="flex justify-between text-[#948e87] print:text-gray-600">
                <span>CGST (9%):</span>
                <span className="font-mono text-white print:text-black">{formatINR(cgst)}</span>
              </div>
              <div className="flex justify-between text-[#948e87] print:text-gray-600">
                <span>SGST (9%):</span>
                <span className="font-mono text-white print:text-black">{formatINR(sgst)}</span>
              </div>
              <div className="flex justify-between border-t border-[#3a3834] pt-1.5 font-bold text-xs text-[#ecc06f] print:text-amber-700">
                <span>Total Amount:</span>
                <span className="font-mono font-bold text-white">{formatINR(invoice.amount)}</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="border-t border-[#3a3834] pt-3 text-center text-[10px] text-[#6e6962] print:text-gray-500">
            Thank you for your business. Generated securely with Vyapar Voice & Gnani AI.
          </div>
        </div>
      </div>
    </div>
  );
}
