package com.hsbc.dsp.preview;

import com.hsbc.dsp.workflow.WorkflowService;
import com.hsbc.dsp.workflow.model.WorkflowState;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Service
public class PreviewTokenService {

    private static final String PREVIEW_KEY_PREFIX = "preview:";
    private static final Duration PREVIEW_TTL = Duration.ofHours(48);

    private final RedisTemplate<String, PreviewConfig> redisTemplate;
    private final WorkflowService workflowService;
    private final PreviewProperties props;
    private final QRCodeGenerator qrCodeGenerator;

    public PreviewTokenService(RedisTemplate<String, PreviewConfig> redisTemplate,
                                WorkflowService workflowService,
                                PreviewProperties props,
                                QRCodeGenerator qrCodeGenerator) {
        this.redisTemplate = redisTemplate;
        this.workflowService = workflowService;
        this.props = props;
        this.qrCodeGenerator = qrCodeGenerator;
    }

    public PreviewResponse generatePreview(String contentId, String screenId,
                                            String variantId, String checkerUserId) {
        var workflowState = workflowService.getState(contentId);
        if (workflowState.getState() != WorkflowState.PENDING_PREVIEW) {
            throw new IllegalStateException("Content must be in PENDING_PREVIEW state.");
        }

        var previewId = UUID.randomUUID().toString();
        var expiresAt = Instant.now().plus(PREVIEW_TTL);

        // Build signed JWT
        var key = Keys.hmacShaKeyFor(props.signingSecret().getBytes());
        var token = Jwts.builder()
            .subject(previewId)
            .claim("contentId", contentId)
            .claim("screenId", screenId)
            .claim("variantId", variantId)
            .claim("requestedBy", checkerUserId)
            .expiration(Date.from(expiresAt))
            .signWith(key)
            .compact();

        // Store preview config in Redis
        var config = new PreviewConfig(previewId, contentId, screenId, variantId,
                checkerUserId, Instant.now(), expiresAt);
        redisTemplate.opsForValue().set(PREVIEW_KEY_PREFIX + previewId, config, PREVIEW_TTL);

        // Generate QR codes for each channel
        var baseUrl = props.previewBaseUrl() + "/screen/" + screenId + "?pt=" + token;
        var iosDeepLink = "hsbc://preview?pt=" + token + "&screen=" + screenId;
        var wechatPath = "/preview/index?pt=" + token;

        return new PreviewResponse(
            previewId,
            baseUrl,
            qrCodeGenerator.generateBase64(iosDeepLink),      // iOS/Android QR
            qrCodeGenerator.generateBase64(baseUrl),           // Web QR
            qrCodeGenerator.generateBase64(wechatPath),        // WeChat Mini QR
            expiresAt
        );
    }

    public PreviewConfig resolveToken(String previewToken) {
        try {
            var key = Keys.hmacShaKeyFor(props.signingSecret().getBytes());
            var claims = Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(previewToken).getPayload();
            var previewId = claims.getSubject();
            var config = redisTemplate.opsForValue().get(PREVIEW_KEY_PREFIX + previewId);
            if (config == null) throw new PreviewExpiredException("Preview token not found or expired.");
            return config;
        } catch (Exception e) {
            throw new PreviewExpiredException("Invalid or expired preview token.");
        }
    }

    public void approveOnDevice(String previewId, String checkerUserId, String deviceInfo) {
        var config = redisTemplate.opsForValue().get(PREVIEW_KEY_PREFIX + previewId);
        if (config == null) throw new PreviewExpiredException("Preview session expired.");

        workflowService.approveAfterPreview(config.contentId(), checkerUserId, deviceInfo);
    }

    public void invalidate(String previewId) {
        redisTemplate.delete(PREVIEW_KEY_PREFIX + previewId);
    }

    public record PreviewConfig(
        String previewId,
        String contentId,
        String screenId,
        String variantId,
        String checkerUserId,
        Instant createdAt,
        Instant expiresAt
    ) {}

    public record PreviewResponse(
        String previewId,
        String previewUrl,
        String qrCodeIosBase64,
        String qrCodeWebBase64,
        String qrCodeWechatBase64,
        Instant expiresAt
    ) {}

    public static class PreviewExpiredException extends RuntimeException {
        public PreviewExpiredException(String msg) { super(msg); }
    }
}
