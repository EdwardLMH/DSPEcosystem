package com.hsbc.dsp.analytics;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsEventForwarder {

    private final WebClient gcpPubSubClient;
    private final WebClient sensorDataClient;

    public AnalyticsEventForwarder(WebClient.Builder builder, AnalyticsProperties props) {
        this.gcpPubSubClient = builder.baseUrl(props.gcpEndpoint()).build();
        this.sensorDataClient = builder.baseUrl(props.sensorDataEndpoint()).build();
    }

    public Mono<Void> forwardBatch(List<Map<String, Object>> events, String region) {
        List<Map<String, Object>> sanitised = events.stream()
            .map(this::hashUserId)
            .toList();

        if ("CN".equalsIgnoreCase(region)) {
            return forwardToSensorData(sanitised);
        }
        return forwardToGcpPubSub(sanitised);
    }

    private Mono<Void> forwardToGcpPubSub(List<Map<String, Object>> events) {
        return gcpPubSubClient.post()
            .uri("/v1/projects/hsbc-dap/topics/dap-sdui-events:publish")
            .bodyValue(Map.of("messages", events))
            .retrieve()
            .bodyToMono(Void.class);
    }

    private Mono<Void> forwardToSensorData(List<Map<String, Object>> events) {
        return sensorDataClient.post()
            .uri("/sa?project=hsbc_cn")
            .bodyValue(events)
            .retrieve()
            .bodyToMono(Void.class);
    }

    private Map<String, Object> hashUserId(Map<String, Object> event) {
        var mutable = new java.util.HashMap<>(event);
        if (mutable.containsKey("userId")) {
            mutable.put("userId", sha256((String) mutable.get("userId")));
        }
        return mutable;
    }

    private String sha256(String input) {
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(input.getBytes()));
        } catch (Exception e) {
            return "hashed";
        }
    }
}
