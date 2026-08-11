import { describe, expect, it } from 'vitest';
import { supportsAmbientScene } from './HomeAmbientScene';

describe('supportsAmbientScene', () => {
  it('keeps the optional scene on capable connections and devices', () => {
    expect(supportsAmbientScene({
      connection: { effectiveType: '4g', saveData: false },
      deviceMemory: 8,
      hardwareConcurrency: 8,
    })).toBe(true);
  });

  it.each([
    { connection: { saveData: true } },
    { connection: { effectiveType: '2g' } },
    { deviceMemory: 2 },
    { hardwareConcurrency: 2 },
  ])('uses the static fallback for constrained environments: %o', (navigatorInfo) => {
    expect(supportsAmbientScene(navigatorInfo)).toBe(false);
  });
});
