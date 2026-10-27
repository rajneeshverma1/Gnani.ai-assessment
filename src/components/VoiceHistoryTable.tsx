'use client';

import React, { useState } from 'react';
import {
  Mic,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Layers,
} from 'lucide-react';

export interface VoiceEventItem {
  id: string;
  transcript: string;
  detectedLanguage: string;
  parsedIntent: any;
  actionStatus: string;
  responseText: string;
  sttLatencyMs: number;
  llmLatencyMs: number;
  ttsLatencyMs: number;
  totalLatencyMs: number;
  errorMessage?: string | null;
  createdAt: string;
}

interface VoiceHistoryTableProps {
  events: VoiceEventItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function VoiceHistoryTable({
  events,
  isLoading,
}: VoiceHistoryTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getActionBadge = (action?: string) => {
    switch (action) {
      case 'create_invoice':
        return (
          <span className="rounded-full bg-[#172b22] border border-[#295441] px-2 py-0.5 font-mono text-[10px] font-medium text-[#68c99e]">
            create_invoice
          </span>
        );
      case 'mark_paid':
        return (
          <span className="rounded-full bg-[#2e2617] border border-[#594726] px-2 py-0.5 font-mono text-[10px] font-medium text-[#ecc06f]">
            mark_paid
          </span>
        );
      case 'add_customer':
        return (
          <span className="rounded-full bg-[#282623] border border-[#3a3834] px-2 py-0.5 font-mono text-[10px] font-medium text-[#f6f3eb]">
            add_customer
          </span>
        );
      case 'query_status':
        return (
          <span className="rounded-full bg-[#282623] border border-[#3a3834] px-2 py-0.5 font-mono text-[10px] font-medium text-[#dcd5c9]">
            query_status
          </span>
        );
      case 'schedule_reminder':
        return (
          <span className="rounded-full bg-[#2e2617] border border-[#594726] px-2 py-0.5 font-mono text-[10px] font-medium text-[#ecc06f]">
            schedule_reminder
          </span>
        );
      case 'unknown':
      default:
        return (
          <span className="rounded-full bg-[#1f1d1b] border border-[#3a3834] px-2 py-0.5 font-mono text-[10px] font-medium text-[#948e87]">
            unknown / clarify
          </span>
        );
    }
  };

  return (
    <div className="clean-card p-4 sm:p-5 space-y-3.5">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-[#3a3834] pb-3">
        <div>
          <h3 className="font-serif text-base font-semibold text-[#f6f3eb] flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#ecc06f]" />
            Voice Command Audit History
            <span className="rounded-full bg-[#11100e] border border-[#3a3834] px-2 py-0.5 text-[11px] font-mono text-[#c3beb7]">
              {events.length} logs
            </span>
          </h3>
          <p className="text-[11px] text-[#948e87]">
            Complete audit trail of all spoken commands, parsed JSON actions, and latencies
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-1.5 py-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-11 rounded-xl bg-[#282623] animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="py-10 text-center text-xs text-[#948e87]">
          No voice commands logged yet. Try speaking into the microphone!
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#3a3834]">
          <table className="w-full text-left text-xs text-[#c3beb7]">
            <thead className="bg-[#11100e] border-b border-[#3a3834] text-[10px] font-semibold text-[#948e87] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 pl-3 w-8"></th>
                <th className="py-2.5">Spoken Transcript</th>
                <th className="py-2.5">Detected Action</th>
                <th className="py-2.5">Language</th>
                <th className="py-2.5">Latency</th>
                <th className="py-2.5 pr-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3a3834] font-normal">
              {events.map((evt) => {
                const isExpanded = expandedId === evt.id;
                const action = evt.parsedIntent?.action;

                return (
                  <React.Fragment key={evt.id}>
                    <tr
                      onClick={() => toggleExpand(evt.id)}
                      className="hover:bg-[#282623]/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 pl-3 text-[#948e87]">
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-[#ecc06f]" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-[#948e87]" />
                        )}
                      </td>

                      <td className="py-2.5 font-medium text-[#f6f3eb] max-w-xs truncate">
                        &ldquo;{evt.transcript}&rdquo;
                      </td>

                      <td className="py-2.5">{getActionBadge(action)}</td>

                      <td className="py-2.5">
                        <span className="rounded-full bg-[#11100e] border border-[#3a3834] px-2 py-0.5 text-[10px] font-mono text-[#c3beb7]">
                          {evt.detectedLanguage}
                        </span>
                      </td>

                      <td className="py-2.5 font-mono text-[11px] text-[#c3beb7]">
                        <span className="text-[#68c99e] font-semibold">
                          {evt.totalLatencyMs}ms
                        </span>
                      </td>

                      <td className="py-2.5 pr-3">
                        {evt.actionStatus === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#68c99e] font-medium">
                            <CheckCircle2 className="h-3 w-3 text-[#68c99e]" />
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#ecc06f] font-medium">
                            <AlertCircle className="h-3 w-3 text-[#ecc06f]" />
                            Clarification
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <tr className="bg-[#11100e]/95">
                        <td colSpan={6} className="p-3.5 border-b border-[#3a3834]">
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-xs">
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-semibold text-[#c3beb7]">
                                Spoken Reply from Timbre TTS:
                              </span>
                              <p className="rounded-xl bg-[#1f1d1b] p-2 text-xs font-medium text-[#f6f3eb] border border-[#3a3834]">
                                &ldquo;{evt.responseText}&rdquo;
                              </p>

                              <div className="flex items-center gap-3 text-[10px] font-mono text-[#948e87] pt-1">
                                <span>STT: {evt.sttLatencyMs}ms</span>
                                <span>•</span>
                                <span>LLM: {evt.llmLatencyMs}ms</span>
                                <span>•</span>
                                <span>TTS: {evt.ttsLatencyMs}ms</span>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <span className="text-[11px] font-semibold text-[#c3beb7]">
                                Parsed Evon v3.3 JSON Intent:
                              </span>
                              <pre className="max-h-28 overflow-y-auto rounded-xl bg-[#11100e] p-2 font-mono text-[10px] text-[#68c99e] border border-[#3a3834]">
                                {JSON.stringify(evt.parsedIntent, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
