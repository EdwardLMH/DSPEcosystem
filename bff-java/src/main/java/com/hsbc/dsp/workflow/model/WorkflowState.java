package com.hsbc.dsp.workflow.model;

public enum WorkflowState {
    DRAFT,
    PENDING_REVIEW,
    REJECTED,
    PENDING_PREVIEW,
    REJECTED_PREVIEW,
    APPROVED,
    PUBLISHED,
    SCHEDULED,
    UNPUBLISHED
}
