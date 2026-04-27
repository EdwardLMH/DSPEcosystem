package com.hsbc.dsp.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ContentVersionService {

    private static final Logger log = LoggerFactory.getLogger(ContentVersionService.class);

    private final JdbcTemplate jdbc;
    private final S3Client s3;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;
    private final ContentRepositoryProperties props;

    public ContentVersionService(JdbcTemplate jdbc, S3Client s3,
                                  AuditLogService auditLogService,
                                  ObjectMapper objectMapper,
                                  ContentRepositoryProperties props) {
        this.jdbc = jdbc;
        this.s3 = s3;
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
        this.props = props;
    }

    /**
     * Called on every CMS publish event. Snapshots full content JSON to S3,
     * records version in DB, logs audit trail.
     */
    @Transactional
    public ContentVersion publishVersion(String contentId, String scope, String market,
                                          String contentType, Map<String, Object> fields,
                                          String authorId, String checkerId) {
        int nextVersion = nextVersionNumber(contentId);
        var versionId = UUID.randomUUID().toString();
        var contentHash = sha256(fields);
        var s3Key = buildS3Key(scope, market, contentId, nextVersion);

        // Persist full snapshot to S3
        uploadToS3(s3Key, contentId, nextVersion, fields, contentHash, authorId, checkerId);

        // Record in DB
        jdbc.update("""
            INSERT INTO content_versions
              (version_id, content_id, version_number, scope, market, content_type,
               status, content_hash, content_s3_key, fields_snapshot,
               author_id, checker_id, published_at, created_at, last_accessed_at)
            VALUES (?,?,?,?,?,?,?,?,?,?::jsonb,?,?,NOW(),NOW(),NOW())
            """,
            versionId, contentId, nextVersion, scope, market, contentType,
            "PUBLISHED", contentHash, s3Key, toJson(fields),
            authorId, checkerId
        );

        // Mark all previous versions as SUPERSEDED
        jdbc.update("""
            UPDATE content_versions SET status = 'SUPERSEDED'
            WHERE content_id = ? AND version_number < ? AND status = 'PUBLISHED'
            """, contentId, nextVersion);

        // Tag S3 object with metadata for lifecycle management
        tagS3Object(s3Key, market, contentType);

        auditLogService.log(contentId, versionId, checkerId, "CHECKER", "PUBLISHED", null, contentHash);
        log.info("Published content {}  version={} hash={}", contentId, nextVersion, contentHash);

        return getVersion(contentId, nextVersion);
    }

    public ContentVersion getCurrentPublished(String contentId) {
        return jdbc.queryForObject("""
            SELECT * FROM content_versions
            WHERE content_id = ? AND status = 'PUBLISHED'
            ORDER BY version_number DESC LIMIT 1
            """, this::mapRow, contentId);
    }

    public ContentVersion getVersion(String contentId, int versionNumber) {
        var version = jdbc.queryForObject("""
            SELECT * FROM content_versions
            WHERE content_id = ? AND version_number = ?
            """, this::mapRow, contentId, versionNumber);

        // Update last accessed timestamp (for archive eligibility tracking)
        jdbc.update("""
            UPDATE content_versions SET last_accessed_at = NOW()
            WHERE content_id = ? AND version_number = ?
            """, contentId, versionNumber);

        return version;
    }

    public List<ContentVersionSummary> listVersions(String contentId) {
        return jdbc.query("""
            SELECT version_id, content_id, version_number, status, scope, market,
                   author_id, checker_id, published_at, content_hash
            FROM content_versions WHERE content_id = ?
            ORDER BY version_number DESC
            """, this::mapSummaryRow, contentId);
    }

    public VersionDiff diff(String contentId, int fromVersion, int toVersion) {
        var from = getVersion(contentId, fromVersion);
        var to = getVersion(contentId, toVersion);
        return new VersionDiff(contentId, fromVersion, toVersion,
                computeDiff(from.fieldsSnapshot(), to.fieldsSnapshot()));
    }

    public ContentVersion restoreAsDraft(String contentId, int versionNumber, String makerId) {
        var source = getVersion(contentId, versionNumber);
        int nextVersion = nextVersionNumber(contentId);
        var versionId = UUID.randomUUID().toString();

        jdbc.update("""
            INSERT INTO content_versions
              (version_id, content_id, version_number, scope, market, content_type,
               status, content_hash, content_s3_key, fields_snapshot,
               author_id, created_at, last_accessed_at)
            VALUES (?,?,?,?,?,?,?,?,?,?::jsonb,?,NOW(),NOW())
            """,
            versionId, contentId, nextVersion, source.scope(), source.market(),
            source.contentType(), "DRAFT", null, null,
            toJson(source.fieldsSnapshot()), makerId
        );

        return getVersion(contentId, nextVersion);
    }

    public byte[] downloadSnapshot(String contentId, int versionNumber) {
        var version = jdbc.queryForObject(
            "SELECT content_s3_key FROM content_versions WHERE content_id=? AND version_number=?",
            (rs, i) -> rs.getString("content_s3_key"), contentId, versionNumber);
        if (version == null) throw new IllegalArgumentException("Version not found");

        var response = s3.getObject(GetObjectRequest.builder()
            .bucket(props.bucketName()).key(version).build());
        try {
            return response.readAllBytes();
        } catch (Exception e) {
            throw new RuntimeException("Failed to read S3 snapshot", e);
        }
    }

    private int nextVersionNumber(String contentId) {
        var max = jdbc.queryForObject(
            "SELECT COALESCE(MAX(version_number), 0) FROM content_versions WHERE content_id = ?",
            Integer.class, contentId);
        return (max == null ? 0 : max) + 1;
    }

    private void uploadToS3(String s3Key, String contentId, int version,
                              Map<String, Object> fields, String hash,
                              String authorId, String checkerId) {
        try {
            var snapshot = Map.of(
                "contentId", contentId,
                "version", version,
                "contentHash", hash,
                "publishedAt", Instant.now().toString(),
                "authorId", authorId,
                "checkerId", checkerId,
                "fields", fields
            );
            var json = objectMapper.writeValueAsBytes(snapshot);
            s3.putObject(PutObjectRequest.builder()
                    .bucket(props.bucketName())
                    .key(s3Key)
                    .contentType("application/json")
                    .serverSideEncryption(ServerSideEncryption.AES256)
                    .build(),
                RequestBody.fromBytes(json));
        } catch (Exception e) {
            throw new RuntimeException("S3 upload failed for " + s3Key, e);
        }
    }

    private void tagS3Object(String s3Key, String market, String contentType) {
        s3.putObjectTagging(PutObjectTaggingRequest.builder()
            .bucket(props.bucketName())
            .key(s3Key)
            .tagging(Tagging.builder().tagSet(
                Tag.builder().key("market").value(market != null ? market : "GLOBAL").build(),
                Tag.builder().key("content-type").value(contentType).build(),
                Tag.builder().key("publish-date").value(Instant.now().toString().substring(0, 10)).build(),
                Tag.builder().key("legal-hold").value("false").build()
            ).build())
            .build());
    }

    private String buildS3Key(String scope, String market, String contentId, int version) {
        var base = "global".equals(scope)
            ? "global/" : "markets/" + market + "/";
        var datePart = Instant.now().toString().substring(0, 7).replace("-", "/");
        return base + datePart + "/" + contentId + "/v" + version + ".json";
    }

    private String sha256(Map<String, Object> fields) {
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            var json = objectMapper.writeValueAsBytes(fields);
            return HexFormat.of().formatHex(digest.digest(json));
        } catch (Exception e) {
            return "error";
        }
    }

    private String toJson(Map<String, Object> fields) {
        try { return objectMapper.writeValueAsString(fields); }
        catch (Exception e) { return "{}"; }
    }

    private List<Map<String, Object>> computeDiff(Map<String, Object> from, Map<String, Object> to) {
        return to.entrySet().stream()
            .filter(e -> !e.getValue().equals(from.get(e.getKey())))
            .map(e -> Map.of("field", e.getKey(),
                "from", from.getOrDefault(e.getKey(), "<absent>"),
                "to", e.getValue()))
            .toList();
    }

    private ContentVersion mapRow(java.sql.ResultSet rs, int i) throws java.sql.SQLException {
        return new ContentVersion(
            rs.getString("version_id"), rs.getString("content_id"),
            rs.getInt("version_number"), rs.getString("scope"),
            rs.getString("market"), rs.getString("content_type"),
            rs.getString("status"), rs.getString("content_hash"),
            rs.getString("content_s3_key"), Map.of(),
            rs.getString("author_id"), rs.getString("checker_id"),
            rs.getTimestamp("published_at") != null ? rs.getTimestamp("published_at").toInstant() : null,
            rs.getTimestamp("created_at").toInstant()
        );
    }

    private ContentVersionSummary mapSummaryRow(java.sql.ResultSet rs, int i) throws java.sql.SQLException {
        return new ContentVersionSummary(
            rs.getString("version_id"), rs.getString("content_id"),
            rs.getInt("version_number"), rs.getString("status"),
            rs.getString("author_id"), rs.getString("checker_id"),
            rs.getTimestamp("published_at") != null ? rs.getTimestamp("published_at").toInstant() : null,
            rs.getString("content_hash")
        );
    }

    public record ContentVersion(String versionId, String contentId, int versionNumber,
                                  String scope, String market, String contentType,
                                  String status, String contentHash, String s3Key,
                                  Map<String, Object> fieldsSnapshot,
                                  String authorId, String checkerId,
                                  Instant publishedAt, Instant createdAt) {}

    public record ContentVersionSummary(String versionId, String contentId, int versionNumber,
                                         String status, String authorId, String checkerId,
                                         Instant publishedAt, String contentHash) {}

    public record VersionDiff(String contentId, int fromVersion, int toVersion,
                               List<Map<String, Object>> changes) {}
}
