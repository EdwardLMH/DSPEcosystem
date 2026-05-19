import { ScreenPayload } from '../types/sdui';

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  deepLink: string;
  assetUrl?: string;
  assetType?: string;
  score: number;
}

interface A2UIComponent {
  id?: string;
  type?: string;
  content?: Record<string, unknown>;
  action?: { type?: string; url?: string };
}

interface SDUIV2Component {
  componentId: string;
  componentType: string;
  content?: Record<string, unknown>;
  action?: { type?: string; url?: string; fallback?: Record<string, string> };
  analytics?: unknown;
  appearance?: Record<string, unknown>;
  visibility?: { visible?: boolean };
  governance?: { locked?: boolean };
}

export function a2uiToSearchResults(payload: unknown): SearchResult[] {
  const data = payload as any;
  const components: A2UIComponent[] = data?.a2ui?.components ?? data?.components ?? [];
  if (!Array.isArray(components)) return [];

  return components.map((component, index) => {
    const content = component.content ?? {};
    return {
      id: String(component.id ?? `a2ui-result-${index + 1}`),
      type: String(content.resultType ?? component.type ?? 'function'),
      title: String(content.title ?? ''),
      description: String(content.description ?? ''),
      icon: String(content.icon ?? ''),
      category: String(content.category ?? '功能入口'),
      deepLink: String(component.action?.url ?? ''),
      assetUrl: content.assetUrl ? String(content.assetUrl) : undefined,
      assetType: content.assetType ? String(content.assetType) : undefined,
      score: Number(content.score ?? 0),
    };
  }).filter(result => result.title && result.deepLink);
}

export function sduiV2ToLegacyScreen(payload: unknown): ScreenPayload {
  const data = payload as any;
  if (data?.contract !== 'HSBC_SDUI_V2' || !Array.isArray(data?.components)) {
    return data as ScreenPayload;
  }

  const componentMap = new Map<string, SDUIV2Component>(
    data.components.map((component: SDUIV2Component) => [component.componentId, component])
  );
  const childrenIds: string[] = data.layout?.slots?.[0]?.children ?? data.components.map((c: SDUIV2Component) => c.componentId);
  const children = childrenIds
    .map(id => componentMap.get(id))
    .filter((component): component is SDUIV2Component => Boolean(component))
    .map((component: SDUIV2Component) => ({
      id: component.componentId,
      instanceId: component.componentId,
      type: component.componentType,
      componentType: component.componentType,
      visible: component.visibility?.visible !== false,
      locked: component.governance?.locked === true,
      props: {
        ...(component.content ?? {}),
        ...(component.appearance ?? {}),
        ...(component.action?.type === 'DEEPLINK'
          ? { deepLink: component.action.url, fallback: component.action.fallback ?? {} }
          : {}),
        ...(component.action?.type === 'EXTERNAL_URL'
          ? { linkUrl: component.action.url }
          : {}),
        ...(component.analytics ? { analytics: component.analytics } : {}),
      },
    }));

  return {
    schemaVersion: data.governance?.sourceSchemaVersion ?? '3.0',
    metadata: {
      screenId: data.page?.pageId ?? data.page?.screen ?? '',
      version: data.governance?.version ?? 1,
      locale: data.runtime?.locale ?? 'en',
      platform: data.runtime?.platform ?? 'web',
      ttl: data.runtime?.ttl ?? 300,
      generatedAt: data.governance?.generatedAt ?? new Date().toISOString(),
    },
    layout: { children },
  } as ScreenPayload;
}
