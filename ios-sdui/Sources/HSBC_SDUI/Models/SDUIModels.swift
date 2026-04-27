// SDUIModels.swift
// HSBC SDUI iOS Renderer
// Models conforming to the SDUI JSON schema v1

import Foundation

// MARK: - Screen Payload

/// Root payload returned by the BFF SDUI endpoint.
public struct ScreenPayload: Codable {
    public let schemaVersion: String
    public let screen: String
    public let ttl: Int                  // seconds until payload is considered stale
    public let integrity: String         // SHA-256 hex of the canonical JSON body
    public let layout: LayoutNode
    public let metadata: ScreenMetadata

    enum CodingKeys: String, CodingKey {
        case schemaVersion = "schema_version"
        case screen, ttl, integrity, layout, metadata
    }
}

// MARK: - Screen Metadata

public struct ScreenMetadata: Codable {
    public let requestId: String
    public let renderedAt: String        // ISO-8601
    public let userId: String
    public let segmentId: String
    public let variantId: String?
    public let experimentId: String?

    enum CodingKeys: String, CodingKey {
        case requestId   = "request_id"
        case renderedAt  = "rendered_at"
        case userId      = "user_id"
        case segmentId   = "segment_id"
        case variantId   = "variant_id"
        case experimentId = "experiment_id"
    }
}

// MARK: - Layout Node

public enum LayoutNodeType: String, Codable {
    case container
    case component
}

public struct LayoutNode: Codable {
    public let type: LayoutNodeType
    public let id: String
    public let componentType: String     // e.g. "promo_banner", "quick_action_grid"
    public let props: [String: AnyCodable]
    public let children: [LayoutNode]?
    public let analytics: AnalyticsConfig?
    public let visibility: VisibilityRules?

    enum CodingKeys: String, CodingKey {
        case type, id
        case componentType = "component_type"
        case props, children, analytics, visibility
    }
}

// MARK: - Analytics Config

public struct AnalyticsConfig: Codable {
    public let impressionEvent: String
    public let clickEvent: String?
    public let componentId: String
    public let variantId: String?
    public let customProperties: [String: AnyCodable]?

    enum CodingKeys: String, CodingKey {
        case impressionEvent  = "impression_event"
        case clickEvent       = "click_event"
        case componentId      = "component_id"
        case variantId        = "variant_id"
        case customProperties = "custom_properties"
    }
}

// MARK: - Action Definition

public enum ActionType: String, Codable {
    case NAVIGATE
    case DEEP_LINK
    case API_CALL
    case MODAL
    case TRACK
    case SHARE
}

public struct ActionDefinition: Codable {
    public let type: ActionType
    public let destination: String?
    public let params: [String: AnyCodable]?
    public let payload: [String: AnyCodable]?
}

// MARK: - Visibility Rules

public struct VisibilityRules: Codable {
    public let segment: String?
    public let platform: String?
    public let locale: String?
    public let minSdui: String?

    enum CodingKeys: String, CodingKey {
        case segment, platform, locale
        case minSdui = "min_sdui"
    }
}

// MARK: - AnyCodable

/// A type-erased Codable wrapper that can hold arbitrary JSON values
/// (Bool, Int, Double, String, [Any], [String: Any], or null).
public struct AnyCodable: Codable {
    public let value: Any?

    public init(_ value: Any?) {
        self.value = value
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()

        if container.decodeNil() {
            self.value = nil
        } else if let bool = try? container.decode(Bool.self) {
            self.value = bool
        } else if let int = try? container.decode(Int.self) {
            self.value = int
        } else if let double = try? container.decode(Double.self) {
            self.value = double
        } else if let string = try? container.decode(String.self) {
            self.value = string
        } else if let array = try? container.decode([AnyCodable].self) {
            self.value = array.map { $0.value }
        } else if let dict = try? container.decode([String: AnyCodable].self) {
            self.value = dict.mapValues { $0.value }
        } else {
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "AnyCodable: unsupported JSON type"
            )
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch value {
        case nil:
            try container.encodeNil()
        case let bool as Bool:
            try container.encode(bool)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        case let array as [Any?]:
            let wrapped = array.map { AnyCodable($0) }
            try container.encode(wrapped)
        case let dict as [String: Any?]:
            let wrapped = dict.mapValues { AnyCodable($0) }
            try container.encode(wrapped)
        default:
            let context = EncodingError.Context(
                codingPath: encoder.codingPath,
                debugDescription: "AnyCodable: value \(String(describing: value)) is not encodable"
            )
            throw EncodingError.invalidValue(value as Any, context)
        }
    }
}

extension AnyCodable: Equatable {
    public static func == (lhs: AnyCodable, rhs: AnyCodable) -> Bool {
        switch (lhs.value, rhs.value) {
        case (nil, nil):                                return true
        case (let l as Bool, let r as Bool):            return l == r
        case (let l as Int, let r as Int):              return l == r
        case (let l as Double, let r as Double):        return l == r
        case (let l as String, let r as String):        return l == r
        default:                                        return false
        }
    }
}

extension AnyCodable: ExpressibleByNilLiteral {
    public init(nilLiteral: ()) { self.value = nil }
}

extension AnyCodable: ExpressibleByStringLiteral {
    public init(stringLiteral value: String) { self.value = value }
}

extension AnyCodable: ExpressibleByIntegerLiteral {
    public init(integerLiteral value: Int) { self.value = value }
}

extension AnyCodable: ExpressibleByBooleanLiteral {
    public init(booleanLiteral value: Bool) { self.value = value }
}

// MARK: - Convenience helpers on AnyCodable

public extension AnyCodable {
    var stringValue: String? { value as? String }
    var intValue: Int? { value as? Int }
    var doubleValue: Double? { value as? Double }
    var boolValue: Bool? { value as? Bool }
    var dictValue: [String: Any?]? { value as? [String: Any?] }
    var arrayValue: [Any?]? { value as? [Any?] }
}
