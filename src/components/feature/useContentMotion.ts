'use client';

import type { RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

/** The page opts individual elements into motion; content stays readable without JS. */
export function useContentMotion(rootRef: RefObject<HTMLElement | null>, revision?: string | number) {
  useGSAP(() => {
    const root = rootRef.current;
    if (!root || !window.matchMedia) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();

    media.add('(prefers-reduced-motion: no-preference)', () => {
      const rules = root.querySelectorAll('[data-draw-rule]');
      if (rules.length) gsap.fromTo(rules, { scaleX: 0, transformOrigin: '0% 50%' }, {
        scaleX: 1, duration: 1.1, stagger: 0.1, ease: 'expo.inOut',
      });
      const reveals = new Map<HTMLElement, gsap.core.Tween>();
      root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element, index) => {
        const isCard = element.dataset.reveal === 'card';
        const isRow = element.dataset.reveal === 'row';
        const tween = gsap.fromTo(element, {
          y: isRow ? 0 : isCard ? 42 : 28,
          x: isRow ? -22 : 0,
          rotation: isCard ? (index % 2 ? 1.2 : -1.2) : 0,
          opacity: 0.35,
        }, {
          x: 0, y: 0, rotation: 0, opacity: 1,
          duration: isCard ? 0.95 : 0.75,
          delay: (index % (isCard ? 4 : 3)) * 0.045,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: { trigger: element, start: 'top 94%', once: true },
        });
        reveals.set(element, tween);
      });

      // Tabbing directly to a link must never wait for its scroll reveal.
      const revealFocused = (event: FocusEvent) => {
        if (!(event.target instanceof Element)) return;
        const element = event.target.closest<HTMLElement>('[data-reveal]');
        if (element) reveals.get(element)?.progress(1);
      };
      root.addEventListener('focusin', revealFocused);

      // Refresh after images/fonts settle, and after accordion or list size changes.
      let isActive = true;
      const refresh = gsap.delayedCall(0.16, () => ScrollTrigger.refresh()).pause();
      const scheduleRefresh = () => { if (isActive) refresh.restart(true); };
      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleRefresh);
      observer?.observe(root);
      root.addEventListener('load', scheduleRefresh, true);
      void document.fonts?.ready.then(scheduleRefresh);
      scheduleRefresh();

      return () => {
        isActive = false;
        observer?.disconnect();
        root.removeEventListener('load', scheduleRefresh, true);
        root.removeEventListener('focusin', revealFocused);
      };
    }, rootRef);

    media.add('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)', () => {
      const cleanups: Array<() => void> = [];
      root.querySelectorAll<HTMLElement>('[data-hover]').forEach((surface) => {
        const label = surface.querySelector<HTMLElement>('[data-hover-label]');
        const arrow = surface.querySelector<HTMLElement>('[data-hover-arrow]');
        const rule = surface.querySelector<HTMLElement>('[data-hover-rule]');
        const picture = surface.querySelector<HTMLElement>('[data-hover-image]');
        const hover = gsap.timeline({ paused: true, defaults: { duration: 0.38, ease: 'power3.out' } });
        if (label) hover.to(label, { x: 8 }, 0);
        if (arrow) hover.to(arrow, { x: 5, y: -5, rotation: 8 }, 0);
        if (rule) hover.fromTo(rule, { scaleX: 0 }, { scaleX: 1, transformOrigin: '0% 50%' }, 0);
        if (picture) hover.to(picture, { scale: 0.96 }, 0);

        const enter = () => hover.play();
        const leave = () => { if (!surface.contains(document.activeElement)) hover.reverse(); };
        const blur = (event: FocusEvent) => {
          if (!(event.relatedTarget instanceof Node) || !surface.contains(event.relatedTarget)) hover.reverse();
        };
        surface.addEventListener('pointerenter', enter);
        surface.addEventListener('pointerleave', leave);
        surface.addEventListener('focusin', enter);
        surface.addEventListener('focusout', blur);
        cleanups.push(() => {
          surface.removeEventListener('pointerenter', enter);
          surface.removeEventListener('pointerleave', leave);
          surface.removeEventListener('focusin', enter);
          surface.removeEventListener('focusout', blur);
        });

        if (!picture) return;
        const xTo = gsap.quickTo(picture, 'x', { duration: 0.65, ease: 'power3.out' });
        const yTo = gsap.quickTo(picture, 'y', { duration: 0.65, ease: 'power3.out' });
        const rotateTo = gsap.quickTo(picture, 'rotation', { duration: 0.75, ease: 'power3.out' });
        let bounds: DOMRect | null = null;
        const measure = () => { bounds = surface.getBoundingClientRect(); };
        const move = (event: PointerEvent) => {
          if (event.pointerType === 'touch' || !bounds?.width || !bounds.height) return;
          const x = gsap.utils.clamp(-0.5, 0.5, (event.clientX - bounds.left) / bounds.width - 0.5);
          const y = gsap.utils.clamp(-0.5, 0.5, (event.clientY - bounds.top) / bounds.height - 0.5);
          xTo(x * 10); yTo(y * 10); rotateTo(x * 5);
        };
        const reset = () => { bounds = null; xTo(0); yTo(0); rotateTo(0); };
        surface.addEventListener('pointerenter', measure);
        surface.addEventListener('pointermove', move);
        surface.addEventListener('pointerleave', reset);
        cleanups.push(() => {
          surface.removeEventListener('pointerenter', measure);
          surface.removeEventListener('pointermove', move);
          surface.removeEventListener('pointerleave', reset);
        });
      });
      return () => cleanups.forEach((cleanup) => cleanup());
    }, rootRef);

    return () => media.revert();
  }, { scope: rootRef, dependencies: [revision], revertOnUpdate: true });
}
