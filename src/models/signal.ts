import { RADAR_MESSAGE_MAX_CHARS } from "./buildings";
import { PLANET_KINDS, type PlanetKind } from "../utils/planetSprite";
import {
  isFiniteNumber,
  isRecord,
  sanitizeId,
  sanitizeName,
  sanitizeText,
} from "../utils/sanitize";

/**
 * Radar signals: a planet name, an author among its inhabitants and a message,
 * turned into a code the players exchange however they like (a message, an
 * e-mail, a QR code…). There is no server: the code carries everything.
 *
 * A code reads OFFLINER1.<payload>.<checksum>:
 * - OFFLINER1: the format and its version;
 * - payload: the signal as JSON, in UTF-8, in URL-safe Base64;
 * - checksum: catches a code damaged on its way (cut, mistyped).
 * It is encoded, not encrypted: anyone with the code can read the message.
 */

export interface RadarSignal {
  /** Identifies the signal: the same code always gives the same id. */
  id: string;
  planetName: string;
  /** Draw the sender's planet and author as they look in their game. */
  planetSeed: string;
  planetKind: PlanetKind | null;
  authorName: string;
  authorTitle: string;
  authorSeed: string;
  message: string;
  sentAt: number;
}

export interface SentSignal extends RadarSignal {
  /** The code to share again. */
  code: string;
}

export interface ReceivedSignal extends RadarSignal {
  receivedAt: number;
}

export type SignalError = "format" | "version" | "checksum" | "content";

export type DecodedSignal =
  | { ok: true; signal: RadarSignal }
  | { ok: false; error: SignalError };

export const SIGNAL_ERROR_MESSAGES: Record<SignalError, string> = {
  format: "Ce n'est pas un signal Offliner : vérifiez que le code est complet.",
  version: "Ce signal vient d'une version d'Offliner que ce jeu ne sait pas lire.",
  checksum: "Le signal est abîmé : il manque ou il y a en trop des caractères.",
  content: "Le signal est illisible : son contenu n'est pas valide.",
};

const PREFIX = "OFFLINER";
const VERSION = 1;

/** What a code carries, with short keys to keep codes and QR codes small. */
interface Payload {
  p: string;
  ps: string;
  pk: string | null;
  a: string;
  t: string;
  as: string;
  m: string;
  d: number;
}

export function encodeSignal(signal: Omit<RadarSignal, "id">): string {
  const payload: Payload = {
    p: signal.planetName,
    ps: signal.planetSeed,
    pk: signal.planetKind,
    a: signal.authorName,
    t: signal.authorTitle,
    as: signal.authorSeed,
    m: signal.message,
    d: signal.sentAt,
  };
  const body = toBase64Url(JSON.stringify(payload));
  return `${PREFIX}${VERSION}.${body}.${checksum(body)}`;
}

/**
 * Reads a code typed, pasted or scanned. Spaces and line breaks added on the
 * way are ignored; everything else is checked and sanitized.
 */
export function decodeSignal(raw: string): DecodedSignal {
  const code = raw.replace(/\s+/g, "");
  const match = /^OFFLINER(\d+)\.([A-Za-z0-9_-]+)\.([0-9a-z]+)$/.exec(code);
  if (!match) return { ok: false, error: "format" };
  if (Number(match[1]) !== VERSION) return { ok: false, error: "version" };
  const [, , body, sum] = match;
  if (checksum(body) !== sum) return { ok: false, error: "checksum" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(fromBase64Url(body));
  } catch {
    return { ok: false, error: "content" };
  }
  if (!isRecord(parsed)) return { ok: false, error: "content" };

  const planetName = sanitizeName(parsed.p);
  const planetSeed = sanitizeId(parsed.ps);
  const authorName = sanitizeName(parsed.a);
  const authorTitle = sanitizeName(parsed.t);
  const authorSeed = sanitizeId(parsed.as);
  const message = sanitizeText(parsed.m, RADAR_MESSAGE_MAX_CHARS);
  if (
    !planetName ||
    !planetSeed ||
    !authorName ||
    !authorTitle ||
    !authorSeed ||
    !message ||
    !isFiniteNumber(parsed.d)
  ) {
    return { ok: false, error: "content" };
  }
  return {
    ok: true,
    signal: {
      id: `${parsed.d}-${sum}`,
      planetName,
      planetSeed,
      planetKind: PLANET_KINDS.find((kind) => kind === parsed.pk) ?? null,
      authorName,
      authorTitle,
      authorSeed,
      message,
      sentAt: parsed.d,
    },
  };
}

/** The id a code's signal gets, without decoding it again. */
export function getSignalId(code: string): string | null {
  const decoded = decodeSignal(code);
  return decoded.ok ? decoded.signal.id : null;
}

/** FNV-1a (32 bits), in base 36: short and enough to catch a damaged code. */
function checksum(text: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function toBase64Url(text: string): string {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(body: string): string {
  const base64 = body.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "="));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  // fatal: invalid UTF-8 is an unreadable signal, not garbled text.
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

/** Loads a saved list of signals, keeping only valid entries. */
export function loadSignals<T extends RadarSignal>(
  value: unknown,
  extra: (item: Record<string, unknown>) => Omit<T, keyof RadarSignal> | null,
  max: number,
): T[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, max).flatMap((item): T[] => {
    if (!isRecord(item)) return [];
    const id = sanitizeId(item.id);
    const planetName = sanitizeName(item.planetName);
    const planetSeed = sanitizeId(item.planetSeed);
    const authorName = sanitizeName(item.authorName);
    const authorTitle = sanitizeName(item.authorTitle);
    const authorSeed = sanitizeId(item.authorSeed);
    const message = sanitizeText(item.message, RADAR_MESSAGE_MAX_CHARS);
    const rest = extra(item);
    if (
      !id ||
      !planetName ||
      !planetSeed ||
      !authorName ||
      !authorTitle ||
      !authorSeed ||
      !message ||
      !isFiniteNumber(item.sentAt) ||
      !rest
    ) {
      return [];
    }
    const base: RadarSignal = {
      id,
      planetName,
      planetSeed,
      planetKind: PLANET_KINDS.find((kind) => kind === item.planetKind) ?? null,
      authorName,
      authorTitle,
      authorSeed,
      message,
      sentAt: item.sentAt,
    };
    return [{ ...base, ...rest } as T];
  });
}
