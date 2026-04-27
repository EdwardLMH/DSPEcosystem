package com.hsbc.dsp.personalisation;

import com.hsbc.dsp.cms.model.CmsSlot;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class PersonalisationEngine {

    private final SegmentService segmentService;

    public PersonalisationEngine(SegmentService segmentService) {
        this.segmentService = segmentService;
    }

    public Mono<SlotResolution> resolveSlot(SlotContext context) {
        return segmentService.getSegmentRules(context.segmentId(), context.slotId())
            .map(rules -> {
                if (rules == null || !rules.hasOverride()) {
                    return SlotResolution.defaultFor(context.slot());
                }
                return new SlotResolution(
                    rules.componentType(),
                    rules.contentId(),
                    rules.additionalProps()
                );
            });
    }

    public record SlotContext(
        String userId,
        String segmentId,
        String locale,
        String platform,
        String screenId,
        String slotId,
        CmsSlot slot
    ) {}

    public record SlotResolution(
        String componentType,
        String contentId,
        java.util.Map<String, Object> additionalProps
    ) {
        static SlotResolution defaultFor(CmsSlot slot) {
            return new SlotResolution(slot.defaultComponentType(), slot.defaultContentId(), java.util.Map.of());
        }
    }
}
