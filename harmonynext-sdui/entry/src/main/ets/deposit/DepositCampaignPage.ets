// DepositCampaignPage.ets
// HarmonyNext ArkTS — New Fund Deposit Campaign (CN) page
// Loads slice layout from the BFF (GET /api/v1/screen/deposit-campaign-hk).
// The page is always LIVE in mock-bff so it never falls back to the static layout
// unless the BFF is unreachable.

import { Hive } from '../common/HiveTokens'
import { SensorDataClient } from '../network/SensorDataClient'
import { fetchDepositCampaignScreen, WealthSlice } from '../network/KYCNetworkService'

// ─── Load-state enum ──────────────────────────────────────────────────────────
// ArkTS forbids string-union @State — plain number constants are used instead.
const LOAD_IDLE    = 0
const LOAD_LOADING = 1
const LOAD_DONE    = 2
const LOAD_ERROR   = 3

// ─── SDUI slice renderer ──────────────────────────────────────────────────────

@Component
struct DepositSDUISliceView {
  slice: WealthSlice = { instanceId: '', type: '', props: {}, visible: true }
  onBack: () => void = () => {}

  build() {
    if (this.slice.visible === false) {
      Column() {}
    } else {
      this.renderSlice()
    }
  }

  @Builder renderSlice() {
    if (this.slice.type === 'HEADER_NAV') {
      DepositHeaderBar({
        title: this.slice.props['title'] as string ?? 'Renminbi Savings Offers',
        showBack: this.slice.props['showBackButton'] as boolean ?? true,
        onBack: this.onBack
      })
    } else if (this.slice.type === 'PROMO_BANNER') {
      DepositPromoBanner({ props: this.slice.props })
    } else if (this.slice.type === 'DEPOSIT_RATE_TABLE') {
      DepositRateTable({ props: this.slice.props })
    } else if (this.slice.type === 'DEPOSIT_OPEN_CTA') {
      DepositOpenCTA({ props: this.slice.props })
    } else if (this.slice.type === 'DEPOSIT_FAQ') {
      DepositFAQSection({ props: this.slice.props })
    } else if (this.slice.type === 'SPACER') {
      Blank().height((this.slice.props['height'] as number) ?? 16)
    }
    // unknown types silently omitted
  }
}

// ─── Root view ────────────────────────────────────────────────────────────────

@Component
export struct DepositCampaignView {
  @State loadState: number   = LOAD_IDLE
  @State sdui: WealthSlice[] = []
  onBack: () => void = () => {}

  aboutToAppear() {
    SensorDataClient.track('deposit_campaign_viewed', 'Deposit', 'page_viewed', '',
      'deposit_campaign_hk', 'deposit_campaign')
    this.loadFromBFF()
  }

  private async loadFromBFF(): Promise<void> {
    this.loadState = LOAD_LOADING
    try {
      const payload = await fetchDepositCampaignScreen()
      this.sdui = payload.layout.children.filter((s: WealthSlice) => s.visible !== false)
      this.loadState = LOAD_DONE
    } catch (_e) {
      this.loadState = LOAD_ERROR
    }
  }

  build() {
    Column() {
      if (this.loadState === LOAD_LOADING) {
        DepositHeaderBar({ title: 'Renminbi Savings Offers', showBack: true, onBack: this.onBack })
        Row() {
          LoadingProgress().width(36).height(36).color(Hive.Color.brandPrimary)
        }
        .width('100%').layoutWeight(1).justifyContent(FlexAlign.Center)

      } else if (this.loadState === LOAD_DONE && this.sdui.length > 0) {
        // SDUI path — render all slices from BFF
        Scroll() {
          Column({ space: 0 }) {
            ForEach(
              this.sdui,
              (slice: WealthSlice) => {
                DepositSDUISliceView({ slice: slice, onBack: this.onBack })
              }
            )
            Blank().height(32)
          }.width('100%')
        }.width('100%').layoutWeight(1).backgroundColor(Hive.Color.n50)

      } else {
        // Static fallback
        Scroll() {
          Column({ space: 0 }) {
            DepositHeaderBar({ title: 'Renminbi Savings Offers', showBack: true, onBack: this.onBack })
            DepositHeroBanner()
            DepositCalloutBanner()
            DepositHardcodedRateTable()
            DepositHardcodedCTA()
            Blank().height(16)
            DepositHardcodedFAQ()
            Blank().height(32)
          }.width('100%')
        }.width('100%').layoutWeight(1).backgroundColor(Hive.Color.n50)
      }
    }
    .width('100%').height('100%')
  }
}

// ─── 1. Header Bar ────────────────────────────────────────────────────────────

@Component
struct DepositHeaderBar {
  title: string = 'Renminbi Savings Offers'
  showBack: boolean = true
  onBack: () => void = () => {}

  build() {
    Column() {
      Row({ space: 12 }) {
        if (this.showBack) {
          Text('‹').fontSize(22).fontColor(Hive.Color.n800)
            .onClick(() => {
              SensorDataClient.track('back_tap', 'Deposit', 'back_tapped', '',
                'deposit_campaign_hk', 'deposit_campaign')
              this.onBack()
            })
        }
        Text(this.title)
          .fontSize(17).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n900)
        Blank()
      }
      .width('100%').height(50)
      .padding({ left: 14, right: 14, top: 8, bottom: 8 })
      .backgroundColor(Hive.Color.brandWhite)
      Divider().color(Hive.Color.n200)
    }
  }
}

// ─── 2. Promo Banner ──────────────────────────────────────────────────────────

@Component
struct DepositPromoBanner {
  props: Record<string, ESObject> = {}

  private bgColor(): string { return this.props['backgroundColor'] as string ?? '#FFFFFF' }
  private imageUrl(): string {
    const raw = this.props['imageUrl'] as string ?? ''
    // If BFF returned a full URL with localhost, rewrite host to emulator loopback
    if (raw.indexOf('http://localhost:4000') === 0) {
      return raw.replace('http://localhost:4000', 'http://10.0.2.2:4000')
    }
    // If BFF returned a relative /media/ path, prepend emulator base
    if (raw.indexOf('/media/') === 0) {
      return 'http://10.0.2.2:4000' + raw
    }
    // Already an absolute URL pointing to the right host — use as-is
    return raw
  }
  private title(): string { return this.props['title'] as string ?? '' }
  private subtitle(): string { return this.props['subtitle'] as string ?? '' }
  private badge(): string { return this.props['badgeText'] as string ?? '' }
  private textColor(): string { return this.props['textColor'] as string ?? '#92400E' }

  build() {
    if (this.props['imageUrl'] !== undefined && this.imageUrl().length > 0) {
      // Full-width image banner — Row constrains width, clip prevents overflow
      Row() {
        Image(this.imageUrl())
          .width('100%').height(200)
          .objectFit(ImageFit.Cover)
      }
      .width('100%').height(200)
      .clip(true)
    } else if (this.title().length > 0) {
      // Text-only callout banner
      Column({ space: 8 }) {
        if (this.badge().length > 0) {
          Text(this.badge())
            .fontSize(10).fontWeight(FontWeight.Bold)
            .fontColor(this.textColor())
            .padding({ left: 10, right: 10, top: 3, bottom: 3 })
            .backgroundColor('#1A92400E')
            .borderRadius(20)
        }
        Text(this.title())
          .fontSize(16).fontWeight(FontWeight.Bold)
          .fontColor(this.textColor())
        if (this.subtitle().length > 0) {
          Text(this.subtitle())
            .fontSize(13).fontColor(this.textColor())
            .opacity(0.8)
        }
      }
      .width('100%').alignItems(HorizontalAlign.Start)
      .padding(16)
      .backgroundColor(this.bgColor())
    }
  }
}

// ─── 3. Deposit Rate Table ────────────────────────────────────────────────────

interface RateRow { term: string; rate: string }

@Component
struct DepositRateTable {
  props: Record<string, ESObject> = {}

  private sectionTitle(): string { return this.props['sectionTitle'] as string ?? 'Time Deposit Rate:' }
  private asAtDate(): string     { return this.props['asAtDate'] as string ?? '' }
  private footnote(): string     { return this.props['footnote'] as string ?? '' }
  private rows(): RateRow[] {
    const raw = this.props['rates'] as Array<Record<string, string>>
    if (!raw) { return [] }
    return raw.map((row: Record<string, string>) => {
      return { term: row['term'] ?? '', rate: row['rate'] ?? '' } as RateRow
    })
  }

  build() {
    Column({ space: 0 }) {
      // Section header
      Row() {
        Text(this.sectionTitle()).fontSize(13).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n700)
        Blank()
        if (this.asAtDate().length > 0) {
          Text('As at ' + this.asAtDate()).fontSize(10).fontColor(Hive.Color.n400)
        }
      }
      .width('100%').padding({ left: 16, right: 16, top: 12, bottom: 12 })
      .backgroundColor(Hive.Color.n50)

      // Column headers
      Row() {
        Text('Term').fontSize(12).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n500)
          .layoutWeight(1)
        Text('Interest Rate (p.a.)').fontSize(12).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n500)
      }
      .width('100%').padding({ left: 16, right: 16, top: 8, bottom: 8 })
      .backgroundColor('#F5F6F8')

      // Rate rows
      ForEach(this.rows(), (row: RateRow, idx: number) => {
        Column({ space: 0 }) {
          Row() {
            Text(row.term).fontSize(13).fontColor(Hive.Color.n700).layoutWeight(1)
            Text(row.rate + '%').fontSize(15).fontWeight(FontWeight.Bold).fontColor(Hive.Color.brandPrimary)
          }
          .width('100%').padding({ left: 16, right: 16, top: 12, bottom: 12 })
          .backgroundColor(idx % 2 === 0 ? Hive.Color.brandWhite : Hive.Color.n50)

          Divider().color(Hive.Color.n100).margin({ left: 16 })
        }
      })

      // Footnote
      if (this.footnote().length > 0) {
        Text(this.footnote())
          .fontSize(10).fontColor(Hive.Color.n400)
          .width('100%').padding({ left: 16, right: 16, top: 10, bottom: 10 })
          .backgroundColor(Hive.Color.n50)
      }
    }
    .width('100%').backgroundColor(Hive.Color.brandWhite)
    .onAppear(() => {
      SensorDataClient.track('slice_impression', 'Deposit', 'DEPOSIT_RATE_TABLE', 'dep-rate-table',
        'deposit_campaign_hk', 'deposit_campaign')
    })
  }
}

// ─── 4. Deposit Open CTA ──────────────────────────────────────────────────────

@Component
struct DepositOpenCTA {
  props: Record<string, ESObject> = {}

  private label(): string    { return this.props['label'] as string ?? 'Open a Deposit' }
  private bgColor(): string  { return this.props['backgroundColor'] as string ?? '#C41E3A' }
  private deepLink(): string { return this.props['deepLink'] as string ?? 'hsbc://deposit/open' }

  build() {
    Button(this.label())
      .width('100%').height(52)
      .fontSize(16).fontWeight(FontWeight.Bold).fontColor('#FFFFFF')
      .backgroundColor(this.bgColor())
      .borderRadius(12)
      .margin({ left: 16, right: 16, top: 12, bottom: 12 })
      .onClick(() => {
        SensorDataClient.track('deposit_cta_tap', 'Deposit', 'open_deposit_tapped', this.deepLink(),
          'deposit_campaign_hk', 'deposit_campaign')
      })
      .onAppear(() => {
        SensorDataClient.track('slice_impression', 'Deposit', 'DEPOSIT_OPEN_CTA', 'dep-open-cta',
          'deposit_campaign_hk', 'deposit_campaign')
      })
  }
}

// ─── 5. FAQ Section ───────────────────────────────────────────────────────────

interface FAQItem { id: string; question: string; answer: string }

@Component
struct DepositFAQSection {
  props: Record<string, ESObject> = {}
  @State expandedId: string = ''

  private sectionTitle(): string { return this.props['sectionTitle'] as string ?? 'Frequently Asked Questions' }
  private items(): FAQItem[] {
    const raw = this.props['items'] as Array<Record<string, string>>
    if (!raw) { return [] }
    return raw.map((item: Record<string, string>) => {
      return { id: item['id'] ?? '', question: item['question'] ?? '', answer: item['answer'] ?? '' } as FAQItem
    })
  }

  build() {
    Column({ space: 0 }) {
      // Section header
      Text(this.sectionTitle())
        .fontSize(13).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n700)
        .width('100%').padding({ left: 16, right: 16, top: 12, bottom: 12 })
        .backgroundColor(Hive.Color.n50)

      ForEach(this.items(), (item: FAQItem, idx: number) => {
        Column({ space: 0 }) {
          // Question row
          Row({ space: 12 }) {
            Text(item.question).fontSize(13).fontColor(Hive.Color.n800).layoutWeight(1)
            Text(this.expandedId === item.id ? '∧' : '∨').fontSize(13).fontColor(Hive.Color.n400)
          }
          .width('100%').padding({ left: 16, right: 16, top: 14, bottom: 14 })
          .backgroundColor(Hive.Color.brandWhite)
          .onClick(() => {
            this.expandedId = this.expandedId === item.id ? '' : item.id
          })

          // Answer (shown when expanded)
          if (this.expandedId === item.id) {
            Text(item.answer)
              .fontSize(13).fontColor(Hive.Color.n500)
              .width('100%')
              .padding({ left: 16, right: 16, bottom: 14 })
              .backgroundColor(Hive.Color.brandWhite)
          }

          Divider().color(Hive.Color.n100).margin({ left: 16 })
        }
      })
    }
    .width('100%').backgroundColor(Hive.Color.brandWhite)
    .onAppear(() => {
      SensorDataClient.track('slice_impression', 'Deposit', 'DEPOSIT_FAQ', 'dep-faq',
        'deposit_campaign_hk', 'deposit_campaign')
    })
  }
}

// ─── Hardcoded fallback components ────────────────────────────────────────────

@Component
struct DepositHeroBanner {
  build() {
    Stack({ alignContent: Alignment.Center }) {
      Column().width('100%').height(200).backgroundColor('#1A3A6B')
      Column({ space: 8 }) {
        Text('🏦').fontSize(48)
        Text('New Fund Deposit Campaign').fontSize(13).fontColor('#D9FFFFFF')
          .textAlign(TextAlign.Center).padding({ left: 16, right: 16 })
      }
    }.width('100%').height(200)
  }
}

@Component
struct DepositCalloutBanner {
  build() {
    Column({ space: 8 }) {
      Text('🔥 New Funds Only')
        .fontSize(10).fontWeight(FontWeight.Bold).fontColor('#92400E')
        .padding({ left: 10, right: 10, top: 3, bottom: 3 })
        .backgroundColor('#1A92400E').borderRadius(20)
      Text('🌟 Up to 1.15% p.a. Annual Equivalent Rate')
        .fontSize(16).fontWeight(FontWeight.Bold).fontColor('#92400E')
      Text('3-Month New Fund CNY Transferable CD — exclusively for new deposits. Don\'t miss this limited-time rate.')
        .fontSize(13).fontColor('#92400E').opacity(0.8)
    }
    .width('100%').alignItems(HorizontalAlign.Start)
    .padding(16).backgroundColor('#FFF7ED')
  }
}

@Component
struct DepositHardcodedRateTable {
  private readonly rates: RateRow[] = [
    { term: '3 Month Time Deposit',  rate: '0.65' },
    { term: '6 Month Time Deposit',  rate: '0.85' },
    { term: '12 Month Time Deposit', rate: '0.95' },
    { term: '24 Month Time Deposit', rate: '1.05' },
    { term: '36 Month Time Deposit', rate: '1.25' },
    { term: '60 Month Time Deposit', rate: '1.30' },
  ]

  build() {
    Column({ space: 0 }) {
      Row() {
        Text('Time Deposit Rate:').fontSize(13).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n700)
        Blank()
        Text('As at 5/22/2025').fontSize(10).fontColor(Hive.Color.n400)
      }.width('100%').padding({ left: 16, right: 16, top: 12, bottom: 12 }).backgroundColor(Hive.Color.n50)

      Row() {
        Text('Term').fontSize(12).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n500).layoutWeight(1)
        Text('Interest Rate (p.a.)').fontSize(12).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n500)
      }.width('100%').padding({ left: 16, right: 16, top: 8, bottom: 8 }).backgroundColor('#F5F6F8')

      ForEach(this.rates, (row: RateRow, idx: number) => {
        Column({ space: 0 }) {
          Row() {
            Text(row.term).fontSize(13).fontColor(Hive.Color.n700).layoutWeight(1)
            Text(row.rate + '%').fontSize(15).fontWeight(FontWeight.Bold).fontColor(Hive.Color.brandPrimary)
          }
          .width('100%').padding({ left: 16, right: 16, top: 12, bottom: 12 })
          .backgroundColor(idx % 2 === 0 ? Hive.Color.brandWhite : Hive.Color.n50)
          Divider().color(Hive.Color.n100).margin({ left: 16 })
        }
      })

      Text('Time deposit minimum balance for Personal Banking customers: RMB50. New Fund refers to funds not previously held with HSBC.')
        .fontSize(10).fontColor(Hive.Color.n400)
        .width('100%').padding({ left: 16, right: 16, top: 10, bottom: 10 }).backgroundColor(Hive.Color.n50)
    }
    .width('100%').backgroundColor(Hive.Color.brandWhite)
  }
}

@Component
struct DepositHardcodedCTA {
  build() {
    Button('Open a Deposit')
      .width('100%').height(52)
      .fontSize(16).fontWeight(FontWeight.Bold).fontColor('#FFFFFF')
      .backgroundColor('#C41E3A').borderRadius(12)
      .margin({ left: 16, right: 16, top: 12, bottom: 12 })
      .onClick(() => {
        SensorDataClient.track('deposit_cta_tap', 'Deposit', 'open_deposit_tapped',
          'hsbc://deposit/open?currency=CNY&campaign=new-fund',
          'deposit_campaign_hk', 'deposit_campaign')
      })
  }
}

@Component
struct DepositHardcodedFAQ {
  @State expandedIdx: number = -1
  private readonly faqs: FAQItem[] = [
    { id: 'faq-1', question: 'Can I withdraw my time deposit before it matures?',
      answer: 'Yes, you can. But you\'ll earn less or no interest, and may have to pay an early withdrawal fee. For foreign currency deposits, visit a bank branch.' },
    { id: 'faq-2', question: 'What happens if I don\'t withdraw my money after maturity?',
      answer: 'If you don\'t take out your money when it matures, most banks will automatically renew your deposit for the same term at the current interest rate. You can also choose to withdraw it or change the term before maturity.' },
    { id: 'faq-3', question: 'How long can I keep a time deposit?',
      answer: 'Banks usually offer terms like 3 months, 6 months, 1 year, 2 years, 3 years, 5 years, or even 10 years. Longer terms usually have higher interest rates.' },
    { id: 'faq-4', question: 'Why is the interest rate higher for time deposits than regular savings accounts?',
      answer: 'Banks can offer better rates because they know you\'ll keep your money in the account for a fixed period. This lets them use the funds for longer-term investments, so they share more of the profit with you as interest.' },
  ]

  build() {
    Column({ space: 0 }) {
      Text('Frequently Asked Questions')
        .fontSize(13).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n700)
        .width('100%').padding({ left: 16, right: 16, top: 12, bottom: 12 })
        .backgroundColor(Hive.Color.n50)

      ForEach(this.faqs, (item: FAQItem, idx: number) => {
        Column({ space: 0 }) {
          Row({ space: 12 }) {
            Text(item.question).fontSize(13).fontColor(Hive.Color.n800).layoutWeight(1)
            Text(this.expandedIdx === idx ? '∧' : '∨').fontSize(13).fontColor(Hive.Color.n400)
          }
          .width('100%').padding({ left: 16, right: 16, top: 14, bottom: 14 })
          .backgroundColor(Hive.Color.brandWhite)
          .onClick(() => { this.expandedIdx = this.expandedIdx === idx ? -1 : idx })

          if (this.expandedIdx === idx) {
            Text(item.answer).fontSize(13).fontColor(Hive.Color.n500)
              .width('100%').padding({ left: 16, right: 16, bottom: 14 })
              .backgroundColor(Hive.Color.brandWhite)
          }
          Divider().color(Hive.Color.n100).margin({ left: 16 })
        }
      })
    }
    .width('100%').backgroundColor(Hive.Color.brandWhite)
  }
}
