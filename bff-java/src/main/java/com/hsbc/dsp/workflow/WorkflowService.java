package com.hsbc.dsp.workflow;

import com.hsbc.dsp.workflow.model.ContentWorkflowState;
import com.hsbc.dsp.workflow.model.WorkflowEvent;
import com.hsbc.dsp.workflow.model.WorkflowState;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class WorkflowService {

    private static final Logger log = LoggerFactory.getLogger(WorkflowService.class);
    private static final String STATE_KEY_PREFIX = "workflow:content:";

    private final RedisTemplate<String, ContentWorkflowState> redisTemplate;
    private final WorkflowNotificationService notificationService;
    private final WorkflowAuditLogger auditLogger;

    public WorkflowService(RedisTemplate<String, ContentWorkflowState> redisTemplate,
                           WorkflowNotificationService notificationService,
                           WorkflowAuditLogger auditLogger) {
        this.redisTemplate = redisTemplate;
        this.notificationService = notificationService;
        this.auditLogger = auditLogger;
    }

    public WorkflowEvent submit(String contentId, String makerUserId) {
        var state = getOrCreate(contentId, makerUserId);
        assertState(state, WorkflowState.DRAFT, WorkflowState.REJECTED, WorkflowState.REJECTED_PREVIEW);

        state.setState(WorkflowState.PENDING_REVIEW);
        state.setMakerUserId(makerUserId);
        state.setSubmittedAt(Instant.now());
        save(contentId, state);

        notificationService.notifyCheckers(contentId, makerUserId);
        auditLogger.log(contentId, makerUserId, "SUBMITTED_FOR_REVIEW", null);

        return new WorkflowEvent(contentId, WorkflowState.PENDING_REVIEW, makerUserId, Instant.now());
    }

    public WorkflowEvent approve(String contentId, String checkerUserId, String comment) {
        var state = getState(contentId);
        assertState(state, WorkflowState.PENDING_REVIEW);
        assertNotSameUser(state.getMakerUserId(), checkerUserId);

        state.setState(WorkflowState.PENDING_PREVIEW);
        state.setCheckerUserId(checkerUserId);
        state.setApprovedAt(Instant.now());
        save(contentId, state);

        auditLogger.log(contentId, checkerUserId, "APPROVED_PENDING_PREVIEW", comment);
        notificationService.notifyMaker(contentId, state.getMakerUserId(),
                "Content approved — preview link being generated");

        return new WorkflowEvent(contentId, WorkflowState.PENDING_PREVIEW, checkerUserId, Instant.now());
    }

    public WorkflowEvent approveAfterPreview(String contentId, String checkerUserId, String deviceInfo) {
        var state = getState(contentId);
        assertState(state, WorkflowState.PENDING_PREVIEW);
        assertNotSameUser(state.getMakerUserId(), checkerUserId);

        state.setState(WorkflowState.APPROVED);
        state.setPreviewApprovedAt(Instant.now());
        state.setPreviewApprovedDevice(deviceInfo);
        save(contentId, state);

        auditLogger.log(contentId, checkerUserId, "APPROVED_AFTER_DEVICE_PREVIEW", deviceInfo);
        notificationService.notifyMaker(contentId, state.getMakerUserId(),
                "Content approved on device — ready to publish");

        return new WorkflowEvent(contentId, WorkflowState.APPROVED, checkerUserId, Instant.now());
    }

    public WorkflowEvent reject(String contentId, String checkerUserId, String comment) {
        var state = getState(contentId);
        var currentState = state.getState();
        assertState(state, WorkflowState.PENDING_REVIEW, WorkflowState.PENDING_PREVIEW);

        var nextState = currentState == WorkflowState.PENDING_PREVIEW
                ? WorkflowState.REJECTED_PREVIEW : WorkflowState.REJECTED;
        state.setState(nextState);
        state.setRejectionComment(comment);
        save(contentId, state);

        auditLogger.log(contentId, checkerUserId, "REJECTED", comment);
        notificationService.notifyMakerRejected(contentId, state.getMakerUserId(), comment);

        return new WorkflowEvent(contentId, nextState, checkerUserId, Instant.now());
    }

    public ContentWorkflowState getState(String contentId) {
        var state = redisTemplate.opsForValue().get(STATE_KEY_PREFIX + contentId);
        if (state == null) throw new IllegalStateException("No workflow state for: " + contentId);
        return state;
    }

    private ContentWorkflowState getOrCreate(String contentId, String makerUserId) {
        var existing = redisTemplate.opsForValue().get(STATE_KEY_PREFIX + contentId);
        if (existing != null) return existing;
        var state = new ContentWorkflowState();
        state.setContentId(contentId);
        state.setState(WorkflowState.DRAFT);
        state.setMakerUserId(makerUserId);
        state.setCreatedAt(Instant.now());
        return state;
    }

    private void save(String contentId, ContentWorkflowState state) {
        redisTemplate.opsForValue().set(STATE_KEY_PREFIX + contentId, state);
    }

    private void assertState(ContentWorkflowState state, WorkflowState... allowed) {
        for (var s : allowed) if (state.getState() == s) return;
        throw new IllegalStateException(
                "Invalid transition from state: " + state.getState());
    }

    private void assertNotSameUser(String makerUserId, String checkerUserId) {
        if (makerUserId.equals(checkerUserId)) {
            throw new SecurityException("Maker cannot approve their own content.");
        }
    }
}
