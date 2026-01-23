import { atom, map } from "nanostores";

// ============================================
// Constants
// ============================================

const PIN_STORAGE_KEY = "fulean2_security_pin";
const LOCKOUT_K = "fulean2_lockout_until";
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds

// ============================================
// State
// ============================================

export const $pinState = map<{
  isEnabled: boolean;
  isCustomPinSet: boolean;
  isLocked: boolean;
  failedAttempts: number;
  lockoutUntil: number | null; // Timestamp
}>({
  isEnabled: false,
  isCustomPinSet: false,
  isLocked: false,
  failedAttempts: 0,
  lockoutUntil: null,
});

// Load state from local storage on init
if (typeof window !== "undefined") {
  const savedPinHash = localStorage.getItem(PIN_STORAGE_KEY);
  const savedLockout = localStorage.getItem(LOCKOUT_K);

  const now = Date.now();
  const lockoutUntil = savedLockout ? parseInt(savedLockout) : null;
  const isCurrentlyLockedOut = lockoutUntil && lockoutUntil > now;

  $pinState.set({
    isEnabled: !!savedPinHash,
    isCustomPinSet: !!savedPinHash,
    isLocked: !!savedPinHash, // Always lock on startup if PIN is set
    failedAttempts: 0,
    lockoutUntil: isCurrentlyLockedOut ? lockoutUntil : null,
  });
}

// ============================================
// Actions
// ============================================

/**
 * Simple hash function for PIN (not crypto-secure but sufficient for local obfuscation)
 * In a real-world scenario, use Web Crypto API for proper hashing
 */
function hashPin(pin: string): string {
  // Basic implementation - for this use case, preventing casual read is enough
  // A real implementation would use SHA-256 via crypto.subtle
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/**
 * Verify if the entered PIN is correct
 */
export function verifyPin(pin: string): {
  success: boolean;
  lockedOut?: boolean;
} {
  const state = $pinState.get();

  // check lockout
  if (state.lockoutUntil && Date.now() < state.lockoutUntil) {
    return { success: false, lockedOut: true };
  } else if (state.lockoutUntil) {
    // Lockout expired
    $pinState.setKey("lockoutUntil", null);
    $pinState.setKey("failedAttempts", 0);
    localStorage.removeItem(LOCKOUT_K);
  }

  const savedHash = localStorage.getItem(PIN_STORAGE_KEY);
  const enteredHash = hashPin(pin);

  if (savedHash === enteredHash) {
    // Success!
    $pinState.setKey("isLocked", false);
    $pinState.setKey("failedAttempts", 0);
    return { success: true };
  } else {
    // Failure
    const newAttempts = state.failedAttempts + 1;

    if (newAttempts >= MAX_ATTEMPTS) {
      // Trigger Lockout
      const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
      $pinState.setKey("lockoutUntil", lockoutUntil);
      $pinState.setKey("failedAttempts", 0); // Reset attempts after lockout triggers
      localStorage.setItem(LOCKOUT_K, lockoutUntil.toString());
      return { success: false, lockedOut: true };
    } else {
      $pinState.setKey("failedAttempts", newAttempts);
      return { success: false };
    }
  }
}

/**
 * Set a new PIN (Enables security)
 */
export function setPin(pin: string) {
  const hash = hashPin(pin);
  localStorage.setItem(PIN_STORAGE_KEY, hash);

  $pinState.set({
    isEnabled: true,
    isCustomPinSet: true,
    isLocked: false, // Don't lock immediately after setting
    failedAttempts: 0,
    lockoutUntil: null,
  });
}

/**
 * Disable PIN security
 */
export function disablePin() {
  localStorage.removeItem(PIN_STORAGE_KEY);
  localStorage.removeItem(LOCKOUT_K);

  $pinState.set({
    isEnabled: false,
    isCustomPinSet: false,
    isLocked: false,
    failedAttempts: 0,
    lockoutUntil: null,
  });
}

/**
 * Lock the app (manually or on background/resume if we want)
 */
export function lockApp() {
  const state = $pinState.get();
  if (state.isEnabled) {
    $pinState.setKey("isLocked", true);
  }
}

/**
 * Check if app is effectively locked (considering PIN status)
 */
export function isAppLocked(): boolean {
  const state = $pinState.get();
  return state.isEnabled && state.isLocked;
}
