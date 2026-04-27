package com.hsbc.dsp.cms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CmsContent(
    String id,
    String contentType,
    String locale,
    Map<String, Object> fields,
    CmsContentMeta meta
) {}

@JsonIgnoreProperties(ignoreUnknown = true)
public record CmsContentMeta(
    String publishedAt,
    String lastReviewedDate,
    String authorCredential,
    List<String> eligibleSegments,
    String experimentId,
    String controlContentId,
    String variantContentId
) {}

@JsonIgnoreProperties(ignoreUnknown = true)
public record CmsScreenTemplate(
    String screenId,
    String platform,
    List<CmsSlot> slots
) {}

@JsonIgnoreProperties(ignoreUnknown = true)
public record CmsSlot(
    String slotId,
    String defaultComponentType,
    String defaultContentId,
    boolean personalisationEnabled,
    boolean abTestEnabled
) {}
