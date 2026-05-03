import { supabase } from './supabase';
import type { ParseVacancyResult, Area } from '../types';

// Cache for areas to avoid repeated fetches
let areasCache: Area[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getAreas(): Promise<Area[]> {
  const now = Date.now();
  if (areasCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return areasCache;
  }

  const { data, error } = await supabase
    .from('areas')
    .select('*')
    .order('search_volume', { ascending: false });

  if (error) {
    console.warn('Failed to fetch areas:', error);
    return [];
  }

  areasCache = data || [];
  cacheTimestamp = now;
  return areasCache;
}

/**
 * Finds best matching area for landmark text
 */
async function findBestArea(landmarkText: string): Promise<{ area_id: string | null; name: string | null }> {
  if (!landmarkText) return { area_id: null, name: null };

  const areas = await getAreas();
  let bestMatch: Area | null = null;
  let bestScore = 0;

  const query = landmarkText.toLowerCase().replace(/near\s+/gi, '').trim();

  for (const area of areas) {
    const areaName = area.name.toLowerCase();
    const score = fuzzyMatch(query, areaName);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = area;
    }
  }

  return bestMatch ? { area_id: bestMatch.id, name: bestMatch.name } : { area_id: null, name: null };
}

// Simple fuzzy score (0-1)
function fuzzyMatch(a: string, b: string): number {
  const minLen = Math.min(a.length, b.length);
  if (minLen === 0) return 0;
  let score = 0;
  for (let i = 0; i < minLen; i++) {
    if (a[i] === b[i]) score++;
  }
  return score / minLen;
}

export async function parseVacancyMessage(text: string): Promise<ParseVacancyResult> {
  const normalized = text.toLowerCase().trim();
  const description = text.trim();

  // Rent: Enhanced for ranges like "8k to 9k", 8000, 8k, Rs. 8,000
  const rentRangeMatch = normalized.match(/(\d{1,2}(?:,\d{3})*|(\d{1,2})k?)\s*(?:to|-)\s*(\d{1,2}(?:,\d{3})*|(\d{1,2})k?)/i);
  let rent: number | null = null;
  if (rentRangeMatch) {
    const low = parseFloat(rentRangeMatch[1].replace(/[^\d.]/g, '')) * (rentRangeMatch[2] ? 1000 : 1);
    const high = parseFloat(rentRangeMatch[3].replace(/[^\d.]/g, '')) * (rentRangeMatch[4] ? 1000 : 1);
    rent = Math.round((low + high) / 2);
  } else {
    const rentMatch = normalized.match(/\b(?:rs\.?\s*)?(?:pkr\s*)?(?:(\d{1,2}(?:,\d{3})*)|(\d{1,2})k?)(?:\s*\/month?)?\b/gi);
    if (rentMatch) {
      const numStr = rentMatch[0].replace(/[^\d]/g, '');
      const parsed = parseInt(numStr, 10) * (/k/i.test(rentMatch[0]) ? 1000 : 1);
      if (parsed >= 5000 && parsed <= 50000) {
        rent = parsed;
      }
    }
  }

  // Beds: Enhanced for "sharing" → 2
  let beds = 1;
  const bedsMatch = normalized.match(/(\d+)\s*(vacancy|person|bed|room|seater)s?/i);
  if (bedsMatch) {
    beds = Math.min(Math.max(parseInt(bedsMatch[1], 10), 1), 4);
  } else if (/sharing|2 person|max/i.test(normalized)) {
    beds = 2;
  } else if (/3 sharing|triple/i.test(normalized)) {
    beds = 3;
  }

  // Gender
  let gender_preference: 'male' | 'female' | 'any' = 'any';
  if (/female|girl|lady|ladi(ya)?|aurat|beti/i.test(normalized)) {
    gender_preference = 'female';
  } else if (/male|boy|ladka|larka|beta/i.test(normalized)) {
    gender_preference = 'male';
  }

  // Type
  let type: 'permanent' | 'temporary' | null = null;
  if (/permanent|long\s*term|lambi/i.test(normalized)) {
    type = 'permanent';
  } else if (/temporary|short\s*term|muzaira/i.test(normalized)) {
    type = 'temporary';
  }

  // Amenities: Expanded for samples + normalize (declared first)
  const amenities: string[] = [];

  const amenitiesMap: {[key: string]: string} = {
    'wifi': 'wifi', 'internet': 'wifi',
    'water': 'water', 'pani': 'water', 'filter water': 'filter-water', 'meetha pani': 'filter-water',
    'gas': 'gas',
    'light': 'light', 'electricity': 'light',
    'furnished': 'furnished',
    'fridge': 'fridge',
    'ac': 'ac', 'air conditioner': 'ac',
    'washing machine': 'washing-machine', 'laundry': 'washing-machine',
    'geyser': 'geyser',
    'cook': 'cook', 'vegetarian cook': 'vegetarian-cook',
    'food': 'food',
    'tv': 'tv',
    'oven': 'oven', 'owen': 'oven',
    'iron': 'iron',
    'security': 'security',
    'parking': 'parking'
  };
  // Direct keywords
  for (const [key, value] of Object.entries(amenitiesMap)) {
    if (new RegExp(`\\b${key.replace(' ', '|')}\\b`, 'i').test(normalized)) {
      amenities.push(value);
    }
  }

  // Community preferences as amenities
  const communities = ['vegetarian', 'muslim', 'hindu', 'maheshwari', 'malhi', 'khatri'];
  for (const comm of communities) {
    if (new RegExp(`\\b${comm}\\b`, 'i').test(normalized)) {
      amenities.push(`community-${comm}`);
    }
  }

  // Landmark: extract potential landmarks (after "near", "opp", "behind", location words)
  const landmarkCandidates = normalized.match(/(?:near|opp|behind|متحف|جامعہ|مارکیٹ|کالمہ\s*\w+|university|mall|chowrangi)[:\s]+([^\.!\n]{5,})/gi);
  let landmarkText = '';
  if (landmarkCandidates && landmarkCandidates.length > 0) {
    landmarkText = landmarkCandidates
      .map(m => m.replace(/^(?:near|opp|behind|(?:\\w+\\s+){1,3})/i, ''))
      .join(' ')
      .trim();
  } else {
    const fallbackMatch = normalized.match(/([a-zA-Z0-9\\s,()]{10,})/);
    if (fallbackMatch) {
      landmarkText = fallbackMatch[0].replace(/\\d/g, '').trim();
    }
  }

  const { area_id, name: area_name } = await findBestArea(landmarkText);
  const custom_area = area_id ? null : landmarkText || null;

  // Generate title
  const areaDisplay = area_name || custom_area || 'Karachi';
  const typeStr = type === 'permanent' ? 'Permanent ' : type === 'temporary' ? 'Temp ' : '';
  const rentDisplay = rent ? `PKR ${rent?.toLocaleString() ?? 'Neg.'}` : 'Negotiable';
  const title = `${typeStr}${beds} Bed${beds > 1 ? 's' : ''} near ${areaDisplay}`;

  // Phone extraction
  let phone: string | null = null;
  const phoneMatch = normalized.match(
    /(?:contact|phone|wp|whatsapp|call|📞|☎️)?\s*[:#]?\s*(\+?92\d{10}|03\d{2}\s?\d{7}|03\d{9})/i
  );
  if (phoneMatch) {
    phone = phoneMatch[1].replace(/\s/g, '');
  }

  return {
    title,
    rent,
    beds,
    gender_preference,
    contact: phone,
    custom_area,
    area_id,
    description,
    amenities,
    type,
  };
}

// Sample tests (run in console)
async function testParser() {
  const samples = [
    "1 permanent vacancy available near tipu burger in dha phase 2 ext All facilities available Contact: 03323831999",
    "Permanent sharing room vacancy available in DHA phase-2 Extension Facilities (Light+Vegetarian cook+Water+security) Contact: 03332514318",
    "2 person vacancy available Maximum 8k to 9k Laga ga month kha Borchi naha ha And 10k advance",
    "Full furnished sharing or room available.... Address.gulistan E johar block 7 near mausamiyat Drinking filter water Meetha pani for usage Fridge Owen Wifi 24 light 24 pani 24 gas BeD Washing machine Iron Wp 03163685854"
  ];

  for (const sample of samples) {
    const result = await parseVacancyMessage(sample);
    console.log('Input:', sample);
    console.log('Parsed:', JSON.stringify(result, null, 2));
    console.log('---');
  }
}

// Uncomment to test: testParser();