package com.hsbc.dsp.kyc.router;

import com.hsbc.dsp.kyc.orchestrator.KYCOrchestrator;
import com.hsbc.dsp.kyc.orchestrator.KYCOrchestrator.AnswerEntry;
import com.hsbc.dsp.kyc.orchestrator.KYCOrchestrator.StepSubmitResult;
import com.hsbc.dsp.sdui.model.ScreenPayload;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/kyc/sessions")
public class KYCController {

    private final KYCOrchestrator orchestrator;

    public KYCController(KYCOrchestrator orchestrator) {
        this.orchestrator = orchestrator;
    }

    /**
     * Get SDUI JSON for a specific KYC step.
     * Platform determined by x-platform header.
     * If stepId omitted, returns current incomplete step (resume behaviour).
     */
    @GetMapping("/{sessionId}/steps/{stepId}")
    public ResponseEntity<ScreenPayload> getStep(
            @PathVariable String sessionId,
            @PathVariable String stepId,
            @RequestHeader(value = "x-platform", defaultValue = "mobile") String platform,
            @AuthenticationPrincipal Jwt user) {
        var payload = orchestrator.getStep(sessionId, stepId, platform, user.getSubject());
        return ResponseEntity.ok()
            .header("Cache-Control", "no-store")   // KYC screens never cached
            .body(payload);
    }

    /**
     * Resume: returns SDUI JSON for the first incomplete step.
     * Used on app re-open or browser refresh.
     */
    @GetMapping("/{sessionId}/resume")
    public ResponseEntity<ScreenPayload> resume(
            @PathVariable String sessionId,
            @RequestHeader(value = "x-platform", defaultValue = "mobile") String platform,
            @AuthenticationPrincipal Jwt user) {
        var payload = orchestrator.resume(sessionId, platform, user.getSubject());
        return ResponseEntity.ok()
            .header("Cache-Control", "no-store")
            .body(payload);
    }

    /**
     * Submit answers for a step.
     * Returns next stepId + updated total, or COMPLETE, or INVALID with errors.
     */
    @PostMapping("/{sessionId}/steps/{stepId}/submit")
    public ResponseEntity<StepSubmitResult> submitStep(
            @PathVariable String sessionId,
            @PathVariable String stepId,
            @RequestBody StepSubmitRequest req,
            @AuthenticationPrincipal Jwt user) {
        var result = orchestrator.submitStep(sessionId, stepId, req.answers(), user.getSubject());

        int httpStatus = switch (result.status()) {
            case "INVALID" -> 422;
            default -> 200;
        };
        return ResponseEntity.status(httpStatus).body(result);
    }

    /**
     * Save & Exit — persists current answers without advancing.
     * Session can be resumed later.
     */
    @PostMapping("/{sessionId}/save")
    public ResponseEntity<Void> saveAndExit(
            @PathVariable String sessionId,
            @RequestBody StepSubmitRequest req,
            @AuthenticationPrincipal Jwt user) {
        orchestrator.submitStep(sessionId, "save-only", req.answers(), user.getSubject());
        return ResponseEntity.ok().build();
    }

    public record StepSubmitRequest(List<AnswerEntry> answers) {}
}
