package com.hsbc.dsp.sdui.engine;

import com.hsbc.dsp.abtest.ABTestAllocator;
import com.hsbc.dsp.cms.client.StripesContentClient;
import com.hsbc.dsp.cms.model.CmsScreenTemplate;
import com.hsbc.dsp.personalisation.PersonalisationEngine;
import com.hsbc.dsp.sdui.model.AnalyticsConfig;
import com.hsbc.dsp.sdui.model.LayoutNode;
import com.hsbc.dsp.sdui.model.ScreenMetadata;
import com.hsbc.dsp.sdui.model.ScreenPayload;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class SDUICompositionEngine {

    private final StripesContentClient cmsClient;
    private final PersonalisationEngine personalisationEngine;
    private final ABTestAllocator abTestAllocator;
    private final PropsInjector propsInjector;
    private final VersionNegotiator versionNegotiator;

    public SDUICompositionEngine(StripesContentClient cmsClient,
                                  PersonalisationEngine personalisationEngine,
                                  ABTestAllocator abTestAllocator,
                                  PropsInjector propsInjector,
                                  VersionNegotiator versionNegotiator) {
        this.cmsClient = cmsClient;
        this.personalisationEngine = personalisationEngine;
        this.abTestAllocator = abTestAllocator;
        this.propsInjector = propsInjector;
        this.versionNegotiator = versionNegotiator;
    }

    public Mono<ScreenPayload> compose(CompositionRequest request) {
        return cmsClient.getScreenTemplate(request.screenId(), request.platform())
            .flatMap(template -> resolveSlots(template, request))
            .map(nodes -> buildPayload(nodes, request));
    }

    private Mono<List<LayoutNode>> resolveSlots(CmsScreenTemplate template,
                                                 CompositionRequest request) {
        return Flux.fromIterable(template.slots())
            .flatMap(slot -> {
                var slotCtx = new PersonalisationEngine.SlotContext(
                    request.userId(), request.segmentId(), request.locale(),
                    request.platform(), request.screenId(), slot.slotId(), slot
                );

                return personalisationEngine.resolveSlot(slotCtx)
                    .flatMap(resolution -> {
                        // Check for active A/B experiment on this slot
                        if (slot.abTestEnabled() && slot.defaultContentId() != null) {
                            var allocation = abTestAllocator.allocate(request.userId(), slot.slotId());
                            if (allocation.isPresent()) {
                                var alloc = allocation.get();
                                return buildNode(alloc.contentId(), slot.slotId(),
                                    resolution.componentType(), request,
                                    alloc.variantId(), alloc.experimentId());
                            }
                        }
                        return buildNode(resolution.contentId(), slot.slotId(),
                            resolution.componentType(), request, null, null);
                    });
            })
            .collectList();
    }

    private Mono<LayoutNode> buildNode(String contentId, String slotId,
                                        String componentType, CompositionRequest request,
                                        String variantId, String experimentId) {
        return cmsClient.getContent(contentId, request.locale())
            .map(content -> {
                Map<String, Object> props = new HashMap<>(content.fields());
                propsInjector.inject(props, request);

                var analytics = new AnalyticsConfig(
                    componentType.toLowerCase() + "_viewed",
                    componentType.toLowerCase() + "_clicked",
                    slotId, variantId, experimentId, Map.of()
                );

                return new LayoutNode(componentType, slotId, props, null, null, analytics, null);
            });
    }

    private ScreenPayload buildPayload(List<LayoutNode> nodes, CompositionRequest request) {
        String schemaVersion = versionNegotiator.negotiate(request.clientSduiVersion());
        var root = new LayoutNode("ScrollContainer", "root",
            Map.of("scrollable", true), nodes, null, null, null);
        var meta = new ScreenMetadata(
            UUID.randomUUID().toString(),
            Instant.now().toString(),
            request.userId(),
            request.segmentId(),
            null, null
        );
        return new ScreenPayload(schemaVersion, request.screenId(), 300, null, root, meta);
    }

    public record CompositionRequest(
        String screenId,
        String userId,
        String segmentId,
        String locale,
        String platform,
        String clientSduiVersion
    ) {}
}
