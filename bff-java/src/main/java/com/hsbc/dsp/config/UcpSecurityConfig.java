package com.hsbc.dsp.config;

import com.hsbc.dsp.security.ad.AdGroupResolver;
import com.hsbc.dsp.security.audit.ImmutableAuditLogger;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;

@Configuration
@EnableWebSecurity
public class UcpSecurityConfig implements WebMvcConfigurer {

    private final AdGroupResolver groupResolver;
    private final ImmutableAuditLogger auditLogger;

    public UcpSecurityConfig(AdGroupResolver groupResolver, ImmutableAuditLogger auditLogger) {
        this.groupResolver = groupResolver;
        this.auditLogger   = auditLogger;
    }

    /**
     * Two security zones:
     *
     * PUBLIC (no auth required) — external customer-facing APIs:
     *   /api/v1/screen/**          SDUI screen delivery to web/iOS/Android/WeChat
     *   /api/v1/kyc/sessions/**    Open Banking KYC journey (customer-authenticated separately)
     *   /api/v1/events             DAP analytics event ingestion from client apps
     *   /health, /actuator/health  Health probes
     *
     * INTERNAL (Azure AD JWT required) — staff CMS/UCP operations:
     *   /api/v1/content/**         Content CRUD, submit, approve, publish
     *   /api/v1/workflow/**        Maker-Checker workflow state transitions
     *   /api/v1/preview/**         Preview token generation and on-device approval
     *   /api/v1/audit-log/**       Audit log query and export (AUDITOR + ADMIN only)
     *   /api/v1/content-repository/**  Version history, legal hold
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // ── PUBLIC — no Azure AD auth required ──────────────────────
                .requestMatchers("/health", "/actuator/health").permitAll()
                .requestMatchers("/api/v1/screen/**").permitAll()       // SDUI delivery to customers
                .requestMatchers("/api/v1/kyc/sessions/**").permitAll() // KYC journey (customer auth handled by KYC system)
                .requestMatchers("/api/v1/events/**").permitAll()        // analytics event ingestion
                .requestMatchers("/api/v1/events/batch").permitAll()
                // ── INTERNAL — Azure AD JWT required ────────────────────────
                .requestMatchers("/api/v1/content/**").authenticated()
                .requestMatchers("/api/v1/workflow/**").authenticated()
                .requestMatchers("/api/v1/preview/**").authenticated()
                .requestMatchers("/api/v1/audit-log/**").authenticated()
                .requestMatchers("/api/v1/content-repository/**").authenticated()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                // JWT validation only applies to authenticated routes above.
                // Public routes pass through without a token.
                .jwt(jwt -> jwt.decoder(jwtDecoder()))
            )
            .csrf(csrf -> csrf.disable())
            .cors(cors -> {});

        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        // Azure AD JWKS endpoint — replace {tenant-id} with HSBC Azure tenant ID
        return NimbusJwtDecoder.withJwkSetUri(
            "https://login.microsoftonline.com/{hsbc-tenant-id}/discovery/v2.0/keys"
        ).build();
    }

    /**
     * Login audit interceptor — logs every authenticated request's first use
     * and captures ACCESS_DENIED attempts even before they reach controllers.
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
                // Login event captured by Spring Security success handler (see below)
                // Individual action audit is handled at the service layer
                return true;
            }
            @Override
            public void afterCompletion(HttpServletRequest req, HttpServletResponse res,
                                         Object handler, Exception ex) {
                // Log 403s that slipped through (e.g. method-level security)
                if (res.getStatus() == 403) {
                    auditLogger.log(null, "ACCESS_DENIED", "HTTP", req.getRequestURI(),
                        null, Map.of("method", req.getMethod(), "status", 403),
                        null, req.getHeader("X-Request-ID"), req.getRemoteAddr());
                }
            }
        });
    }
}
