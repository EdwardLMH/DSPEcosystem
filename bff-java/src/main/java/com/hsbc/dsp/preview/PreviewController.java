package com.hsbc.dsp.preview;

import com.hsbc.dsp.sdui.engine.SDUICompositionEngine;
import com.hsbc.dsp.sdui.model.ComponentNode;
import com.hsbc.dsp.sdui.model.LayoutNode;
import com.hsbc.dsp.sdui.model.ScreenPayload;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/preview")
public class PreviewController {

    private final PreviewTokenService previewTokenService;
    private final SDUICompositionEngine compositionEngine;
    private final PublishService publishService;

    public PreviewController(PreviewTokenService previewTokenService,
                              SDUICompositionEngine compositionEngine,
                              PublishService publishService) {
        this.previewTokenService = previewTokenService;
        this.compositionEngine = compositionEngine;
        this.publishService = publishService;
    }

    /** Checker generates preview links after first approval. */
    @PostMapping("/generate")
    public ResponseEntity<PreviewTokenService.PreviewResponse> generate(
            @RequestBody GeneratePreviewRequest req,
            @AuthenticationPrincipal Jwt checker) {
        var response = previewTokenService.generatePreview(
                req.contentId(), req.screenId(), req.variantId(), checker.getSubject());
        return ResponseEntity.ok(response);
    }

    /**
     * Called by mobile app / WeChat Mini Program when it holds a preview token.
     * Returns preview SDUI JSON with PreviewModeBanner injected at top.
     */
    @GetMapping("/screen/{screenId}")
    public Mono<ResponseEntity<ScreenPayload>> previewScreen(
            @PathVariable String screenId,
            @RequestHeader("x-preview-token") String previewToken,
            @RequestHeader(value = "x-platform", defaultValue = "ios") String platform,
            @RequestHeader(value = "x-locale", defaultValue = "en-HK") String locale,
            @RequestHeader(value = "x-sdui-version", defaultValue = "2.3") String sduiVersion) {

        var config = previewTokenService.resolveToken(previewToken);
        var request = new SDUICompositionEngine.CompositionRequest(
                screenId, "preview-user", "preview", locale, platform, sduiVersion);

        return compositionEngine.compose(request)
                .map(payload -> injectPreviewBanner(payload, config))
                .map(payload -> ResponseEntity.ok()
                        .header("x-sdui-preview-mode", "true")
                        .header("Cache-Control", "no-store")
                        .body(payload));
    }

    /** Checker approves content after on-device preview. */
    @PostMapping("/{previewId}/approve")
    public ResponseEntity<Void> approveOnDevice(
            @PathVariable String previewId,
            @RequestHeader(value = "x-device-info", defaultValue = "unknown") String deviceInfo,
            @AuthenticationPrincipal Jwt checker) {
        previewTokenService.approveOnDevice(previewId, checker.getSubject(), deviceInfo);
        return ResponseEntity.ok().build();
    }

    /** Checker rejects after on-device preview. */
    @PostMapping("/{previewId}/reject")
    public ResponseEntity<Void> rejectOnDevice(
            @PathVariable String previewId,
            @RequestBody RejectPreviewRequest req,
            @AuthenticationPrincipal Jwt checker) {
        // Delegates to WorkflowService via PreviewTokenService config lookup
        previewTokenService.invalidate(previewId);
        return ResponseEntity.ok().build();
    }

    /** Final publish to production after APPROVED state. */
    @PostMapping("/{previewId}/publish")
    public ResponseEntity<Void> publish(
            @PathVariable String previewId,
            @RequestBody PublishRequest req,
            @AuthenticationPrincipal Jwt checker) {
        publishService.publish(previewId, req, checker.getSubject());
        previewTokenService.invalidate(previewId);
        return ResponseEntity.ok().build();
    }

    private ScreenPayload injectPreviewBanner(ScreenPayload payload,
                                               PreviewTokenService.PreviewConfig config) {
        var banner = new ComponentNode(
            "PreviewModeBanner",
            "preview-banner",
            Map.of(
                "message", "PREVIEW — Not live yet",
                "contentId", config.contentId(),
                "expiresAt", config.expiresAt().toString(),
                "approveAction", "/api/v1/preview/" + config.previewId() + "/approve",
                "rejectAction", "/api/v1/preview/" + config.previewId() + "/reject"
            ),
            null, null, null, null
        );

        // Prepend preview banner to root children
        var root = payload.layout();
        var children = new java.util.ArrayList<LayoutNode>();
        children.add(banner);
        if (root.children() != null) children.addAll(root.children());
        var newRoot = new LayoutNode(root.type(), root.id(), root.props(), children,
                root.visibility(), root.analytics(), root.fallback());
        return new ScreenPayload(payload.schemaVersion(), payload.screen(),
                payload.ttl(), payload.integrity(), newRoot, payload.metadata());
    }

    public record GeneratePreviewRequest(String contentId, String screenId, String variantId) {}
    public record RejectPreviewRequest(String comment) {}
    public record PublishRequest(String publishMode, String scheduledAt,
                                  java.util.List<String> channels, java.util.List<String> locales) {}
}
