/**
 * Application Constants
 * Centralized configuration values
 */

// App Info
export const APP_NAME = 'Gharzaroor.pk';
export const APP_URL = 'https://gharzaroor.pk';
export const APP_TAGLINE = 'Har zaroorat ka ek ghar';
export const APP_DESCRIPTION = 'Find verified shared flats near KU, IBA, NED. Phone-verified owners, instant contact reveal, zero spam.';

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

// Search
export const SEARCH_DEBOUNCE_MS = 300;
export const MIN_SEARCH_LENGTH = 2;

// Listings
export const FEATURED_LISTINGS_LIMIT = 3;
export const MAX_PHOTOS_UPLOAD = 3;
export const PHOTO_MAX_SIZE_MB = 5;
export const PHOTO_MAX_WIDTH = 800;

// Validation
export const MIN_RENT = 5000;
export const MAX_RENT = 50000;
export const MIN_BEDS = 1;
export const MAX_BEDS = 4;
export const TITLE_MIN_LENGTH = 5;
export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 1000;

// Trust scores
export const TRUST_SCORE_ADMIN = 90;
export const TRUST_SCORE_VERIFIED = 50;

// Feature flags
export const FEATURES = {
  ENABLE_GOOGLE_AUTH: true,
  ENABLE_LISTING_REPORT: true,
  ENABLE_ANALYTICS: true,
  ENABLE_WANTED_ADS: true,
} as const;

// Free period for countdown banner
export const FREE_PERIOD_END = '2026-08-01';

export const LANDMARK_CHAR_MIN = 3;
export const LANDMARK_CHAR_MAX = 100;
export const COOLDOWN_SECONDS = 30;

export const CONFIG = {
  MAX_RENT,
  MIN_RENT,
  MAX_BEDS,
  MIN_BEDS,
  MAX_PHOTOS: MAX_PHOTOS_UPLOAD,
  MAX_PHOTO_SIZE_MB: PHOTO_MAX_SIZE_MB,
  PHOTO_MAX_WIDTH,
  LANDMARK_CHAR_MIN,
  LANDMARK_CHAR_MAX,
  COOLDOWN_SECONDS,
} as const;
