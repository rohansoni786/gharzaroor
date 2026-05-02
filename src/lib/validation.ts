/**
 * Password strength validation utilities
 */

// Password requirements
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordStrength {
  const errors: string[] = [];
  let score = 0;

  // Check length
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  } else {
    score++;
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`Password must be less than ${PASSWORD_MAX_LENGTH} characters`);
  }

  // Check for uppercase
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    errors.push('Add at least one uppercase letter');
  }

  // Check for lowercase
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    errors.push('Add at least one lowercase letter');
  }

  // Check for numbers
  if (/[0-9]/.test(password)) {
    score++;
  } else {
    errors.push('Add at least one number');
  }

  // Check for special characters
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
  } else {
    errors.push('Add at least one special character (!@#$%^&*)');
  }

  const label = score <= 1 ? 'Weak' : score <= 2 ? 'Fair' : score <= 3 ? 'Good' : 'Strong';

  return {
    score,
    label,
    isValid: errors.length === 0,
    errors,
  };
}

export function getPasswordStrengthColor(score: number): string {
  return score <= 1 ? 'text-red-500' : score <= 2 ? 'text-orange-500' : score <= 3 ? 'text-yellow-500' : 'text-green-500';
}

export function getPasswordStrengthBarColor(score: number): string {
  return score <= 1 ? 'bg-red-500' : score <= 2 ? 'bg-orange-500' : score <= 3 ? 'bg-yellow-500' : 'bg-green-500';
}
