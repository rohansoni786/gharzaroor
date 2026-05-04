/**
 * Shared type definitions for Gharzaroor.pk
 * Enterprise-level type safety
 */

// Database types
export interface Listing {
  id: string;
  title: string;
  rent: number;
  beds_available: number;
  gender_preference: 'male' | 'female' | 'any';
  phone_number: string | null;
  contact_phone: string | null;
  type: 'permanent' | 'temporary' | null;
  photos: string[] | null;
  description: string | null;
  amenities: string[];
  status: 'live' | 'pending' | 'flagged' | 'rejected' | 'filled' | 'deleted';
  area_id: string | null;
  custom_area: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  areas?: { name: string } | null | undefined;
}

export interface WantedAd {
  id: string;
  seeker_id: string;
  contact_phone: string | null;
  area_id: string | null;
  custom_area: string | null;
  rent_min: number;
  rent_max: number;
  beds_needed: number;
  gender_preference: 'male' | 'female' | 'any';
  description: string;
  status: 'active' | 'closed';
  created_at: string;
  areas?: { name: string } | null;
}

export interface Area {
  id: string;
  name: string;
  coordinates: unknown | null;
  category: string | null;
  search_volume: number;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email?: string | null;
  phone_number: string | null;
  whatsapp_number: string | null;
  age?: number | null;
  emergency_contact?: string | null;
  occupation?: 'student' | 'professional' | 'both' | null;
  avatar_url?: string | null;
  trust_score: number;
  created_at: string;
}

// Quick Post Parser
export interface ParseVacancyResult {
  title: string;
  rent: number | null;
  beds: number;
  gender_preference: 'male' | 'female' | 'any';
  contact: string | null;
  custom_area: string | null;
  area_id: string | null;
  description: string;
  amenities: string[];
  type: 'permanent' | 'temporary' | null;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Auth types
export interface AuthState {
  user: {
    id: string;
    email: string;
  } | null;
  session: unknown | null;
  loading: boolean;
}

// Form types
export interface FormErrors {
  [key: string]: {
    message: string;
  };
}

