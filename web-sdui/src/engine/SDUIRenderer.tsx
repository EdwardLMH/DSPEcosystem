import React, { useEffect, useRef } from 'react';
import { LayoutNode, AnalyticsConfig } from '../types/sdui';
import { ComponentRegistry } from './ComponentRegistry';
import { analyticsClient } from '../analytics/AnalyticsClient';

interface SDUIRendererProps {
  node: LayoutNode;
}

export function SDUIRenderer({ node }: SDUIRendererProps) {
  const Component = ComponentRegistry[node.type];

  if (!Component) {
    console.warn(`[SDUI] Unknown component type: "${node.type}" — rendering fallback`);
    if (node.fallback) return <SDUIRenderer node={node.fallback} />;
    return null;
  }

  const children = 'children' in node && node.children
    ? node.children.map(child => <SDUIRenderer key={child.id} node={child} />)
    : undefined;

  return (
    <AnalyticsWrapper config={node.analytics} componentId={node.id}>
      <Component {...node.props} id={node.id}>
        {children}
      </Component>
    </AnalyticsWrapper>
  );
}

function AnalyticsWrapper({
  config,
  componentId,
  children,
}: {
  config?: AnalyticsConfig;
  componentId: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (!config?.impressionEvent || fired.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fired.current) {
          fired.current = true;
          analyticsClient.fire(config.impressionEvent, {
            componentId,
            variantId: config.variantId,
            experimentId: config.experimentId,
            ...config.customProperties,
          });
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [config, componentId]);

  return <div ref={ref} data-component-id={componentId}>{children}</div>;
}
