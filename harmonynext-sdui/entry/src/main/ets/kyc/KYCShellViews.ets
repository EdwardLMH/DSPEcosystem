// KYCShellViews.ets
// HarmonyNext ArkTS — KYC journey shell: welcome, step shell, completion, nav bar
//
// ROUTING FIX:
//   The mock BFF returns step IDs like "step-001", "step-002" etc.
//   Routing MUST be done on the PRIMARY QUESTION ID extracted from:
//     payload.layout.children[0].props["questionId"]
//   This mirrors the iOS KYCSDUIStepRouter approach exactly.

import { Hive } from '../common/HiveTokens'
import { KYCState, SDUIScreenPayload, AnswerEntry } from '../models/SDUIModels'
import {
  KYCNameDobStep, KYCNationalityStep,
  KYCHKIDStep, KYCMainlandIDStep, KYCPassportStep,
  KYCDocumentStep, KYCContactStep,
  KYCAddressStep, KYCAddressDistrictStep,
  KYCEmploymentStep, KYCAnnualIncomeStep,
  KYCSourceOfFundsStep, KYCAccountPurposeStep,
  KYCLivenessStep, KYCOpenBankingStep, KYCDeclarationStep,
} from './KYCStepViews'
import {
  startSession, resume, getStep, submitStep
} from '../network/KYCNetworkService'
import { SensorDataClient } from '../network/SensorDataClient'

// ─── Primary question extractor (mirrors iOS KYCStepContentCard.questionIds) ──
// Reads payload.layout.children[0].props["questionId"] as the routing key.

// FIX: use children[0].id which is typed as string — avoids ESObject implicit-type
// error from props['questionId'] index access (arkts-no-any-unknown).
// The BFF sets node.id = q.questionId in buildComponent(), so .id is authoritative.
function primaryQuestionId(payload: SDUIScreenPayload): string {
  const children = payload.layout.children
  if (children === null || children === undefined) return ''
  if (children.length === 0) return ''
  return children[0].id   // SDUINode.id is typed string — no cast needed
}

// ─── Step title (matches iOS KYCStepTitleView) ────────────────────────────────

function stepTitle(primaryQ: string): string {
  if (primaryQ === 'q_first_name')         return '👤 Full Legal Name & Date of Birth'
  if (primaryQ === 'q_nationality')        return '🌍 Nationality'
  if (primaryQ === 'q_hkid_number')        return '🪪 Hong Kong Identity Card'
  if (primaryQ === 'q_mainland_id')        return '🪪 Mainland China ID'
  if (primaryQ === 'q_passport_number')    return '🛂 Passport'
  if (primaryQ === 'q_hkid_front')         return '📄 Upload Identity Document'
  if (primaryQ === 'q_email')             return '📱 Contact Details'
  if (primaryQ === 'q_addr_line1')         return '🏠 Residential Address'
  if (primaryQ === 'q_addr_district')      return '📍 District'
  if (primaryQ === 'q_employment_status')  return '💼 Employment Status'
  if (primaryQ === 'q_annual_income')      return '💰 Annual Income'
  if (primaryQ === 'q_source_of_funds')    return '🏦 Source of Funds'
  if (primaryQ === 'q_account_purpose')    return '🎯 Purpose of Account'
  if (primaryQ === 'q_liveness')           return '😊 Selfie & Liveness Check'
  if (primaryQ === 'q_ob_consent')         return '🏦 Connect Your Bank'
  if (primaryQ === 'q_pep_status')         return '✍️ Legal Declarations'
  return '📋 Application'
}

// ─── Inline item interfaces for ForEach callbacks ─────────────────────────────

interface WelcomeItem {
  icon: string
  title: string
  desc: string
}

interface CompletionItem {
  icon: string
  text: string
}

// ─── Root KYC view ────────────────────────────────────────────────────────────

@Component
export struct KYCRootView {
  @ObjectLink state: KYCState

  build() {
    if (this.state.isComplete) {
      KYCCompletionView()
    } else if (this.state.screenPayload !== null) {
      KYCJourneyView({ state: this.state })
    } else {
      KYCWelcomeView({ state: this.state })
    }
  }
}

// ─── Welcome view ─────────────────────────────────────────────────────────────

@Component
struct KYCWelcomeView {
  @ObjectLink state: KYCState

  doStart() {
    this.state.isLoading = true
    this.state.errorMessage = ''
    SensorDataClient.kycJourneyStarted()
    startSession('harmonynext')
      .then(res => {
        this.state.sessionId = res.sessionId
        this.state.totalSteps = res.totalSteps
        return resume(res.sessionId, 'harmonynext')
      })
      .then(payload => {
        this.state.screenPayload = payload
        this.state.currentStepId = payload.metadata.stepId
        this.state.currentStepIndex = payload.metadata.stepIndex
        this.state.totalSteps = payload.metadata.totalSteps
        this.state.sectionTitle = payload.metadata.sectionTitle
        this.state.isLoading = false
        SensorDataClient.kycStepViewed(
          payload.metadata.stepId,
          payload.metadata.stepIndex,
          payload.metadata.totalSteps,
          payload.metadata.sectionTitle
        )
      })
      .catch((err: Error) => {
        this.state.isLoading = false
        this.state.errorMessage =
          `Cannot connect to server. Is the mock BFF running?\n${err.message}`
      })
  }

  build() {
    Scroll() {
      Column({ space: 0 }) {
        Row().width('100%').height(6).backgroundColor(Hive.Color.brandPrimary)

        Column({ space: Hive.Spacing.s6 }) {
          HSBCLogoView()

          Column({ space: Hive.Spacing.s2 }) {
            Text('Open Banking\nAccount Opening')
              .fontSize(Hive.Typography.displayLarge)
              .fontWeight(FontWeight.Bold)
              .fontColor(Hive.Color.n900)
              .lineHeight(36)
            Text('Complete your KYC verification in minutes using Open Banking. Fully regulated by the HKMA.')
              .fontSize(Hive.Typography.bodyBase)
              .fontColor(Hive.Color.n600)
          }.width('100%').alignItems(HorizontalAlign.Start)

          Column({ space: Hive.Spacing.s2 }) {
            ForEach([
              { icon: '👤', title: 'Personal Details',      desc: 'Name, DOB, nationality, address' } as WelcomeItem,
              { icon: '🪪', title: 'Identity Verification', desc: 'Government ID + liveness selfie' } as WelcomeItem,
              { icon: '💼', title: 'Due Diligence',         desc: 'Occupation & source of funds' } as WelcomeItem,
              { icon: '🏦', title: 'Open Banking',          desc: 'Connect bank for instant verification' } as WelcomeItem,
              { icon: '✍️', title: 'Declarations',          desc: 'Legal declarations & consent' } as WelcomeItem,
            ], (item: WelcomeItem) => {
              Row({ space: Hive.Spacing.s3 }) {
                Text(item.icon).fontSize(22)
                  .width(44).height(44).textAlign(TextAlign.Center)
                  .borderRadius(Hive.Radius.md).backgroundColor('#FFEEEF')
                Column({ space: 2 }) {
                  Text(item.title).fontSize(14).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n800)
                  Text(item.desc).fontSize(12).fontColor(Hive.Color.n500)
                }.layoutWeight(1).alignItems(HorizontalAlign.Start)
              }
              .width('100%').padding(Hive.Spacing.s4)
              .borderRadius(Hive.Radius.md)
              .backgroundColor(Hive.Color.brandWhite)
              .shadow({ radius: 4, color: '#0A000000', offsetY: 2 })
            })
          }.width('100%')

          Row({ space: Hive.Spacing.s2 }) {
            Text('🔒').fontSize(14)
            Text('Regulated by HKMA · Data protected under PDPO Cap. 486')
              .fontSize(12).fontColor(Hive.Color.n500)
          }.width('100%')

          if (this.state.errorMessage !== '') {
            Text(this.state.errorMessage)
              .fontSize(13).fontColor(Hive.Color.error).width('100%')
          }

          Button(this.state.isLoading ? 'Starting…' : 'Begin Application')
            .width('100%').height(Hive.Component.Button.height)
            .borderRadius(Hive.Radius.base)
            .backgroundColor(Hive.Color.brandPrimary)
            .fontColor(Hive.Color.brandWhite)
            .fontWeight(FontWeight.Medium)
            .enabled(!this.state.isLoading)
            .onClick(() => { this.doStart() })

          Blank().height(Hive.Spacing.s8)
        }.padding(Hive.Spacing.s6).width('100%')
      }
    }.width('100%').backgroundColor(Hive.Color.n50)
  }
}

// ─── Journey shell ────────────────────────────────────────────────────────────

@Component
struct KYCJourneyView {
  @ObjectLink state: KYCState

  progress(): number {
    return this.state.totalSteps > 0
      ? this.state.currentStepIndex / this.state.totalSteps * 100
      : 0
  }

  // Returns the human-readable title for the current step.
  // Keeping this in a method avoids any variable declarations inside build().
  currentStepTitle(): string {
    const payload = this.state.screenPayload
    if (payload === null || payload === undefined) return '📋 Application'
    return stepTitle(primaryQuestionId(payload as SDUIScreenPayload))
  }

  doSubmit() {
    const sessionId = this.state.sessionId
    const stepId = this.state.currentStepId
    if (!sessionId || !stepId) return

    this.state.isSubmitting = true
    SensorDataClient.kycStepCompleted(
      stepId, this.state.currentStepIndex, this.state.sectionTitle)

    const answers: AnswerEntry[] = []
    Object.keys(this.state.answers).forEach((k: string) => {
      answers.push({ questionId: k, value: this.state.answers[k] })
    })

    submitStep(sessionId, stepId, { answers })
      .then(res => {
        if (res.status === 'COMPLETE') {
          SensorDataClient.kycJourneyCompleted()
          this.state.isSubmitting = false
          this.state.isComplete = true
        } else if (res.status === 'NEXT_STEP' && res.nextStepId) {
          this.state.totalSteps = res.totalSteps ?? this.state.totalSteps
          getStep(sessionId, res.nextStepId, 'harmonynext')
            .then(payload => {
              this.state.screenPayload = payload
              this.state.currentStepId = payload.metadata.stepId
              this.state.currentStepIndex = payload.metadata.stepIndex
              this.state.totalSteps = payload.metadata.totalSteps
              this.state.sectionTitle = payload.metadata.sectionTitle
              this.state.isSubmitting = false
              SensorDataClient.kycStepViewed(
                payload.metadata.stepId,
                payload.metadata.stepIndex,
                payload.metadata.totalSteps,
                payload.metadata.sectionTitle
              )
            })
            .catch((err: Error) => {
              this.state.isSubmitting = false
              this.state.errorMessage = `Failed to load next step: ${err.message}`
            })
        } else {
          this.state.isSubmitting = false
        }
      })
      .catch((err: Error) => {
        this.state.isSubmitting = false
        this.state.errorMessage = `Submission failed: ${err.message}`
      })
  }

  build() {
    Column({ space: 0 }) {
      // Header
      Row() {
        HSBCLogoView()
        Blank().layoutWeight(1)
        Text('Save & Exit').fontSize(13).fontColor(Hive.Color.n500)
      }
      .width('100%').height(56)
      .padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4 })
      .backgroundColor(Hive.Color.brandWhite)
      Divider().color(Hive.Color.n200)

      // Progress bar
      Column({ space: Hive.Spacing.s2 }) {
        Row() {
          Text(this.state.sectionTitle)
            .fontSize(Hive.Typography.caption).fontColor(Hive.Color.n500)
          Blank().layoutWeight(1)
          Text(`Step ${this.state.currentStepIndex} of ${this.state.totalSteps}`)
            .fontSize(Hive.Typography.caption).fontColor(Hive.Color.n500)
        }.width('100%')
        Progress({ value: this.progress(), total: 100, type: ProgressType.Linear })
          .color(Hive.Color.brandPrimary).width('100%')
      }
      .width('100%')
      .padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4, top: 10, bottom: 10 })
      .backgroundColor(Hive.Color.brandWhite)
      Divider().color(Hive.Color.n200)

      // Step content (scrollable)
      Scroll() {
        Column({ space: Hive.Spacing.s4 }) {
          // Section badge + title (derived from primaryQuestionId — not stepId)
          Column({ space: Hive.Spacing.s2 }) {
            Row({ space: Hive.Spacing.s1 }) {
              Text(this.state.sectionTitle)
                .fontSize(12).fontWeight(FontWeight.Medium).fontColor(Hive.Color.brandPrimary)
            }
            .padding({ left: 12, right: 12, top: 4, bottom: 4 })
            .borderRadius(Hive.Radius.full).backgroundColor('#FFEEEF')

            if (this.state.screenPayload !== null) {
              Text(this.currentStepTitle())
                .fontSize(Hive.Typography.headingMd).fontWeight(FontWeight.Bold)
                .fontColor(Hive.Color.n900)
            }
          }.width('100%').alignItems(HorizontalAlign.Start)

          // Step card — keyed on stepId so ArkTS destroys/recreates on step change
          Column({ space: 0 }) {
            if (this.state.screenPayload !== null) {
              KYCStepContent({ state: this.state })
            }
          }
          .width('100%').padding(Hive.Spacing.s4)
          .borderRadius(Hive.Radius.lg)
          .backgroundColor(Hive.Color.brandWhite)
          .shadow({ radius: 8, color: '#0F000000', offsetY: 2 })

          if (this.state.errorMessage !== '') {
            Text(this.state.errorMessage)
              .fontSize(13).fontColor(Hive.Color.error).width('100%')
          }
          Blank().height(100)
        }.padding(Hive.Spacing.s4)
      }.layoutWeight(1).backgroundColor(Hive.Color.n50)

      // Nav bar
      Divider().color(Hive.Color.n200)
      Row({ space: Hive.Spacing.s3 }) {
        if (this.state.currentStepIndex > 1) {
          Button('← Back')
            .height(52).padding({ left: 16, right: 16 })
            .borderRadius(Hive.Radius.base)
            .backgroundColor(Hive.Color.brandWhite)
            .fontColor(Hive.Color.n700)
            .border({ width: 1, color: Hive.Color.n300, radius: Hive.Radius.base })
        }
        Button(this.state.isSubmitting ? 'Submitting…' :
          this.state.currentStepIndex >= this.state.totalSteps ? 'Submit Application' : 'Continue')
          .layoutWeight(1).height(52)
          .borderRadius(Hive.Radius.base)
          .backgroundColor(this.state.isSubmitting ? Hive.Color.n300 : Hive.Color.brandPrimary)
          .fontColor(Hive.Color.brandWhite)
          .fontWeight(FontWeight.Medium)
          .enabled(!this.state.isSubmitting)
          .onClick(() => { this.doSubmit() })
      }
      .width('100%')
      .padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4, top: 12, bottom: 28 })
      .backgroundColor(Hive.Color.brandWhite)
    }
    .width('100%').height('100%').backgroundColor(Hive.Color.n50)
  }
}

// ─── Step content router ──────────────────────────────────────────────────────
// Routes on primaryQuestionId extracted from the SDUI payload layout children,
// exactly as iOS does in KYCSDUIStepRouter.swift via primaryQuestion.
//
// ArkTS build() rules:
//   • Exactly ONE root container node — no early returns, no leading variable
//     declarations before the root node.
//   • All logic is pushed into helper methods called from within the UI tree.

@Component
struct KYCStepContent {
  @ObjectLink state: KYCState

  // Returns the primary question ID without any variable declaration in build().
  primaryQ(): string {
    const payload = this.state.screenPayload
    if (payload === null || payload === undefined) return ''
    return primaryQuestionId(payload as SDUIScreenPayload)
  }

  build() {
    // Single mandatory root container — satisfies ArkTS "one root node" rule.
    Column({ space: 0 }) {
      if (this.primaryQ() === 'q_first_name') {
        KYCNameDobStep({ state: this.state })
      } else if (this.primaryQ() === 'q_nationality') {
        KYCNationalityStep({ state: this.state })
      } else if (this.primaryQ() === 'q_hkid_number') {
        KYCHKIDStep({ state: this.state })
      } else if (this.primaryQ() === 'q_mainland_id') {
        KYCMainlandIDStep({ state: this.state })
      } else if (this.primaryQ() === 'q_passport_number') {
        KYCPassportStep({ state: this.state })
      } else if (this.primaryQ() === 'q_hkid_front') {
        KYCDocumentStep({ state: this.state })
      } else if (this.primaryQ() === 'q_email') {
        KYCContactStep({ state: this.state })
      } else if (this.primaryQ() === 'q_addr_line1' || this.primaryQ() === 'q_addr_line2') {
        KYCAddressStep({ state: this.state })
      } else if (this.primaryQ() === 'q_addr_district') {
        KYCAddressDistrictStep({ state: this.state })
      } else if (this.primaryQ() === 'q_employment_status') {
        KYCEmploymentStep({ state: this.state })
      } else if (this.primaryQ() === 'q_annual_income') {
        KYCAnnualIncomeStep({ state: this.state })
      } else if (this.primaryQ() === 'q_source_of_funds') {
        KYCSourceOfFundsStep({ state: this.state })
      } else if (this.primaryQ() === 'q_account_purpose') {
        KYCAccountPurposeStep({ state: this.state })
      } else if (this.primaryQ() === 'q_liveness') {
        KYCLivenessStep({ state: this.state })
      } else if (this.primaryQ() === 'q_ob_consent') {
        KYCOpenBankingStep({ state: this.state })
      } else if (this.primaryQ() === 'q_pep_status' ||
                 this.primaryQ() === 'decl_truthful' ||
                 this.primaryQ() === 'decl_fatca') {
        KYCDeclarationStep({ state: this.state })
      } else {
        // Debug fallback — visible when primaryQ() returns '' or an unrecognised value
        Column({ space: Hive.Spacing.s3 }) {
          Text('⚠️').fontSize(32).textAlign(TextAlign.Center).width('100%')
          Text('Unknown step').fontSize(14).fontWeight(FontWeight.Medium)
            .fontColor(Hive.Color.n600).textAlign(TextAlign.Center).width('100%')
          Text('stepId: ' + this.state.currentStepId)
            .fontSize(12).fontColor(Hive.Color.n400).textAlign(TextAlign.Center).width('100%')
          Text('primaryQ: ' + (this.primaryQ() !== '' ? this.primaryQ() : '(none — no children)'))
            .fontSize(12).fontColor(Hive.Color.n400).textAlign(TextAlign.Center).width('100%')
        }.padding(Hive.Spacing.s6).width('100%')
      }
    }.width('100%')
  }
}

// ─── Completion view ──────────────────────────────────────────────────────────

@Component
struct KYCCompletionView {
  build() {
    Column({ space: Hive.Spacing.s6 }) {
      HSBCLogoView()
      Text('✅').fontSize(72)
      Text('Application Submitted')
        .fontSize(Hive.Typography.headingXL).fontWeight(FontWeight.Bold)
        .fontColor(Hive.Color.success)

      Column({ space: Hive.Spacing.s3 }) {
        ForEach([
          { icon: '📧', text: 'Confirmation email sent' } as CompletionItem,
          { icon: '📱', text: 'SMS notification will follow' } as CompletionItem,
          { icon: '⏱',  text: 'Decision within 3 working days' } as CompletionItem,
          { icon: '🔒', text: 'Data encrypted per PDPO Cap. 486' } as CompletionItem,
        ], (item: CompletionItem) => {
          Row({ space: Hive.Spacing.s3 }) {
            Text(item.icon).fontSize(16)
            Text(item.text).fontSize(14).fontColor(Hive.Color.n700)
          }.width('100%')
        })
      }
      .width('100%').padding(Hive.Spacing.s5)
      .borderRadius(Hive.Radius.md).backgroundColor(Hive.Color.n50)
      .border({ width: 1, color: Hive.Color.n200, radius: Hive.Radius.md })

      Text(`Reference: OBKYC-${Math.floor(Math.random() * 900000 + 100000)}`)
        .fontSize(12).fontColor(Hive.Color.n500)
    }
    .width('100%').height('100%')
    .padding(Hive.Spacing.s6)
    .backgroundColor(Hive.Color.n50)
    .alignItems(HorizontalAlign.Center)
    .justifyContent(FlexAlign.Center)
  }
}

// ─── HSBC Logo ────────────────────────────────────────────────────────────────

@Component
export struct HSBCLogoView {
  build() {
    Row({ space: Hive.Spacing.s2 }) {
      Grid() {
        GridItem() { Row().width(14).height(14).backgroundColor(Hive.Color.brandPrimary) }
        GridItem() { Row().width(14).height(14).backgroundColor(Hive.Color.brandWhite) }
        GridItem() { Row().width(14).height(14).backgroundColor(Hive.Color.brandWhite) }
        GridItem() { Row().width(14).height(14).backgroundColor(Hive.Color.brandPrimary) }
      }
      .columnsTemplate('1fr 1fr').rowsTemplate('1fr 1fr')
      .width(28).height(28)
      .border({ width: 0.5, color: Hive.Color.n200 })

      Text('HSBC').fontSize(20).fontWeight(FontWeight.Bold).fontColor(Hive.Color.n900)
        .letterSpacing(1)
    }.alignItems(VerticalAlign.Center)
  }
}
