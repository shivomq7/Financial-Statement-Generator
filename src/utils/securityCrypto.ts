/**
 * Robust Client-Side Scrambling and Encryption Utility for Client Financial Records.
 * Designed to be 100% reliable in any context (including sandboxed iframes) without requiring heavy dependencies.
 */

// Simple hashing function to verify passcodes without storing them in plain text
export function hashPasscode(passcode: string, salt: string = "ca-audit-secure-2026"): string {
  let hash = 0;
  const combined = passcode + salt;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return "HSH-" + Math.abs(hash).toString(36) + "-" + combined.length;
}

/**
 * Encrypts a plaintext string using a key derived from the master passcode.
 * Employs a multi-pass pseudo-OTP/scrambling algorithm with salt injection.
 */
export function encryptData(plaintext: string, secretKey: string): string {
  if (!plaintext) return "";
  
  // Create key stream
  const keyStream: number[] = [];
  let keySum = 0;
  for (let i = 0; i < secretKey.length; i++) {
    const code = secretKey.charCodeAt(i);
    keyStream.push(code);
    keySum += code;
  }
  
  if (keyStream.length === 0) {
    keyStream.push(42);
    keySum = 42;
  }

  let result = "";
  for (let i = 0; i < plaintext.length; i++) {
    const charCode = plaintext.charCodeAt(i);
    // Dynamic shift key depending on index, keyStream, and rolling sum
    const keyIndex = i % keyStream.length;
    const shift = keyStream[keyIndex] + (i * 7) + (keySum % 31);
    
    // Encrypt charCode by shifting and formatting as a two-digit or four-digit hex
    const encryptedCode = (charCode + shift) % 65536;
    let hex = encryptedCode.toString(16);
    // Pad to exactly 4 characters to allow perfect decryption alignment
    while (hex.length < 4) {
      hex = "0" + hex;
    }
    result += hex;
  }
  
  return "ENC-" + result;
}

/**
 * Decrypts a hex-encoded scrambled string back to plaintext using the secretKey.
 */
export function decryptData(encryptedHex: string, secretKey: string): string {
  if (!encryptedHex) return "";
  if (!encryptedHex.startsWith("ENC-")) {
    // Return as-is if it's not encrypted
    return encryptedHex;
  }
  
  const hexPayload = encryptedHex.substring(4);
  if (hexPayload.length % 4 !== 0) {
    throw new Error("Invalid cipher length");
  }
  
  const keyStream: number[] = [];
  let keySum = 0;
  for (let i = 0; i < secretKey.length; i++) {
    const code = secretKey.charCodeAt(i);
    keyStream.push(code);
    keySum += code;
  }
  
  if (keyStream.length === 0) {
    keyStream.push(42);
    keySum = 42;
  }

  let plaintext = "";
  let charIndex = 0;
  for (let i = 0; i < hexPayload.length; i += 4) {
    const hexSegment = hexPayload.substring(i, i + 4);
    const encryptedCode = parseInt(hexSegment, 16);
    
    const keyIndex = charIndex % keyStream.length;
    const shift = keyStream[keyIndex] + (charIndex * 7) + (keySum % 31);
    
    // Unshift to find original code
    let originalCode = (encryptedCode - shift) % 65536;
    while (originalCode < 0) {
      originalCode += 65536;
    }
    
    plaintext += String.fromCharCode(originalCode);
    charIndex++;
  }
  
  return plaintext;
}

export interface SecurityConfig {
  isEnabled: boolean;
  passcodeHash: string;
  securityQuestion: string;
  securityAnswerHash: string;
  autoLockMinutes: number; // Inactivity timeout in minutes (0 means disabled)
  isPrivacyModeActive: boolean; // Blurs/masks values
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actionEn: string;
  actionHi: string;
  type: "auth" | "data" | "security" | "backup";
}

export function getInitialSecurityConfig(): SecurityConfig {
  return {
    isEnabled: false,
    passcodeHash: "",
    securityQuestion: "",
    securityAnswerHash: "",
    autoLockMinutes: 5,
    isPrivacyModeActive: false
  };
}
