import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { Vector3 } from 'three';
import HomeAmbientScene, { supportsAmbientScene } from './HomeAmbientScene';
import { calcOrbitalPos, calcOrbitalTangent, createOrbitBasis } from './sceneOrbit';

vi.mock('next/dynamic', () => ({
  default: () => function Scene({ isVisible }: { isVisible: boolean }) {
    return <div data-testid="scene" data-visible={isVisible} />;
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('pauses a hidden scene without remounting it and resumes when visible', () => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('min-width'), media: query,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }));
  const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  const { unmount } = render(<HomeAmbientScene tracks={[]} />);
  const scene = screen.getByTestId('scene');
  expect(scene).toHaveAttribute('data-visible', 'true');
  visibility.mockReturnValue('hidden');
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(screen.getByTestId('scene')).toBe(scene);
  expect(scene).toHaveAttribute('data-visible', 'false');
  visibility.mockReturnValue('visible');
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(screen.getByTestId('scene')).toBe(scene);
  expect(scene).toHaveAttribute('data-visible', 'true');
  const removeListener = vi.spyOn(document, 'removeEventListener');
  unmount();
  expect(removeListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
});

it('preserves the original orbital positions and normalized tangents with cached bases', () => {
  const position = new Vector3();
  const tangent = new Vector3();
  for (const inclination of [-0.5, 0, 0.5]) {
    for (const node of [0, 1.7, Math.PI]) {
      const basis = createOrbitBasis({ radius: 23, inclination, node, phase: 0, speed: 0.002 });
      for (const phase of [0, 0.8, Math.PI, 5.9]) {
        const sin = Math.sin(phase), cos = Math.cos(phase);
        const sinI = Math.sin(inclination), cosI = Math.cos(inclination);
        const sinN = Math.sin(node), cosN = Math.cos(node);
        calcOrbitalPos(basis, phase, position);
        calcOrbitalTangent(basis, phase, tangent);
        expect(position.toArray()).toEqual([
          23 * (cosN * cos - sinN * sin * cosI),
          23 * sinN * sinI * sin,
          23 * (sinN * cos + cosN * sin * cosI) - 18,
        ]);
        expect(tangent.toArray()).toEqual(new Vector3(
          -(cosN * sin + sinN * cos * cosI), sinN * sinI * cos,
          -(sinN * sin - cosN * cos * cosI),
        ).normalize().toArray());
      }
    }
  }
});

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
