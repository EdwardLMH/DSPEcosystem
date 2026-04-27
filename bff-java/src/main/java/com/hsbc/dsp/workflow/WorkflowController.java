package com.hsbc.dsp.workflow;

import com.hsbc.dsp.workflow.model.ContentWorkflowState;
import com.hsbc.dsp.workflow.model.WorkflowEvent;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/workflow")
public class WorkflowController {

    private final WorkflowService workflowService;

    public WorkflowController(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @PostMapping("/content/{contentId}/submit")
    public ResponseEntity<WorkflowEvent> submit(
            @PathVariable String contentId,
            @AuthenticationPrincipal Jwt maker) {
        var event = workflowService.submit(contentId, maker.getSubject());
        return ResponseEntity.ok(event);
    }

    @PostMapping("/content/{contentId}/approve")
    public ResponseEntity<WorkflowEvent> approve(
            @PathVariable String contentId,
            @AuthenticationPrincipal Jwt checker,
            @RequestBody(required = false) ApprovalRequest req) {
        var event = workflowService.approve(contentId, checker.getSubject(),
                req != null ? req.comment() : null);
        return ResponseEntity.ok(event);
    }

    @PostMapping("/content/{contentId}/reject")
    public ResponseEntity<WorkflowEvent> reject(
            @PathVariable String contentId,
            @AuthenticationPrincipal Jwt checker,
            @RequestBody RejectionRequest req) {
        var event = workflowService.reject(contentId, checker.getSubject(), req.comment());
        return ResponseEntity.ok(event);
    }

    @GetMapping("/content/{contentId}/state")
    public ResponseEntity<ContentWorkflowState> getState(@PathVariable String contentId) {
        return ResponseEntity.ok(workflowService.getState(contentId));
    }

    public record ApprovalRequest(String comment) {}
    public record RejectionRequest(String comment) {}
}
