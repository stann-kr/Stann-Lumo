import { describe, expect, it } from 'vitest';
import { assertPublicPayloadSafe } from './publicPayload';

describe('assertPublicPayloadSafe', () => {
  it.each([
    'raApiConfig',
    'ra_api_config',
    'api-key',
    'AccessKey',
    'user id',
    'DJ.ID',
    'raUserId',
  ])('rejects the exact normalized credential field %s', (key) => {
    expect(() => assertPublicPayloadSafe({ nested: { [key]: 'test-only-value' } })).toThrow(
      /Unsafe public payload field/,
    );
  });

  it('allows ordinary public key and fieldKey fields', () => {
    expect(() =>
      assertPublicPayloadSafe({
        artistInfo: [{ key: 'genre', value: 'techno' }],
        terminalInfo: { customFields: [{ fieldKey: 'location', fieldValue: 'Seoul' }] },
      }),
    ).not.toThrow();
  });

  it('handles arrays, primitives, and circular objects', () => {
    const payload: { list: unknown[]; self?: unknown } = { list: [null, 1, 'safe'] };
    payload.self = payload;

    expect(() => assertPublicPayloadSafe(payload)).not.toThrow();
  });
});
