package com.hsbc.dsp.sdui.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ScreenPayload(
    String schemaVersion,
    String screen,
    int ttl,
    String integrity,
    LayoutNode layout,
    ScreenMetadata metadata
) {}

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ScreenMetadata(
    String requestId,
    String renderedAt,
    String userId,
    String segmentId,
    String variantId,
    String experimentId
) {}

@JsonInclude(JsonInclude.Include.NON_NULL)
public record LayoutNode(
    String type,
    String id,
    Map<String, Object> props,
    List<LayoutNode> children,
    VisibilityRules visibility,
    AnalyticsConfig analytics,
    LayoutNode fallback
) {}

@JsonInclude(JsonInclude.Include.NON_NULL)
public record VisibilityRules(
    List<String> segment,
    List<String> platform,
    List<String> locale,
    String minSdui,
    String condition
) {}

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AnalyticsConfig(
    String impressionEvent,
    String clickEvent,
    String componentId,
    String variantId,
    String experimentId,
    Map<String, String> customProperties
) {}

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ActionDefinition(
    String type,
    String destination,
    Map<String, String> params,
    Map<String, Object> payload
) {}
