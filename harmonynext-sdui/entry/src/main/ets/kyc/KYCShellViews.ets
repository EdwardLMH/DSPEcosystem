// KYCShellViews.ets
// HarmonyNext ArkTS — KYC journey shell: welcome, step shell, completion, nav bar
//
// KYCRootView owns the @State KYCStore directly — no prop threading needed.
// Child components that need to mutate state receive @ObjectLink store: KYCStore
// (passed as a sub-property reference, which ArkTS tracks correctly).
//
// ROUTING CONTRACT:
//   Routes on the PRIMARY QUESTION ID from payload.layout.children[0].id.
//   The BFF sets node.id = questionId in buildComponent(), so .id is authoritative.
//   Step IDs ("step-001" etc.) carry no semantic meaning and are NOT used for routing.

import { Hive } from '../common/HiveTokens'
import { KYCState, KYCAction, SDUIScreenPayload } from '../models/SDUIModels'
import { KYCStore } from './KYCStore'
import {
  KYCNameDobStep, KYCNationalityStep,
  KYCHKIDStep, KYCMainlandIDStep, KYCPassportStep,
  KYCDocumentStep, KYCContactStep,
  KYCAddressStep,
  KYCEmploymentIncomeStep,
  KYCSourceOfFundsStep,
  KYCLivenessStep, KYCOpenBankingStep, KYCDeclarationStep,
} from './KYCStepViews'

// ─── Primary question extractor ───────────────────────────────────────────────
// Uses children[0].id (typed string) — avoids ESObject implicit-type error from
// props['questionId'] index access. BFF sets node.id = q.questionId.

function primaryQuestionId(payload: SDUIScreenPayload): string {
  const children = payload.layout.children
  if (children === null || children === undefined) return ''
  if (children.length === 0) return ''
  return children[0].id
}

// ─── Step title (mirrors iOS KYCStepTitleView / Android kycStepTitle()) ───────

function stepTitle(primaryQ: string): string {
  if (primaryQ === 'q_first_name')         return '👤 Full Legal Name & Date of Birth'
  if (primaryQ === 'q_nationality')        return '🌍 Nationality'
  if (primaryQ === 'q_hkid_number')        return '🪪 Hong Kong Identity Card'
  if (primaryQ === 'q_mainland_id')        return '🪪 Mainland China ID'
  if (primaryQ === 'q_passport_number')    return '🛂 Passport'
  if (primaryQ === 'q_hkid_front')         return '📄 Upload Identity Document'
  if (primaryQ === 'q_email')             return '📱 Contact Details'
  if (primaryQ === 'q_addr_line1' ||
      primaryQ === 'q_addr_line2' ||
      primaryQ === 'q_addr_district')      return '🏠 Residential Address'
  if (primaryQ === 'q_employment_status')  return '💼 Employment & Income'
  if (primaryQ === 'q_source_of_funds')    return '🏦 Source of Funds'
  if (primaryQ === 'q_liveness')           return '😊 Selfie & Liveness Check'
  if (primaryQ === 'q_ob_consent')         return '🔗 Connect Your Bank'
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
  // The store itself is not reactive — only KYCState (which is @Observed) is.
  // We keep @State copies of the two flags that drive the root branch switch so
  // that KYCRootView re-renders when dispatch() changes them.
  private store: KYCStore = new KYCStore()
  @State screenReady: boolean = false
  @State isComplete: boolean = false

  aboutToAppear() {
    this.store.onScreenReady = () => { this.screenReady = true }
    this.store.onComplete    = () => { this.isComplete  = true }
  }

  build() {
    if (this.isComplete) {
      KYCCompletionView()
    } else if (this.screenReady) {
      KYCJourneyView({ state: this.store.state, dispatch: (a: KYCAction) => this.store.dispatch(a) })
    } else {
      KYCWelcomeView({ state: this.store.state, dispatch: (a: KYCAction) => this.store.dispatch(a) })
    }
  }
}

// ─── Welcome view ─────────────────────────────────────────────────────────────

@Component
struct KYCWelcomeView {
  @ObjectLink state: KYCState
  dispatch: (a: KYCAction) => void = (_a: KYCAction) => {}

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
            .onClick(() => { this.dispatch({ type: 'START_SESSION' }) })

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
  dispatch: (a: KYCAction) => void = (_a: KYCAction) => {}

  progress(): number {
    return this.state.totalSteps > 0
      ? this.state.currentStepIndex / this.state.totalSteps * 100
      : 0
  }

  currentStepTitle(): string {
    const payload = this.state.screenPayload
    if (payload === null || payload === undefined) return '📋 Application'
    return stepTitle(primaryQuestionId(payload as SDUIScreenPayload))
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
          this.state.currentStepIndex >= this.state.totalSteps
            ? 'Submit Application' : 'Continue')
          .layoutWeight(1).height(52)
          .borderRadius(Hive.Radius.base)
          .backgroundColor(this.state.isSubmitting ? Hive.Color.n300 : Hive.Color.brandPrimary)
          .fontColor(Hive.Color.brandWhite)
          .fontWeight(FontWeight.Medium)
          .enabled(!this.state.isSubmitting)
          .onClick(() => { this.dispatch({ type: 'SUBMIT_STEP' }) })
      }
      .width('100%')
      .padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4, top: 12, bottom: 28 })
      .backgroundColor(Hive.Color.brandWhite)
    }
    .width('100%').height('100%').backgroundColor(Hive.Color.n50)
  }
}

// ─── Step content router ──────────────────────────────────────────────────────
// Routes on primaryQuestionId — exactly as iOS KYCSDUIStepRouter / Android KYCStepRouter.
// Receives @ObjectLink state: KYCState (from KYCJourneyView.state).

@Component
struct KYCStepContent {
  @ObjectLink state: KYCState

  primaryQ(): string {
    const payload = this.state.screenPayload
    if (payload === null || payload === undefined) return ''
    return primaryQuestionId(payload as SDUIScreenPayload)
  }

  build() {
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
      } else if (this.primaryQ() === 'q_addr_line1' || this.primaryQ() === 'q_addr_line2' ||
                 this.primaryQ() === 'q_addr_district') {
        KYCAddressStep({ state: this.state })
      } else if (this.primaryQ() === 'q_employment_status') {
        KYCEmploymentIncomeStep({ state: this.state })
      } else if (this.primaryQ() === 'q_source_of_funds') {
        KYCSourceOfFundsStep({ state: this.state })
      } else if (this.primaryQ() === 'q_liveness') {
        KYCLivenessStep({ state: this.state })
      } else if (this.primaryQ() === 'q_ob_consent') {
        KYCOpenBankingStep({ state: this.state })
      } else if (this.primaryQ() === 'q_pep_status' ||
                 this.primaryQ() === 'decl_truthful' ||
                 this.primaryQ() === 'decl_fatca') {
        KYCDeclarationStep({ state: this.state })
      } else {
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
