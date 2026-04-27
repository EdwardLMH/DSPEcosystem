package com.hsbc.dsp.abtest;

import com.optimizely.ab.Optimizely;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
public class ABTestAllocator {

    private final Optimizely optimizely;

    public ABTestAllocator(Optimizely optimizely) {
        this.optimizely = optimizely;
    }

    /**
     * Allocates a user to a variant for the given experiment.
     * Returns empty if no active experiment or user not in audience.
     */
    public Optional<VariantAllocation> allocate(String userId, String experimentId) {
        try {
            String variationKey = optimizely.activate(experimentId, userId);
            if (variationKey == null) {
                return Optional.empty();
            }
            Map<String, Object> variables = optimizely.getAllFeatureVariables(experimentId, userId);
            String contentId = (String) variables.getOrDefault("contentId", null);
            return Optional.of(new VariantAllocation(experimentId, variationKey, contentId));
        } catch (Exception e) {
            // Circuit breaker: fall back to control on any Optimizely failure
            return Optional.empty();
        }
    }

    public record VariantAllocation(
        String experimentId,
        String variantId,
        String contentId
    ) {}
}
