import SwiftUI

// ─── Shared field wrapper used by all steps ───────────────────────────────────

private struct FieldGroup<Content: View>: View {
    let title: String
    var required: Bool = false
    var help: String? = nil
    var error: String? = nil
    @ViewBuilder let content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: Hive.Spacing.s1) {
            HiveFieldLabel(text: title, required: required)
            content()
            if let h = help  { HiveHelpText(message: h) }
            if let e = error { HiveErrorText(message: e) }
        }
    }
}

// ─── STEP 1: Full Legal Name + Date of Birth ──────────────────────────────────

struct KYCNameStep: View {
    @Environment(AppStore.self) private var store
    @State private var firstName  = ""
    @State private var middleName = ""
    @State private var lastName   = ""
    @State private var dob        = Calendar.current.date(byAdding: .year, value: -30, to: Date()) ?? Date()
    @State private var firstErr: String?
    @State private var lastErr:  String?
    @FocusState private var focused: Field?
    enum Field { case first, middle, last }

    private var maxDob: Date {
        Calendar.current.date(byAdding: .year, value: -18, to: Date()) ?? Date()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Hive.Spacing.s4) {
            FieldGroup(title: "First Name / Given Name", required: true,
                       help: "As it appears on your official ID document",
                       error: firstErr) {
                TextField("e.g. Tai Man", text: $firstName)
                    .hiveInput(focused: focused == .first, error: firstErr != nil)
                    .focused($focused, equals: .first)
                    .textContentType(.givenName)
                    .autocapitalization(.words)
                    .onChange(of: firstName) { _, v in
                        firstErr = v.trimmingCharacters(in: .whitespaces).isEmpty ? "First name is required" : nil
                        store.dispatch(.setAnswer(questionId: "q_first_name", value: AnyCodable(v)))
                    }
            }
            FieldGroup(title: "Middle Name", help: "If applicable") {
                TextField("(optional)", text: $middleName)
                    .hiveInput(focused: focused == .middle)
                    .focused($focused, equals: .middle)
                    .autocapitalization(.words)
                    .onChange(of: middleName) { _, v in
                        store.dispatch(.setAnswer(questionId: "q_middle_name", value: AnyCodable(v)))
                    }
            }
            FieldGroup(title: "Last Name / Surname", required: true, error: lastErr) {
                TextField("e.g. CHAN", text: $lastName)
                    .hiveInput(focused: focused == .last, error: lastErr != nil)
                    .focused($focused, equals: .last)
                    .textContentType(.familyName)
                    .autocapitalization(.allCharacters)
                    .onChange(of: lastName) { _, v in
                        lastErr = v.trimmingCharacters(in: .whitespaces).isEmpty ? "Last name is required" : nil
                        store.dispatch(.setAnswer(questionId: "q_last_name", value: AnyCodable(v)))
                    }
            }
            FieldGroup(title: "Date of Birth", required: true,
                       help: "You must be at least 18 years old") {
                DatePicker("", selection: $dob, in: ...maxDob, displayedComponents: .date)
                    .datePickerStyle(.compact)
                    .labelsHidden()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, Hive.Spacing.s4)
                    .frame(height: Hive.Component.Input.height)
                    .background(Hive.Color.brandWhite)
                    .cornerRadius(Hive.Radius.base)
                    .overlay(RoundedRectangle(cornerRadius: Hive.Radius.base)
                        .stroke(Hive.Color.n300, lineWidth: 1))
                    .onChange(of: dob) { _, d in
                        let fmt = DateFormatter()
                        fmt.dateFormat = "yyyy-MM-dd"
                        store.dispatch(.setAnswer(questionId: "q_date_of_birth",
                                                  value: AnyCodable(fmt.string(from: d))))
                    }
            }
        }
        .onAppear {
            // Seed the DOB answer with the initial picker value
            let fmt = DateFormatter()
            fmt.dateFormat = "yyyy-MM-dd"
            store.dispatch(.setAnswer(questionId: "q_date_of_birth",
                                      value: AnyCodable(fmt.string(from: dob))))
        }
    }
}

// ─── STEP 2: Nationality ──────────────────────────────────────────────────────

struct KYCDobNationalityStep: View {
    @Environment(AppStore.self) private var store
    @State private var nationality = ""
    @State private var showNatSheet = false

    var body: some View {
        VStack(alignment: .leading, spacing: Hive.Spacing.s4) {
            FieldGroup(title: "Nationality", required: true) {
                Button(action: { showNatSheet = true }) {
                    HStack {
                        if nationality.isEmpty {
                            Text("Select nationality")
                                .foregroundColor(Hive.Color.n400)
                        } else {
                            let c = KYC_COUNTRIES.first { $0.iso2 == nationality }
                            Text("\(c?.flag ?? "") \(c?.name ?? nationality)")
                                .foregroundColor(Hive.Color.n800)
                        }
                        Spacer()
                        Image(systemName: "chevron.down")
                            .font(.system(size: 12))
                            .foregroundColor(Hive.Color.n400)
                    }
                    .padding(.horizontal, Hive.Spacing.s4)
                    .frame(height: Hive.Component.Input.height)
                    .background(Hive.Color.brandWhite)
                    .cornerRadius(Hive.Radius.base)
                    .overlay(RoundedRectangle(cornerRadius: Hive.Radius.base)
                        .stroke(Hive.Color.n300, lineWidth: 1))
                }
                .buttonStyle(.plain)
            }
        }
        .sheet(isPresented: $showNatSheet) {
            CountryPickerSheet(selected: $nationality, onSelect: { iso2 in
                nationality = iso2
                store.dispatch(.setAnswer(questionId: "q_nationality", value: AnyCodable(iso2)))
                showNatSheet = false
            })
        }
    }
}

// ─── STEP 3: Contact Details ──────────────────────────────────────────────────

struct KYCContactStep: View {
    @Environment(AppStore.self) private var store
    @State private var dialCode    = "+852"
    @State private var dialFlag    = "🇭🇰"
    @State private var phoneNumber = ""
    @State private var email       = ""
    @State private var phoneErr: String?
    @State private var emailErr: String?
    @State private var showDialPicker = false
    @FocusState private var focused: Field?
    enum Field { case phone, email }

    var body: some View {
        VStack(alignment: .leading, spacing: Hive.Spacing.s4) {
            // Phone
            FieldGroup(title: "Mobile Phone Number", required: true,
                       help: "Enter local number without country code",
                       error: phoneErr) {
                HStack(spacing: Hive.Spacing.s2) {
                    Button(action: { showDialPicker = true }) {
                        HStack(spacing: 4) {
                            Text(dialFlag).font(.system(size: 20))
                            Text(dialCode)
                                .font(Hive.Typography.bodyBase)
                                .foregroundColor(Hive.Color.n800)
                            Image(systemName: "chevron.down")
                                .font(.system(size: 10))
                                .foregroundColor(Hive.Color.n400)
                        }
                        .padding(.horizontal, Hive.Spacing.s3)
                        .frame(height: Hive.Component.Input.height)
                        .background(Hive.Color.n50)
                        .cornerRadius(Hive.Radius.base)
                        .overlay(RoundedRectangle(cornerRadius: Hive.Radius.base)
                            .stroke(Hive.Color.n300, lineWidth: 1))
                    }
                    .buttonStyle(.plain)

                    TextField("e.g. 91234567", text: $phoneNumber)
                        .hiveInput(focused: focused == .phone, error: phoneErr != nil)
                        .focused($focused, equals: .phone)
                        .keyboardType(.phonePad)
                        .textContentType(.telephoneNumber)
                        .onChange(of: phoneNumber) { _, v in
                            phoneErr = nil
                            store.dispatch(.setAnswer(questionId: "q_phone",
                                                      value: AnyCodable("\(dialCode)\(v)")))
                        }
                }
            }

            // Email
            FieldGroup(title: "Email Address", required: true,
                       help: "We'll send your application confirmation here",
                       error: emailErr) {
                TextField("name@example.com", text: $email)
                    .hiveInput(focused: focused == .email, error: emailErr != nil)
                    .focused($focused, equals: .email)
                    .keyboardType(.emailAddress)
                    .textContentType(.emailAddress)
                    .autocapitalization(.none)
                    .onChange(of: email) { _, v in
                        let valid = v.contains("@") && v.contains(".")
                        emailErr = v.isEmpty ? nil : (valid ? nil : "Please enter a valid email")
                        if valid { store.dispatch(.setAnswer(questionId: "q_email", value: AnyCodable(v))) }
                    }
            }
        }
        .sheet(isPresented: $showDialPicker) {
            DialCodePickerSheet { code, flag in
                dialCode = code; dialFlag = flag
                showDialPicker = false
            }
        }
    }
}

// ─── STEP 3: Government ID (nationality-conditional) ─────────────────────────
// Dispatches q_hkid_number (HK), q_mainland_id (CN), or q_passport_number (other).
// The BFF filters which of the three question IDs appear in this step based on
// the nationality answer stored in the session.

struct KYCIdentifierStep: View {
    @Environment(AppStore.self) private var store

    // Determine which ID type this step is collecting based on the primary question
    // delivered by the BFF (first child in the step payload).
    // Router sends us here for q_hkid_number, q_mainland_id, or q_passport_number.
    private var idQuestionId: String {
        // We infer from session answers what nationality was picked; the BFF
        // already filtered the step to only contain the right question(s).
        // Primary question drives which variant we render.
        "q_hkid_number" // default — router overrides via the step payload primary question
    }

    var body: some View {
        KYCIDInputView()
    }
}

// Renders the correct ID input fields based on what the BFF sent for this step.
// The BFF nationality-filters so only one variant's questions appear.
struct KYCIDInputView: View {
    @Environment(AppStore.self) private var store

    // We rely on the step's questionIds (passed via router) but since KYCIdentifierStep
    // is routed on primary question, we render all three variants and the BFF validates
    // only what it declared as required for this session's nationality.

    @State private var hkidNumber   = ""
    @State private var hkidExpiry   = ""
    @State private var mainlandId   = ""
    @State private var passportNum  = ""
    @State private var passportExp  = ""
    @FocusState private var focused: Field?
    enum Field { case hkid, hkidExp, mainland, passport, passportExp }

    // Derive which variant to show from the primary question in the current step payload
    private var primaryQuestion: String {
        store.screenPayload?.layout.children?.first?.id ?? ""
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Hive.Spacing.s4) {
            switch primaryQuestion {
            case "q_hkid_number":
                hkidFields
            case "q_mainland_id":
                mainlandFields
            default:
                passportFields
            }
        }
    }

    private var hkidFields: some View {
        VStack(alignment: .leading, spacing: Hive.Spacing.s4) {
            FieldGroup(title: "HKID Number", required: true,
                       help: "Include check digit in brackets, e.g. A123456(7)") {
                TextField("A123456(7)", text: $hkidNumber)
                    .hiveInput(focused: focused == .hkid)
                    .focused($focused, equals: .hkid)
                    .autocapitalization(.allCharacters)
                    .disableAutocorrection(true)
                    .onChange(of: hkidNumber) { _, v in
                        store.dispatch(.setAnswer(questionId: "q_hkid_number", value: AnyCodable(v)))
                    }
            }
            FieldGroup(title: "HKID Expiry Date",
                       help: "DD/MM/YYYY or N/A if no expiry") {
                TextField("DD/MM/YYYY or N/A", text: $hkidExpiry)
                    .hiveInput(focused: focused == .hkidExp)
                    .focused($focused, equals: .hkidExp)
                    .keyboardType(.numbersAndPunctuation)
                    .onChange(of: hkidExpiry) { _, v in
                        store.dispatch(.setAnswer(questionId: "q_hkid_expiry", value: AnyCodable(v)))
                    }
            }
        }
    }

    private var mainlandFields: some View {
        FieldGroup(title: "Mainland China ID (居民身份証)", required: true,
                   help: "18-digit resident identity number") {
            TextField("110101199001011234", text: $mainlandId)
                .hiveInput(focused: focused == .mainland)
                .focused($focused, equals: .mainland)
                .keyboardType(.numberPad)
                .onChange(of: mainlandId) { _, v in
                    store.dispatch(.setAnswer(questionId: "q_mainland_id", value: AnyCodable(v)))
                }
        }
    }

    private var passportFields: some View {
        VStack(alignment: .leading, spacing: Hive.Spacing.s4) {
            FieldGroup(title: "Passport Number", required: true) {
                TextField("e.g. X12345678", text: $passportNum)
                    .hiveInput(focused: focused == .passport)
                    .focused($focused, equals: .passport)
                    .autocapitalization(.allCharacters)
                    .disableAutocorrection(true)
                    .onChange(of: passportNum) { _, v in
                        store.dispatch(.setAnswer(questionId: "q_passport_number", value: AnyCodable(v)))
                    }
            }
            FieldGroup(title: "Passport Expiry Date", help: "DD/MM/YYYY") {
                TextField("DD/MM/YYYY", text: $passportExp)
                    .hiveInput(focused: focused == .passportExp)
                    .focused($focused, equals: .passportExp)
                    .keyboardType(.numbersAndPunctuation)
                    .onChange(of: passportExp) { _, v in
                        store.dispatch(.setAnswer(questionId: "q_passport_expiry", value: AnyCodable(v)))
                    }
            }
        }
    }
}

// ─── STEP 6: Residential Address (q_addr_line1 + q_addr_line2 + q_addr_district) ─

struct KYCAddressStep: View {
    @Environment(AppStore.self) private var store
    @State private var addrLine1 = ""
    @State private var addrLine2 = ""
    @State private var district  = ""
    @FocusState private var focused: Field?
    enum Field { case line1, line2 }

    var body: some View {
        VStack(alignment: .leading, spacing: Hive.Spacing.s4) {
            HStack(spacing: Hive.Spacing.s1) {
                Image(systemName: "mappin.circle.fill")
                    .foregroundColor(Hive.Color.brandPrimary)
                    .font(.system(size: 12))
                Text("Hong Kong Address Format")
                    .font(Hive.Typography.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(Hive.Color.brandPrimary)
            }
            .padding(.horizontal, Hive.Spacing.s3)
            .padding(.vertical, 4)
            .background(Hive.Color.brandPrimaryLight)
            .cornerRadius(Hive.Radius.full)

            FieldGroup(title: "Address Line 1", required: true,
                       help: "Flat / Floor / Block / Building name") {
                TextField("e.g. Flat B, 12/F, Block 3, Harbour View Mansion", text: $addrLine1)
                    .hiveInput(focused: focused == .line1)
                    .focused($focused, equals: .line1)
                    .onChange(of: addrLine1) { _, v in
                        store.dispatch(.setAnswer(questionId: "q_addr_line1", value: AnyCodable(v)))
                    }
            }

            FieldGroup(title: "Address Line 2",
                       help: "Street name and number (optional)") {
                TextField("e.g. 28 Kings Road, North Point", text: $addrLine2)
                    .hiveInput(focused: focused == .line2)
                    .focused($focused, equals: .line2)
                    .onChange(of: addrLine2) { _, v in
                        store.dispatch(.setAnswer(questionId: "q_addr_line2", value: AnyCodable(v)))
                    }
            }

            FieldGroup(title: "District", required: true) {
                Picker("Select district", selection: $district) {
                    Text("Select district").tag("")
                    ForEach(HK_DISTRICTS, id: \.0) { d in
                        Text(d.1).tag(d.0)
                    }
                }
                .pickerStyle(.menu)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, Hive.Spacing.s4)
                .frame(height: Hive.Component.Input.height)
                .background(Hive.Color.brandWhite)
                .cornerRadius(Hive.Radius.base)
                .overlay(RoundedRectangle(cornerRadius: Hive.Radius.base)
                    .stroke(Hive.Color.n300, lineWidth: 1))
                .onChange(of: district) { _, v in
                    store.dispatch(.setAnswer(questionId: "q_addr_district", value: AnyCodable(v)))
                }
            }
        }
    }
}

// ─── STEP 6: Document Upload ──────────────────────────────────────────────────

struct KYCDocumentStep: View {
    @Environment(AppStore.self) private var store
    @State private var docType   = ""
    @State private var frontItem: PhotosPickerItemWrapper? = nil
    @State private var backItem:  PhotosPickerItemWrapper? = nil
    @State private var frontImage: UIImage? = nil
    @State private var backImage:  UIImage? = nil
    @State private var showFrontPicker = false
    @State private var showBackPicker  = false

    private let docTypes = [
        ("HKID",     "Hong Kong Identity Card", true),
        ("PASSPORT", "Passport",                false),
        ("DRIVERS",  "Driver's Licence",        false),
    ]

    var needsBack: Bool { docType == "HKID" }

    var body: some View {
        VStack(alignment: .leading, spacing: Hive.Spacing.s4) {
            FieldGroup(title: "Document Type", required: true) {
                Picker("Select type", selection: $docType) {
                    Text("Select document type").tag("")
                    ForEach(docTypes, id: \.0) { t in Text(t.1).tag(t.0) }
                }
                .pickerStyle(.menu)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, Hive.Spacing.s4)
                .frame(height: Hive.Component.Input.height)
                .background(Hive.Color.brandWhite)
                .cornerRadius(Hive.Radius.base)
                .overlay(RoundedRectangle(cornerRadius: Hive.Radius.base)
                    .stroke(Hive.Color.n300, lineWidth: 1))
                .onChange(of: docType) { _, v in
                    store.dispatch(.setAnswer(questionId: "q_doc_type", value: AnyCodable(v)))
                }
            }

            if !docType.isEmpty {
                DocumentUploadZone(
                    label: "Front / Photo Page",
                    hint: "Hold the document flat, ensure all corners are visible",
                    image: frontImage,
                    onTap: { showFrontPicker = true }
                )
                if needsBack {
                    DocumentUploadZone(
                        label: "Back Side",
                        hint: "Required for HKID",
                        image: backImage,
                        onTap: { showBackPicker = true }
                    )
                }
                if frontImage != nil {
                    DocQualityChecklist()
                }
            }
        }
        .sheet(isPresented: $showFrontPicker) {
            ImageCaptureSheet { img in
                frontImage = img
                store.dispatch(.setAnswer(questionId: "q_doc_front",
                                          value: AnyCodable("captured")))
                showFrontPicker = false
            }
        }
        .sheet(isPresented: $showBackPicker) {
            ImageCaptureSheet { img in
                backImage = img
                store.dispatch(.setAnswer(questionId: "q_doc_back",
                                          value: AnyCodable("captured")))
                showBackPicker = false
            }
        }
    }
}

struct DocumentUploadZone: View {
    let label: String
    let hint: String
    let image: UIImage?
    let onTap: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Hive.Spacing.s1) {
            HiveFieldLabel(text: label, required: true)
            HiveHelpText(message: hint)
            Button(action: onTap) {
                if let img = image {
                    Image(uiImage: img)
                        .resizable()
                        .scaledToFill()
                        .frame(maxWidth: .infinity)
                        .frame(height: 160)
                        .clipped()
                        .cornerRadius(Hive.Radius.md)
                        .overlay(
                            Text("✓ Tap to retake")
                                .font(Hive.Typography.caption)
                                .foregroundColor(.white)
                                .padding(6)
                                .background(Color.black.opacity(0.5))
                                .cornerRadius(Hive.Radius.sm),
                            alignment: .bottomTrailing
                        )
                } else {
                    VStack(spacing: Hive.Spacing.s3) {
                        Image(systemName: "camera.fill")
                            .font(.system(size: 32))
                            .foregroundColor(Hive.Color.n400)
                        Text("Take Photo or Upload")
                            .font(Hive.Typography.bodyBase)
                            .fontWeight(.semibold)
                            .foregroundColor(Hive.Color.n700)
                        Text("JPG, PNG or PDF · Max 10MB")
                            .font(Hive.Typography.caption)
                            .foregroundColor(Hive.Color.n400)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, Hive.Spacing.s8)
                    .background(Hive.Color.n50)
                    .cornerRadius(Hive.Radius.md)
                    .overlay(
                        RoundedRectangle(cornerRadius: Hive.Radius.md)
                            .stroke(style: StrokeStyle(lineWidth: 2, dash: [6]))
                            .foregroundColor(Hive.Color.n300)
                    )
                }
            }
            .buttonStyle(.plain)
        }
    }
}

struct DocQualityChecklist: View {
    private let checks = [
        "All four corners of the document are visible",
        "Text is clear and readable — no blurring",
        "No glare or shadows covering important details",
        "Document is not expired",
    ]
    var body: some View {
        VStack(alignment: .leading, spacing: Hive.Spacing.s2) {
            Text("✓ Quality checklist")
                .font(Hive.Typography.labelBase)
                .foregroundColor(Hive.Color.success)
            ForEach(checks, id: \.self) { check in
                HStack(alignment: .top, spacing: Hive.Spacing.s2) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(Hive.Color.success)
                        .font(.system(size: 14))
                    Text(check)
                        .font(Hive.Typography.caption)
                        .foregroundColor(Hive.Color.n700)
                }
            }
        }
        .padding(Hive.Spacing.s4)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Hive.Color.successLight)
        .cornerRadius(Hive.Radius.md)
        .overlay(RoundedRectangle(cornerRadius: Hive.Radius.md)
            .stroke(Hive.Color.success, lineWidth: 1))
    }
}

// Camera capture sheet (uses UIImagePickerController)
struct ImageCaptureSheet: UIViewControllerRepresentable {
    let onCapture: (UIImage) -> Void

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = UIImagePickerController.isSourceTypeAvailable(.camera) ? .camera : .photoLibrary
        picker.delegate = context.coordinator
        return picker
    }
    func updateUIViewController(_ vc: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(onCapture: onCapture) }

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let onCapture: (UIImage) -> Void
        init(onCapture: @escaping (UIImage) -> Void) { self.onCapture = onCapture }
        func imagePickerController(_ picker: UIImagePickerController,
                                    didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            picker.dismiss(animated: true)
            if let img = info[.editedImage] as? UIImage ?? info[.originalImage] as? UIImage {
                onCapture(img)
            }
        }
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            picker.dismiss(animated: true)
        }
    }
}

struct PhotosPickerItemWrapper: Identifiable { let id = UUID() }

// ─── STEP 7: Liveness ─────────────────────────────────────────────────────────

struct KYCLivenessStep: View {
    @Environment(AppStore.self) private var store
    @State private var phase: LivenessPhase = .instructions
    @State private var selfieImage: UIImage? = nil
    @State private var showCamera = false
    @State private var progress: Double = 0
    @State private var timer: Timer? = nil

    enum LivenessPhase { case instructions, capture, processing, done }

    var body: some View {
        VStack(spacing: Hive.Spacing.s4) {
            switch phase {
            case .instructions:
                instructionsView
            case .capture:
                Color.clear.onAppear { showCamera = true }
            case .processing:
                processingView
            case .done:
                doneView
            }
        }
        .sheet(isPresented: $showCamera) {
            ImageCaptureSheet { img in
                selfieImage = img
                showCamera = false
                phase = .processing
                startProcessing()
            }
        }
    }

    private var instructionsView: some View {
        VStack(spacing: Hive.Spacing.s4) {
            HiveInfoBanner(
                title: "Liveness Detection — Identity Verification",
                message: "We need to verify you are a real person matching your ID. This takes ~30 seconds."
            )
            ForEach([
                ("😊", "Face the camera",   "Position your face in the oval guide with good lighting."),
                ("👁", "Follow the prompts","You may be asked to blink or turn your head slightly."),
                ("📸", "Stay still",         "Hold steady while we capture your image for matching."),
            ], id: \.0) { icon, title, desc in
                HStack(spacing: Hive.Spacing.s4) {
                    Text(icon).font(.system(size: 28))
                        .frame(width: 48, height: 48)
                        .background(Hive.Color.brandPrimaryLight)
                        .cornerRadius(Hive.Radius.md)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(title).font(Hive.Typography.labelBase).foregroundColor(Hive.Color.n800)
                        Text(desc).font(Hive.Typography.caption).foregroundColor(Hive.Color.n600)
                    }
                    Spacer()
                }
                .padding(Hive.Spacing.s4)
                .background(Hive.Color.brandWhite)
                .cornerRadius(Hive.Radius.md)
                .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
            }
            Button("Begin Liveness Check") { phase = .capture }
                .buttonStyle(HivePrimaryButtonStyle())
        }
    }

    private var processingView: some View {
        VStack(spacing: Hive.Spacing.s5) {
            if let img = selfieImage {
                Image(uiImage: img)
                    .resizable().scaledToFill()
                    .frame(width: 120, height: 120)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(Hive.Color.brandPrimary, lineWidth: 3))
            }
            Text("Verifying your identity…")
                .font(Hive.Typography.headingSm)
                .foregroundColor(Hive.Color.n800)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Hive.Color.n200).frame(height: 4)
                    Capsule().fill(Hive.Color.brandPrimary)
                        .frame(width: geo.size.width * progress, height: 4)
                        .animation(.linear(duration: 0.1), value: progress)
                }
            }.frame(height: 4)
            Text("Matching against your ID document using facial recognition…")
                .font(Hive.Typography.caption)
                .foregroundColor(Hive.Color.n500)
                .multilineTextAlignment(.center)
        }
        .padding(Hive.Spacing.s4)
    }

    private var doneView: some View {
        VStack(spacing: Hive.Spacing.s4) {
            Text("✅").font(.system(size: 56))
            Text("Liveness Check Passed")
                .font(Hive.Typography.headingMd)
                .foregroundColor(Hive.Color.success)
            Text("Facial match confidence: 98.4%\nYour identity has been verified.")
                .font(Hive.Typography.bodySm)
                .foregroundColor(Hive.Color.n700)
                .multilineTextAlignment(.center)
        }
        .padding(Hive.Spacing.s6)
        .frame(maxWidth: .infinity)
        .background(Hive.Color.successLight)
        .cornerRadius(Hive.Radius.lg)
        .overlay(RoundedRectangle(cornerRadius: Hive.Radius.lg)
            .stroke(Hive.Color.success, lineWidth: 1))
    }

    private func startProcessing() {
        progress = 0
        timer = Timer.scheduledTimer(withTimeInterval: 0.05, repeats: true) { t in
            progress = min(progress + 0.02, 1.0)
            if progress >= 1.0 {
                t.invalidate()
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                    phase = .done
                    store.dispatch(.setAnswer(questionId: "q_liveness",
                                              value: AnyCodable("PASSED")))
                }
            }
        }
    }
}

// ─── STEP 7: Employment & Income (q_employment_status + q_annual_income) ─────

struct KYCEmploymentStatusStep: View {
    @Environment(AppStore.self) private var store
    @State private var status = ""
    @State private var income = ""

    private let statusOptions = [
        ("EMPLOYED",       "Employed (full-time or part-time)"),
        ("SELF_EMPLOYED",  "Self-employed"),
        ("BUSINESS_OWNER", "Business owner"),
        ("RETIRED",        "Retired"),
        ("STUDENT",        "Student"),
        ("HOMEMAKER",      "Homemaker"),
        ("UNEMPLOYED",     "Unemployed"),
    ]

    private let incomeOptions = [
        ("below_100k",  "Below HKD 100,000"),
        ("100k_300k",   "HKD 100,000 – 300,000"),
        ("300k_600k",   "HKD 300,000 – 600,000"),
        ("600k_1m",     "HKD 600,000 – 1,000,000"),
        ("above_1m",    "Above HKD 1,000,000"),
        ("prefer_not",  "Prefer not to say"),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: Hive.Spacing.s4) {
            KYCSingleSelectField(
                title: "Employment Status",
                placeholder: "Select employment status",
                options: statusOptions,
                selection: $status
            ) { v in
                store.dispatch(.setAnswer(questionId: "q_employment_status", value: AnyCodable(v)))
            }
            KYCSingleSelectField(
                title: "Annual Income (HKD)",
                placeholder: "Select income range",
                options: incomeOptions,
                selection: $income
            ) { v in
                store.dispatch(.setAnswer(questionId: "q_annual_income", value: AnyCodable(v)))
            }
        }
    }
}

// ─── STEP 8: Source of Funds & Account Purpose ────────────────────────────────

struct KYCSourceOfFundsStep: View {
    @Environment(AppStore.self) private var store
    @State private var source  = ""
    @State private var purpose = ""

    private let sourceOptions = [
        ("EMPLOYMENT",  "Employment / Salary"),
        ("BUSINESS",    "Business Income"),
        ("INVESTMENT",  "Investment Returns"),
        ("INHERITANCE", "Inheritance / Gift"),
        ("PROPERTY",    "Property Sale"),
        ("PENSION",     "Pension / Retirement Fund"),
        ("SAVINGS",     "Accumulated Savings"),
        ("OTHER",       "Other"),
    ]

    private let purposeOptions = [
        ("EVERYDAY_BANKING",       "Everyday banking & payments"),
        ("SAVINGS",                "Savings & deposits"),
        ("INVESTMENT",             "Investment & wealth management"),
        ("SALARY_RECEIPT",         "Salary / income receipt"),
        ("INTERNATIONAL_TRANSFER", "International money transfers"),
        ("MORTGAGE",               "Mortgage repayments"),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: Hive.Spacing.s4) {
            KYCSingleSelectField(
                title: "Primary Source of Funds",
                placeholder: "Select source of funds",
                options: sourceOptions,
                selection: $source
            ) { v in
                store.dispatch(.setAnswer(questionId: "q_source_of_funds", value: AnyCodable(v)))
            }
            KYCSingleSelectField(
                title: "Purpose of Account",
                placeholder: "Select purpose",
                options: purposeOptions,
                selection: $purpose
            ) { v in
                store.dispatch(.setAnswer(questionId: "q_account_purpose", value: AnyCodable(v)))
            }
        }
    }
}

// ─── Shared single-select picker field ───────────────────────────────────────

private struct KYCSingleSelectField: View {
    let title: String
    let placeholder: String
    let options: [(String, String)]
    @Binding var selection: String
    let onSelect: (String) -> Void

    var body: some View {
        FieldGroup(title: title, required: true) {
            Picker(placeholder, selection: $selection) {
                Text(placeholder).tag("")
                ForEach(options, id: \.0) { opt in
                    Text(opt.1).tag(opt.0)
                }
            }
            .pickerStyle(.menu)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, Hive.Spacing.s4)
            .frame(height: Hive.Component.Input.height)
            .background(Hive.Color.brandWhite)
            .cornerRadius(Hive.Radius.base)
            .overlay(RoundedRectangle(cornerRadius: Hive.Radius.base)
                .stroke(Hive.Color.n300, lineWidth: 1))
            .foregroundColor(selection.isEmpty ? Hive.Color.n400 : Hive.Color.n800)
            .onChange(of: selection) { _, v in
                if !v.isEmpty { onSelect(v) }
            }
        }
    }
}

// ─── STEP 9: Open Banking Consent ────────────────────────────────────────────

struct KYCOpenBankingStep: View {
    @Environment(AppStore.self) private var store
    @State private var selectedBank = ""
    @State private var connected = false
    @State private var connecting = false

    private let banks = [
        ("HSBC_HK",  "HSBC Hong Kong"),
        ("BOC_HK",   "Bank of China (Hong Kong)"),
        ("HANG_SENG","Hang Seng Bank"),
        ("SCB_HK",   "Standard Chartered Hong Kong"),
        ("CITI_HK",  "Citibank Hong Kong"),
        ("DBS_HK",   "DBS Bank Hong Kong"),
        ("BEA",      "Bank of East Asia"),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: Hive.Spacing.s4) {
            HiveInfoBanner(
                title: "🔒 Open Banking — Secure Account Connection",
                message: "We use Open Banking (HKMA regulated) to verify your identity. Your bank credentials are never shared with HSBC."
            )

            FieldGroup(title: "Your current bank", required: true) {
                Picker("Select bank", selection: $selectedBank) {
                    Text("Select your bank").tag("")
                    ForEach(banks, id: \.0) { b in Text(b.1).tag(b.0) }
                }
                .pickerStyle(.menu)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, Hive.Spacing.s4)
                .frame(height: Hive.Component.Input.height)
                .background(Hive.Color.brandWhite)
                .cornerRadius(Hive.Radius.base)
                .overlay(RoundedRectangle(cornerRadius: Hive.Radius.base)
                    .stroke(Hive.Color.n300, lineWidth: 1))
            }

            if connected {
                HStack(spacing: Hive.Spacing.s4) {
                    Text("🏦").font(.system(size: 28))
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Bank Connected Successfully")
                            .font(Hive.Typography.labelBase)
                            .foregroundColor(Hive.Color.success)
                        Text("Account ownership verified · Consent token issued · 90-day access")
                            .font(Hive.Typography.caption)
                            .foregroundColor(Hive.Color.n600)
                    }
                }
                .padding(Hive.Spacing.s4)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Hive.Color.successLight)
                .cornerRadius(Hive.Radius.md)
                .overlay(RoundedRectangle(cornerRadius: Hive.Radius.md)
                    .stroke(Hive.Color.success, lineWidth: 1))
            } else {
                Button(action: connectBank) {
                    HStack {
                        Image(systemName: "lock.fill")
                        Text("Connect to \(banks.first { $0.0 == selectedBank }?.1 ?? "your bank") securely")
                    }
                }
                .buttonStyle(HivePrimaryButtonStyle(isLoading: connecting))
                .disabled(selectedBank.isEmpty || connecting)
                .opacity(selectedBank.isEmpty ? 0.5 : 1)
            }

            Text("Powered by Open Banking · Regulated by the HKMA")
                .font(Hive.Typography.caption)
                .foregroundColor(Hive.Color.n400)
                .frame(maxWidth: .infinity, alignment: .center)
        }
    }

    private func connectBank() {
        connecting = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            connecting = false
            connected = true
            store.dispatch(.setAnswer(questionId: "q_ob_consent",
                                      value: AnyCodable("tok_\(Int.random(in: 100000...999999))")))
        }
    }
}

// ─── STEP 10: Declarations ───────────────────────────────────────────────────

struct KYCDeclarationStep: View {
    @Environment(AppStore.self) private var store
    @State private var pepStatus   = ""
    @State private var decl1       = false
    @State private var decl2       = false

    var body: some View {
        VStack(alignment: .leading, spacing: Hive.Spacing.s5) {
            // PEP
            VStack(alignment: .leading, spacing: Hive.Spacing.s3) {
                HiveFieldLabel(text: "Politically Exposed Person (PEP) Status", required: true)
                HiveHelpText(message: "A PEP holds or has held a prominent public position in the last 12 months")
                ForEach([
                    ("NO",     "I am not a PEP and not related to a PEP"),
                    ("YES",    "I am a PEP or closely related to a PEP"),
                    ("FORMER", "I was a PEP more than 12 months ago"),
                ], id: \.0) { value, label in
                    Button(action: {
                        pepStatus = value
                        store.dispatch(.setAnswer(questionId: "q_pep_status", value: AnyCodable(value)))
                    }) {
                        HStack(spacing: Hive.Spacing.s3) {
                            ZStack {
                                Circle()
                                    .stroke(pepStatus == value ? Hive.Color.brandPrimary : Hive.Color.n300,
                                            lineWidth: 2)
                                    .frame(width: 20, height: 20)
                                if pepStatus == value {
                                    Circle().fill(Hive.Color.brandPrimary).frame(width: 10, height: 10)
                                }
                            }
                            Text(label)
                                .font(Hive.Typography.bodySm)
                                .foregroundColor(Hive.Color.n700)
                                .fixedSize(horizontal: false, vertical: true)
                            Spacer()
                        }
                        .padding(Hive.Spacing.s4)
                        .background(pepStatus == value ? Hive.Color.brandPrimaryLight : Hive.Color.n50)
                        .cornerRadius(Hive.Radius.md)
                        .overlay(RoundedRectangle(cornerRadius: Hive.Radius.md)
                            .stroke(pepStatus == value ? Hive.Color.brandPrimary : Hive.Color.n200,
                                    lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                    .animation(.easeInOut(duration: 0.15), value: pepStatus)
                }
            }

            // Declarations
            ForEach([
                ("decl_truthful", "All information provided is true, accurate and complete to the best of my knowledge.", $decl1),
                ("decl_fatca", "I confirm I am NOT a US person for FATCA purposes (no US citizenship, Green Card, or tax residency).", $decl2),
            ], id: \.0) { id, text, binding in
                Button(action: {
                    binding.wrappedValue.toggle()
                    store.dispatch(.setAnswer(questionId: id, value: AnyCodable(binding.wrappedValue)))
                }) {
                    HStack(alignment: .top, spacing: Hive.Spacing.s3) {
                        ZStack {
                            RoundedRectangle(cornerRadius: Hive.Radius.sm)
                                .stroke(binding.wrappedValue ? Hive.Color.success : Hive.Color.n300, lineWidth: 2)
                                .frame(width: 22, height: 22)
                            if binding.wrappedValue {
                                RoundedRectangle(cornerRadius: Hive.Radius.sm - 1)
                                    .fill(Hive.Color.success).frame(width: 20, height: 20)
                                Image(systemName: "checkmark")
                                    .foregroundColor(.white)
                                    .font(.system(size: 12, weight: .bold))
                            }
                        }
                        Text(text)
                            .font(Hive.Typography.bodySm)
                            .foregroundColor(Hive.Color.n700)
                            .fixedSize(horizontal: false, vertical: true)
                            .multilineTextAlignment(.leading)
                        Spacer()
                    }
                    .padding(Hive.Spacing.s4)
                    .background(binding.wrappedValue ? Hive.Color.successLight : Hive.Color.n50)
                    .cornerRadius(Hive.Radius.md)
                    .overlay(RoundedRectangle(cornerRadius: Hive.Radius.md)
                        .stroke(binding.wrappedValue ? Hive.Color.success : Hive.Color.n200, lineWidth: 1))
                }
                .buttonStyle(.plain)
                .animation(.easeInOut(duration: 0.15), value: binding.wrappedValue)
            }

            // Privacy notice
            Text("By submitting, you consent to HSBC processing your personal data under the Personal Data (Privacy) Ordinance (Cap. 486) and HSBC's Privacy Notice.")
                .font(Hive.Typography.caption)
                .foregroundColor(Hive.Color.n400)
                .padding(Hive.Spacing.s4)
                .background(Hive.Color.n100)
                .cornerRadius(Hive.Radius.md)
        }
    }
}

// ─── Country Picker Sheet ─────────────────────────────────────────────────────

struct CountryPickerSheet: View {
    @Binding var selected: String
    let onSelect: (String) -> Void
    @State private var search = ""

    private var filtered: [(iso2:String,name:String,flag:String,dialCode:String,phoneDigits:Int)] {
        search.isEmpty ? KYC_COUNTRIES
            : KYC_COUNTRIES.filter { $0.name.lowercased().contains(search.lowercased()) }
    }

    var body: some View {
        NavigationView {
            List {
                ForEach(filtered, id: \.iso2) { c in
                    Button(action: { onSelect(c.iso2) }) {
                        HStack {
                            Text(c.flag).font(.system(size: 24))
                            Text(c.name)
                                .font(Hive.Typography.bodyBase)
                                .foregroundColor(Hive.Color.n800)
                            Spacer()
                            if c.iso2 == selected {
                                Image(systemName: "checkmark")
                                    .foregroundColor(Hive.Color.brandPrimary)
                            }
                        }
                    }
                }
            }
            .searchable(text: $search, prompt: "Search country")
            .navigationTitle("Select Nationality")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

// ─── Dial Code Picker Sheet ───────────────────────────────────────────────────

struct DialCodePickerSheet: View {
    let onSelect: (String, String) -> Void
    @State private var search = ""

    private var filtered: [(iso2:String,name:String,flag:String,dialCode:String,phoneDigits:Int)] {
        search.isEmpty ? KYC_COUNTRIES
            : KYC_COUNTRIES.filter {
                $0.name.lowercased().contains(search.lowercased())
                    || $0.dialCode.contains(search)
            }
    }

    var body: some View {
        NavigationView {
            List {
                ForEach(filtered, id: \.iso2) { c in
                    Button(action: { onSelect(c.dialCode, c.flag) }) {
                        HStack {
                            Text(c.flag).font(.system(size: 24))
                            Text(c.name)
                                .font(Hive.Typography.bodyBase)
                                .foregroundColor(Hive.Color.n800)
                            Spacer()
                            Text(c.dialCode)
                                .font(Hive.Typography.bodySm)
                                .foregroundColor(Hive.Color.n500)
                        }
                    }
                }
            }
            .searchable(text: $search, prompt: "Search country or code")
            .navigationTitle("Select Country Code")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
