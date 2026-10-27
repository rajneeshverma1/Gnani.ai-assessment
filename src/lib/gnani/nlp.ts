// Indian natural language resolution engine for Evon v3.3 extraction

// Hindi / Hinglish spoken number mappings
const NUMBER_WORDS: Record<string, number> = {
  ek: 1,
  do: 2,
  teen: 3,
  char: 4,
  paanch: 5,
  panch: 5,
  che: 6,
  saat: 7,
  aath: 8,
  nau: 9,
  das: 10,
  gyarah: 11,
  barah: 12,
  terah: 13,
  chaudah: 14,
  pandrah: 15,
  solah: 16,
  satrah: 17,
  atharah: 18,
  unnees: 19,
  bees: 20,
  tees: 30,
  chalis: 40,
  pachas: 50,
  saath: 60,
  sattar: 70,
  assi: 80,
  nabbe: 90,
  sau: 100,
  hazaar: 1000,
  hazar: 1000,
  lakh: 100000,
  lac: 100000,
  crore: 10000000,
};

// Parse spoken or formatted numeric expressions into integer/float
export function parseSpokenNumber(text: string): number | null {
  if (!text) return null;

  // 1. Direct regex for numbers like 2500, 2,500, 2.5k, 50000, etc.
  // Note: Avoid matching Hindi particles like 'ka', 'ki', 'ke', 'ko' as 'k'
  const digitsMatch = text.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(k(?!a|i|e|o\b)|lakh|lac|cr)?\b/i);
  if (digitsMatch) {
    let num = parseFloat(digitsMatch[1].replace(/,/g, ''));
    const multiplier = (digitsMatch[2] || '').toLowerCase();
    if (multiplier.startsWith('k')) num *= 1000;
    if (multiplier === 'lakh' || multiplier === 'lac') num *= 100000;
    if (multiplier === 'cr') num *= 10000000;
    return num;
  }

  // 2. Parse spoken Hindi/Hinglish words (e.g. "do hazaar paanch sau", "dedh lakh", "pachas hazaar")
  const lower = text.toLowerCase();
  if (lower.includes('dedh lakh')) return 150000;
  if (lower.includes('dhai lakh')) return 250000;
  if (lower.includes('dedh hazaar')) return 1500;
  if (lower.includes('dhai hazaar')) return 2500;

  const tokens = lower.split(/[\s,]+/);
  let total = 0;
  let current = 0;
  let matched = false;

  for (const t of tokens) {
    if (NUMBER_WORDS[t] !== undefined) {
      matched = true;
      const val = NUMBER_WORDS[t];
      if (val === 100) {
        current = (current === 0 ? 1 : current) * 100;
      } else if (val === 1000) {
        total += (current === 0 ? 1 : current) * 1000;
        current = 0;
      } else if (val === 100000) {
        total += (current === 0 ? 1 : current) * 100000;
        current = 0;
      } else if (val === 10000000) {
        total += (current === 0 ? 1 : current) * 10000000;
        current = 0;
      } else {
        current += val;
      }
    }
  }

  total += current;
  return matched && total > 0 ? total : null;
}

// Day of week resolution (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
const DAY_MAP: Record<string, number> = {
  sunday: 0,
  ravivar: 0,
  itwar: 0,
  monday: 1,
  somwar: 1,
  tuesday: 2,
  mangalwar: 2,
  wednesday: 3,
  budhwar: 3,
  thursday: 4,
  guruwar: 4,
  veervar: 4,
  friday: 5,
  shukrawar: 5,
  jumma: 5,
  saturday: 6,
  shaniwar: 6,
};

// Resolve relative dates into ISO 'YYYY-MM-DD'
export function resolveRelativeDate(text: string, baseDate: Date = new Date()): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  const d = new Date(baseDate);

  // Today
  if (lower.includes('aaj') || lower.includes('today')) {
    return d.toISOString().split('T')[0];
  }

  // Tomorrow / Kal
  if (lower.includes('kal') || lower.includes('tomorrow')) {
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  // Day after tomorrow / Parso
  if (lower.includes('parso') || lower.includes('parson') || lower.includes('day after tomorrow')) {
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  }

  // Next week / agle hafte
  if (lower.includes('agle hafte') || lower.includes('next week')) {
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }

  // Next month / agle mahine
  if (lower.includes('agle mahine') || lower.includes('next month')) {
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  }

  // N days / "3 din mein", "5 din tak"
  const daysMatch = lower.match(/(\d+)\s*(?:din|days)/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  // Day of week matches (e.g. "Friday tak", "Somwar ko")
  for (const [dayName, targetDay] of Object.entries(DAY_MAP)) {
    if (lower.includes(dayName)) {
      const currentDay = d.getDay();
      let diff = targetDay - currentDay;
      if (diff <= 0) diff += 7; // Next occurrence
      d.setDate(d.getDate() + diff);
      return d.toISOString().split('T')[0];
    }
  }

  return null;
}

// Extract Indian Phone Numbers (e.g. 9876543210, +91 98765 43210)
export function extractPhoneNumber(text: string): string | null {
  const match = text.match(/(?:\+91[\-\s]?)?[6-9]\d{9}/);
  if (match) {
    return match[0].replace(/\s+/g, '');
  }
  return null;
}
