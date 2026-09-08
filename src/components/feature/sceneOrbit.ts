import type { Vector3 } from 'three';

export interface OrbitParams {
  radius: number;
  speed: number;
  phase: number;
  inclination: number;
  node: number;
}

// Inclination and node stay fixed while phase advances. Cache their trig once.
export function createOrbitBasis(p: OrbitParams) {
  return {
    radius: p.radius,
    sinI: Math.sin(p.inclination),
    cosI: Math.cos(p.inclination),
    sinN: Math.sin(p.node),
    cosN: Math.cos(p.node),
  };
}

export function calcOrbitalPos(p: ReturnType<typeof createOrbitBasis>, phase: number, out: Vector3): void {
  const cos = Math.cos(phase);
  const sin = Math.sin(phase);
  out.set(
    p.radius * (p.cosN * cos - p.sinN * sin * p.cosI),
    p.radius * p.sinN * p.sinI * sin,
    p.radius * (p.sinN * cos + p.cosN * sin * p.cosI) - 18,
  );
}

export function calcOrbitalTangent(p: ReturnType<typeof createOrbitBasis>, phase: number, out: Vector3): void {
  const sin = Math.sin(phase);
  const cos = Math.cos(phase);
  out.set(
    -(p.cosN * sin + p.sinN * cos * p.cosI),
    p.sinN * p.sinI * cos,
    -(p.sinN * sin - p.cosN * cos * p.cosI),
  ).normalize();
}
