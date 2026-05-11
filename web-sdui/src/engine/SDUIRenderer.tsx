import React, { useEffect, useRef } from 'react';
import { LayoutNode, AnalyticsConfig } from '../types/sdui';
import { ComponentRegistry } from './ComponentRegistry';
import { analyticsClient } from '../analytics/AnalyticsClient';
import { useSDUIContext } from '../context/SDUIContext';

interface SDUIRendererProps {
  node: LayoutNode;
}

export function SDUIRenderer({ node }: SDUIRendererProps) {
  const { a11y, textDir } = useSDUIContext();
  const anyNode = node as any;
  const Component = ComponentRegistry[anyNode.type];

  if (!Component) {
    console.warn(`[SDUI] Unknown component type: "${anyNode.type}" — rendering fallback`);
    if (anyNode.fallback) return <SDUIRenderer node={anyNode.fallback} />;
    return null;
  }

  const children = anyNode.children
    ? (anyNode.children as LayoutNode[]).map((child: LayoutNode) => (
        <SDUIRenderer key={(child as any).id} node={child} />
      ))
    : undefined;

  // Merge server-provided a11y props (a11yLabel, a11yHint) into aria attributes
  const props = anyNode.props ?? {};
  const ariaLabel = props.a11yLabel as string | undefined;
  const ariaHint  = props.a11yHint  as string | undefined;

  return (
    <AnalyticsWrapper config={anyNode.analytics} componentId={anyNode.id}>
      <div
        dir={textDir}
        aria-label={ariaLabel}
        aria-describedby={ariaHint ? `hint-${anyNode.id}` : undefined}
        data-component-id={anyNode.id}
        data-reduce-motion={a11y.reduceMotion ? 'true' : undefined}
      >
        {ariaHint && (
          <span id={`hint-${anyNode.id}`} className="sr-only">{ariaHint}</span>
        )}
        <Component {...props} id={anyNode.id}>
          {children}
        </Component>
      </div>
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
  const ref   = useRef<HTMLDivElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (!(config as any)?.impressionEvent || fired.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fired.current) {
          fired.current = true;
          analyticsClient.fire((config as any).impressionEvent, {
            componentId,
            variantId: (config as any).variantId,
            experimentId: (config as any).experimentId,
            ...(config as any).customProperties,
          });
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [config, componentId]);

  return <>{children}</>;
}
