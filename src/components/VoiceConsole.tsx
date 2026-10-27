'use client';

import React, { useState, useRef } from 'react';
import {
  Mic,
  Square,
  Volume2,
  VolumeX,
  Sparkles,
  Database,
  Cpu,
  Copy,
  Check,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VoiceConsoleProps {
  language: 'hi-IN' | 'en-IN' | 'hinglish';
  onActionComplete: () => void;
}

type PipelineStep = 'idle' | 'recording' | 'stt' | 'llm' | 'db' | 'tts' | 'done';

const SAMPLE_PROMPTS = [
  {
    title: 'Daily Work Planner',
    text: 'मुझे आज का काम प्लान करने में मदद करो',
    tag: 'Hindi',
    badge: 'plan_day',
  },
  {
    title: 'Create Invoice',
    text: 'Ravi Kumar ko 2500 ka invoice banao Friday tak',
    tag: 'Hindi / Hinglish',
    badge: 'create_invoice',
  },
  {
    title: 'Mark Paid',
    text: 'Sunita Sharma ka invoice paid mark karo',
    tag: 'Hinglish',
    badge: 'mark_paid',
  },
  {
    title: 'Business Summary',
    text: 'Aaj ka business summary batao',
    tag: 'Hinglish',
    badge: 'business_summary',
  },
  {
    title: 'Add Customer',
    text: 'Add customer Sunita Sharma with phone 9876543210',
    tag: 'English',
    badge: 'add_customer',
  },
  {
    title: 'Check Status',
    text: 'Ravi Kumar ka payment status batao',
    tag: 'Hindi',
    badge: 'query_status',
  },
];

export default function VoiceConsole({ language, onActionComplete }: VoiceConsoleProps) {
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [manualText, setManualText] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [copiedJson, setCopiedJson] = useState(false);

  // Response state
  const [voiceResponse, setVoiceResponse] = useState<{
    transcript: string;
    intent: any;
    result: any;
    replyText: string;
    replyAudioUrl: string;
    latency: {
      sttMs: number;
      llmMs: number;
      ttsMs: number;
      totalMs: number;
    };
    success: boolean;
    error?: string;
  } | null>(null);

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const liveTranscriptRef = useRef<string>('');
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Visualizer animation loop with warm amber to sage gradient
  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barCount = 28;
    const step = Math.floor(bufferLength / barCount);
    const barWidth = canvas.width / barCount - 2;

    for (let i = 0; i < barCount; i++) {
      const val = dataArray[i * step] || 0;
      const barHeight = Math.max(2, (val / 255) * canvas.height * 0.9);

      const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
      grad.addColorStop(0, '#ecc06f');
      grad.addColorStop(1, '#68c99e');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(i * (barWidth + 2), canvas.height - barHeight, barWidth, barHeight, [2, 2, 0, 0]);
      ctx.fill();
    }

    animFrameRef.current = requestAnimationFrame(drawWaveform);
  };

  // Start browser audio recording + real-time live speech dictation
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      setLiveTranscript('');
      liveTranscriptRef.current = '';

      // Initialize Web Speech API for real-time live text typing as user speaks
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = language === 'en-IN' ? 'en-IN' : 'hi-IN';

          recognition.onresult = (event: any) => {
            let transcriptText = '';
            for (let i = 0; i < event.results.length; i++) {
              transcriptText += event.results[i][0].transcript;
            }
            if (transcriptText.trim()) {
              setManualText(transcriptText);
              setLiveTranscript(transcriptText);
              liveTranscriptRef.current = transcriptText;
            }
          };

          recognition.onerror = (e: any) => {
            console.warn('SpeechRecognition warning:', e.error);
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (speechErr) {
          console.warn('SpeechRecognition start failed:', speechErr);
        }
      }

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const finalLiveText = liveTranscriptRef.current.trim() || manualText.trim();
        await processAudio(audioBlob, finalLiveText);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250);

      setIsRecording(true);
      setPipelineStep('recording');
      setRecordSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);

      drawWaveform();
    } catch (err: any) {
      console.warn('Microphone access denied:', err);
      alert('Microphone access was denied or not available. You can also use the prompt chips or type in the command box.');
      setIsRecording(false);
      setPipelineStep('idle');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Error stopping speech recognition:', e);
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const processAudio = async (blob: Blob, liveText?: string) => {
    setPipelineStep('stt');
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      await sendVoiceCommand({
        audioBase64: base64Audio,
        mimeType: 'audio/webm',
        text: liveText && liveText.length > 0 ? liveText : undefined,
      });
    };
  };

  const sendVoiceCommand = async (payload: {
    audioBase64?: string;
    mimeType?: string;
    text?: string;
  }) => {
    try {
      setPipelineStep('stt');
      const t1 = setTimeout(() => setPipelineStep('llm'), 500);
      const t2 = setTimeout(() => setPipelineStep('db'), 1000);
      const t3 = setTimeout(() => setPipelineStep('tts'), 1500);

      const res = await fetch('/api/voice/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          language,
        }),
      });

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      const data = await res.json();
      setPipelineStep('done');
      setVoiceResponse(data);

      if (data.success) {
        onActionComplete();
        if (data.intent?.action === 'create_invoice') {
          confetti({
            particleCount: 40,
            spread: 45,
            origin: { y: 0.5 },
            colors: ['#f6f3eb', '#ecc06f', '#68c99e', '#dcd5c9'],
          });
        }
      }

      if (data.replyAudioUrl && autoPlayAudio) {
        setTimeout(() => {
          if (audioPlayerRef.current) {
            audioPlayerRef.current.src = data.replyAudioUrl;
            audioPlayerRef.current.play().catch((e) => console.log('Audio autoplay prevented:', e));
          }
        }, 200);
      }
    } catch (err: any) {
      console.error('Command failed:', err);
      setPipelineStep('idle');
      setVoiceResponse({
        transcript: payload.text || 'Voice command error',
        intent: { action: 'unknown', missing_fields: ['network_error'] },
        result: null,
        replyText: 'Kuch gadbad ho gayi. Kripya dobara koshish karein.',
        replyAudioUrl: '',
        latency: { sttMs: 0, llmMs: 0, ttsMs: 0, totalMs: 0 },
        success: false,
        error: err.message,
      });
    }
  };

  const handlePromptClick = (text: string) => {
    setManualText(text);
    sendVoiceCommand({ text });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    sendVoiceCommand({ text: manualText.trim() });
  };

  const copyJsonToClipboard = () => {
    if (!voiceResponse?.intent) return;
    navigator.clipboard.writeText(JSON.stringify(voiceResponse.intent, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="clean-card p-4 sm:p-5 space-y-3.5">
      {/* Console Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3a3834] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#282623] text-[#ecc06f] border border-[#3a3834]">
            <Mic className="h-3.5 w-3.5 text-[#ecc06f]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-[15px] font-semibold text-[#f6f3eb]">
                Voice Command Console
              </h2>
              <span className="rounded-full bg-[#172b22] text-[#68c99e] border border-[#295441] px-2 py-0.5 text-[10px] font-mono uppercase">
                Prisma • Evon • Timbre
              </span>
            </div>
            <p className="text-[11px] text-[#948e87]">
              Speak in Hindi, Hinglish, or English to create invoices and manage customer ledgers
            </p>
          </div>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={() => setAutoPlayAudio(!autoPlayAudio)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            autoPlayAudio
              ? 'border-[#594726] bg-[#2e2617] text-[#ecc06f]'
              : 'border-[#3a3834] bg-[#11100e] text-[#948e87]'
          }`}
          title="Toggle Timbre voice confirmation playback"
        >
          {autoPlayAudio ? <Volume2 className="h-3.5 w-3.5 text-[#ecc06f]" /> : <VolumeX className="h-3.5 w-3.5" />}
          <span className="text-[11px]">Audio Auto-play: {autoPlayAudio ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Unified Command Center Bar (TryClean pill buttons & deep well) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {/* Sleek Mic Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex-none flex items-center justify-center gap-2 h-10 px-4 rounded-full font-semibold text-xs transition-all shadow-sm ${
              isRecording
                ? 'bg-[#e66f5c] text-white animate-pulse'
                : 'clean-btn-primary'
            }`}
            title={isRecording ? 'Click to stop listening' : 'Click to speak voice command'}
          >
            {isRecording ? (
              <>
                <Square className="h-3.5 w-3.5 fill-current" />
                <span className="font-mono text-[11px]">
                  00:{recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds} Stop
                </span>
              </>
            ) : (
              <>
                <Mic className="h-3.5 w-3.5" />
                <span>Speak</span>
              </>
            )}
          </button>

          {/* Text Input inside TryClean deep well */}
          <form onSubmit={handleManualSubmit} className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder='Type command or click mic, e.g. "Ravi Kumar ko 2500 ka invoice banao Friday tak"'
              className="flex-1 rounded-full border border-[#3a3834] bg-[#11100e] px-4 py-2 text-xs text-[#f6f3eb] placeholder-[#6e6962] focus:border-white/30 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!manualText.trim() || pipelineStep === 'stt' || pipelineStep === 'llm'}
              className="flex-none flex items-center gap-1.5 rounded-full clean-btn-secondary px-4 py-2 text-xs font-semibold disabled:opacity-40"
              title="Run custom command"
            >
              <Send className="h-3 w-3" />
              <span className="hidden sm:inline">Run</span>
            </button>
          </form>
        </div>

        {/* Real-time Frequency Waveform Visualizer & Live Dictation */}
        {isRecording && (
          <div className="rounded-xl border border-[#3a3834] bg-[#11100e] p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-medium text-[#ecc06f] flex items-center gap-1.5 pl-1">
                <span className="h-2 w-2 rounded-full bg-[#ecc06f] animate-ping" />
                Listening live... speak in Hindi, Hinglish, or English
              </span>
              <canvas ref={canvasRef} width={220} height={22} className="rounded" />
            </div>

            {liveTranscript ? (
              <div className="flex items-center gap-2 rounded-lg bg-[#1f1d1b] border border-[#594726] px-3 py-1.5 text-xs">
                <Mic className="h-3.5 w-3.5 text-[#ecc06f] shrink-0 animate-pulse" />
                <span className="font-mono text-[10px] text-[#ecc06f] uppercase font-bold tracking-wider">Listening:</span>
                <span className="font-medium text-[#f6f3eb] italic truncate">&ldquo;{liveTranscript}&rdquo;</span>
              </div>
            ) : (
              <p className="text-[10px] text-[#948e87] pl-1 italic">
                Aap bolna shuru karein, yahan live words likh kar aayenge...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Quick Spoken Prompt Chips */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px] text-[#948e87]">
          <span className="font-semibold uppercase tracking-wider text-[#c3beb7] flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-[#ecc06f]" />
            Quick Prompts (Click to execute)
          </span>
          <span>Prisma v2.5 STT</span>
        </div>

        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(prompt.text)}
              className="flex items-center justify-between gap-2 rounded-xl border border-[#3a3834] bg-[#11100e] px-3 py-1.5 text-left text-[11px] hover:border-white/20 hover:bg-[#1f1d1b] transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <span className="text-[#c3beb7] group-hover:text-[#f6f3eb] font-mono truncate block">
                  &ldquo;{prompt.text}&rdquo;
                </span>
              </div>
              <span className="flex-none rounded-full bg-[#1f1d1b] px-2 py-0.5 text-[9px] font-mono text-[#948e87] border border-[#3a3834]">
                {prompt.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Live Pipeline Stepper */}
      {(pipelineStep !== 'idle' || voiceResponse) && (
        <div className="rounded-xl border border-[#3a3834] bg-[#11100e] p-3 text-xs">
          <div className="flex items-center justify-between border-b border-[#3a3834] pb-2 text-[11px]">
            <span className="font-medium text-[#f6f3eb] flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-[#ecc06f]" />
              Gnani AI Execution Stepper
            </span>
            {voiceResponse?.latency && (
              <span className="font-mono text-[#68c99e]">
                Total Latency: {voiceResponse.latency.totalMs}ms
              </span>
            )}
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4 text-[11px]">
            {/* Step 1: STT */}
            <div
              className={`rounded-xl border p-2 transition-colors ${
                pipelineStep === 'stt'
                  ? 'border-[#68c99e] bg-[#172b22] text-[#68c99e]'
                  : voiceResponse
                  ? 'border-[#295441] bg-[#172b22]/40 text-[#f6f3eb]'
                  : 'border-[#3a3834] bg-[#1f1d1b] text-[#948e87]'
              }`}
            >
              <div className="flex items-center justify-between font-medium">
                <span>1. Prisma STT</span>
                {pipelineStep === 'stt' && <Loader2 className="h-3 w-3 animate-spin text-[#68c99e]" />}
                {voiceResponse && <CheckCircle2 className="h-3 w-3 text-[#68c99e]" />}
              </div>
              <p className="mt-0.5 text-[10px] text-[#948e87]">
                {voiceResponse?.latency?.sttMs ? `${voiceResponse.latency.sttMs}ms` : 'Audio to transcript'}
              </p>
            </div>

            {/* Step 2: Evon Reasoning */}
            <div
              className={`rounded-xl border p-2 transition-colors ${
                pipelineStep === 'llm'
                  ? 'border-[#ecc06f] bg-[#2e2617] text-[#ecc06f]'
                  : voiceResponse
                  ? 'border-[#594726] bg-[#2e2617]/40 text-[#f6f3eb]'
                  : 'border-[#3a3834] bg-[#1f1d1b] text-[#948e87]'
              }`}
            >
              <div className="flex items-center justify-between font-medium">
                <span>2. Evon Reason</span>
                {pipelineStep === 'llm' && <Loader2 className="h-3 w-3 animate-spin text-[#ecc06f]" />}
                {voiceResponse && <CheckCircle2 className="h-3 w-3 text-[#ecc06f]" />}
              </div>
              <p className="mt-0.5 text-[10px] text-[#948e87]">
                {voiceResponse?.latency?.llmMs ? `${voiceResponse.latency.llmMs}ms` : 'JSON extraction'}
              </p>
            </div>

            {/* Step 3: DB Mutation */}
            <div
              className={`rounded-xl border p-2 transition-colors ${
                pipelineStep === 'db'
                  ? 'border-[#ecc06f] bg-[#2e2617] text-[#ecc06f]'
                  : voiceResponse
                  ? 'border-[#594726] bg-[#2e2617]/40 text-[#f6f3eb]'
                  : 'border-[#3a3834] bg-[#1f1d1b] text-[#948e87]'
              }`}
            >
              <div className="flex items-center justify-between font-medium">
                <span>3. Postgres DB</span>
                {pipelineStep === 'db' && <Loader2 className="h-3 w-3 animate-spin text-[#ecc06f]" />}
                {voiceResponse && <CheckCircle2 className="h-3 w-3 text-[#ecc06f]" />}
              </div>
              <p className="mt-0.5 text-[10px] text-[#948e87]">
                {voiceResponse?.success ? 'Atomic Transaction' : 'Ledger Sync'}
              </p>
            </div>

            {/* Step 4: Timbre TTS */}
            <div
              className={`rounded-xl border p-2 transition-colors ${
                pipelineStep === 'tts'
                  ? 'border-[#f6f3eb] bg-[#282623] text-[#f6f3eb]'
                  : voiceResponse
                  ? 'border-[#3a3834] bg-[#282623]/60 text-[#f6f3eb]'
                  : 'border-[#3a3834] bg-[#1f1d1b] text-[#948e87]'
              }`}
            >
              <div className="flex items-center justify-between font-medium">
                <span>4. Timbre TTS</span>
                {pipelineStep === 'tts' && <Loader2 className="h-3 w-3 animate-spin text-[#f6f3eb]" />}
                {voiceResponse && <CheckCircle2 className="h-3 w-3 text-[#f6f3eb]" />}
              </div>
              <p className="mt-0.5 text-[10px] text-[#948e87]">
                {voiceResponse?.latency?.ttsMs ? `${voiceResponse.latency.ttsMs}ms` : 'Spoken Voice Audio'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Voice Results Deck */}
      {voiceResponse && (
        <div className="rounded-xl border border-[#3a3834] bg-[#11100e] p-3.5 space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {/* Left Column: Transcript & Audio Response */}
            <div className="space-y-2.5">
              <div className="rounded-xl border border-[#3a3834] bg-[#1f1d1b] p-3">
                <div className="flex items-center justify-between text-[11px] text-[#c3beb7] border-b border-[#3a3834] pb-1.5">
                  <span className="font-semibold text-[#f6f3eb] flex items-center gap-1.5">
                    <Mic className="h-3 w-3 text-[#68c99e]" />
                    Transcribed Speech
                  </span>
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-[#172b22] text-[#68c99e] border border-[#295441]">
                    {voiceResponse.intent?.language || language}
                  </span>
                </div>
                <p className="mt-2 text-xs font-medium text-[#f6f3eb] italic">
                  &ldquo;{voiceResponse.transcript}&rdquo;
                </p>
              </div>

              {/* Timbre Spoken Voice Response */}
              <div className="rounded-xl border border-[#594726] bg-[#2e2617]/40 p-3">
                <div className="flex items-center justify-between text-[11px] text-[#ecc06f] border-b border-[#594726]/50 pb-1.5">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Volume2 className="h-3.5 w-3.5 text-[#ecc06f]" />
                    Spoken Reply (Timbre TTS)
                  </span>
                  <span className="font-mono text-[9px] text-[#ecc06f]">
                    &lt; 20 words
                  </span>
                </div>

                <p className="mt-2 text-xs font-semibold text-[#f6f3eb]">
                  {voiceResponse.replyText}
                </p>

                {voiceResponse.replyAudioUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <audio
                      ref={audioPlayerRef}
                      controls
                      src={voiceResponse.replyAudioUrl}
                      className="w-full h-7 rounded"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Parsed Intent JSON & DB Result */}
            <div className="space-y-2.5">
              <div className="rounded-xl border border-[#3a3834] bg-[#1f1d1b] p-3">
                <div className="flex items-center justify-between text-[11px] text-[#c3beb7] border-b border-[#3a3834] pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#f6f3eb]">Extracted Action</span>
                    <span
                      className={`font-mono text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        voiceResponse.intent?.action === 'unknown'
                          ? 'bg-[#2e2617] text-[#ecc06f] border border-[#594726]'
                          : 'bg-[#282623] text-[#f6f3eb] border border-[#3a3834]'
                      }`}
                    >
                      {voiceResponse.intent?.action}
                    </span>
                  </div>
                  <button
                    onClick={copyJsonToClipboard}
                    className="flex items-center gap-1 text-[10px] text-[#c3beb7] hover:text-[#f6f3eb]"
                  >
                    {copiedJson ? <Check className="h-3 w-3 text-[#68c99e]" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedJson ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {voiceResponse.intent?.missing_fields?.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 rounded-xl bg-[#2e2617]/70 border border-[#594726] p-1.5 text-[11px] text-[#ecc06f]">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#ecc06f]" />
                    <span>Missing fields: {voiceResponse.intent.missing_fields.join(', ')}</span>
                  </div>
                )}

                <pre className="mt-2 max-h-28 overflow-y-auto rounded-xl bg-[#11100e] p-2 font-mono text-[10px] text-[#68c99e] border border-[#3a3834]">
                  {JSON.stringify(voiceResponse.intent, null, 2)}
                </pre>
              </div>

              {voiceResponse.result && (
                <div className="rounded-xl border border-[#295441] bg-[#172b22]/40 p-2.5">
                  <div className="flex items-center justify-between text-[11px] text-[#68c99e] border-b border-[#295441]/50 pb-1">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Database className="h-3 w-3 text-[#68c99e]" />
                      {voiceResponse.result.planType === 'daily_work_plan'
                        ? 'AI Daily Work Plan'
                        : voiceResponse.result.totalCustomers !== undefined
                        ? 'Business Overview'
                        : 'Ledger Mutation Result'}
                    </span>
                    <span className="rounded-full bg-[#172b22] px-2 py-0.5 font-mono text-[9px] text-[#68c99e] border border-[#295441]">
                      READY
                    </span>
                  </div>

                  {voiceResponse.result.planType === 'daily_work_plan' ? (
                    <div className="mt-2 space-y-2 text-[11px] text-[#f6f3eb]">
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="rounded bg-[#11100e] p-1.5 border border-[#3a3834]">
                          <span className="text-[10px] text-[#948e87] block">Pending Due</span>
                          <span className="font-mono text-xs font-bold text-[#ecc06f]">
                            ₹{Number(voiceResponse.result.totalPendingAmount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="rounded bg-[#11100e] p-1.5 border border-[#3a3834]">
                          <span className="text-[10px] text-[#948e87] block">Pending Bills</span>
                          <span className="font-mono text-xs font-bold text-[#f6f3eb]">
                            {voiceResponse.result.totalPendingInvoices} bills
                          </span>
                        </div>
                      </div>

                      {voiceResponse.result.actionItems?.length > 0 && (
                        <div className="space-y-1 pt-1">
                          {voiceResponse.result.actionItems.map((item: string, i: number) => (
                            <div key={i} className="flex items-start gap-1.5 text-[11px] text-[#c3beb7]">
                              <CheckCircle2 className="h-3 w-3 text-[#68c99e] mt-0.5 shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : voiceResponse.result.totalCustomers !== undefined ? (
                    <div className="mt-1.5 text-[11px] text-[#f6f3eb] space-y-1">
                      <p>Active Customers: <span className="font-bold text-white">{voiceResponse.result.totalCustomers}</span></p>
                      <p>Pending Dues: <span className="font-mono text-[#ecc06f]">₹{Number(voiceResponse.result.totalPending || 0).toLocaleString('en-IN')}</span></p>
                      <p>Collected: <span className="font-mono text-[#68c99e]">₹{Number(voiceResponse.result.totalPaid || 0).toLocaleString('en-IN')}</span></p>
                    </div>
                  ) : (
                    <div className="mt-1.5 text-[11px] text-[#f6f3eb] space-y-0.5">
                      {voiceResponse.result.invoiceNumber && (
                        <p>
                          Invoice: <span className="font-mono font-bold text-white">{voiceResponse.result.invoiceNumber}</span>
                          {voiceResponse.result.amount && ` • Amount: ₹${voiceResponse.result.amount}`}
                        </p>
                      )}
                      {voiceResponse.result.customerName && (
                        <p>Customer: <span className="font-medium text-white">{voiceResponse.result.customerName}</span></p>
                      )}
                      {voiceResponse.result.status && (
                        <p>Status: <span className="font-mono text-[#68c99e] uppercase">{voiceResponse.result.status}</span></p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
