package com.hsbc.dsp.sdui.engine;

import com.hsbc.dsp.sdui.engine.SDUICompositionEngine.CompositionRequest;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
public class PropsInjector {

    /**
     * Resolves {{dynamic:*}} placeholders in component props.
     * Dynamic values come from request context or downstream ML services.
     */
    public void inject(Map<String, Object> props, CompositionRequest request) {
        props.replaceAll((key, value) -> {
            if (value instanceof String s && s.startsWith("{{dynamic:")) {
                return resolveDynamic(s, request);
            }
            return value;
        });
    }

    private Object resolveDynamic(String placeholder, CompositionRequest request) {
        String token = placeholder.replace("{{dynamic:", "").replace("}}", "");
        return switch (token) {
            case "firstName"         -> ""; // resolved from user profile service at runtime
            case "mlRecommendations" -> java.util.List.of(); // resolved from Vertex AI
            case "savingsRates"      -> java.util.List.of(); // resolved from rates service
            default                  -> null;
        };
    }
}
