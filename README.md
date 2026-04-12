```
  ----++                                ----++                    ---+++     
  ---+++                                ---++                     ---++      
 ----+---     -----     ---------  --------++ ------     -----   ----++----- 
 ---------+ --------++----------++--------+++--------+ --------++---++---++++
 ---+++---++ ++++---++---+++---++---+++---++---+++---++---++---++------++++  
----++ ---++--------++---++----++---+++---++---++ ---+---++     -------++    
----+----+---+++---++---++----++---++----++---++---+++--++ --------+---++   
---------++--------+++--------+++--------++ -------+++ -------++---++----++  
 +++++++++   +++++++++- +++---++   ++++++++    ++++++    ++++++  ++++  ++++  
                     --------+++                                             
                       +++++++                                               
```

# @bagdock/pii-patterns

PII regex patterns and scrubbing utilities for the [Bagdock](https://bagdock.com) platform — 15-pattern defense-in-depth redaction for personally identifiable information.

[![npm version](https://img.shields.io/npm/v/@bagdock/pii-patterns.svg)](https://www.npmjs.com/package/@bagdock/pii-patterns)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Install

```bash
npm install @bagdock/pii-patterns
```

```bash
yarn add @bagdock/pii-patterns
```

```bash
pnpm add @bagdock/pii-patterns
```

```bash
bun add @bagdock/pii-patterns
```

## Usage

```ts
import { scrubPii, scrubPiiDeep, scrubMessagesForModel } from '@bagdock/pii-patterns'

// Scrub a single string
scrubPii('Email me at john@example.com')
// → 'Email me at [EMAIL_REDACTED]'

// Recursively scrub nested objects
scrubPiiDeep({ email: 'john@example.com', count: 42 })
// → { email: '[EMAIL_REDACTED]', count: 42 }

// Scrub user messages before sending to an AI model
const messages = [
  { role: 'system', content: 'You are helpful.' },
  { role: 'user', content: 'My SSN is 123-45-6789' },
]
scrubMessagesForModel(messages)
// → [{ role: 'system', content: 'You are helpful.' },
//    { role: 'user', content: 'My SSN is [SSN_REDACTED]' }]
```

## API

### `scrubPii(text: string): string`

Applies all 15 PII patterns in order and returns the redacted string.

### `scrubPiiDeep(value: unknown): unknown`

Recursively walks objects and arrays, scrubbing any string values. Non-string primitives pass through unchanged.

### `scrubMessagesForModel<T>(messages: T[]): T[]`

Scrubs PII from `user` role messages before AI inference. Assistant and system messages pass through unchanged. Returns a shallow copy — originals are not mutated.

## Patterns

15 PII types are detected and redacted:

| Pattern | Token | Coverage |
|---------|-------|----------|
| Email address | `[EMAIL_REDACTED]` | Global |
| Social Security Number | `[SSN_REDACTED]` | US |
| National Insurance Number | `[NINO_REDACTED]` | UK |
| IBAN | `[IBAN_REDACTED]` | EU/UK |
| NHS Number | `[NHS_REDACTED]` | UK |
| PPS Number | `[PPSN_REDACTED]` | Ireland |
| Driving Licence | `[LICENCE_REDACTED]` | UK (DVLA format) |
| Sort Code + Account | `[BANKACCT_REDACTED]` | UK |
| VAT Number | `[VAT_REDACTED]` | EU |
| Credit/Debit Card | `[CARD_REDACTED]` | Global |
| Phone Number | `[PHONE_REDACTED]` | Global |
| Date of Birth | `[DOB_REDACTED]` | Global |
| Postcode | `[POSTCODE_REDACTED]` | UK |
| ZIP Code | `[ZIP_REDACTED]` | US |
| Passport/ID Number | `[ID_REDACTED]` | Global |

## Defense-in-depth

This package provides **client-side** PII scrubbing as a defense-in-depth layer.
It is **not** a substitute for server-side controls. The Bagdock platform applies
authoritative PII scrubbing on the server edge before any AI model receives input.

## License

MIT — see [LICENSE](LICENSE).
