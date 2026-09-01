import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRAEvents, parseRAApiXML } from './raApi.client';

describe('RA API browser boundary', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not expose parser diagnostics from an invalid upstream document', () => {
    const reflected = 'test-only-reflected-parser-secret';

    expect(() => parseRAApiXML(`<events><${reflected}></events>`)).toThrow(
      'RA API 응답을 해석하지 못했습니다.',
    );
    try {
      parseRAApiXML(`<events><${reflected}></events>`);
    } catch (error) {
      expect(String(error)).not.toContain(reflected);
    }
  });

  it('uses a generic browser error for a failed proxy response', async () => {
    const reflected = 'test-only-reflected-error-secret';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({ error: { message: reflected } }, { status: 502 }),
      ),
    );

    await expect(fetchRAEvents()).rejects.toEqual({
      message: 'RA API 호출에 실패했습니다.',
    });
  });
});
