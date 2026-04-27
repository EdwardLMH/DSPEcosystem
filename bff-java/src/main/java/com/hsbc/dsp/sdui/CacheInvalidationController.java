package com.hsbc.dsp.sdui;

import com.hsbc.dsp.sdui.engine.SDUICompositionEngine;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/internal/cache")
public class CacheInvalidationController {

    private final org.springframework.data.redis.core.RedisTemplate<String, String> redis;

    public CacheInvalidationController(
        org.springframework.data.redis.core.RedisTemplate<String, String> redis) {
        this.redis = redis;
    }

    @PostMapping("/invalidate")
    public Mono<Void> invalidate(@RequestBody InvalidationRequest request) {
        return Mono.fromRunnable(() -> {
            for (String contentId : request.contentIds()) {
                // Scan and delete all cache keys referencing this contentId
                var keys = redis.keys("sdui:*:" + contentId + ":*");
                if (keys != null && !keys.isEmpty()) {
                    redis.delete(keys);
                }
            }
        });
    }

    public record InvalidationRequest(List<String> contentIds, String publishedBy) {}
}
