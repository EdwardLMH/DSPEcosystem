const SDUI_V2_SCHEMA = {
  schemaVersion: '2.0',
  contract: 'HSBC_SDUI_V2',
  description: 'Canonical governed SDUI contract for CMS-authored and agent-assisted screens.',
  topLevel: ['schemaVersion', 'contract', 'page', 'runtime', 'layout', 'components', 'governance'],
  componentShape: {
    componentId: 'stable instance id',
    componentType: 'registered renderer component type',
    content: 'text, media, table data, FAQ content and other display data',
    action: 'single primary behavior such as deeplink, navigation or external URL',
    analytics: 'provider, events and event properties',
    appearance: 'colors, spacing and non-content presentation props',
    visibility: 'channel/platform targeting and hidden output behavior',
    governance: 'lock status, source, version and review metadata',
  },
};

const ACTION_COMPONENTS = new Set([
  'DEPOSIT_OPEN_CTA',
  'CONTACT_RM_CTA',
  'PRIMARY_CTA',
  'SECONDARY_CTA',
  'QUICK_ACCESS_ENTRY',
]);

const APPEARANCE_FIELDS = new Set([
  'backgroundColor',
  'textColor',
  'badgeColor',
  'height',
  'sticky',
  'layout',
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function inferAction(type, props = {}) {
  if (!ACTION_COMPONENTS.has(type) && !props.deepLink && !props.linkUrl) return undefined;
  if (props.deepLink) {
    return {
      type: 'DEEPLINK',
      url: props.deepLink,
      fallback: props.fallback || {},
    };
  }
  if (props.linkUrl) {
    return {
      type: 'EXTERNAL_URL',
      url: props.linkUrl,
    };
  }
  return undefined;
}

function splitProps(type, props = {}) {
  const content = {};
  const appearance = {};
  const reserved = new Set(['deepLink', 'fallback', 'analytics']);

  Object.entries(props || {}).forEach(([key, value]) => {
    if (reserved.has(key)) return;
    if (APPEARANCE_FIELDS.has(key)) {
      appearance[key] = value;
      return;
    }
    content[key] = value;
  });

  return {
    content,
    action: inferAction(type, props),
    analytics: props.analytics,
    appearance,
  };
}

function mergeV2Props(component) {
  return {
    ...(component.content || {}),
    ...(component.appearance || {}),
    ...(component.action?.type === 'DEEPLINK'
      ? { deepLink: component.action.url, fallback: component.action.fallback || {} }
      : {}),
    ...(component.action?.type === 'EXTERNAL_URL'
      ? { linkUrl: component.action.url }
      : {}),
    ...(component.analytics ? { analytics: component.analytics } : {}),
  };
}

function legacyNodeToV2(node, index = 0, page = {}) {
  const componentId = node.instanceId || node.id || `${node.type}-${index + 1}`;
  const split = splitProps(node.type, node.props || {});
  const outputChannels = node.props?.outputChannels;
  const webOnly = node.props?.webOnly === true;

  return {
    componentId,
    componentType: node.type,
    content: split.content,
    ...(split.action ? { action: split.action } : {}),
    ...(split.analytics ? { analytics: split.analytics } : {}),
    ...(Object.keys(split.appearance).length ? { appearance: split.appearance } : {}),
    visibility: {
      visible: node.visible !== false,
      hiddenInOutput: node.visible === false || node.props?.hidden === true,
      channels: Array.isArray(outputChannels)
        ? outputChannels
        : webOnly
          ? ['WEB_STANDARD', 'web-sdui']
          : ['SDUI', 'WEB_STANDARD', 'WEB_WECHAT'],
    },
    governance: {
      locked: node.locked === true,
      sourceSchemaVersion: page.schemaVersion || 'legacy',
      sourceInstanceId: node.instanceId || null,
    },
  };
}

function legacyPayloadToV2(payload, context = {}) {
  const children = payload?.layout?.children || payload?.slices || [];
  const pageId = payload.pageId || payload.metadata?.pageId || context.pageId || 'unknown';
  const components = children.map((node, index) => legacyNodeToV2(node, index, payload));

  return {
    schemaVersion: '2.0',
    contract: 'HSBC_SDUI_V2',
    page: {
      pageId,
      pageName: payload.metadata?.pageName || payload.name || context.pageName || pageId,
      screen: payload.screen || context.screen || pageId,
      market: payload.metadata?.market || context.market || null,
      supportedLocales: payload.metadata?.supportedLocales || payload.supportedLocales || [],
    },
    runtime: {
      locale: payload.metadata?.locale || payload.locale || context.locale || 'en',
      textDir: payload.metadata?.textDir || context.textDir || 'ltr',
      platform: payload.metadata?.platform || context.platform || 'all',
      channel: payload.metadata?.channel || context.channel || 'SDUI',
      ttl: payload.ttl || context.ttl || 300,
      a11y: payload.metadata?.a11y || context.a11y || {},
      analytics: payload.metadata?.analytics || payload.analytics || null,
    },
    layout: {
      layoutType: payload.layout?.type || 'SCROLL',
      slots: [
        {
          slotId: 'main',
          role: 'body',
          children: components.map(component => component.componentId),
        },
      ],
    },
    components,
    governance: {
      transformation: 'legacy-layout-children-to-sdui-v2',
      sourceSchemaVersion: payload.schemaVersion || 'legacy',
      generatedAt: payload.metadata?.generatedAt || new Date().toISOString(),
      publishedAt: payload.metadata?.publishedAt || payload.publishedAt || null,
      version: payload.metadata?.version || payload.version || 1,
    },
  };
}

function v2PayloadToLegacy(v2) {
  const componentMap = new Map((v2.components || []).map(component => [component.componentId, component]));
  const mainSlot = (v2.layout?.slots || [])[0] || { children: [] };
  const children = mainSlot.children
    .map(componentId => componentMap.get(componentId))
    .filter(Boolean)
    .map(component => ({
      instanceId: component.componentId,
      type: component.componentType,
      visible: component.visibility?.visible !== false,
      locked: component.governance?.locked === true,
      props: mergeV2Props(component),
    }));

  return {
    schemaVersion: v2.governance?.sourceSchemaVersion || '3.0',
    pageId: v2.page?.pageId,
    screen: v2.page?.screen,
    ttl: v2.runtime?.ttl || 300,
    metadata: {
      pageId: v2.page?.pageId,
      pageName: v2.page?.pageName,
      locale: v2.runtime?.locale,
      textDir: v2.runtime?.textDir,
      platform: v2.runtime?.platform,
      channel: v2.runtime?.channel,
      supportedLocales: v2.page?.supportedLocales || [],
      analytics: v2.runtime?.analytics || undefined,
      version: v2.governance?.version,
      publishedAt: v2.governance?.publishedAt,
      generatedAt: v2.governance?.generatedAt,
      a11y: v2.runtime?.a11y,
    },
    layout: {
      type: v2.layout?.layoutType || 'SCROLL',
      children,
    },
  };
}

function searchResultsToA2UI(query, results = []) {
  return {
    schemaVersion: '0.1',
    protocol: 'A2UI_LIKE',
    intent: {
      type: 'AI_SEARCH_RESULTS',
      query,
    },
    surface: {
      componentType: 'SEARCH_RESULTS_PANEL',
      title: `Search results for ${query}`,
    },
    components: results.map((result, index) => ({
      id: `search-result-${result.id || index + 1}`,
      type: 'QUICK_ACCESS_ENTRY',
      content: {
        title: result.title,
        description: result.description,
        icon: result.icon,
        category: result.category,
        score: result.score,
        resultType: result.type,
        assetUrl: result.assetUrl,
        assetType: result.assetType,
      },
      action: {
        type: result.assetUrl ? 'EXTERNAL_URL' : 'DEEPLINK',
        url: result.deepLink,
      },
      analytics: {
        provider: 'default',
        event: 'ai_search_result_tapped',
        properties: {
          result_id: result.id,
          result_type: result.type,
          result_rank: index + 1,
        },
      },
    })),
  };
}

function validateA2UI(a2ui) {
  const errors = [];
  if (!a2ui || typeof a2ui !== 'object') errors.push('payload must be an object');
  if (a2ui && !Array.isArray(a2ui.components)) errors.push('components must be an array');
  (a2ui?.components || []).forEach((component, index) => {
    if (!component.id) errors.push(`components[${index}].id is required`);
    if (!component.type) errors.push(`components[${index}].type is required`);
    if (component.action && component.action.type === 'DEEPLINK' && !component.action.url) {
      errors.push(`components[${index}].action.url is required for deeplink`);
    }
  });
  return { valid: errors.length === 0, errors };
}

function a2uiToSDUIV2(a2ui, context = {}) {
  const validation = validateA2UI(a2ui);
  if (!validation.valid) {
    const error = new Error('Invalid A2UI payload');
    error.details = validation.errors;
    throw error;
  }

  return {
    schemaVersion: '2.0',
    contract: 'HSBC_SDUI_V2',
    page: {
      pageId: context.pageId || 'agent-generated-ui',
      pageName: context.pageName || 'Agent Generated UI',
      screen: context.screen || 'agent_generated_ui',
      market: context.market || null,
      supportedLocales: context.supportedLocales || [],
    },
    runtime: {
      locale: context.locale || 'en',
      textDir: context.textDir || 'ltr',
      platform: context.platform || 'all',
      channel: context.channel || 'SDUI',
      ttl: context.ttl || 60,
      a11y: context.a11y || {},
      analytics: context.analytics || null,
    },
    layout: {
      layoutType: 'SCROLL',
      slots: [
        {
          slotId: 'main',
          role: 'body',
          children: a2ui.components.map(component => component.id),
        },
      ],
    },
    components: a2ui.components.map(component => ({
      componentId: component.id,
      componentType: component.type,
      content: component.content || {},
      ...(component.action ? { action: component.action } : {}),
      ...(component.analytics ? { analytics: component.analytics } : {}),
      visibility: {
        visible: true,
        hiddenInOutput: false,
        channels: ['SDUI', 'WEB_STANDARD', 'WEB_WECHAT'],
      },
      governance: {
        locked: true,
        sourceSchemaVersion: a2ui.schemaVersion || 'A2UI_LIKE',
        source: 'AI_AGENT',
      },
    })),
    governance: {
      transformation: 'a2ui-like-to-sdui-v2',
      sourceSchemaVersion: a2ui.schemaVersion || 'A2UI_LIKE',
      generatedAt: new Date().toISOString(),
      publishedAt: null,
      version: 1,
    },
  };
}

module.exports = {
  SDUI_V2_SCHEMA,
  legacyPayloadToV2,
  v2PayloadToLegacy,
  searchResultsToA2UI,
  validateA2UI,
  a2uiToSDUIV2,
};
