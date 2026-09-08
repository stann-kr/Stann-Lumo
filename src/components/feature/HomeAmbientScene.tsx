'use client';

import dynamic from 'next/dynamic';
import { Component, type ReactNode, useEffect, useState } from 'react';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import type { Track } from '@/capabilities/content/content';

const Scene3D = dynamic(() => import('./Scene3D'), {
  loading: () => null,
  ssr: false,
});

interface SceneNavigator {
  connection?: {
    effectiveType?: string;
    saveData?: boolean;
  };
  deviceMemory?: number;
  hardwareConcurrency?: number;
}

interface SceneErrorBoundaryProps {
  children: ReactNode;
}

interface SceneErrorBoundaryState {
  hasError: boolean;
}

class SceneErrorBoundary extends Component<SceneErrorBoundaryProps, SceneErrorBoundaryState> {
  state: SceneErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { hasError: true };
  }

  render(): ReactNode {
    return this.state.hasError ? null : this.props.children;
  }
}

export function supportsAmbientScene(navigatorInfo: SceneNavigator): boolean {
  const { connection, deviceMemory, hardwareConcurrency } = navigatorInfo;
  const hasSlowConnection = connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g';

  return !connection?.saveData
    && !hasSlowConnection
    && (deviceMemory === undefined || deviceMemory >= 4)
    && (hardwareConcurrency === undefined || hardwareConcurrency >= 4);
}

const StaticSceneFallback = () => <div className="home-scene-fallback" aria-hidden="true" />;

/**
 * Public ambient layer. It keeps a quiet static fallback available while
 * the optional WebGL scene is unavailable, reduced, or too costly to render.
 */
export default function HomeAmbientScene({ tracks }: { tracks: Track[] }) {
  const { isResolved, prefersReducedMotion } = useMotionPreference();
  const [isDesktop, setIsDesktop] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setIsVisible(document.visibilityState !== 'hidden');
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const updateViewport = (matches = desktopQuery.matches) => setIsDesktop(matches);

    updateViewport();
    const handleViewportChange = (event: MediaQueryListEvent) => updateViewport(event.matches);
    desktopQuery.addEventListener('change', handleViewportChange);

    return () => desktopQuery.removeEventListener('change', handleViewportChange);
  }, []);

  const sceneNavigator = typeof navigator === 'undefined' ? {} : navigator as SceneNavigator;
  const canRenderScene = isResolved
    && isDesktop
    && !prefersReducedMotion
    && supportsAmbientScene(sceneNavigator);

  return (
    <>
      <StaticSceneFallback />
      {canRenderScene && (
        <SceneErrorBoundary>
          <Scene3D tracks={tracks} isVisible={isVisible} />
        </SceneErrorBoundary>
      )}
    </>
  );
}
