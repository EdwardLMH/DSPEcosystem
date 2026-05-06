// KYCStepViews.ets
// HarmonyNext ArkTS — KYC step UI components
//
// ROUTING CONTRACT (mirrors iOS KYCSDUIStepRouter.swift):
//   Each exported struct is keyed on the PRIMARY QUESTION ID returned by the mock
//   BFF in payload.layout.children[0].props.questionId.
//   Step IDs from the BFF are sequential ("step-001", "step-002" …) and are NOT
//   used for routing — only the primary question ID is.
//
// OBKYC journey — 11 mobile steps:
//
//   step-001  q_first_name          KYCNameDobStep        Personal Info: first name + last name + DOB
//   step-002  q_nationality         KYCNationalityStep    Nationality selector
//   step-003  q_hkid_number         KYCHKIDStep           Identity Doc — HK (if nationality=HK)
//             q_mainland_id         KYCMainlandIDStep     Identity Doc — Mainland China
//             q_passport_number     KYCPassportStep       Identity Doc — all others
//   step-004  q_hkid_front          KYCDocumentStep       Upload Identity Document (front + back)
//   step-005  q_email               KYCContactStep        Contact Details: email + phone
//   step-006  q_addr_line1          KYCAddressStep        Residential Address: line1 + line2 + district
//   step-007  q_employment_status   KYCEmploymentIncomeStep  Employment & Income: status + annual income
//   step-008  q_source_of_funds     KYCSourceOfFundsStep  Source of Funds + Purpose of Account
//   step-009  q_liveness            KYCLivenessStep       Selfie & Liveness Check
//   step-010  q_ob_consent          KYCOpenBankingStep    Connect Your Bank
//   step-011  q_pep_status          KYCDeclarationStep    Legal Declarations

import { Hive } from '../common/HiveTokens'
import { KYCState } from '../models/SDUIModels'

// ─── Shared interfaces ────────────────────────────────────────────────────────

interface StringPair  { code: string; label: string }
interface StringTriple { code: string; label: string; placeholder: string }

interface LivenessInstruction { icon: string; title: string; desc: string }
interface PepOption           { val: string;  label: string }
interface DeclOption          { id: string;   text: string }

// ─── Shared reference data ────────────────────────────────────────────────────

const COUNTRIES: StringPair[] = [
  { code: 'HK',    label: '🇭🇰 Hong Kong SAR' },
  { code: 'CN',    label: '🇨🇳 Mainland China' },
  { code: 'SG',    label: '🇸🇬 Singapore' },
  { code: 'GB',    label: '🇬🇧 United Kingdom' },
  { code: 'US',    label: '🇺🇸 United States' },
  { code: 'AU',    label: '🇦🇺 Australia' },
  { code: 'IN',    label: '🇮🇳 India' },
  { code: 'JP',    label: '🇯🇵 Japan' },
  { code: 'OTHER', label: 'Other' },
]

const HK_DISTRICTS: StringPair[] = [
  { code: 'central_western', label: 'Central & Western (中西區)' },
  { code: 'eastern',         label: 'Eastern (東區)' },
  { code: 'southern',        label: 'Southern (南區)' },
  { code: 'wan_chai',        label: 'Wan Chai (灣仔)' },
  { code: 'kowloon_city',    label: 'Kowloon City (九龍城)' },
  { code: 'kwun_tong',       label: 'Kwun Tong (觀塘)' },
  { code: 'sham_shui_po',    label: 'Sham Shui Po (深水埗)' },
  { code: 'yau_tsim_mong',   label: 'Yau Tsim Mong (油尖旺)' },
  { code: 'sha_tin',         label: 'Sha Tin (沙田)' },
  { code: 'tai_po',          label: 'Tai Po (大埔)' },
  { code: 'north',           label: 'North (北區)' },
  { code: 'islands',         label: 'Islands (離島)' },
]

const EMPLOYMENT_OPTIONS: StringPair[] = [
  { code: 'EMPLOYED',       label: 'Employed (full-time or part-time)' },
  { code: 'SELF_EMPLOYED',  label: 'Self-employed' },
  { code: 'BUSINESS_OWNER', label: 'Business owner' },
  { code: 'RETIRED',        label: 'Retired' },
  { code: 'STUDENT',        label: 'Student' },
  { code: 'HOMEMAKER',      label: 'Homemaker' },
  { code: 'UNEMPLOYED',     label: 'Unemployed' },
]

const INCOME_OPTIONS: StringPair[] = [
  { code: 'below_100k',  label: 'Below HKD 100,000' },
  { code: '100k_300k',   label: 'HKD 100,000 – 300,000' },
  { code: '300k_600k',   label: 'HKD 300,000 – 600,000' },
  { code: '600k_1m',     label: 'HKD 600,000 – 1,000,000' },
  { code: 'above_1m',    label: 'Above HKD 1,000,000' },
  { code: 'prefer_not',  label: 'Prefer not to say' },
]

const FUNDS_OPTIONS: StringPair[] = [
  { code: 'EMPLOYMENT',  label: 'Employment / Salary' },
  { code: 'BUSINESS',    label: 'Business Income' },
  { code: 'INVESTMENT',  label: 'Investment Returns' },
  { code: 'INHERITANCE', label: 'Inheritance / Gift' },
  { code: 'PROPERTY',    label: 'Property Sale' },
  { code: 'PENSION',     label: 'Pension / Retirement Fund' },
  { code: 'SAVINGS',     label: 'Accumulated Savings' },
  { code: 'OTHER',       label: 'Other' },
]

const PURPOSE_OPTIONS: StringPair[] = [
  { code: 'EVERYDAY_BANKING',       label: 'Everyday banking & payments' },
  { code: 'SAVINGS',                label: 'Savings & deposits' },
  { code: 'INVESTMENT',             label: 'Investment & wealth management' },
  { code: 'SALARY_RECEIPT',         label: 'Salary / income receipt' },
  { code: 'INTERNATIONAL_TRANSFER', label: 'International money transfers' },
  { code: 'MORTGAGE',               label: 'Mortgage repayments' },
]

// ─── Helper: safe answer read ─────────────────────────────────────────────────

function answerStr(state: KYCState, key: string): string {
  const v: ESObject = state.answers[key]
  if (v === null || v === undefined) return ''
  return v as string
}

// ─── STEP 001: Full Name + Date of Birth ─────────────────────────────────────
// Primary question: q_first_name

@Component
export struct KYCNameDobStep {
  @ObjectLink state: KYCState

  build() {
    Column({ space: Hive.Spacing.s4 }) {
      // First Name
      Column({ space: Hive.Spacing.s1 }) {
        Row({ space: Hive.Spacing.s1 }) {
          Text('First Name / Given Name').fontSize(Hive.Typography.labelBase).fontColor(Hive.Color.n700)
          Text(' *').fontColor(Hive.Color.error).fontSize(Hive.Typography.labelBase)
        }.width('100%')
        Text('As it appears on your official ID document')
          .fontSize(Hive.Typography.caption).fontColor(Hive.Color.n500).width('100%')
        TextInput({ placeholder: 'e.g. Tai Man', text: answerStr(this.state, 'q_first_name') })
          .width('100%').height(Hive.Component.Input.height)
          .borderRadius(Hive.Radius.base).borderWidth(1).borderColor(Hive.Color.n300)
          .onChange((v: string) => { this.state.setAnswer('q_first_name', v as ESObject) })
      }.width('100%').alignItems(HorizontalAlign.Start)

      // Last Name
      Column({ space: Hive.Spacing.s1 }) {
        Row({ space: Hive.Spacing.s1 }) {
          Text('Last Name / Surname').fontSize(Hive.Typography.labelBase).fontColor(Hive.Color.n700)
          Text(' *').fontColor(Hive.Color.error).fontSize(Hive.Typography.labelBase)
        }.width('100%')
        TextInput({ placeholder: 'e.g. CHAN', text: answerStr(this.state, 'q_last_name') })
          .width('100%').height(Hive.Component.Input.height)
          .borderRadius(Hive.Radius.base).borderWidth(1).borderColor(Hive.Color.n300)
          .onChange((v: string) => { this.state.setAnswer('q_last_name', v as ESObject) })
      }.width('100%').alignItems(HorizontalAlign.Start)

      // Date of Birth
      Column({ space: Hive.Spacing.s1 }) {
        Row({ space: Hive.Spacing.s1 }) {
          Text('Date of Birth').fontSize(Hive.Typography.labelBase).fontColor(Hive.Color.n700)
          Text(' *').fontColor(Hive.Color.error).fontSize(Hive.Typography.labelBase)
        }.width('100%')
        Text('You must be at least 18 years old. Format: YYYY-MM-DD')
          .fontSize(Hive.Typography.caption).fontColor(Hive.Color.n500).width('100%')
        TextInput({ placeholder: 'YYYY-MM-DD', text: answerStr(this.state, 'q_date_of_birth') })
          .width('100%').height(Hive.Component.Input.height)
          .borderRadius(Hive.Radius.base).borderWidth(1).borderColor(Hive.Color.n300)
          .type(InputType.Number)
          .onChange((v: string) => { this.state.setAnswer('q_date_of_birth', v as ESObject) })
      }.width('100%').alignItems(HorizontalAlign.Start)
    }
  }
}

// ─── STEP 002: Nationality ────────────────────────────────────────────────────
// Primary question: q_nationality
//
// FIX: Mutating state.answers (a Record) in-place does NOT trigger ArkTS
// re-render because the Record reference itself doesn't change — only its
// contents do, which the reactivity system can't observe.
// Solution: mirror the selected value in a @State string so the Text label
// and colour expressions bind to a reactive field that DOES trigger re-render.

@Component
export struct KYCNationalityStep {
  @ObjectLink state: KYCState
  @State showPicker: boolean = false
  @State selectedCode: string = ''   // ← reactive mirror of state.answers value

  aboutToAppear() {
    // Restore any previously saved answer (e.g. navigating back)
    this.selectedCode = answerStr(this.state, 'q_nationality')
  }

  natLabel(): string {
    const c = COUNTRIES.find((e: StringPair) => e.code === this.selectedCode)
    return c ? c.label : 'Select nationality'
  }

  build() {
    Column({ space: Hive.Spacing.s4 }) {
      Column({ space: Hive.Spacing.s1 }) {
        Row({ space: Hive.Spacing.s1 }) {
          Text('Nationality').fontSize(Hive.Typography.labelBase).fontColor(Hive.Color.n700)
          Text(' *').fontColor(Hive.Color.error).fontSize(Hive.Typography.labelBase)
        }.width('100%')
        Row() {
          Text(this.natLabel())
            .fontSize(Hive.Typography.bodyBase)
            .fontColor(this.selectedCode === '' ? Hive.Color.n400 : Hive.Color.n800)
            .layoutWeight(1)
          Text('▼').fontSize(12).fontColor(Hive.Color.n400)
        }
        .width('100%').height(Hive.Component.Input.height)
        .padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4 })
        .borderRadius(Hive.Radius.base).borderWidth(1).borderColor(Hive.Color.n300)
        .backgroundColor(Hive.Color.brandWhite)
        .onClick(() => { this.showPicker = true })
      }.width('100%').alignItems(HorizontalAlign.Start)
    }.width('100%')
    .bindSheet($$this.showPicker, this.pickerSheet(), { height: SheetSize.MEDIUM })
  }

  @Builder pickerSheet() {
    Column({ space: 0 }) {
      Text('Select Nationality')
        .fontSize(16).fontWeight(FontWeight.Medium)
        .padding({ left: 16, right: 16, top: 12, bottom: 12 }).width('100%')
      Divider()
      List() {
        ForEach(COUNTRIES, (e: StringPair) => {
          ListItem() {
            Row() {
              Text(e.label).fontSize(15).fontColor(Hive.Color.n800).layoutWeight(1)
              if (e.code === this.selectedCode) {
                Text('✓').fontColor(Hive.Color.success).fontWeight(FontWeight.Bold)
              }
            }.width('100%').height(50).padding({ left: 16, right: 16 })
            .onClick(() => {
              this.selectedCode = e.code              // triggers re-render immediately
              this.state.setAnswer('q_nationality', e.code as ESObject)
              this.showPicker = false
            })
          }
        })
      }.width('100%').layoutWeight(1)
    }.height('100%')
  }
}

// ─── STEP 003a: HKID ──────────────────────────────────────────────────────────
// Primary question: q_hkid_number

@Component
export struct KYCHKIDStep {
  @ObjectLink state: KYCState

  build() {
    Column({ space: Hive.Spacing.s4 }) {
      Column({ space: Hive.Spacing.s1 }) {
        Row({ space: Hive.Spacing.s1 }) {
          Text('HKID Number').fontSize(Hive.Typography.labelBase).fontColor(Hive.Color.n700)
          Text(' *').fontColor(Hive.Color.error).fontSize(Hive.Typography.labelBase)
        }.width('100%')
        Text('Include check digit in brackets, e.g. A123456(7)')
          .fontSize(Hive.Typography.caption).fontColor(Hive.Color.n500).width('100%')
        TextInput({ placeholder: 'A123456(7)', text: answerStr(this.state, 'q_hkid_number') })
          .width('100%').height(Hive.Component.Input.height)
          .borderRadius(Hive.Radius.base).borderWidth(1).borderColor(Hive.Color.n300)
          .onChange((v: string) => { this.state.setAnswer('q_hkid_number', v as ESObject) })
      }.width('100%').alignItems(HorizontalAlign.Start)

      Column({ space: Hive.Spacing.s1 }) {
        Text('HKID Expiry Date').fontSize(Hive.Typography.labelBase).fontColor(Hive.Color.n700).width('100%')
        Text('Enter DD/MM/YYYY or "N/A" for permanent residents')
          .fontSize(Hive.Typography.caption).fontColor(Hive.Color.n500).width('100%')
        TextInput({ placeholder: 'DD/MM/YYYY or N/A', text: answerStr(this.state, 'q_hkid_expiry') })
          .width('100%').height(Hive.Component.Input.height)
          .borderRadius(Hive.Radius.base).borderWidth(1).borderColor(Hive.Color.n300)
          .onChange((v: string) => { this.state.setAnswer('q_hkid_expiry', v as ESObject) })
      }.width('100%').alignItems(HorizontalAlign.Start)
    }
  }
}

// ─── STEP 003b: Mainland China ID ────────────────────────────────────────────
// Primary question: q_mainland_id

@Component
export struct KYCMainlandIDStep {
  @ObjectLink state: KYCState

  build() {
    Column({ space: Hive.Spacing.s4 }) {
      Column({ space: Hive.Spacing.s1 }) {
        Row({ space: Hive.Spacing.s1 }) {
          Text('Mainland China ID (居民身份証)').fontSize(Hive.Typography.labelBase).fontColor(Hive.Color.n700)
          Text(' *').fontColor(Hive.Color.error).fontSize(Hive.Typography.labelBase)
        }.width('100%')
        Text('18-digit resident identity number')
          .fontSize(Hive.Typography.caption).fontColor(Hive.Color.n500).width('100%')
        TextInput({ placeholder: '110101199001011234', text: answerStr(this.state, 'q_mainland_id') })
          .width('100%').height(Hive.Component.Input.height)
          .borderRadius(Hive.Radius.base).borderWidth(1).borderColor(Hive.Color.n300)
          .onChange((v: string) => { this.state.setAnswer('q_mainland_id', v as ESObject) })
      }.width('100%').alignItems(HorizontalAlign.Start)
    }
  }
}

// ─── STEP 003c: Passport ──────────────────────────────────────────────────────
// Primary question: q_passport_number

@Component
export struct KYCPassportStep {
  @ObjectLink state: KYCState

  build() {
    Column({ space: Hive.Spacing.s4 }) {
      Column({ space: Hive.Spacing.s1 }) {
        Row({ space: Hive.Spacing.s1 }) {
          Text('Passport Number').fontSize(Hive.Typography.labelBase).fontColor(Hive.Color.n700)
          Text(' *').fontColor(Hive.Color.error).fontSize(Hive.Typography.labelBase)
        }.width('100%')
        TextInput({ placeholder: 'e.g. X12345678', text: answerStr(this.state, 'q_passport_number') })
          .width('100%').height(Hive.Component.Input.height)
          .borderRadius(Hive.Radius.base).borderWidth(1).borderColor(Hive.Color.n300)
          .onChange((v: string) => { this.state.setAnswer('q_passport_number', v as ESObject) })
      }.width('100%').alignItems(HorizontalAlign.Start)

      Column({ space: Hive.Spacing.s1 }) {
        Row({ space: Hive.Spacing.s1 }) {
          Text('Passport Expiry Date').fontSize(Hive.Typography.labelBase).fontColor(Hive.Color.n700)
          Text(' *').fontColor(Hive.Color.error).fontSize(Hive.Typography.labelBase)
        }.width('100%')
        TextInput({ placeholder: 'DD/MM/YYYY', text: answerStr(this.state, 'q_passport_expiry') })
          .width('100%').height(Hive.Component.Input.height)
          .borderRadius(Hive.Radius.base).borderWidth(1).borderColor(Hive.Color.n300)
          .onChange((v: string) => { this.state.setAnswer('q_passport_expiry', v as ESObject) })
      }.width('100%').alignItems(HorizontalAlign.Start)
    }
  }
}

// ─── STEP 004: Document Upload ────────────────────────────────────────────────
// Primary question: q_hkid_front

@Component
export struct KYCDocumentStep {
  @ObjectLink state: KYCState
  @State frontDone: boolean = false
  @State backDone: boolean  = false

  build() {
    Column({ space: Hive.Spacing.s4 }) {
      // Info banner
      Row({ space: Hive.Spacing.s2 }) {
        Text('📄').fontSize(14)
        Text('Upload a clear photo or scan of your Hong Kong Identity Card')
          .fontSize(13).fontColor(Hive.Color.n700).layoutWeight(1)
      }
      .padding(Hive.Spacing.s3).width('100%')
      .borderRadius(Hive.Radius.md).backgroundColor(Hive.Color.infoLt)

      this.uploadZone('Front / Photo Page', 'Hold flat, ensure all corners are visible',
        this.frontDone, () => {
          this.frontDone = true
          this.state.setAnswer('q_hkid_front', 'captured' as ESObject)
        })

      this.uploadZone('Back Side', 'Required for HKID',
        this.backDone, () => {
          this.backDone = true
          this.state.setAnswer('q_hkid_back', 'captured' as ESObject)
        })

      if (this.frontDone) {
        Column({ space: Hive.Spacing.s2 }) {
          Text('✓ Quality checklist').fontSize(13).fontWeight(FontWeight.Medium)
            .fontColor(Hive.Color.success)
          ForEach([
            'All four corners are visible',
            'Text is clear — no blurring',
            'No glare or shadows',
            'Document is not expired',
          ], (check: string) => {
            Row({ space: Hive.Spacing.s2 }) {
              Text('✔').fontColor(Hive.Color.success).fontSize(12)
              Text(check).fontSize(12).fontColor(Hive.Color.n700)
            }.width('100%')
          })
        }
        .padding(Hive.Spacing.s3).width('100%')
        .borderRadius(Hive.Radius.base).backgroundColor(Hive.Color.successLt)
        .border({ width: 1, color: Hive.Color.success, radius: Hive.Radius.base })
      }
    }.width('100%')
  }

  @Builder uploadZone(label: string, hint: string, isDone: boolean, onCapture: () => void) {
    Column({ space: Hive.Spacing.s1 }) {
      Text(label).fontSize(Hive.Typography.labelBase).fontColor(Hive.Color.n700)
      Text(hint).fontSize(Hive.Typography.caption).fontColor(Hive.Color.n500)
      Stack() {
        if (isDone) {
          Column({ space: 4 }) {
            Text('✓').fontSize(32).fontColor(Hive.Color.success)
            Text('Captured — tap to retake').fontSize(12).fontColor(Hive.Color.success)
          }.width('100%').height(140)
          .justifyContent(FlexAlign.Center).alignItems(HorizontalAlign.Center)
          .borderRadius(Hive.Radius.md).backgroundColor(Hive.Color.successLt)
          .border({ width: 2, color: Hive.Color.success, radius: Hive.Radius.md })
        } else {
          Column({ space: 8 }) {
            Text('📷').fontSize(32)
            Text('Take Photo or Upload').fontSize(14).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n700)
            Text('JPG, PNG or PDF · Max 10MB').fontSize(12).fontColor(Hive.Color.n400)
          }.width('100%').height(140)
          .justifyContent(FlexAlign.Center).alignItems(HorizontalAlign.Center)
          .borderRadius(Hive.Radius.md).backgroundColor(Hive.Color.n50)
          .border({ width: 2, color: Hive.Color.n300, radius: Hive.Radius.md, style: BorderStyle.Dashed })
        }
      }.onClick(onCapture)
    }.width('100%').alignItems(HorizontalAlign.Start)
  }
}

// ─── STEP 005: Contact Details ────────────────────────────────────────────────
// Primary question: q_email

@Component
export struct KYCContactStep {
  @ObjectLink state: KYCState

  build() {
    Column({ space: Hive.Spacing.s4 }) {
      Column({ space: Hive.Spacing.s1 }) {
        Row({ space: Hive.Spacing.s1 }) {
          Text('Email Address').fontSize(Hive.Typography.labelBase).fontColor(Hive.Color.n700)
          Text(' *').fontColor(Hive.Color.error).fontSize(Hive.Typography.labelBase)
        }.width('100%')
        Text("We'll send your application confirmation here")
          .fontSize(Hive.Typography.caption).fontColor(Hive.Color.n500).width('100%')
        TextInput({ placeholder: 'name@example.com', text: answerStr(this.state, 'q_email') })
          .width('100%').height(Hive.Component.Input.height)
          .borderRadius(Hive.Radius.base).borderWidth(1).borderColor(Hive.Color.n300)
          .type(InputType.Email)
          .onChange((v: string) => { this.state.setAnswer('q_email', v as ESObject) })
      }.width('100%').alignItems(HorizontalAlign.Start)

      Column({ space: Hive.Spacing.s1 }) {
        Row({ space: Hive.Spacing.s1 }) {
          Text('Mobile Phone Number').fontSize(Hive.Typography.labelBase).fontColor(Hive.Color.n700)
          Text(' *').fontColor(Hive.Color.error).fontSize(Hive.Typography.labelBase)
        }.width('100%')
        Text('Enter local HK number (8 digits)')
          .fontSize(Hive.Typography.caption).fontColor(Hive.Color.n500).width('100%')
        Row({ space: Hive.Spacing.s2 }) {
          Row() {
            Text('🇭🇰 +852').fontSize(14).fontColor(Hive.Color.n800)
          }
          .height(Hive.Component.Input.height)
          .padding({ left: 12, right: 12 })
          .borderRadius(Hive.Radius.base).borderWidth(1).borderColor(Hive.Color.n300)
          .backgroundColor(Hive.Color.n50)

          TextInput({ placeholder: '91234567', text: answerStr(this.state, 'q_phone') })
            .layoutWeight(1).height(Hive.Component.Input.height)
            .borderRadius(Hive.Radius.base).borderWidth(1).borderColor(Hive.Color.n300)
            .type(InputType.PhoneNumber)
            .onChange((v: string) => { this.state.setAnswer('q_phone', `+852${v}` as ESObject) })
        }.width('100%')
      }.width('100%').alignItems(HorizontalAlign.Start)
    }.width('100%')
  }
}

// ─── STEP 006: Residential Address (lines + district) ────────────────────────
// Primary question: q_addr_line1

@Component
export struct KYCAddressStep {
  @ObjectLink state: KYCState

  sendAddress() {
    const line1 = answerStr(this.state, 'q_addr_line1')
    const line2 = answerStr(this.state, 'q_addr_line2')
    const dist  = answerStr(this.state, 'q_addr_district')
    const parts: string[] = []
    if (line1 !== '') parts.push(line1)
    if (line2 !== '') parts.push(line2)
    if (dist !== '')  parts.push(dist)
    this.state.setAnswer('q_address', parts.join(', ') as ESObject)
  }

  @State showDistrictPicker: boolean = false
  @State selectedDistrict: string = ''

  aboutToAppear() { this.selectedDistrict = answerStr(this.state, 'q_addr_district') }

  distLabel(): string {
    const d = HK_DISTRICTS.find((e: StringPair) => e.code === this.selectedDistrict)
    return d ? d.label : 'Select district'
  }

  build() {
    Column({ space: Hive.Spacing.s3 }) {
      Row({ space: Hive.Spacing.s2 }) {
        Text('📍').fontSize(12)
        Text('Hong Kong Address Format')
          .fontSize(12).fontWeight(FontWeight.Medium).fontColor(Hive.Color.brandPrimary)
      }
      .padding({ left: 12, right: 12, top: 4, bottom: 4 })
      .borderRadius(Hive.Radius.full).backgroundColor('#FFEEEF')

      Column({ space: Hive.Spacing.s1 }) {
        Row() {
          Text('Address Line 1').fontSize(Hive.Typography.labelBase).fontColor(Hive.Color.n700)
          Text(' *').fontColor(Hive.Color.error)
        }.width('100%')
        Text('Flat / Floor / Block').fontSize(Hive.Typography.caption).fontColor(Hive.Color.n500).width('100%')
        TextInput({ placeholder: 'e.g. Flat B, 12/F, Block 3', text: answerStr(this.state, 'q_addr_line1') })
          .width('100%').height(Hive.Component.Input.height)
          .borderRadius(Hive.Radius.base).borderWidth(1).borderColor(Hive.Color.n300)
          .onChange((v: string) => { this.state.setAnswer('q_addr_line1', v as ESObject); this.sendAddress() })
      }.width('100%').alignItems(HorizontalAlign.Start)

      Column({ space: Hive.Spacing.s1 }) {
        Text('Address Line 2').fontSize(Hive.Typography.labelBase).fontColor(Hive.Color.n700).width('100%')
        Text('Building name / Estate (optional)').fontSize(Hive.Typography.caption).fontColor(Hive.Color.n500).width('100%')
        TextInput({ placeholder: 'Building / Estate name', text: answerStr(this.state, 'q_addr_line2') })
          .width('100%').height(Hive.Component.Input.height)
          .borderRadius(Hive.Radius.base).borderWidth(1).borderColor(Hive.Color.n300)
          .onChange((v: string) => { this.state.setAnswer('q_addr_line2', v as ESObject); this.sendAddress() })
      }.width('100%').alignItems(HorizontalAlign.Start)

      Column({ space: Hive.Spacing.s1 }) {
        Row() {
          Text('District').fontSize(Hive.Typography.labelBase).fontColor(Hive.Color.n700)
          Text(' *').fontColor(Hive.Color.error)
        }.width('100%')
        Row() {
          Text(this.distLabel())
            .fontSize(Hive.Typography.bodyBase)
            .fontColor(this.selectedDistrict === '' ? Hive.Color.n400 : Hive.Color.n800)
            .layoutWeight(1)
          Text('▼').fontSize(12).fontColor(Hive.Color.n400)
        }
        .width('100%').height(Hive.Component.Input.height)
        .padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4 })
        .borderRadius(Hive.Radius.base).borderWidth(1).borderColor(Hive.Color.n300)
        .backgroundColor(Hive.Color.brandWhite)
        .onClick(() => { this.showDistrictPicker = true })
      }.width('100%').alignItems(HorizontalAlign.Start)
    }.width('100%')
    .bindSheet($$this.showDistrictPicker, this.districtPickerSheet(), { height: SheetSize.MEDIUM })
  }

  @Builder districtPickerSheet() {
    Column({ space: 0 }) {
      Text('Select District').fontSize(16).fontWeight(FontWeight.Medium)
        .padding({ left: 16, right: 16, top: 12, bottom: 12 }).width('100%')
      Divider()
      List() {
        ForEach(HK_DISTRICTS, (e: StringPair) => {
          ListItem() {
            Row() {
              Text(e.label).fontSize(15).fontColor(Hive.Color.n800).layoutWeight(1)
              if (e.code === this.selectedDistrict) {
                Text('✓').fontColor(Hive.Color.success).fontWeight(FontWeight.Bold)
              }
            }.width('100%').height(50).padding({ left: 16, right: 16 })
            .onClick(() => {
              this.selectedDistrict = e.code
              this.state.setAnswer('q_addr_district', e.code as ESObject)
              this.showDistrictPicker = false
              this.sendAddress()
            })
          }
        })
      }.width('100%').layoutWeight(1)
    }.height('100%')
  }
}

// ─── STEP 007: Employment Status + Annual Income ──────────────────────────────
// Primary question: q_employment_status

@Component
export struct KYCEmploymentIncomeStep {
  @ObjectLink state: KYCState
  @State showEmpPicker: boolean = false
  @State selectedEmp: string = ''
  @State showIncPicker: boolean = false
  @State selectedInc: string = ''

  aboutToAppear() {
    this.selectedEmp = answerStr(this.state, 'q_employment_status')
    this.selectedInc = answerStr(this.state, 'q_annual_income')
  }

  empLabel(): string {
    const o = EMPLOYMENT_OPTIONS.find((e: StringPair) => e.code === this.selectedEmp)
    return o ? o.label : 'Select employment status'
  }

  incLabel(): string {
    const o = INCOME_OPTIONS.find((e: StringPair) => e.code === this.selectedInc)
    return o ? o.label : 'Select annual income range'
  }

  build() {
    Column({ space: Hive.Spacing.s4 }) {
      // Each picker trigger lives in its own Column so .bindSheet() has a dedicated node.
      // Attaching two .bindSheet() modifiers to the same node causes sheet flicker on HarmonyNext.
      Column({ space: Hive.Spacing.s1 }) {
        Row() {
          Text('Employment Status').fontSize(Hive.Typography.labelBase).fontColor(Hive.Color.n700)
          Text(' *').fontColor(Hive.Color.error)
        }.width('100%')
        Row() {
          Text(this.empLabel())
            .fontSize(Hive.Typography.bodyBase)
            .fontColor(this.selectedEmp === '' ? Hive.Color.n400 : Hive.Color.n800)
            .layoutWeight(1)
          Text('▼').fontSize(12).fontColor(Hive.Color.n400)
        }
        .width('100%').height(Hive.Component.Input.height)
        .padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4 })
        .borderRadius(Hive.Radius.base).borderWidth(1).borderColor(Hive.Color.n300)
        .backgroundColor(Hive.Color.brandWhite)
        .onClick(() => { this.showEmpPicker = true })
      }.width('100%').alignItems(HorizontalAlign.Start)
      .bindSheet($$this.showEmpPicker, this.empPickerSheet(), { height: SheetSize.MEDIUM })

      Column({ space: Hive.Spacing.s1 }) {
        Row() {
          Text('Annual Income (HKD)').fontSize(Hive.Typography.labelBase).fontColor(Hive.Color.n700)
          Text(' *').fontColor(Hive.Color.error)
        }.width('100%')
        Row() {
          Text(this.incLabel())
            .fontSize(Hive.Typography.bodyBase)
            .fontColor(this.selectedInc === '' ? Hive.Color.n400 : Hive.Color.n800)
            .layoutWeight(1)
          Text('▼').fontSize(12).fontColor(Hive.Color.n400)
        }
        .width('100%').height(Hive.Component.Input.height)
        .padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4 })
        .borderRadius(Hive.Radius.base).borderWidth(1).borderColor(Hive.Color.n300)
        .backgroundColor(Hive.Color.brandWhite)
        .onClick(() => { this.showIncPicker = true })
      }.width('100%').alignItems(HorizontalAlign.Start)
      .bindSheet($$this.showIncPicker, this.incPickerSheet(), { height: SheetSize.MEDIUM })
    }.width('100%')
  }

  @Builder empPickerSheet() {
    Column({ space: 0 }) {
      Text('Employment Status').fontSize(16).fontWeight(FontWeight.Medium)
        .padding({ left: 16, right: 16, top: 12, bottom: 12 }).width('100%')
      Divider()
      List() {
        ForEach(EMPLOYMENT_OPTIONS, (e: StringPair) => {
          ListItem() {
            Row() {
              Text(e.label).fontSize(15).fontColor(Hive.Color.n800).layoutWeight(1)
              if (e.code === this.selectedEmp) {
                Text('✓').fontColor(Hive.Color.success).fontWeight(FontWeight.Bold)
              }
            }.width('100%').height(50).padding({ left: 16, right: 16 })
            .onClick(() => {
              this.selectedEmp = e.code
              this.state.setAnswer('q_employment_status', e.code as ESObject)
              this.showEmpPicker = false
            })
          }
        })
      }.width('100%').layoutWeight(1)
    }.height('100%')
  }

  @Builder incPickerSheet() {
    Column({ space: 0 }) {
      Text('Annual Income (HKD)').fontSize(16).fontWeight(FontWeight.Medium)
        .padding({ left: 16, right: 16, top: 12, bottom: 12 }).width('100%')
      Divider()
      List() {
        ForEach(INCOME_OPTIONS, (e: StringPair) => {
          ListItem() {
            Row() {
              Text(e.label).fontSize(15).fontColor(Hive.Color.n800).layoutWeight(1)
              if (e.code === this.selectedInc) {
                Text('✓').fontColor(Hive.Color.success).fontWeight(FontWeight.Bold)
              }
            }.width('100%').height(50).padding({ left: 16, right: 16 })
            .onClick(() => {
              this.selectedInc = e.code
              this.state.setAnswer('q_annual_income', e.code as ESObject)
              this.showIncPicker = false
            })
          }
        })
      }.width('100%').layoutWeight(1)
    }.height('100%')
  }
}

// ─── STEP 008: Source of Funds + Purpose of Account ──────────────────────────
// Primary question: q_source_of_funds

@Component
export struct KYCSourceOfFundsStep {
  @ObjectLink state: KYCState
  @State showFundsPicker: boolean = false
  @State selectedFunds: string = ''
  @State showPurposePicker: boolean = false
  @State selectedPurpose: string = ''

  aboutToAppear() {
    this.selectedFunds   = answerStr(this.state, 'q_source_of_funds')
    this.selectedPurpose = answerStr(this.state, 'q_account_purpose')
  }

  fundsLabel(): string {
    const o = FUNDS_OPTIONS.find((e: StringPair) => e.code === this.selectedFunds)
    return o ? o.label : 'Select primary source of funds'
  }

  purposeLabel(): string {
    const o = PURPOSE_OPTIONS.find((e: StringPair) => e.code === this.selectedPurpose)
    return o ? o.label : 'Select purpose of account'
  }

  build() {
    Column({ space: Hive.Spacing.s4 }) {
      // Each picker trigger lives in its own Column so .bindSheet() has a dedicated node.
      Column({ space: Hive.Spacing.s1 }) {
        Row() {
          Text('Primary Source of Funds').fontSize(Hive.Typography.labelBase).fontColor(Hive.Color.n700)
          Text(' *').fontColor(Hive.Color.error)
        }.width('100%')
        Row() {
          Text(this.fundsLabel())
            .fontSize(Hive.Typography.bodyBase)
            .fontColor(this.selectedFunds === '' ? Hive.Color.n400 : Hive.Color.n800)
            .layoutWeight(1)
          Text('▼').fontSize(12).fontColor(Hive.Color.n400)
        }
        .width('100%').height(Hive.Component.Input.height)
        .padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4 })
        .borderRadius(Hive.Radius.base).borderWidth(1).borderColor(Hive.Color.n300)
        .backgroundColor(Hive.Color.brandWhite)
        .onClick(() => { this.showFundsPicker = true })
      }.width('100%').alignItems(HorizontalAlign.Start)
      .bindSheet($$this.showFundsPicker, this.fundsPickerSheet(), { height: SheetSize.MEDIUM })

      Column({ space: Hive.Spacing.s1 }) {
        Row() {
          Text('Purpose of Account').fontSize(Hive.Typography.labelBase).fontColor(Hive.Color.n700)
          Text(' *').fontColor(Hive.Color.error)
        }.width('100%')
        Row() {
          Text(this.purposeLabel())
            .fontSize(Hive.Typography.bodyBase)
            .fontColor(this.selectedPurpose === '' ? Hive.Color.n400 : Hive.Color.n800)
            .layoutWeight(1)
          Text('▼').fontSize(12).fontColor(Hive.Color.n400)
        }
        .width('100%').height(Hive.Component.Input.height)
        .padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4 })
        .borderRadius(Hive.Radius.base).borderWidth(1).borderColor(Hive.Color.n300)
        .backgroundColor(Hive.Color.brandWhite)
        .onClick(() => { this.showPurposePicker = true })
      }.width('100%').alignItems(HorizontalAlign.Start)
      .bindSheet($$this.showPurposePicker, this.purposePickerSheet(), { height: SheetSize.MEDIUM })
    }.width('100%')
  }

  @Builder fundsPickerSheet() {
    Column({ space: 0 }) {
      Text('Primary Source of Funds').fontSize(16).fontWeight(FontWeight.Medium)
        .padding({ left: 16, right: 16, top: 12, bottom: 12 }).width('100%')
      Divider()
      List() {
        ForEach(FUNDS_OPTIONS, (e: StringPair) => {
          ListItem() {
            Row() {
              Text(e.label).fontSize(15).fontColor(Hive.Color.n800).layoutWeight(1)
              if (e.code === this.selectedFunds) {
                Text('✓').fontColor(Hive.Color.success).fontWeight(FontWeight.Bold)
              }
            }.width('100%').height(50).padding({ left: 16, right: 16 })
            .onClick(() => {
              this.selectedFunds = e.code
              this.state.setAnswer('q_source_of_funds', e.code as ESObject)
              this.showFundsPicker = false
            })
          }
        })
      }.width('100%').layoutWeight(1)
    }.height('100%')
  }

  @Builder purposePickerSheet() {
    Column({ space: 0 }) {
      Text('Purpose of Account').fontSize(16).fontWeight(FontWeight.Medium)
        .padding({ left: 16, right: 16, top: 12, bottom: 12 }).width('100%')
      Divider()
      List() {
        ForEach(PURPOSE_OPTIONS, (e: StringPair) => {
          ListItem() {
            Row() {
              Text(e.label).fontSize(15).fontColor(Hive.Color.n800).layoutWeight(1)
              if (e.code === this.selectedPurpose) {
                Text('✓').fontColor(Hive.Color.success).fontWeight(FontWeight.Bold)
              }
            }.width('100%').height(50).padding({ left: 16, right: 16 })
            .onClick(() => {
              this.selectedPurpose = e.code
              this.state.setAnswer('q_account_purpose', e.code as ESObject)
              this.showPurposePicker = false
            })
          }
        })
      }.width('100%').layoutWeight(1)
    }.height('100%')
  }
}

// ─── STEP 012: Liveness Check ─────────────────────────────────────────────────
// Primary question: q_liveness

@Component
export struct KYCLivenessStep {
  @ObjectLink state: KYCState
  @State phase: string = 'instructions'
  @State progress: number = 0

  simulateProcessing() {
    this.phase = 'processing'
    const timer = setInterval(() => {
      this.progress = Math.min(this.progress + 2, 100)
      if (this.progress >= 100) {
        clearInterval(timer)
        setTimeout(() => {
          this.phase = 'done'
          this.state.setAnswer('q_liveness', 'PASSED' as ESObject)
        }, 300)
      }
    }, 50)
  }

  build() {
    Column({ space: Hive.Spacing.s4 }) {
      if (this.phase === 'instructions') {
        Column({ space: Hive.Spacing.s3 }) {
          Column({ space: Hive.Spacing.s2 }) {
            Text('🔒 Liveness Detection — Identity Verification')
              .fontSize(14).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n800)
            Text('We verify you are a real person matching your ID. This takes ~30 seconds.')
              .fontSize(13).fontColor(Hive.Color.n700)
          }
          .padding(Hive.Spacing.s4).width('100%')
          .borderRadius(Hive.Radius.md).backgroundColor(Hive.Color.infoLt)

          ForEach([
            { icon: '😊', title: 'Face the camera', desc: 'Position in oval with good lighting.' } as LivenessInstruction,
            { icon: '👁️', title: 'Follow prompts',  desc: 'You may be asked to blink or turn.' } as LivenessInstruction,
            { icon: '📸', title: 'Stay still',       desc: 'Hold steady while we capture.' } as LivenessInstruction,
          ], (item: LivenessInstruction) => {
            Row({ space: Hive.Spacing.s3 }) {
              Text(item.icon).fontSize(22)
                .width(44).height(44).textAlign(TextAlign.Center)
                .borderRadius(Hive.Radius.md).backgroundColor('#FFEEEF')
              Column({ space: 2 }) {
                Text(item.title).fontSize(14).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n800)
                Text(item.desc).fontSize(12).fontColor(Hive.Color.n600)
              }.layoutWeight(1).alignItems(HorizontalAlign.Start)
            }.width('100%').padding(Hive.Spacing.s4)
            .borderRadius(Hive.Radius.md).backgroundColor(Hive.Color.brandWhite)
          })

          Button('Begin Liveness Check')
            .width('100%').height(Hive.Component.Button.height)
            .borderRadius(Hive.Radius.base).backgroundColor(Hive.Color.brandPrimary)
            .fontColor(Hive.Color.brandWhite).fontWeight(FontWeight.Medium)
            .onClick(() => { this.simulateProcessing() })
        }
      } else if (this.phase === 'processing') {
        Column({ space: Hive.Spacing.s4 }) {
          LoadingProgress().color(Hive.Color.brandPrimary).width(56).height(56)
          Text('Verifying your identity…').fontSize(16).fontWeight(FontWeight.Medium)
          Progress({ value: this.progress, total: 100, type: ProgressType.Linear })
            .width('100%').color(Hive.Color.brandPrimary)
          Text('Matching against your ID using facial recognition…')
            .fontSize(12).fontColor(Hive.Color.n500).textAlign(TextAlign.Center)
        }.width('100%').alignItems(HorizontalAlign.Center).padding(Hive.Spacing.s6)
      } else {
        Column({ space: Hive.Spacing.s4 }) {
          Text('✅').fontSize(56)
          Text('Liveness Check Passed')
            .fontSize(20).fontWeight(FontWeight.Bold).fontColor(Hive.Color.success)
          Text('Facial match confidence: 98.4%\nYour identity has been verified.')
            .fontSize(13).fontColor(Hive.Color.n700).textAlign(TextAlign.Center)
        }
        .width('100%').padding(Hive.Spacing.s6).alignItems(HorizontalAlign.Center)
        .borderRadius(Hive.Radius.md).backgroundColor(Hive.Color.successLt)
        .border({ width: 1, color: Hive.Color.success, radius: Hive.Radius.md })
      }
    }.width('100%')
  }
}

// ─── STEP 013: Open Banking ───────────────────────────────────────────────────
// Primary question: q_ob_consent

@Component
export struct KYCOpenBankingStep {
  @ObjectLink state: KYCState
  @State selectedBank: string = ''
  @State connected: boolean = false
  @State connecting: boolean = false
  @State showBankPicker: boolean = false

  private banks: StringPair[] = [
    { code: 'HSBC_HK',   label: 'HSBC Hong Kong' },
    { code: 'BOC_HK',    label: 'Bank of China (Hong Kong)' },
    { code: 'HANG_SENG', label: 'Hang Seng Bank' },
    { code: 'SCB_HK',    label: 'Standard Chartered Hong Kong' },
    { code: 'CITI_HK',   label: 'Citibank Hong Kong' },
    { code: 'DBS_HK',    label: 'DBS Bank Hong Kong' },
    { code: 'BEA',       label: 'Bank of East Asia' },
  ]

  bankLabel(): string {
    const b = this.banks.find((e: StringPair) => e.code === this.selectedBank)
    return b ? b.label : 'Select your bank'
  }

  // FIX: const declarations are forbidden inside build() — even in else branches.
  // Pre-compute the button label in a method so build() stays pure UI syntax.
  connectBtnLabel(): string {
    const name: string = this.bankLabel() === 'Select your bank' ? 'your bank' : this.bankLabel()
    return this.connecting ? 'Connecting…' : 'Connect to ' + name + ' securely'
  }

  connectBank() {
    this.connecting = true
    setTimeout(() => {
      this.connecting = false
      this.connected = true
      this.state.setAnswer('q_ob_consent', `tok_${Math.floor(Math.random() * 900000 + 100000)}` as ESObject)
    }, 1500)
  }

  build() {
    Column({ space: Hive.Spacing.s3 }) {
      Column({ space: Hive.Spacing.s2 }) {
        Text('🔒 Open Banking — Secure Account Connection')
          .fontSize(14).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n800)
        Text('We use Open Banking (HKMA regulated) to verify your identity. Your bank credentials are never shared with HSBC.')
          .fontSize(13).fontColor(Hive.Color.n700)
      }.padding(Hive.Spacing.s4).width('100%')
      .borderRadius(Hive.Radius.md).backgroundColor(Hive.Color.infoLt)

      Column({ space: Hive.Spacing.s1 }) {
        Row() {
          Text('Your current bank').fontSize(Hive.Typography.labelBase).fontColor(Hive.Color.n700)
          Text(' *').fontColor(Hive.Color.error)
        }.width('100%')
        Row() {
          Text(this.bankLabel())
            .fontSize(Hive.Typography.bodyBase)
            .fontColor(this.selectedBank === '' ? Hive.Color.n400 : Hive.Color.n800)
            .layoutWeight(1)
          Text('▼').fontSize(12).fontColor(Hive.Color.n400)
        }
        .width('100%').height(Hive.Component.Input.height)
        .padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4 })
        .borderRadius(Hive.Radius.base).borderWidth(1).borderColor(Hive.Color.n300)
        .backgroundColor(Hive.Color.brandWhite)
        .onClick(() => { this.showBankPicker = true })
      }.width('100%').alignItems(HorizontalAlign.Start)

      if (this.connected) {
        Row({ space: Hive.Spacing.s3 }) {
          Text('🏦').fontSize(28)
          Column({ space: 2 }) {
            Text('Bank Connected Successfully')
              .fontSize(14).fontWeight(FontWeight.Medium).fontColor(Hive.Color.success)
            Text('Account ownership verified · 90-day access')
              .fontSize(12).fontColor(Hive.Color.n600)
          }.layoutWeight(1).alignItems(HorizontalAlign.Start)
        }
        .width('100%').padding(Hive.Spacing.s4)
        .borderRadius(Hive.Radius.md).backgroundColor(Hive.Color.successLt)
        .border({ width: 1, color: Hive.Color.success, radius: Hive.Radius.md })
      } else {
        Button(this.connectBtnLabel())
          .width('100%').height(Hive.Component.Button.height)
          .borderRadius(Hive.Radius.base)
          .backgroundColor(this.selectedBank === '' || this.connecting ? Hive.Color.n300 : Hive.Color.brandPrimary)
          .fontColor(Hive.Color.brandWhite).fontWeight(FontWeight.Medium)
          .enabled(this.selectedBank !== '' && !this.connecting)
          .onClick(() => { this.connectBank() })
      }

      Text('Powered by Open Banking · Regulated by the HKMA')
        .fontSize(11).fontColor(Hive.Color.n400).textAlign(TextAlign.Center).width('100%')
    }.width('100%')
    .bindSheet($$this.showBankPicker, this.bankPickerSheet(), { height: SheetSize.MEDIUM })
  }

  @Builder bankPickerSheet() {
    Column() {
      Text('Select Bank').fontSize(16).fontWeight(FontWeight.Medium)
        .padding({ left: 16, right: 16, top: 12, bottom: 12 }).width('100%')
      Divider()
      List() {
        ForEach(this.banks, (e: StringPair) => {
          ListItem() {
            Row() {
              Text(e.label).fontSize(15).fontColor(Hive.Color.n800).layoutWeight(1)
              if (e.code === this.selectedBank) {
                Text('✓').fontColor(Hive.Color.success).fontWeight(FontWeight.Bold)
              }
            }.width('100%').height(50).padding({ left: 16, right: 16 })
            .onClick(() => { this.selectedBank = e.code; this.showBankPicker = false })
          }
        })
      }.width('100%').layoutWeight(1)
      Blank().height(40)
    }
  }
}

// ─── STEP 014: Legal Declarations ────────────────────────────────────────────
// Primary question: q_pep_status

@Component
export struct KYCDeclarationStep {
  @ObjectLink state: KYCState
  @State pepStatus: string = ''
  // @State mirrors drive re-render — mutating state.answers in-place doesn't trigger @ObjectLink diff
  @State declTruthful: boolean = false
  @State declFatca: boolean = false

  aboutToAppear() {
    this.declTruthful = this.state.answers['decl_truthful'] === true
    this.declFatca    = this.state.answers['decl_fatca'] === true
  }

  isChecked(id: string): boolean {
    return id === 'decl_truthful' ? this.declTruthful : this.declFatca
  }

  @Builder declRow(decl: DeclOption) {
    Row({ space: Hive.Spacing.s3 }) {
      Stack() {
        Rect({ width: 22, height: 22 }).radius(4)
          .stroke(this.isChecked(decl.id) ? Hive.Color.success : Hive.Color.n300)
          .strokeWidth(2)
          .fill(this.isChecked(decl.id) ? Hive.Color.success : 'transparent')
        if (this.isChecked(decl.id)) {
          Text('✓').fontSize(13).fontColor(Hive.Color.brandWhite).fontWeight(FontWeight.Bold)
        }
      }.width(22).height(22)
      Text(decl.text).fontSize(13).fontColor(Hive.Color.n700).layoutWeight(1)
    }.width('100%').padding(Hive.Spacing.s4)
    .borderRadius(Hive.Radius.md)
    .backgroundColor(this.isChecked(decl.id) ? Hive.Color.successLt : Hive.Color.n50)
    .border({
      width: 1,
      color: this.isChecked(decl.id) ? Hive.Color.success : Hive.Color.n200,
      radius: Hive.Radius.md
    })
    .onClick(() => {
      if (decl.id === 'decl_truthful') {
        this.declTruthful = !this.declTruthful
        this.state.setAnswer(decl.id, this.declTruthful as ESObject)
      } else {
        this.declFatca = !this.declFatca
        this.state.setAnswer(decl.id, this.declFatca as ESObject)
      }
    })
  }

  build() {
    Column({ space: Hive.Spacing.s4 }) {
      Column({ space: Hive.Spacing.s3 }) {
        Text('Politically Exposed Person (PEP) Status')
          .fontSize(Hive.Typography.labelBase).fontColor(Hive.Color.n700)
        Text('A PEP holds or has held a prominent public position in the last 12 months')
          .fontSize(Hive.Typography.caption).fontColor(Hive.Color.n500)
        ForEach([
          { val: 'NO',     label: 'I am not a PEP and not related to a PEP' } as PepOption,
          { val: 'YES',    label: 'I am a PEP or closely related to a PEP' } as PepOption,
          { val: 'FORMER', label: 'I was a PEP more than 12 months ago' } as PepOption,
        ], (item: PepOption) => {
          Row({ space: Hive.Spacing.s3 }) {
            Stack() {
              Circle({ width: 20, height: 20 })
                .stroke(this.pepStatus === item.val ? Hive.Color.brandPrimary : Hive.Color.n300)
                .strokeWidth(2).fill('transparent')
              if (this.pepStatus === item.val) {
                Circle({ width: 10, height: 10 }).fill(Hive.Color.brandPrimary)
              }
            }.width(20).height(20)
            Text(item.label).fontSize(14).fontColor(Hive.Color.n700).layoutWeight(1)
          }.width('100%').padding(Hive.Spacing.s4)
          .borderRadius(Hive.Radius.md)
          .backgroundColor(this.pepStatus === item.val ? '#FFEEEF' : Hive.Color.n50)
          .border({
            width: 1,
            color: this.pepStatus === item.val ? Hive.Color.brandPrimary : Hive.Color.n200,
            radius: Hive.Radius.md
          })
          .onClick(() => {
            this.pepStatus = item.val
            this.state.setAnswer('q_pep_status', item.val as ESObject)
          })
        })
      }.width('100%').alignItems(HorizontalAlign.Start)

      ForEach([
        { id: 'decl_truthful', text: 'All information provided is true, accurate and complete to the best of my knowledge.' } as DeclOption,
        { id: 'decl_fatca',    text: 'I confirm I am NOT a US person for FATCA purposes (no US citizenship, Green Card, or tax residency).' } as DeclOption,
      ], (decl: DeclOption) => {
        this.declRow(decl)
      })

      Text("By submitting, you consent to HSBC processing your personal data under the Personal Data (Privacy) Ordinance (Cap. 486) and HSBC's Privacy Notice.")
        .fontSize(11).fontColor(Hive.Color.n400)
        .padding(Hive.Spacing.s3).width('100%')
        .borderRadius(Hive.Radius.md).backgroundColor(Hive.Color.n100)
    }.width('100%')
  }
}
