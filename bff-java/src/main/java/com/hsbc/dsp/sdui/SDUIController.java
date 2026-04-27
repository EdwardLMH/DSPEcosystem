package com.hsbc.dsp.sdui;

import com.hsbc.dsp.sdui.engine.SDUICompositionEngine;
import com.hsbc.dsp.sdui.engine.SDUICompositionEngine.CompositionRequest;
import com.hsbc.dsp.sdui.model.ScreenPayload;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1")
public class SDUIController {

    private final SDUICompositionEngine compositionEngine;

    public SDUIController(SDUICompositionEngine compositionEngine) {
        this.compositionEngine = compositionEngine;
    }

    @GetMapping("/screen/{screenId}")
    public Mono<ResponseEntity<ScreenPayload>> getScreen(
        @PathVariable String screenId,
        @RequestHeader("x-user-id") String userId,
        @RequestHeader("x-segment") String segmentId,
        @RequestHeader(value = "x-locale", defaultValue = "en-HK") String locale,
        @RequestHeader(value = "x-platform", defaultValue = "web") String platform,
        @RequestHeader(value = "x-sdui-version", defaultValue = "1.0") String sduiVersion
    ) {
        var request = new CompositionRequest(screenId, userId, segmentId, locale, platform, sduiVersion);
        return compositionEngine.compose(request)
            .map(payload -> ResponseEntity.ok()
                .header("x-sdui-schema-version", payload.schemaVersion())
                .header("x-sdui-cache-ttl", String.valueOf(payload.ttl()))
                .body(payload))
            .onErrorReturn(ResponseEntity.internalServerError().build());
    }
}
