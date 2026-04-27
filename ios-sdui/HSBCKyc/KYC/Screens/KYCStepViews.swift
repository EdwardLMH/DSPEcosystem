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

// ─── STEP 1: Full Legal Name ──────────────────────────────────────────────────

struct KYCNameStep: View {
    @Environment(AppStore.self) private var store
    @State private var firstName  = ""
    @State private var middleName = ""
    @State private var lastName   = ""
    @State private var firstErr: String?
    @State private var lastErr:  String?
    @FocusState private var focused: Field?
    enum Field { case first, middle, last }

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
        }
    }
}

// ─── STEP 2: Date of Birth + Nationality ─────────────────────────────────────

struct KYCDobNationalityStep: View {
    @Environment(AppStore.self) private var store
    @State private var dob = Date()
    @State private var nationality = ""
    @State private var dobErr: String?
    @State private var showNatSheet = false

    private var maxDob: Date {
        Calendar.current.date(byAdding: .year, value: -18, to: Date()) ?? Date()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Hive.Spacing.s4) {
            FieldGroup(title: "Date of Birth", required: true,
                       help: "You must be at least 18 years old", error: dobErr) {
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
                        let formatter = DateFormatter()
                        formatter.dateFormat = "yyyy-MM-dd"
                        store.dispatch(.setAnswer(questionId: "q_dob",
                                                  value: AnyCodable(formatter.string(from: d))))
                    }
            }

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

// ─── STEP 4: Government ID ────────────────────────────────────────────────────

struct KYCIdentifierStep: View {
    @Environment(AppStore.self) private var store
    @State private var idType   = ""
    @State private var idNumber = ""
    @State private var idErr: String?
    @FocusState private var focused: Bool

    private let idTypes = [
        ("HKID", "HKID (Hong Kong)", "A123456(7)"),
        ("PASSPORT", "Passport", "X12345678"),
        ("MAINLANDID", "Mainland China ID (居民身份証)", "110101199001011234"),
        ("NRIC", "NRIC (Singapore)", "S1234567D"),
        ("SSN", "Social Security Number (US)", "123-45-6789"),
        ("AADHAAR", "Aadhaar (India)", "1234 5678 9012"),
        ("OTHER", "Other National ID", ""),
    ]

    var placeholder: String {
        idTypes.first { $0.0 == idType }?.2 ?? "Enter ID number"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Hive.Spacing.s4) {
            FieldGroup(title: "ID Document Type", required: true) {
                Picker("Select type", selection: $idType) {
                    Text("Select ID type").tag("")
                    ForEach(idTypes, id: \.0) { type in
                        Text(type.1).tag(type.0)
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
                .onChange(of: idType) { _, v in
                    store.dispatch(.setAnswer(questionId: "q_id_type", value: AnyCodable(v)))
                    idNumber = ""
                }
            }

            if !idType.isEmpty {
                FieldGroup(title: "ID Number", required: true,
                           help: idTypes.first { $0.0 == idType }?.2.isEmpty == false
                               ? "Format: \(placeholder)" : nil,
                           error: idErr) {
                    TextField(placeholder, text: $idNumber)
                        .hiveInput(focused: focused, error: idErr != nil)
                        .focused($focused)
                        .autocapitalization(.allCharacters)
                        .disableAutocorrection(true)
                        .onChange(of: idNumber) { _, v in
                            idErr = v.isEmpty ? "ID number is required" : nil
                            store.dispatch(.setAnswer(questionId: "q_id_number", value: AnyCodable(v)))
                        }
                }
            }
        }
    }
}

// ─── STEP 5: Residential Address ─────────────────────────────────────────────

struct KYCAddressStep: View {
    @Environment(AppStore.self) private var store
    @State private var flat      = ""
    @State private var floor     = ""
    @State private var block     = ""
    @State private var building  = ""
    @State private var street    = ""
    @State private var district  = ""
    @State private var region    = ""
    @FocusState private var focused: Field?
    enum Field { case flat, floor, block, building, street }

    var body: some View {
        VStack(alignment: .leading, spacing: Hive.Spacing.s4) {
            // HK address format badge
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

            HStack(spacing: Hive.Spacing.s3) {
                FieldGroup(title: "Flat / Unit") {
                    TextField("e.g. Flat B", text: $flat)
                        .hiveInput(focused: focused == .flat)
                        .focused($focused, equals: .flat)
                        .onChange(of: flat) { _, v in sendAddress() }
                }
                FieldGroup(title: "Floor") {
                    TextField("e.g. 12/F", text: $floor)
                        .hiveInput(focused: focused == .floor)
                        .focused($focused, equals: .floor)
                        .onChange(of: floor) { _, v in sendAddress() }
                }
            }

            HStack(spacing: Hive.Spacing.s3) {
                FieldGroup(title: "Block") {
                    TextField("e.g. Block 3", text: $block)
                        .hiveInput(focused: focused == .block)
                        .focused($focused, equals: .block)
                        .onChange(of: block) { _, v in sendAddress() }
                }
                FieldGroup(title: "Building", required: true) {
                    TextField("Building name", text: $building)
                        .hiveInput(focused: focused == .building)
                        .focused($focused, equals: .building)
                        .onChange(of: building) { _, v in sendAddress() }
                }
            }

            FieldGroup(title: "Street Address", required: true) {
                TextField("e.g. 28 Kings Road", text: $street)
                    .hiveInput(focused: focused == .street)
                    .focused($focused, equals: .street)
                    .onChange(of: street) { _, v in sendAddress() }
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
                .onChange(of: district) { _, _ in sendAddress() }
            }

            FieldGroup(title: "Region", required: true) {
                Picker("Select region", selection: $region) {
                    Text("Select region").tag("")
                    Text("Hong Kong Island (港島)").tag("HK_ISLAND")
                    Text("Kowloon (九龍)").tag("KOWLOON")
                    Text("New Territories (新界)").tag("NEW_TERR")
                    Text("Outlying Islands (離島)").tag("OUTLYING")
                }
                .pickerStyle(.menu)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, Hive.Spacing.s4)
                .frame(height: Hive.Component.Input.height)
                .background(Hive.Color.brandWhite)
                .cornerRadius(Hive.Radius.base)
                .overlay(RoundedRectangle(cornerRadius: Hive.Radius.base)
                    .stroke(Hive.Color.n300, lineWidth: 1))
                .onChange(of: region) { _, _ in sendAddress() }
            }
        }
    }

    private func sendAddress() {
        let addr = "\(flat) \(floor) \(block) \(building), \(street), \(district), \(region), HK"
            .trimmingCharacters(in: .whitespaces)
        store.dispatch(.setAnswer(questionId: "q_address", value: AnyCodable(addr)))
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
                body: "We need to verify you are a real person matching your ID. This takes ~30 seconds."
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

// ─── STEP 8: Source of Wealth ─────────────────────────────────────────────────

struct KYCWealthStep: View {
    @Environment(AppStore.self) private var store
    @State private var occupation  = ""
    @State private var income      = ""
    @State private var fundsSource = ""
    @State private var purpose     = ""
    @State private var detail      = ""
    @FocusState private var detailFocused: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: Hive.Spacing.s4) {
            FieldGroup(title: "Occupation / Industry", required: true) {
                pickerField("Select occupation", options: OCCUPATIONS, selection: $occupation)
                    .onChange(of: occupation) { _, v in
                        store.dispatch(.setAnswer(questionId: "q_occupation", value: AnyCodable(v)))
                    }
            }
            FieldGroup(title: "Annual Income (HKD)", required: true) {
                pickerField("Select income range", options: INCOME_BANDS, selection: $income)
                    .onChange(of: income) { _, v in
                        store.dispatch(.setAnswer(questionId: "q_annual_income", value: AnyCodable(v)))
                    }
            }
            FieldGroup(title: "Primary Source of Funds", required: true) {
                pickerField("Select source", options: FUNDS_SOURCES, selection: $fundsSource)
                    .onChange(of: fundsSource) { _, v in
                        store.dispatch(.setAnswer(questionId: "q_source_of_funds", value: AnyCodable(v)))
                    }
            }
            FieldGroup(title: "Purpose of Account", required: true) {
                pickerField("Select purpose", options: ACCOUNT_PURPOSES, selection: $purpose)
                    .onChange(of: purpose) { _, v in
                        store.dispatch(.setAnswer(questionId: "q_account_purpose", value: AnyCodable(v)))
                    }
            }
            FieldGroup(title: "Additional Details",
                       help: "Optional — any additional context about your source of funds") {
                ZStack(alignment: .topLeading) {
                    if detail.isEmpty {
                        Text("Provide additional context (optional)")
                            .font(Hive.Typography.bodyBase)
                            .foregroundColor(Hive.Color.n400)
                            .padding(.horizontal, Hive.Spacing.s4)
                            .padding(.top, 14)
                            .allowsHitTesting(false)
                    }
                    TextEditor(text: $detail)
                        .font(Hive.Typography.bodyBase)
                        .foregroundColor(Hive.Color.n800)
                        .focused($detailFocused)
                        .frame(minHeight: 90)
                        .padding(.horizontal, Hive.Spacing.s3)
                        .scrollContentBackground(.hidden)
                        .onChange(of: detail) { _, v in
                            store.dispatch(.setAnswer(questionId: "q_funds_detail", value: AnyCodable(v)))
                        }
                }
                .background(Hive.Color.brandWhite)
                .cornerRadius(Hive.Radius.base)
                .overlay(RoundedRectangle(cornerRadius: Hive.Radius.base)
                    .stroke(detailFocused ? Hive.Color.brandPrimary : Hive.Color.n300,
                            lineWidth: detailFocused ? 2 : 1))
            }
        }
    }

    @ViewBuilder
    private func pickerField(_ placeholder: String,
                              options: [(String, String)],
                              selection: Binding<String>) -> some View {
        Picker(placeholder, selection: selection) {
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
        .foregroundColor(selection.wrappedValue.isEmpty ? Hive.Color.n400 : Hive.Color.n800)
    }
}

// ─── STEP 9: Open Banking Consent ────────────────────────────────────────────

struct KYCOpenBankingStep: View {
    @Environment(AppStore.self) private var store
    @State private var selectedBank = ""
    @State private var consents: [String: Bool] = [
        "ob_account_info": false,
        "ob_transactions": false,
        "ob_identity":     false,
        "ob_direct_debit": false,
    ]
    @State private var connected = false
    @State private var connecting = false

    private let banks = [
        ("HSBC_UK","HSBC UK"), ("LLOYDS","Lloyds Bank"),
        ("BARCLAYS","Barclays"), ("NATWEST","NatWest"),
        ("SANTANDER","Santander"), ("MONZO","Monzo"),
        ("STARLING","Starling Bank"),
    ]

    private let permissions = [
        ("ob_account_info", "Account Information",
         "View account details, balances and account number for ownership verification", true),
        ("ob_transactions", "Transaction History",
         "Access up to 12 months of transactions for behavioural risk scoring", true),
        ("ob_identity",     "Identity Confirmation",
         "Confirm your name and address match your application", true),
        ("ob_direct_debit", "Direct Debit Setup",
         "Set up recurring payments (only if you request this service)", false),
    ]

    private var requiredMet: Bool {
        permissions.filter(\.3).allSatisfy { consents[$0.0] == true }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Hive.Spacing.s4) {
            HiveInfoBanner(
                title: "🔒 Open Banking — Secure Account Connection",
                body: "We use Open Banking (FCA/HKMA regulated) to verify your identity. Your bank credentials are never shared with HSBC."
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

            Text("Data access permissions")
                .font(Hive.Typography.labelBase)
                .foregroundColor(Hive.Color.n700)

            ForEach(permissions, id: \.0) { id, title, desc, required in
                ConsentRow(id: id, title: title, desc: desc, required: required,
                           isOn: consents[id] ?? false) {
                    if !required { consents[id] = !(consents[id] ?? false) }
                }
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
                .disabled(selectedBank.isEmpty || !requiredMet || connecting)
                .opacity((selectedBank.isEmpty || !requiredMet) ? 0.5 : 1)
            }

            Text("Powered by Open Banking · Regulated by the FCA and HKMA")
                .font(Hive.Typography.caption)
                .foregroundColor(Hive.Color.n400)
                .frame(maxWidth: .infinity, alignment: .center)
        }
    }

    private func connectBank() {
        // Mark required consents as accepted
        permissions.filter(\.3).forEach { consents[$0.0] = true }
        connecting = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            connecting = false
            connected = true
            store.dispatch(.setAnswer(questionId: "q_ob_consent",
                                      value: AnyCodable("tok_\(Int.random(in: 100000...999999))")))
        }
    }
}

struct ConsentRow: View {
    let id: String; let title: String; let desc: String
    let required: Bool; let isOn: Bool; let onTap: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: Hive.Spacing.s3) {
            // Checkbox
            ZStack {
                RoundedRectangle(cornerRadius: Hive.Radius.sm)
                    .stroke(isOn ? Hive.Color.success : Hive.Color.n300, lineWidth: 2)
                    .frame(width: 20, height: 20)
                if isOn {
                    RoundedRectangle(cornerRadius: Hive.Radius.sm - 1)
                        .fill(Hive.Color.success)
                        .frame(width: 18, height: 18)
                    Image(systemName: "checkmark")
                        .foregroundColor(.white)
                        .font(.system(size: 11, weight: .bold))
                }
            }
            .onTapGesture { if !required { onTap() } }

            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text(title)
                        .font(Hive.Typography.labelBase)
                        .foregroundColor(Hive.Color.n800)
                    if required {
                        Text("Required")
                            .font(Hive.Typography.caption)
                            .foregroundColor(Hive.Color.brandPrimary)
                    }
                }
                Text(desc)
                    .font(Hive.Typography.caption)
                    .foregroundColor(Hive.Color.n600)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(Hive.Spacing.s4)
        .background(isOn ? Hive.Color.successLight : Hive.Color.n50)
        .cornerRadius(Hive.Radius.md)
        .overlay(RoundedRectangle(cornerRadius: Hive.Radius.md)
            .stroke(isOn ? Hive.Color.success : Hive.Color.n200, lineWidth: 1))
        .onTapGesture { onTap() }
        .animation(.easeInOut(duration: 0.15), value: isOn)
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
