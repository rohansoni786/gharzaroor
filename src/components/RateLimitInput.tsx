'use client';

import { useState, useCallback } from 'react';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  message?: string;
}

/**
 * Rate Limiting Hook
 * Limits how often an action can be performed
 */
export function useRateLimit(config: RateLimitConfig) {
  const { maxAttempts, windowMs, message = 'Too many attempts. Please wait.' } = config;
  const [attempts, setAttempts] = useState<number[]>([]);

  const isBlocked = useCallback(() => {
    const now = Date.now();
    const recentAttempts = attempts.filter((time) => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return true;
    }
    return false;
  }, [attempts, maxAttempts, windowMs]);

  const recordAttempt = useCallback(() => {
    setAttempts((prev) => [...prev, Date.now()]);
  }, []);

  const clearAttempts = useCallback(() => {
    setAttempts([]);
  }, []);

  // Clean up old attempts periodically
  if (typeof window !== 'undefined') {
    const interval = setInterval(() => {
      const now = Date.now();
      setAttempts((prev) => prev.filter((time) => now - time < windowMs));
    }, 60000);
    
    return () => clearInterval(interval);
  }

  return { isBlocked, recordAttempt, clearAttempts, message };
}

/**
 * RateLimitedButton
 * A button that implements rate limiting
 */
import { ReactNode, MouseEvent } from 'react';

interface RateLimitedButtonProps {
  children: ReactNode;
  onClick: () => Promise<void> | void;
  maxAttempts?: number;
  windowMs?: number;
  disabled?: boolean;
  className?: string;
}

export function RateLimitedButton({ 
  children, 
  onClick, 
  maxAttempts = 5, 
  windowMs = 60000,
  disabled = false,
  className = ''
}: RateLimitedButtonProps) {
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [attempts, setAttempts] = useState<number[]>([]);

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    const now = Date.now();
    const recentAttempts = attempts.filter((time) => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      setBlocked(true);
      return;
    }

    setLoading(true);
    setAttempts([...recentAttempts, now]);
    
    try {
      await onClick();
    } finally {
      setLoading(false);
    }
  };

  if (blocked) {
    return (
      <button disabled className={className}>
        Please wait before retrying
      </button>
    );
  }

  return (
    <button 
      onClick={handleClick} 
      disabled={disabled || loading}
      className={className}
    >
      {loading ? 'Please wait...' : children}
    </button>
  );
}
