/**
 * End-to-end encryption utilities using the Web Crypto API.
 *
 * Flow (ECDH + AES-GCM):
 * 1. Each user generates an ECDH P-256 key pair on-device on first login.
 *    The private key is stored in localStorage (never sent to the server).
 *    The public key is published to profiles.public_key.
 * 2. For a 1:1 chat, the sender derives a shared AES-GCM key from
 *    (sender private key, recipient public key) via ECDH.
 * 3. For a group chat, the creator generates a random 256-bit AES-GCM key,
 *    wraps it once per member using the pairwise shared key, and stores the
 *    wraps in conversation_keys. Members fetch + unwrap their copy.
 * 4. Messages are encrypted with the conversation key; the server only ever
 *    relays base64(iv || ciphertext) blobs in messages.body.
 *
 * Only message *bodies* (text / captions) are encrypted. Metadata (timestamps,
 * media_url, type) is visible to the server — this matches the "metadata
 * minimization" directive while keeping media delivery on the CDN.
 */

const KEY_STORAGE = 'wa_e2ee_keys';

interface StoredKeys {
  private: Base64;
  public: Base64;
}

export type Base64 = string;

function bufToB64(buf: ArrayBuffer | Uint8Array): Base64 {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function b64ToBuf(b64: Base64): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );
}

export async function exportPublicKey(key: CryptoKey): Promise<Base64> {
  const spki = await crypto.subtle.exportKey('spki', key);
  return bufToB64(spki);
}

async function importPublicKey(b64: Base64): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'spki',
    b64ToBuf(b64),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
}

async function exportPrivateKey(key: CryptoKey): Promise<Base64> {
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', key);
  return bufToB64(pkcs8);
}

async function importPrivateKey(b64: Base64): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'pkcs8',
    b64ToBuf(b64),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey', 'deriveBits']
  );
}

/** Derive a shared AES-GCM key from a local private key + a remote public key. */
async function deriveSharedKey(
  privateKey: CryptoKey,
  remotePublicKey: CryptoKey
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: remotePublicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Derive a fresh random AES-GCM key (used as the group conversation key). */
export async function generateGroupKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ]);
}

/**
 * Ensure the current user has an ECDH key pair. Generates one on first call,
 * persists both keys to localStorage (the private key never leaves the device),
 * and returns the CryptoKeys plus the public key (base64 SPKI) ready to
 * publish to the profile.
 */
export async function ensureKeyPair(userId: string): Promise<{
  publicKeyB64: Base64;
  privateKey: CryptoKey;
  isNew: boolean;
}> {
  const storageKey = `${KEY_STORAGE}:${userId}`;
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    const parsed: StoredKeys = JSON.parse(stored);
    const privateKey = await importPrivateKey(parsed.private);
    return { publicKeyB64: parsed.public, privateKey, isNew: false };
  }
  const pair = await generateKeyPair();
  const privateB64 = await exportPrivateKey(pair.privateKey);
  const publicB64 = await exportPublicKey(pair.publicKey);
  const toStore: StoredKeys = { private: privateB64, public: publicB64 };
  localStorage.setItem(storageKey, JSON.stringify(toStore));
  return { publicKeyB64: publicB64, privateKey: pair.privateKey, isNew: true };
}

/**
 * Encrypt a plaintext string with the given AES-GCM key.
 * Returns base64(iv || ciphertext).
 */
export async function encryptMessage(
  key: CryptoKey,
  plaintext: string
): Promise<Base64> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);
  return bufToB64(combined);
}

/**
 * Decrypt a base64(iv || ciphertext) blob with the given AES-GCM key.
 * Returns the plaintext string.
 */
export async function decryptMessage(
  key: CryptoKey,
  blobB64: Base64
): Promise<string> {
  const combined = new Uint8Array(b64ToBuf(blobB64));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plaintext);
}

/** Wrap (encrypt) a raw key string with a pairwise shared key for storage. */
export async function wrapKey(
  wrapperKey: CryptoKey,
  rawKeyB64: Base64
): Promise<Base64> {
  return encryptMessage(wrapperKey, rawKeyB64);
}

/** Unwrap (decrypt) a wrapped key string with a pairwise shared key. */
export async function unwrapKey(
  wrapperKey: CryptoKey,
  wrappedB64: Base64
): Promise<Base64> {
  return decryptMessage(wrapperKey, wrappedB64);
}

/**
 * Derive the pairwise shared key needed to wrap/unwrap group keys.
 * Uses the local user's private key and the target user's public key.
 */
export async function getPairwiseKey(
  privateKey: CryptoKey,
  otherPublicKeyB64: Base64
): Promise<CryptoKey> {
  const pubKey = await importPublicKey(otherPublicKeyB64);
  return deriveSharedKey(privateKey, pubKey);
}

/** Convert a CryptoKey to a base64 string (for wrapping / caching). */
export async function exportSymmetricKey(key: CryptoKey): Promise<Base64> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return bufToB64(raw);
}

/** Convert a base64 raw key string back to a usable AES-GCM CryptoKey. */
export async function importSymmetricKey(b64: Base64): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', b64ToBuf(b64), { name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt',
  ]);
}

/** Hash a phone number with SHA-256 for privacy-preserving matching. */
export async function hashPhone(phone: string): Promise<string> {
  const normalized = phone.replace(/\D/g, '');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  return bufToB64(digest);
}

/**
 * Decrypt a raw key string that was wrapped with a pairwise key, then import it
 * as a usable AES-GCM CryptoKey. Convenience wrapper for group key recovery.
 */
export async function unwrapAndImportKey(
  wrapperKey: CryptoKey,
  wrappedB64: Base64
): Promise<CryptoKey> {
  const rawB64 = await unwrapKey(wrapperKey, wrappedB64);
  return importSymmetricKey(rawB64);
}
