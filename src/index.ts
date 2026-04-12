/**
 * @bagdock/pii-patterns — PII regex patterns and scrubbing utilities.
 *
 * 15-pattern canonical scrubber for personally identifiable information,
 * covering US, UK, EU, and Irish PII types. Designed for client-side
 * defense-in-depth scrubbing before messages leave the browser.
 *
 * Pattern ordering matters: more specific patterns (NHS, PPSN, licence,
 * bank account, VAT) run before broader patterns (card, phone) to avoid
 * false matches.
 *
 * @compliance SOC 2 CC6.1 | ISO 27001 A.18.1
 */

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const PHONE_RE = /(?:\+?\d{1,4}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g
const UK_POSTCODE_RE = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/gi
const US_ZIP_RE = /\b\d{5}(?:-\d{4})?\b/g
const CARD_RE = /\b(?:\d[ \-]*?){13,19}\b/g
const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/g
const UK_NINO_RE = /\b[A-CEGHJ-PR-TW-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]\b/gi
const IBAN_RE = /\b[A-Z]{2}\d{2}\s?[\dA-Z]{4}\s?[\dA-Z]{4}(?:\s?[\dA-Z]{1,4}){1,7}\b/gi
const DOB_RE = /\b(?:\d{1,2}[/.-]\d{1,2}[/.-](?:19|20)\d{2})\b/g
const NHS_RE = /\b\d{3}\s?\d{3}\s?\d{4}\b/g
const PPSN_RE = /\b\d{7}[A-Z]{1,2}\b/g
const UK_LICENCE_RE = /\b[A-Z]{1,5}\d{6}[A-Z\d]{2}\d[A-Z]{2}\d{2}\b/g
const BANK_ACCT_RE = /\b\d{2}-\d{2}-\d{2}\s?\d{8}\b/g
const EU_VAT_RE = /\b[A-Z]{2}\d{2,12}\b/g
const PASSPORT_RE = /\b[A-Z]{1,2}\d{6,9}\b/g

/**
 * Scrub all 15 PII pattern types from a text string.
 * Returns the scrubbed string with redaction tokens (e.g. `[EMAIL_REDACTED]`).
 */
export function scrubPii(text: string): string {
  if (!text) return text
  return text
    .replace(EMAIL_RE, '[EMAIL_REDACTED]')
    .replace(SSN_RE, '[SSN_REDACTED]')
    .replace(UK_NINO_RE, '[NINO_REDACTED]')
    .replace(IBAN_RE, '[IBAN_REDACTED]')
    .replace(NHS_RE, '[NHS_REDACTED]')
    .replace(PPSN_RE, '[PPSN_REDACTED]')
    .replace(UK_LICENCE_RE, '[LICENCE_REDACTED]')
    .replace(BANK_ACCT_RE, '[BANKACCT_REDACTED]')
    .replace(EU_VAT_RE, '[VAT_REDACTED]')
    .replace(CARD_RE, '[CARD_REDACTED]')
    .replace(PHONE_RE, '[PHONE_REDACTED]')
    .replace(DOB_RE, '[DOB_REDACTED]')
    .replace(UK_POSTCODE_RE, '[POSTCODE_REDACTED]')
    .replace(US_ZIP_RE, '[ZIP_REDACTED]')
    .replace(PASSPORT_RE, '[ID_REDACTED]')
}

/**
 * Recursively scrub PII from nested objects and arrays.
 * Strings are scrubbed; non-string primitives pass through unchanged.
 */
export function scrubPiiDeep(value: unknown): unknown {
  if (typeof value === 'string') return scrubPii(value)
  if (Array.isArray(value)) return value.map(scrubPiiDeep)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = scrubPiiDeep(v)
    }
    return out
  }
  return value
}

/**
 * Scrub PII from a message array before sending to an AI model.
 * Only scrubs `user` role messages; assistant and system messages pass through.
 * Returns a shallow copy — originals are NOT mutated.
 */
export function scrubMessagesForModel<T extends { role: string; content?: unknown }>(
  messages: T[],
): T[] {
  return messages.map((m) => {
    if (m.role !== 'user') return m
    if (typeof m.content === 'string') {
      return { ...m, content: scrubPii(m.content) }
    }
    if (Array.isArray(m.content)) {
      return {
        ...m,
        content: m.content.map((part: any) => {
          if (part?.type === 'text' && typeof part.text === 'string') {
            return { ...part, text: scrubPii(part.text) }
          }
          return part
        }),
      }
    }
    return m
  })
}
