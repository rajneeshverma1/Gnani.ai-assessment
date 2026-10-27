# VyaparVoice — Voice-First AI Billing & Customer Ledger for Indian SMBs

VyaparVoice is a production-grade, voice-driven billing and customer assistant engineered specifically for Indian Small and Medium Businesses (SMBs) — Kirana stores, wholesalers, traders, and service providers. Powered by the **Gnani.ai** conversational intelligence stack (**Prisma v2.5 STT**, **Evon v3.3 LLM**, and **Timbre v2.5 TTS**), it empowers non-tech-savvy merchants to create GST invoices, look up customer balances, mark payments, and schedule automated WhatsApp/SMS reminders in seconds using natural **Hindi**, **Hinglish**, and **Indian English** voice commands.

Inspired by the warm paper and luxury editorial design language of **[TryClean.ai](https://www.tryclean.ai)**, VyaparVoice features a deep espresso paper background (`#161513`), warm cream typography (`#f6f3eb`), elegant serif headings, and pill-shaped controls with zero distracting blue accents.

---

## Key Capabilities

1. **Voice-Driven GST Invoicing**:
   * Speak naturally: *"Ravi Kumar ko 2500 ka invoice banao Friday tak"* or *"Add customer Sunita Sharma with phone 9876543210"*.
   * Native parsing of Indian number words (*"do hazar paanch sau"*, *"dhai hazar"*, *"ek lakh"*) and relative dates (*"agle mangalwar"*, *"Friday tak"*).

2. **Multilingual Indian Speech Pipeline**:
   * **Prisma v2.5 STT**: Server-side speech-to-text with auto language detection for Hindi (`hi-IN`), Hinglish, and Indian English (`en-IN`).
   * **Evon v3.3 LLM**: Structured semantic extraction into strict JSON schemas with missing-field ambiguity detection and follow-up prompts.
   * **Timbre v2.5 TTS**: Generates natural, merchant-friendly audio confirmations strictly under 20 words.
   * **Local Fallback Engine**: Deterministic regex & phonetic fallback ensuring 100% demo uptime even when external APIs are offline.

3. **Complete Ledger & Billing Management**:
   * Real-time financial KPI metrics with latency breakdown (`Prisma STT`, `Evon LLM`, `Timbre TTS`).
   * Indian GST Tax Invoices (HSN/SAC codes, CGST 9% + SGST 9%, Place of Supply, UPI/IMPS payment details).
   * Customer Directory with outstanding balance tracking and one-click billing.
   * Due-date payment reminders with 7-day lookahead.
   * Complete Voice Command Audit History with expandable parsed JSON intents and latency records.

---

## Architecture Pipeline

```text
[ Merchant Mic / WebM Stream ]
             │
             ▼
  /api/voice/command (Server-Side Next.js Route Handler)
             │
   ┌─────────┴────────────────────────────────────────┐
   │                                                  │
   ▼ (Step 1)                                         ▼ (Step 2)
[ Prisma v2.5 STT ]                           [ Evon v3.3 LLM ]
Audio -> Hindi/Hinglish Transcript            Intent Parsing & Schema Extraction
   │                                                  │
   └─────────────────────────┬────────────────────────┘
                             │
                             ▼ (Step 3)
                [ PostgreSQL via Prisma ORM ]
                Atomic Transaction: Customer, Invoice, Reminder
                             │
                             ▼ (Step 4)
                      [ Timbre v2.5 TTS ]
                Concise Spoken Voice Audio (<20 words)
                             │
                             ▼
   [ Instant Client UI Update + Audio Confirmation Auto-Play ]
```

---

## Tech Stack

* **Framework**: Next.js 15 (App Router, Turbopack)
* **Language**: TypeScript 5 with strict mode
* **Database**: PostgreSQL with Prisma ORM
* **Styling**: TailwindCSS v4 with TryClean.ai warm paper & cream design tokens
* **Icons & Animation**: Lucide React, Canvas Confetti, Web Audio API Waveform Visualizer
* **Data Fetching**: SWR for optimistic UI updates and live state sync

---

## Getting Started

### Prerequisites

* Node.js 18.17+ or Node.js 20+
* PostgreSQL database instance running locally or hosted (e.g. Supabase, Neon)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/rajneeshverma1/Gnani.ai-assessment.git
   cd Gnani.ai-assessment
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment file and fill in your PostgreSQL and Gnani credentials:
   ```bash
   cp .env.example .env
   ```

   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vyapar_voice?schema=public"
   GNANI_API_KEY="your_gnani_api_key_here"
   GNANI_STT_API_KEY="your_gnani_stt_key_here"
   GNANI_TTS_API_KEY="your_gnani_tts_key_here"
   GNANI_LLM_API_KEY="your_gnani_llm_key_here"
   GNANI_BASE_URL="https://api.gnani.ai"
   NEXT_PUBLIC_APP_URL="http://localhost:3001"
   ```

4. **Run Prisma Migrations & Seed Data**:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. **Start Development Server**:
   ```bash
   npm run dev -- -p 3001
   ```
   Open `http://localhost:3001` in your browser.

---

## REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/voice/command` | Processes speech audio or text command via Gnani pipeline |
| `GET` | `/api/voice/history` | Returns complete audit trail of voice commands and intents |
| `GET` | `/api/stats` | Aggregated financial metrics and average AI model latency |
| `GET` / `POST` | `/api/invoices` | List invoices with status filtering or create a new invoice |
| `PATCH` | `/api/invoices/[id]` | Update invoice status (`pending`, `paid`, `overdue`) |
| `GET` / `POST` | `/api/customers` | Customer directory with outstanding balances and invoices |
| `DELETE` | `/api/customers/[id]` | Delete customer and cascade associated invoices |
| `GET` | `/api/reminders/upcoming` | Fetch upcoming 7-day due-date payment reminders |
| `POST` | `/api/seed` | Reset and reseed database with realistic demo accounts |

---

## Design System (TryClean.ai Warm Paper & Luxury Cream)

* **Paper Canvas**: Deep warm espresso (`#161513` / `hsl(28 9% 8%)`)
* **Surfaces**: Warm paper cards (`#1f1d1b`, `#282623`) with hairline borders (`#3a3834`)
* **Deep Wells**: Inputs and query logs sit in recessed wells (`#11100e`)
* **Typography**:
  * Headings: Editorial serif typography (`font-serif`)
  * Body & Labels: Warm luxury cream (`#f6f3eb`) and secondary linen (`#c3beb7`)
  * Monospace: Figures and currency numbers (`font-mono`)
* **Pill Buttons**: Rounded full pill buttons with light-edge elevation (`clean-btn-primary`, `clean-btn-secondary`)
* **Zero Blue**: All accents use natural warm amber (`#ecc06f`), sage green (`#68c99e`), and terracotta coral (`#e66f5c`).

---

## License

MIT © 2026 Vyapar Voice / Gnani.ai Assessment.
