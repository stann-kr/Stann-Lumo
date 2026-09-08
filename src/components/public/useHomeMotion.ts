'use client';

import { useRef, type RefObject } from 'react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/dist/Flip';
import { useGSAP } from '@gsap/react';
import { useContentMotion } from '../feature/useContentMotion';
import { PUBLIC_MOTION } from '../feature/publicMotion';

gsap.registerPlugin(useGSAP, Flip);

interface PanelSnapshot {
  edges: Flip.FlipState;
  headings: Array<{ element: HTMLElement; left: number; top: number; wasExpanded: boolean }>;
}

export function useHomeMotion(rootRef: RefObject<HTMLDivElement | null>, selectedPath: string | null, isMotionEnabled: boolean) {
  useContentMotion(rootRef);
  const pending = useRef<PanelSnapshot | null>(null);
  const active = useRef<gsap.core.Timeline | null>(null);

  useGSAP(() => {
    const finish = () => { active.current?.progress(1); };
    const focus = (event: FocusEvent) => {
      if (event.target instanceof Element && event.target.closest('[data-panel-content]')) finish();
    };
    const root = rootRef.current;
    root?.addEventListener('focusin', focus);
    window.addEventListener('keydown', finish, true);
    window.addEventListener('resize', finish);
    document.addEventListener('visibilitychange', finish);
    return () => {
      pending.current = null;
      root?.removeEventListener('focusin', focus);
      window.removeEventListener('keydown', finish, true);
      window.removeEventListener('resize', finish);
      document.removeEventListener('visibilitychange', finish);
    };
  }, { scope: rootRef });

  useGSAP(() => {
    const snapshot = pending.current;
    pending.current = null;
    if (!snapshot || !isMotionEnabled || !window.matchMedia) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const root = rootRef.current;
      if (!root || document.hidden) return;
      const transition = gsap.timeline({ defaults: { ease: PUBLIC_MOTION.ease } });
      active.current = transition;
      // Only the dividing lines resize. Text and artwork keep their natural proportions.
      transition.add(Flip.from(snapshot.edges, {
        scale: true, prune: true, duration: PUBLIC_MOTION.panel, ease: PUBLIC_MOTION.ease,
      }), 0);
      for (const { element, left, top, wasExpanded } of snapshot.headings) {
        const bounds = element.getBoundingClientRect();
        const hasChanged = element.closest('[data-expanded]')?.getAttribute('data-expanded') !== String(wasExpanded);
        transition.fromTo(element, { x: left - bounds.left, y: top - bounds.top }, {
          x: 0, y: 0, duration: PUBLIC_MOTION.panel, clearProps: 'transform',
        }, 0);
        if (hasChanged) transition.fromTo(element.querySelector('[data-panel-title]'), { opacity: 0.15 }, {
          opacity: 1, duration: PUBLIC_MOTION.feedback, clearProps: 'opacity',
        }, 0.04);
      }
      const content = root.querySelector('[data-expanded="true"] [data-panel-content]');
      if (content) transition.fromTo(content.children, { y: 8, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.2, stagger: { amount: 0.04 }, clearProps: 'transform,opacity',
      }, 0.04);
      return () => { active.current = null; };
    }, rootRef);
    return () => media.revert();
  }, { scope: rootRef, dependencies: [selectedPath, isMotionEnabled], revertOnUpdate: true });

  return (isPointer: boolean) => {
    const root = rootRef.current;
    pending.current = null;
    if (!root || !isPointer || !isMotionEnabled || document.hidden) {
      active.current?.progress(1);
      return;
    }
    // Capture the currently drawn positions before completing an interrupted transition.
    const headings = Array.from(root.querySelectorAll<HTMLElement>('[data-panel-heading]'), (element) => {
      const bounds = element.getBoundingClientRect();
      return { element, left: bounds.left, top: bounds.top, wasExpanded: element.closest('[data-expanded]')?.getAttribute('data-expanded') === 'true' };
    });
    const edges = Flip.getState(root.querySelectorAll('[data-panel-edge], [data-panel-rule], [data-panel-index]'), { props: 'opacity' });
    active.current?.progress(1);
    pending.current = { edges, headings };
  };
}
