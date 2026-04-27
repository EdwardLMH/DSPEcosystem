import Foundation

// MARK: - SDUI Models

struct SDUIScreenPayload: Codable {
    let schemaVersion: String
    let screen: String
    let metadata: ScreenMetadata
    let layout: SDUINode
}

struct ScreenMetadata: Codable {
    let sessionId: String
    let stepId: String
    let stepIndex: Int
    let totalSteps: Int
    let sectionTitle: String
    let platform: String
}

struct SDUINode: Codable {
    let type: String
    let id: String
    let props: [String: AnyCodable]?
    let children: [SDUINode]?
    let analytics: SDUIAnalytics?
}

struct SDUIAnalytics: Codable {
    let impressionEvent: String
    let componentId: String
    let customProperties: [String: String]?
}

// MARK: - Network DTOs

struct StartSessionResponse: Codable {
    let sessionId: String
    let totalSteps: Int
    let platform: String
}

struct SubmitRequest: Codable {
    let answers: [AnswerEntry]
}

struct AnswerEntry: Codable {
    let questionId: String
    let value: AnyCodable
}

struct SubmitResponse: Codable {
    let status: String
    let nextStepId: String?
    let totalSteps: Int?
    let sessionId: String?
    let validationErrors: [RawValidationError]?
}

struct RawValidationError: Codable {
    let questionId: String
    let message: String
}

// MARK: - AnyCodable (type-erased JSON value)

struct AnyCodable: Codable, @unchecked Sendable {
    let value: Any

    init(_ value: Any) { self.value = value }
    init(_ value: String)  { self.value = value }
    init(_ value: Int)     { self.value = value }
    init(_ value: Bool)    { self.value = value }
    init(_ value: Double)  { self.value = value }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let v = try? container.decode(Bool.self)   { self.value = v }
        else if let v = try? container.decode(Int.self)    { self.value = v }
        else if let v = try? container.decode(Double.self) { self.value = v }
        else if let v = try? container.decode(String.self) { self.value = v }
        else if let v = try? container.decode([AnyCodable].self) { self.value = v.map(\.value) }
        else if let v = try? container.decode([String: AnyCodable].self) {
            self.value = v.mapValues(\.value)
        } else {
            self.value = ""
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch value {
        case let v as Bool:   try container.encode(v)
        case let v as Int:    try container.encode(v)
        case let v as Double: try container.encode(v)
        case let v as String: try container.encode(v)
        case let v as [Any]:
            try container.encode(v.map { AnyCodable($0) })
        case let v as [String: Any]:
            try container.encode(v.mapValues { AnyCodable($0) })
        default:
            try container.encode(String(describing: value))
        }
    }

    var stringValue: String { value as? String ?? "" }
    var boolValue: Bool     { value as? Bool ?? false }
    var intValue: Int       { value as? Int ?? 0 }

    var optionsValue: [[String: String]] {
        guard let arr = value as? [[String: Any]] else { return [] }
        return arr.compactMap { dict in
            guard let v = dict["value"] as? String,
                  let l = dict["label"] as? String else { return nil }
            return ["value": v, "label": l]
        }
    }
}

// MARK: - KYC Reference Data

let KYC_COUNTRIES: [(iso2: String, name: String, flag: String, dialCode: String, phoneDigits: Int)] = [
    ("HK", "Hong Kong SAR",  "🇭🇰", "+852", 8),
    ("CN", "Mainland China", "🇨🇳", "+86",  11),
    ("SG", "Singapore",      "🇸🇬", "+65",  8),
    ("GB", "United Kingdom", "🇬🇧", "+44",  10),
    ("US", "United States",  "🇺🇸", "+1",   10),
    ("AU", "Australia",      "🇦🇺", "+61",  9),
    ("CA", "Canada",         "🇨🇦", "+1",   10),
    ("IN", "India",          "🇮🇳", "+91",  10),
    ("JP", "Japan",          "🇯🇵", "+81",  10),
    ("MY", "Malaysia",       "🇲🇾", "+60",  9),
    ("TW", "Taiwan",         "🇹🇼", "+886", 9),
    ("KR", "South Korea",    "🇰🇷", "+82",  10),
    ("DE", "Germany",        "🇩🇪", "+49",  11),
    ("FR", "France",         "🇫🇷", "+33",  9),
    ("AE", "UAE",            "🇦🇪", "+971", 9),
]

let HK_DISTRICTS = [
    ("CENTRAL_WESTERN", "Central & Western (中西區)"),
    ("EASTERN",         "Eastern (東區)"),
    ("SOUTHERN",        "Southern (南區)"),
    ("WAN_CHAI",        "Wan Chai (灣仔)"),
    ("KOWLOON_CITY",    "Kowloon City (九龍城)"),
    ("KWUN_TONG",       "Kwun Tong (觀塘)"),
    ("SHAM_SHUI_PO",    "Sham Shui Po (深水埗)"),
    ("WONG_TAI_SIN",    "Wong Tai Sin (黃大仙)"),
    ("YAU_TSIM_MONG",   "Yau Tsim Mong (油尖旺)"),
    ("SHA_TIN",         "Sha Tin (沙田)"),
    ("TAI_PO",          "Tai Po (大埔)"),
    ("NORTH",           "North (北區)"),
    ("ISLANDS",         "Islands (離島)"),
]

let OCCUPATIONS = [
    ("BANKING_FINANCE",    "Banking & Finance"),
    ("ACCOUNTING",         "Accounting & Auditing"),
    ("LEGAL",              "Legal & Compliance"),
    ("MEDICAL",            "Medical & Healthcare"),
    ("ENGINEERING",        "Engineering & Technology"),
    ("EDUCATION",          "Education"),
    ("REAL_ESTATE",        "Real Estate"),
    ("RETAIL_HOSPITALITY", "Retail & Hospitality"),
    ("GOVERNMENT",         "Government & Public Sector"),
    ("SELF_EMPLOYED",      "Self-employed / Freelance"),
    ("BUSINESS_OWNER",     "Business Owner"),
    ("INVESTMENT",         "Investment & Asset Management"),
    ("RETIRED",            "Retired"),
    ("STUDENT",            "Student"),
    ("OTHER",              "Other"),
]

let INCOME_BANDS = [
    ("BELOW_150K",  "Below HKD 150,000"),
    ("150K_300K",   "HKD 150,000 – 300,000"),
    ("300K_600K",   "HKD 300,000 – 600,000"),
    ("600K_1M",     "HKD 600,000 – 1,000,000"),
    ("1M_3M",       "HKD 1,000,000 – 3,000,000"),
    ("ABOVE_3M",    "Above HKD 3,000,000"),
]

let FUNDS_SOURCES = [
    ("EMPLOYMENT",   "Employment / Salary"),
    ("BUSINESS",     "Business Income"),
    ("INVESTMENT",   "Investment Returns"),
    ("INHERITANCE",  "Inheritance / Gift"),
    ("PROPERTY",     "Property Sale"),
    ("PENSION",      "Pension / Retirement Fund"),
    ("SAVINGS",      "Accumulated Savings"),
    ("OTHER",        "Other"),
]

let ACCOUNT_PURPOSES = [
    ("EVERYDAY_BANKING",      "Everyday banking & payments"),
    ("SAVINGS",               "Savings & deposits"),
    ("INVESTMENT",            "Investment & wealth management"),
    ("SALARY_RECEIPT",        "Salary / income receipt"),
    ("INTERNATIONAL_TRANSFER","International money transfers"),
    ("MORTGAGE",              "Mortgage repayments"),
]
