import { describe, it, expect } from 'bun:test'
import { scrubPii, scrubPiiDeep, scrubMessagesForModel } from '../src/index'

describe('scrubPii', () => {
  const cases: Array<[string, string, string]> = [
    ['email', 'contact me at john@example.com please', 'contact me at [EMAIL_REDACTED] please'],
    ['SSN', 'SSN: 123-45-6789', 'SSN: [SSN_REDACTED]'],
    ['UK postcode', 'Address: SW1A 1AA London', 'Address: [POSTCODE_REDACTED] London'],
    ['credit card (spaces)', 'card: 4111 1111 1111 1111', 'card: [CARD_REDACTED]'],
    ['UK NINO', 'NINO: AB 12 34 56 C', 'NINO: [NINO_REDACTED]'],
    ['IBAN', 'IBAN: GB29 NWBK 6016 1331 9268 19', 'IBAN: [IBAN_REDACTED]'],
    ['NHS number', 'NHS: 943 476 5919', 'NHS: [NHS_REDACTED]'],
    ['Irish PPSN', 'PPSN: 1234567T', 'PPSN: [PPSN_REDACTED]'],
    ['UK licence', 'Licence: MORGA657054SM9IJ01', 'Licence: [LICENCE_REDACTED]'],
    ['sort code + account', 'Bank: 12-34-56 12345678', 'Bank: [BANKACCT_REDACTED]'],
    ['DOB', 'DOB: 15/03/1990', 'DOB: [DOB_REDACTED]'],
    ['US ZIP', 'ZIP: 90210', 'ZIP: [ZIP_REDACTED]'],
    ['phone (international)', 'Call +44 7700 900000', 'Call [PHONE_REDACTED]'],
  ]

  for (const [label, input, expected] of cases) {
    it(`redacts ${label}`, () => {
      expect(scrubPii(input)).toBe(expected)
    })
  }

  it('preserves non-PII text', () => {
    const text = 'Hello, I need a storage unit near London.'
    expect(scrubPii(text)).toBe(text)
  })

  it('handles empty string', () => {
    expect(scrubPii('')).toBe('')
  })

  it('handles multiple PII types in one string', () => {
    const input = 'Email john@test.com and SSN 123-45-6789'
    const result = scrubPii(input)
    expect(result).toContain('[EMAIL_REDACTED]')
    expect(result).toContain('[SSN_REDACTED]')
    expect(result).not.toContain('john@test.com')
    expect(result).not.toContain('123-45-6789')
  })
})

describe('scrubPiiDeep', () => {
  it('scrubs strings in nested objects', () => {
    const input = {
      name: 'John',
      email: 'john@example.com',
      nested: { phone: '+44 7700 900000' },
      array: ['test@test.com', 42],
    }
    const result = scrubPiiDeep(input) as any
    expect(result.email).toContain('[EMAIL_REDACTED]')
    expect(result.nested.phone).toContain('[PHONE_REDACTED]')
    expect(result.array[0]).toContain('[EMAIL_REDACTED]')
    expect(result.array[1]).toBe(42)
    expect(result.name).toBe('John')
  })

  it('returns primitives unchanged', () => {
    expect(scrubPiiDeep(42)).toBe(42)
    expect(scrubPiiDeep(null)).toBe(null)
    expect(scrubPiiDeep(true)).toBe(true)
    expect(scrubPiiDeep(undefined)).toBe(undefined)
  })

  it('scrubs plain strings', () => {
    expect(scrubPiiDeep('my email is a@b.com')).toContain('[EMAIL_REDACTED]')
  })
})

describe('scrubMessagesForModel', () => {
  it('scrubs user messages but not assistant messages', () => {
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'My email is test@example.com' },
      { role: 'assistant', content: 'test@example.com is noted' },
    ]
    const result = scrubMessagesForModel(messages)
    expect(result[0].content).toBe('You are a helpful assistant.')
    expect(result[1].content).toContain('[EMAIL_REDACTED]')
    expect(result[2].content).toBe('test@example.com is noted')
  })

  it('handles multipart content (text parts)', () => {
    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'SSN: 123-45-6789' },
          { type: 'image', url: 'https://example.com/img.png' },
        ],
      },
    ]
    const result = scrubMessagesForModel(messages)
    const parts = result[0].content as any[]
    expect(parts[0].text).toContain('[SSN_REDACTED]')
    expect(parts[1]).toEqual({ type: 'image', url: 'https://example.com/img.png' })
  })

  it('does not mutate original messages', () => {
    const original = [{ role: 'user', content: 'email: a@b.com' }]
    const result = scrubMessagesForModel(original)
    expect(original[0].content).toBe('email: a@b.com')
    expect(result[0].content).toContain('[EMAIL_REDACTED]')
  })

  it('passes through messages without content', () => {
    const messages = [{ role: 'user' }] as any
    const result = scrubMessagesForModel(messages)
    expect(result[0]).toEqual({ role: 'user' })
  })
})
