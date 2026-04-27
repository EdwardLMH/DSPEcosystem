import Foundation
import SwiftUI
import Combine
// HIVE tokens imported from hive-tokens/swift/HiveTokens.swift
// Copy HiveTokens.swift into this Swift Package / Xcode target before building.

// ─── KYC Models ──────────────────────────────────────────────────────────────

struct KYCValidation: Codable {
    let required: Bool?
    let minLength: Int?
    let maxLength: Int?
    let pattern: String?
    let errorMessage: String?
    let minAge: Int?
}

struct KYCSelectOption: Codable {
    let value: String
    let label: String
}

// ─── KYC Text Input (iOS) ────────────────────────────────────────────────────

struct KYCTextInputView: View {
    let questionId: String
    let label: String
    let placeholder: String?
    let helpText: String?
    let validation: KYCValidation?
    let savedValue: String?
    let onAnswer: (String, String) -> Void

    @State private var value: String
    @State private var error: String?
    @State private var touched = false

    init(questionId: String, label: String, placeholder: String? = nil,
         helpText: String? = nil, validation: KYCValidation? = nil,
         savedValue: String? = nil, onAnswer: @escaping (String, String) -> Void) {
        self.questionId = questionId
        self.label = label
        self.placeholder = placeholder
        self.helpText = helpText
        self.validation = validation
        self.savedValue = savedValue
        self.onAnswer = onAnswer
        _value = State(initialValue: savedValue ?? "")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: HiveSpacing.s1) {
            HStack(spacing: HiveSpacing.s1) {
                Text(label)
                    .font(HiveTypography.labelBase)
                    .foregroundColor(HiveColor.neutral.n700)
                if validation?.required == true {
                    Text("*").foregroundColor(HiveColor.semantic.error)
                }
            }
            if let help = helpText {
                Text(help)
                    .font(HiveTypography.caption)
                    .foregroundColor(HiveColor.neutral.n500)
            }
            TextField(placeholder ?? "", text: $value)
                .font(HiveTypography.bodyBase)
                .padding(.horizontal, HiveComponent.input.paddingH)
                .frame(height: HiveComponent.input.height)
                .background(HiveComponent.input.bgColor)
                .cornerRadius(HiveComponent.input.borderRadius)
                .overlay(
                    RoundedRectangle(cornerRadius: HiveComponent.input.borderRadius)
                        .stroke(
                            touched && error != nil
                                ? HiveComponent.input.errorColor
                                : HiveComponent.input.borderColor,
                            lineWidth: 1
                        )
                )
                .autocapitalization(.words)
                .onSubmit { validate(); onAnswer(questionId, value) }
                .onChange(of: value) { _ in if touched { validate() } }
            if touched, let err = error {
                Text(err)
                    .font(HiveTypography.caption)
                    .foregroundColor(HiveColor.semantic.error)
            }
        }
        .padding(.vertical, HiveSpacing.s1)
    }

    private func validate() {
        touched = true
        guard let v = validation else { error = nil; return }
        if v.required == true && value.trimmingCharacters(in: .whitespaces).isEmpty {
            error = v.errorMessage ?? "This field is required"; return
        }
        if let min = v.minLength, value.count < min {
            error = "Minimum \(min) characters"; return
        }
        if let pattern = v.pattern,
           !NSPredicate(format: "SELF MATCHES %@", pattern).evaluate(with: value) {
            error = v.errorMessage ?? "Invalid format"; return
        }
        error = nil
    }
}

// ─── KYC Single Select — Bottom Sheet (iOS native) ────────────────────────────

struct KYCSingleSelectView: View {
    let questionId: String
    let label: String
    let options: [KYCSelectOption]
    let savedValue: String?
    let onAnswer: (String, String) -> Void

    @State private var selected: String?
    @State private var showSheet = false

    init(questionId: String, label: String, options: [KYCSelectOption],
         savedValue: String? = nil, onAnswer: @escaping (String, String) -> Void) {
        self.questionId = questionId; self.label = label
        self.options = options; self.savedValue = savedValue; self.onAnswer = onAnswer
        _selected = State(initialValue: savedValue)
    }

    var selectedLabel: String {
        options.first { $0.value == selected }?.label ?? "Select an option"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: HiveSpacing.s1) {
            Text(label)
                .font(HiveTypography.labelBase)
                .foregroundColor(HiveColor.neutral.n700)
            Spacer().frame(height: HiveSpacing.s1)
            Button(action: { showSheet = true }) {
                HStack {
                    Text(selectedLabel)
                        .foregroundColor(selected == nil ? HiveColor.neutral.n400 : HiveColor.neutral.n800)
                        .font(HiveTypography.bodyBase)
                    Spacer()
                    Image(systemName: "chevron.down")
                        .foregroundColor(HiveColor.neutral.n500)
                        .font(.system(size: 12))
                }
                .padding(.horizontal, HiveComponent.input.paddingH)
                .frame(height: HiveComponent.input.height)
                .background(HiveComponent.input.bgColor)
                .cornerRadius(HiveComponent.input.borderRadius)
                .overlay(
                    RoundedRectangle(cornerRadius: HiveComponent.input.borderRadius)
                        .stroke(HiveComponent.input.borderColor, lineWidth: 1)
                )
            }
        }
        .padding(.vertical, HiveSpacing.s1)
        .confirmationDialog(label, isPresented: $showSheet, titleVisibility: .visible) {
            ForEach(options, id: \.value) { option in
                Button(option.label) {
                    selected = option.value
                    onAnswer(questionId, option.value)
                }
            }
            Button("Cancel", role: .cancel) {}
        }
    }
}

// ─── KYC Progress Bar (iOS) ──────────────────────────────────────────────────

struct KYCProgressBarView: View {
    let currentStep: Int
    let totalSteps: Int
    let sectionTitle: String
    let sectionProgress: String?

    var progress: Double { Double(currentStep) / Double(totalSteps) }

    var body: some View {
        VStack(alignment: .leading, spacing: HiveSpacing.s1) {
            HStack {
                Text(sectionTitle)
                    .font(HiveTypography.caption)
                    .foregroundColor(HiveColor.neutral.n500)
                Spacer()
                Text(sectionProgress ?? "Step \(currentStep) of \(totalSteps)")
                    .font(HiveTypography.caption)
                    .foregroundColor(HiveColor.neutral.n500)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(HiveComponent.progressBar.trackColor)
                        .frame(height: HiveComponent.progressBar.height)
                    Capsule()
                        .fill(HiveComponent.progressBar.fillColor)
                        .frame(width: geo.size.width * progress,
                               height: HiveComponent.progressBar.height)
                        .animation(HiveAnimation.slow, value: progress)
                }
            }
            .frame(height: HiveComponent.progressBar.height)
        }
        .padding(.horizontal, HiveSpacing.s4)
        .padding(.vertical, HiveSpacing.s2)
    }
}

// ─── KYC Document Upload (iOS — camera first) ────────────────────────────────

struct KYCDocUploadView: View {
    let questionId: String
    let label: String
    let helpText: String?
    let onAnswer: (String, Data) -> Void

    @State private var capturedImage: UIImage?
    @State private var showImagePicker = false
    @State private var sourceType: UIImagePickerController.SourceType = .camera

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(label).font(.subheadline).fontWeight(.semibold)
            if let help = helpText {
                Text(help).font(.caption).foregroundColor(.secondary)
            }
            if let img = capturedImage {
                Image(uiImage: img)
                    .resizable().scaledToFit()
                    .frame(maxHeight: 200)
                    .cornerRadius(8)
                Button("Retake Photo") {
                    capturedImage = nil
                    sourceType = .camera
                    showImagePicker = true
                }
                .foregroundColor(.red)
            } else {
                VStack(spacing: 12) {
                    Button(action: { sourceType = .camera; showImagePicker = true }) {
                        Label("Take Photo", systemImage: "camera")
                            .frame(maxWidth: .infinity).padding(14)
                            .background(Color.red).foregroundColor(.white)
                            .cornerRadius(8)
                    }
                    Button(action: { sourceType = .photoLibrary; showImagePicker = true }) {
                        Label("Choose from Gallery", systemImage: "photo.on.rectangle")
                            .frame(maxWidth: .infinity).padding(14)
                            .background(Color(.systemGray6)).foregroundColor(.primary)
                            .cornerRadius(8)
                    }
                }
            }
        }
        .padding(.vertical, 4)
        .sheet(isPresented: $showImagePicker) {
            ImagePickerView(sourceType: sourceType) { image in
                capturedImage = image
                if let data = image.jpegData(compressionQuality: 0.8) {
                    onAnswer(questionId, data)
                }
            }
        }
    }
}

// ─── KYC Navigation Bar (iOS — sticky bottom) ────────────────────────────────

struct KYCNavigationBarView: View {
    let showBack: Bool
    let showSaveExit: Bool
    let nextLabel: String
    let isLoading: Bool
    let onBack: (() -> Void)?
    let onSaveExit: (() -> Void)?
    let onNext: () -> Void

    var body: some View {
        HStack {
            if showBack {
                Button(action: { onBack?() }) {
                    HStack(spacing: HiveSpacing.s1) {
                        Image(systemName: "chevron.left")
                        Text("Back").font(HiveTypography.bodyBase)
                    }
                    .foregroundColor(HiveColor.neutral.n700)
                }
            }
            if showSaveExit {
                Button("Save & Exit") { onSaveExit?() }
                    .font(HiveTypography.bodyBase)
                    .foregroundColor(HiveColor.brand.primary)
            }
            Spacer()
            Button(action: onNext) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: HiveColor.brand.white))
                } else {
                    Text(nextLabel)
                        .font(HiveComponent.button.font)
                }
            }
            .padding(.horizontal, HiveComponent.button.paddingH)
            .frame(height: HiveComponent.button.height)
            .background(isLoading ? HiveColor.neutral.n300 : HiveColor.brand.primary)
            .foregroundColor(HiveColor.brand.white)
            .cornerRadius(HiveComponent.button.borderRadius)
            .disabled(isLoading)
        }
        .padding(HiveSpacing.s4)
        .background(HiveColor.brand.white)
        .shadow(color: HiveShadows.navBar.color,
                radius: HiveShadows.navBar.radius,
                x: HiveShadows.navBar.x,
                y: HiveShadows.navBar.y)
    }
}

// ─── Placeholder for ImagePickerView (requires UIViewControllerRepresentable) ─

struct ImagePickerView: UIViewControllerRepresentable {
    let sourceType: UIImagePickerController.SourceType
    let onCapture: (UIImage) -> Void

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = sourceType
        picker.delegate = context.coordinator
        return picker
    }
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    func makeCoordinator() -> Coordinator { Coordinator(onCapture: onCapture) }

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let onCapture: (UIImage) -> Void
        init(onCapture: @escaping (UIImage) -> Void) { self.onCapture = onCapture }
        func imagePickerController(_ picker: UIImagePickerController,
                                    didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            picker.dismiss(animated: true)
            if let image = info[.editedImage] as? UIImage ?? info[.originalImage] as? UIImage {
                onCapture(image)
            }
        }
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            picker.dismiss(animated: true)
        }
    }
}
