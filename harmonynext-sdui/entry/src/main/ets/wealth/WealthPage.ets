// WealthPage.ets
// HarmonyNext ArkTS — Home Wealth Hub HK page
// Loads slice layout from the UCP BFF (GET /api/v1/screen/home-wealth-hk) when a
// LIVE page has been approved and published.  Falls back to the static layout when
// the BFF has no live page yet (404 / connection refused).

import { Hive } from '../common/HiveTokens'
import { SensorDataClient } from '../network/SensorDataClient'
import { AISearchPage } from './AISearchPage'
import { fetchWealthScreen, WealthSlice } from '../network/KYCNetworkService'

// ─── Data models ──────────────────────────────────────────────────────────────

interface QuickItem    { icon: string; label: string; deepLink: string }
interface FuncItem     { icon: string; label: string; deepLink: string }
interface WealthProd   { id: string; name: string; tag: string; yield7Day: string
                         risk: string; redemption: string; cta: string
                         deepLink: string; highlighted: boolean }
interface RankingItem  { id: string; icon: string; badge: string; title: string
                         desc: string; deepLink: string }
interface DealItem     { id: string; brand: string; emoji: string; tag: string; deepLink: string }
interface BottomLink   { icon: string; label: string; deepLink: string }

const QUICK_ITEMS: QuickItem[] = [
  { icon: '🌙', label: '朝朝寶',   deepLink: 'hsbc://wealth/morning-treasure' },
  { icon: '💵', label: '借錢',     deepLink: 'hsbc://loan/apply' },
  { icon: '↔️', label: '轉帳',     deepLink: 'hsbc://transfer' },
  { icon: '📊', label: '帳戶總覽', deepLink: 'hsbc://accounts' },
]

const FUNC_ROWS: FuncItem[][] = [
  [{ icon:'💳', label:'信用卡',   deepLink:'hsbc://cards' },
   { icon:'📄', label:'收支明細', deepLink:'hsbc://statements' },
   { icon:'🔄', label:'他行卡轉入', deepLink:'hsbc://transfer/external' },
   { icon:'🏙️', label:'城市服務', deepLink:'hsbc://city-services' },
   { icon:'🔥', label:'熱門活動', deepLink:'hsbc://events' }],
  [{ icon:'📈', label:'理財',     deepLink:'hsbc://wealth' },
   { icon:'Ⓜ️', label:'M+會員',  deepLink:'hsbc://membership' },
   { icon:'🎬', label:'影票',     deepLink:'hsbc://movies' },
   { icon:'💹', label:'基金',     deepLink:'hsbc://funds' },
   { icon:'⋯',  label:'全部',    deepLink:'hsbc://all-services' }],
]

const WEALTH_PRODUCTS: WealthProd[] = [
  { id:'w1', name:'活錢理財｜歷史天天正收益', tag:'代碼',   yield7Day:'2.80%',
    risk:'R1低風險', redemption:'贖回T+1到帳', cta:'去看看',
    deepLink:'hsbc://wealth/daily-positive', highlighted:true },
  { id:'w2', name:'主投債券', tag:'代碼', yield7Day:'3.04%',
    risk:'歷史周周正', redemption:'成立以來…', cta:'查看',
    deepLink:'hsbc://wealth/bond-fund', highlighted:false },
  { id:'w3', name:'年均收益率', tag:'收益確定', yield7Day:'2.31%',
    risk:'保証領取', redemption:'穩健低波', cta:'查看',
    deepLink:'hsbc://wealth/guaranteed', highlighted:false },
]

const RANKINGS: RankingItem[] = [
  { id:'r1', icon:'🥇', badge:'優中選優', title:'3322選基',
    desc:'近1年漲跌幅高達318.19%', deepLink:'hsbc://rankings/top-funds' },
  { id:'r2', icon:'🔒', badge:'固收優選', title:'穩健省心好選擇',
    desc:'歷史持有3月盈利概率高達98.23%', deepLink:'hsbc://rankings/fixed-income' },
  { id:'r3', icon:'📈', badge:'屢創新高', title:'屢創新高榜',
    desc:'近3年净值創新高次數達152', deepLink:'hsbc://rankings/all-time-high' },
]

const DEALS: DealItem[] = [
  { id:'d1', brand:'KFC',           emoji:'🍗', tag:'單品優惠',  deepLink:'hsbc://deals/kfc' },
  { id:'d2', brand:'Luckin Coffee', emoji:'☕', tag:'5折喝瑞幸', deepLink:'hsbc://deals/luckin' },
  { id:'d3', brand:'DQ',            emoji:'🍦', tag:'5折起',     deepLink:'hsbc://deals/dq' },
]

// ─── Load-state enum ──────────────────────────────────────────────────────────
// ArkTS forbids string-union @State — use a plain number enum instead.
const LOAD_IDLE    = 0
const LOAD_LOADING = 1
const LOAD_DONE    = 2
const LOAD_ERROR   = 3

// ─── SDUI slice renderer ──────────────────────────────────────────────────────
// Renders one SDUI slice from the BFF payload.  Only slice types present in the
// UCP schema are handled; unknown types are skipped silently.

@Component
struct SDUISliceView {
  slice: WealthSlice = { instanceId: '', type: '', props: {}, visible: true }
  @State adDismissed: boolean = false

  build() {
    if (!this.slice.visible) {
      Column() {}   // hidden slice — render nothing
    } else {
      this.renderSlice()
    }
  }

  @Builder renderSlice() {
    if (this.slice.type === 'HEADER_NAV') {
      SDUIHeaderNav({ props: this.slice.props })
    } else if (this.slice.type === 'QUICK_ACCESS') {
      SDUIQuickAccess({ props: this.slice.props })
    } else if (this.slice.type === 'PROMO_BANNER') {
      SDUIPromoBanner({ props: this.slice.props })
    } else if (this.slice.type === 'FUNCTION_GRID') {
      SDUIFunctionGrid({ props: this.slice.props })
    } else if (this.slice.type === 'AI_ASSISTANT') {
      SDUIAIAssistant({ props: this.slice.props })
    } else if (this.slice.type === 'AD_BANNER') {
      if (!this.adDismissed) {
        SDUIAdBanner({ props: this.slice.props, onDismiss: () => { this.adDismissed = true } })
      }
    } else if (this.slice.type === 'FLASH_LOAN') {
      SDUIFlashLoan({ props: this.slice.props })
    } else if (this.slice.type === 'WEALTH_SELECTION') {
      SDUIWealthSelection({ props: this.slice.props })
    } else if (this.slice.type === 'FEATURED_RANKINGS') {
      SDUIFeaturedRankings({ props: this.slice.props })
    } else if (this.slice.type === 'LIFE_DEALS') {
      SDUILifeDeals({ props: this.slice.props })
    } else if (this.slice.type === 'SPACER') {
      const h: number = this.slice.props['height'] as number ?? 16
      Blank().height(h)
    }
    // unknown types silently omitted
  }
}

// ─── Root view ─────────────────────────────────────────────────────────────────

@Component
export struct WealthPageView {
  @State adDismissed: boolean   = false
  @State searchOpen: boolean    = false
  @State loadState: number      = LOAD_IDLE      // LOAD_* constants
  @State sdui: WealthSlice[]    = []             // BFF slices when loaded

  aboutToAppear() {
    SensorDataClient.wealthHubViewed()
    this.loadFromBFF()
  }

  private async loadFromBFF(): Promise<void> {
    this.loadState = LOAD_LOADING
    try {
      const payload = await fetchWealthScreen()
      this.sdui = payload.layout.children.filter((s: WealthSlice) => s.visible !== false)
      this.loadState = LOAD_DONE
    } catch (_e) {
      // BFF not live or unreachable — fall back to static layout
      this.loadState = LOAD_ERROR
    }
  }

  build() {
    Stack({ alignContent: Alignment.TopStart }) {
      Scroll() {
        Column({ space: 0 }) {
          if (this.loadState === LOAD_LOADING) {
            // Minimal loading state — show header so page doesn't flash blank
            WHHeaderNav({ onSearchTap: () => { this.searchOpen = true } })
            Row() {
              Text('載入中…').fontSize(13).fontColor(Hive.Color.n400)
            }
            .width('100%').height(80)
            .justifyContent(FlexAlign.Center)
          } else if (this.loadState === LOAD_DONE && this.sdui.length > 0) {
            // ── SDUI path: render slices from BFF ──────────────────────────
            ForEach(this.sdui, (slice: WealthSlice) => {
              SDUISliceView({ slice: slice })
            })
          } else {
            // ── Static fallback: BFF not live yet ──────────────────────────
            WHHeaderNav({ onSearchTap: () => { this.searchOpen = true } })
            WHQuickAccess()
            WHPromoBanner()
            WHFunctionGrid()
            WHAIAssistant()
            if (!this.adDismissed) {
              WHAdBanner({ onDismiss: () => { this.adDismissed = true } })
            }
            WHFlashLoan()
            WHWealthSelection()
            WHFeaturedRankings()
            WHLifeDeals()
          }
          Blank().height(40)
        }.width('100%')
      }.width('100%').height('100%').backgroundColor(Hive.Color.n50)

      if (this.searchOpen) {
        AISearchPage({ onDismiss: () => { this.searchOpen = false } })
          .width('100%').height('100%')
          .backgroundColor(Hive.Color.brandWhite)
          .zIndex(10)
      }
    }.width('100%').height('100%')
  }
}

// ─── SDUI slice components (BFF-driven) ───────────────────────────────────────
// Each reads from props: Record<string, ESObject> delivered by the BFF.

@Component
struct SDUIHeaderNav {
  props: Record<string, ESObject> = {}

  build() {
    Column() {
      Row({ space: 10 }) {
        Row({ space: 6 }) {
          Text('🔍').fontSize(13).fontColor(Hive.Color.n400)
          Text(this.props['searchPlaceholder'] as string ?? '搜尋功能、產品')
            .fontSize(13).fontColor(Hive.Color.n400).layoutWeight(1)
        }
        .layoutWeight(1).height(36).padding({ left: 14, right: 14 })
        .borderRadius(18).backgroundColor(Hive.Color.n100)
        .onClick(() => {
          SensorDataClient.track('search_tap', 'Wealth', 'search_tapped', '',
            'wealth_hub_hk', 'wealth_hub')
        })

        if (this.props['showNotificationBell'] as boolean !== false) {
          Text('🔔').fontSize(20).onClick(() => {
            SensorDataClient.track('notification_tap', 'Wealth', 'notification_tapped', '',
              'wealth_hub_hk', 'wealth_hub')
          })
        }
        if (this.props['showQRScanner'] as boolean !== false) {
          Text('⬛').fontSize(18).onClick(() => {
            SensorDataClient.track('qr_tap', 'Wealth', 'qr_scanner_tapped', '',
              'wealth_hub_hk', 'wealth_hub')
          })
        }
      }.width('100%').height(50)
      .padding({ left: 14, right: 14, top: 8, bottom: 8 })
      .backgroundColor(Hive.Color.brandWhite)

      Divider().color(Hive.Color.n200)
    }
  }
}

@Component
struct SDUIQuickAccess {
  props: Record<string, ESObject> = {}

  build() {
    // items is an ESObject array — cast each element to a typed record
    const rawItems = this.props['items'] as ESObject[] ?? []
    Row() {
      ForEach(rawItems, (raw: ESObject) => {
        const item = raw as Record<string, string>
        Column({ space: 5 }) {
          Text(item['icon'] ?? '').fontSize(22)
            .width(48).height(48).textAlign(TextAlign.Center)
            .borderRadius(14)
            .linearGradient({ direction: GradientDirection.LeftTop,
              colors: [['#F0F9FF', 0], ['#E0F2FE', 1]] })
          Text(item['label'] ?? '').fontSize(10).fontColor(Hive.Color.n700).textAlign(TextAlign.Center)
        }
        .layoutWeight(1).alignItems(HorizontalAlign.Center)
        .onClick(() => {
          SensorDataClient.quickAccessTapped(item['label'] ?? '', item['deepLink'] ?? '')
        })
      })
    }
    .width('100%').backgroundColor(Hive.Color.brandWhite)
    .padding({ left: 16, right: 16, top: 12, bottom: 12 })
  }
}

@Component
struct SDUIPromoBanner {
  props: Record<string, ESObject> = {}

  build() {
    const title    = this.props['title'] as string ?? ''
    const subtitle = this.props['subtitle'] as string ?? ''
    const ctaLabel = this.props['ctaLabel'] as string ?? ''
    const badgeText = this.props['badgeText'] as string ?? ''
    const deepLink = this.props['ctaDeepLink'] as string ?? ''

    Row({ space: 0 }) {
      Column({ space: 4 }) {
        if (badgeText.length > 0) {
          Text(badgeText)
            .fontSize(9).fontWeight(FontWeight.Bold).fontColor('#DB0011')
            .padding({ left: 8, right: 8, top: 2, bottom: 2 })
            .borderRadius(10).backgroundColor('#FFEDED')
        }
        Text(title).fontSize(16).fontWeight(FontWeight.Bolder).fontColor(Hive.Color.n900)
        Text(subtitle).fontSize(10).fontColor(Hive.Color.n500)
        Button(ctaLabel)
          .height(32).padding({ left: 16, right: 16 })
          .borderRadius(14).backgroundColor(Hive.Color.brandPrimary)
          .fontColor(Hive.Color.brandWhite).fontSize(11).fontWeight(FontWeight.Bold)
          .margin({ top: 8 })
          .onClick(() => {
            SensorDataClient.promoBannerTapped(title, this.props['instanceId'] as string ?? '', deepLink)
          })
      }.layoutWeight(1).alignItems(HorizontalAlign.Start)

      Text('🎯').fontSize(32)
        .width(80).height(80).textAlign(TextAlign.Center)
        .borderRadius(12).backgroundColor('#14000000')
    }
    .width('100%').padding({ left: 12, right: 12, top: 12, bottom: 12 })
    .margin({ left: 12, right: 12, top: 8, bottom: 0 })
    .borderRadius(14)
    .backgroundColor(this.props['backgroundColor'] as string ?? '#E8F4FD')
    .alignItems(VerticalAlign.Center)
  }
}

@Component
struct SDUIFunctionGrid {
  props: Record<string, ESObject> = {}

  build() {
    const rawRows = this.props['rows'] as ESObject[] ?? []
    Column({ space: 6 }) {
      ForEach(rawRows, (rawRow: ESObject) => {
        const row = rawRow as ESObject[]
        Row() {
          ForEach(row, (raw: ESObject) => {
            const item = raw as Record<string, string>
            Column({ space: 4 }) {
              Text(item['icon'] ?? '').fontSize(20)
                .width(44).height(44).textAlign(TextAlign.Center)
                .borderRadius(12).backgroundColor(Hive.Color.n100)
              Text(item['label'] ?? '').fontSize(10).fontColor(Hive.Color.n700)
                .textAlign(TextAlign.Center).lineHeight(14)
            }
            .layoutWeight(1).alignItems(HorizontalAlign.Center)
            .onClick(() => {
              const extra: Record<string, ESObject> = {}
              extra['function_label'] = (item['label'] ?? '') as ESObject
              extra['deep_link']      = (item['deepLink'] ?? '') as ESObject
              SensorDataClient.track('function_tap', 'Wealth', 'function_tapped',
                item['label'] ?? '', 'wealth_hub_hk', 'wealth_hub',
                '', '', '', '', '', '', '', '', extra)
            })
          })
        }.width('100%')
      })
    }
    .width('100%').backgroundColor(Hive.Color.brandWhite)
    .padding({ left: 16, right: 16, top: 8, bottom: 8 })
  }
}

@Component
struct SDUIAIAssistant {
  props: Record<string, ESObject> = {}

  build() {
    Row({ space: 8 }) {
      Text('✉️').fontSize(20)
      Text(this.props['greeting'] as string ?? 'Hi，我是你的智能財富助理')
        .fontSize(11).fontColor(Hive.Color.n600).layoutWeight(1)
      Text('›').fontSize(14).fontColor(Hive.Color.n400)
    }
    .width('100%').height(44)
    .padding({ left: 12, right: 12 })
    .margin({ left: 16, right: 16, top: 4, bottom: 4 })
    .borderRadius(10).backgroundColor(Hive.Color.n50)
    .alignItems(VerticalAlign.Center)
    .onClick(() => { SensorDataClient.aiAssistantTapped() })
  }
}

@Component
struct SDUIAdBanner {
  props: Record<string, ESObject> = {}
  onDismiss: () => void = () => {}

  build() {
    const title    = this.props['title'] as string ?? ''
    const subtitle = this.props['subtitle'] as string ?? ''
    const ctaLabel = this.props['ctaLabel'] as string ?? ''
    const deepLink = this.props['ctaDeepLink'] as string ?? ''

    Stack({ alignContent: Alignment.TopEnd }) {
      Row({ space: 12 }) {
        Column({ space: 4 }) {
          Text(title).fontSize(13).fontWeight(FontWeight.Bold).fontColor('#92400E')
          Text(subtitle).fontSize(10).fontColor('#78716C')
          Button(ctaLabel)
            .height(30).padding({ left: 14, right: 14 })
            .borderRadius(12).backgroundColor(Hive.Color.brandPrimary)
            .fontColor(Hive.Color.brandWhite).fontSize(11).fontWeight(FontWeight.Bold)
            .margin({ top: 8 })
            .onClick(() => {
              SensorDataClient.sliceTapped('AD_BANNER', 'slice-ad', ctaLabel, deepLink)
            })
        }.layoutWeight(1).alignItems(HorizontalAlign.Start)

        Text('🌱').fontSize(28)
          .width(72).height(72).textAlign(TextAlign.Center)
          .borderRadius(10).backgroundColor('#14000000')
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 12, bottom: 12 })
      .borderRadius(14)
      .linearGradient({ direction: GradientDirection.LeftTop,
        colors: [['#FFFBEB', 0], ['#FEF3C7', 1]] })
      .alignItems(VerticalAlign.Center)

      Text('✕').fontSize(13).fontColor(Hive.Color.n400)
        .width(32).height(32).textAlign(TextAlign.Center)
        .onClick(() => {
          SensorDataClient.adBannerDismissed(title)
          this.onDismiss()
        })
    }
    .margin({ left: 12, right: 12, top: 6, bottom: 6 })
  }
}

@Component
struct SDUIFlashLoan {
  props: Record<string, ESObject> = {}

  build() {
    const productName = this.props['productName'] as string ?? '閃電貸 極速放款'
    const tagline     = this.props['tagline'] as string ?? '最高可借額度'
    const currency    = this.props['currency'] as string ?? 'HKD'
    const maxAmount   = this.props['maxAmount'] as number ?? 300000
    const ctaLabel    = this.props['ctaLabel'] as string ?? '獲取額度'
    const deepLink    = this.props['ctaDeepLink'] as string ?? 'hsbc://loan/flash'

    Row() {
      Column({ space: 2 }) {
        Text(`⚡ ${productName}`).fontSize(11).fontWeight(FontWeight.Bold)
          .fontColor(Hive.Color.brandPrimary)
        Text(tagline).fontSize(10).fontColor(Hive.Color.n500)
        Text(`${currency} ${maxAmount.toLocaleString()}.00`).fontSize(22)
          .fontWeight(FontWeight.Bolder).fontColor(Hive.Color.n900)
      }.layoutWeight(1).alignItems(HorizontalAlign.Start)

      Button(ctaLabel)
        .height(44).padding({ left: 18, right: 18 })
        .borderRadius(20).backgroundColor(Hive.Color.brandPrimary)
        .fontColor(Hive.Color.brandWhite).fontSize(12).fontWeight(FontWeight.Bold)
        .onClick(() => {
          SensorDataClient.sliceTapped('FLASH_LOAN', 'slice-flash-loan', ctaLabel, deepLink)
        })
    }
    .width('100%').padding({ left: 16, right: 16, top: 12, bottom: 12 })
    .margin({ left: 12, right: 12, top: 6, bottom: 6 })
    .borderRadius(14)
    .linearGradient({ direction: GradientDirection.LeftTop,
      colors: [['#FFF5F5', 0], ['#FFE4E4', 1]] })
    .alignItems(VerticalAlign.Center)
  }
}

@Component
struct SDUIWealthSelection {
  props: Record<string, ESObject> = {}

  build() {
    const sectionTitle = this.props['sectionTitle'] as string ?? '財富精選'
    const rawProducts  = this.props['products'] as ESObject[] ?? []

    Column({ space: 0 }) {
      Row() {
        Text(sectionTitle).fontSize(15).fontWeight(FontWeight.Bold)
        Blank().layoutWeight(1)
        Text('更多 ›').fontSize(12).fontColor(Hive.Color.brandPrimary)
      }.width('100%').margin({ bottom: 10 })

      ForEach(rawProducts, (raw: ESObject, index: number) => {
        const p = raw as Record<string, ESObject>
        Row() {
          Column({ space: 2 }) {
            Text(p['productName'] as string ?? '').fontSize(12)
              .fontWeight(FontWeight.Medium).fontColor(Hive.Color.n900)
            Row({ space: 6 }) {
              Text(p['riskLevel'] as string ?? '').fontSize(9).fontColor(Hive.Color.n500)
                .padding({ left: 6, right: 6, top: 1, bottom: 1 })
                .borderRadius(8).backgroundColor(Hive.Color.n100)
              Text(p['redemption'] as string ?? '').fontSize(9).fontColor(Hive.Color.n500)
                .padding({ left: 6, right: 6, top: 1, bottom: 1 })
                .borderRadius(8).backgroundColor(Hive.Color.n100)
            }
          }.layoutWeight(1).alignItems(HorizontalAlign.Start)

          Column({ space: 2 }) {
            Text(p['yield7Day'] as string ?? '').fontSize(18).fontWeight(FontWeight.Bolder)
              .fontColor(Hive.Color.brandPrimary)
            Text('7日年化').fontSize(9).fontColor(Hive.Color.n400)
            if (p['highlighted'] as boolean === true) {
              Button(p['ctaLabel'] as string ?? '查看')
                .height(28).padding({ left: 12, right: 12 })
                .borderRadius(12).backgroundColor(Hive.Color.brandPrimary)
                .fontColor(Hive.Color.brandWhite).fontSize(10).fontWeight(FontWeight.Bold)
                .margin({ top: 4 })
                .onClick(() => {
                  SensorDataClient.wealthProductTapped(
                    p['productName'] as string ?? '', p['id'] as string ?? '')
                })
            }
          }.alignItems(HorizontalAlign.End)
        }
        .width('100%').padding({ top: 10, bottom: 10 })
        .onClick(() => {
          SensorDataClient.wealthProductTapped(
            p['productName'] as string ?? '', p['id'] as string ?? '')
        })

        if (index < rawProducts.length - 1) {
          Divider().color(Hive.Color.n100)
        }
      })

      Blank().height(10)
      Text('💬 理財產品這么多，哪款適合我？')
        .fontSize(11).fontColor(Hive.Color.n500).textAlign(TextAlign.Center).width('100%')
    }
    .width('100%').backgroundColor(Hive.Color.brandWhite)
    .padding({ left: 16, right: 16, top: 12, bottom: 12 })
  }
}

@Component
struct SDUIFeaturedRankings {
  props: Record<string, ESObject> = {}

  build() {
    const sectionTitle = this.props['sectionTitle'] as string ?? '特色榜單'
    const rawItems     = this.props['items'] as ESObject[] ?? []

    Column({ space: 0 }) {
      Row() {
        Text(sectionTitle).fontSize(15).fontWeight(FontWeight.Bold)
        Blank().layoutWeight(1)
        Text('更多 ›').fontSize(12).fontColor(Hive.Color.brandPrimary)
      }.width('100%').margin({ bottom: 10 })

      ForEach(rawItems, (raw: ESObject) => {
        const item = raw as Record<string, string>
        Row({ space: 12 }) {
          Text(item['icon'] ?? '').fontSize(24)
          Column({ space: 2 }) {
            Text(item['badge'] ?? '').fontSize(9).fontWeight(FontWeight.Bold)
              .fontColor(Hive.Color.brandPrimary)
              .padding({ left: 8, right: 8, top: 2, bottom: 2 })
              .borderRadius(10).backgroundColor('#FEF2F2')
            Text(item['title'] ?? '').fontSize(13).fontWeight(FontWeight.Bold).fontColor(Hive.Color.n900)
            Text(item['description'] ?? '').fontSize(10).fontColor(Hive.Color.n500)
          }.layoutWeight(1).alignItems(HorizontalAlign.Start)
          Text('›').fontSize(16).fontColor(Hive.Color.n400)
        }
        .width('100%').padding({ top: 8, bottom: 8 })
        .onClick(() => {
          SensorDataClient.rankingsTapped(item['title'] ?? '', item['badge'] ?? '')
        })

        Divider().color('#F9FAFB')
      })
    }
    .width('100%').backgroundColor(Hive.Color.brandWhite)
    .padding({ left: 16, right: 16, top: 12, bottom: 12 })
  }
}

@Component
struct SDUILifeDeals {
  props: Record<string, ESObject> = {}

  build() {
    const sectionTitle = this.props['sectionTitle'] as string ?? '生活特惠'
    const rawDeals     = this.props['deals'] as ESObject[] ?? []
    const rawLinks     = this.props['bottomLinks'] as ESObject[] ?? []

    Column({ space: 10 }) {
      Row() {
        Text(sectionTitle).fontSize(15).fontWeight(FontWeight.Bold)
        Blank().layoutWeight(1)
        Text('更多 ›').fontSize(12).fontColor(Hive.Color.brandPrimary)
      }.width('100%')

      Row({ space: 10 }) {
        ForEach(rawDeals, (raw: ESObject) => {
          const d = raw as Record<string, string>
          Column({ space: 0 }) {
            Text(d['logoUrl'] || '🏷').fontSize(24)
              .width('100%').height(64).textAlign(TextAlign.Center)
              .backgroundColor(Hive.Color.n100)
            Text(d['tag'] ?? '').fontSize(9).fontWeight(FontWeight.Bold)
              .fontColor(Hive.Color.brandWhite)
              .width('100%').textAlign(TextAlign.Center).padding({ top: 4, bottom: 4 })
              .backgroundColor(Hive.Color.brandPrimary)
          }
          .layoutWeight(1).borderRadius(12).clip(true)
          .backgroundColor(Hive.Color.n50)
          .onClick(() => {
            SensorDataClient.lifeDealTapped(d['brandName'] ?? '', d['tag'] ?? '')
          })
        })
      }.width('100%')

      Row({ space: 10 }) {
        ForEach(rawLinks, (raw: ESObject) => {
          const link = raw as Record<string, string>
          Row({ space: 8 }) {
            Text(link['icon'] ?? '').fontSize(24)
            Text(link['label'] ?? '').fontSize(10).fontColor(Hive.Color.n700).lineHeight(16)
          }
          .layoutWeight(1).padding(10).borderRadius(12)
          .backgroundColor(Hive.Color.n50)
          .alignItems(VerticalAlign.Center)
          .onClick(() => {
            const extra: Record<string, ESObject> = {}
            extra['deep_link'] = (link['deepLink'] ?? '') as ESObject
            SensorDataClient.track('bottom_link_tap', 'Wealth', 'bottom_link_tapped',
              link['label'] ?? '', 'wealth_hub_hk', 'wealth_hub',
              '', '', '', '', '', '', '', '', extra)
          })
        })
      }.width('100%')
    }
    .width('100%').backgroundColor(Hive.Color.brandWhite)
    .padding({ left: 16, right: 16, top: 12, bottom: 12 })
  }
}

// ─── Static fallback components (unchanged from original) ─────────────────────
// Used when the BFF has no LIVE page published yet.

@Component
struct WHHeaderNav {
  onSearchTap: () => void = () => {}

  aboutToAppear() {
    SensorDataClient.sliceImpression('HEADER_NAV', 'slice-header', 0)
  }

  build() {
    Column() {
      Row({ space: 10 }) {
        Row({ space: 6 }) {
          Text('🔍').fontSize(13).fontColor(Hive.Color.n400)
          Text('搜尋功能、產品').fontSize(13).fontColor(Hive.Color.n400).layoutWeight(1)
        }
        .layoutWeight(1).height(36).padding({ left: 14, right: 14 })
        .borderRadius(18).backgroundColor(Hive.Color.n100)
        .onClick(() => {
          SensorDataClient.track('search_tap', 'Wealth', 'search_tapped', '',
            'wealth_hub_hk', 'wealth_hub')
          this.onSearchTap()
        })

        Text('🔔').fontSize(20).onClick(() => {
          SensorDataClient.track('notification_tap', 'Wealth', 'notification_tapped', '',
            'wealth_hub_hk', 'wealth_hub')
        })
        Text('⬛').fontSize(18).onClick(() => {
          SensorDataClient.track('qr_tap', 'Wealth', 'qr_scanner_tapped', '',
            'wealth_hub_hk', 'wealth_hub')
        })
      }.width('100%').height(50)
      .padding({ left: 14, right: 14, top: 8, bottom: 8 })
      .backgroundColor(Hive.Color.brandWhite)

      Divider().color(Hive.Color.n200)
    }
  }
}

@Component
struct WHQuickAccess {
  aboutToAppear() {
    SensorDataClient.sliceImpression('QUICK_ACCESS', 'slice-quick', 1)
  }

  build() {
    Row() {
      ForEach(QUICK_ITEMS, (item: QuickItem) => {
        Column({ space: 5 }) {
          Text(item.icon).fontSize(22)
            .width(48).height(48).textAlign(TextAlign.Center)
            .borderRadius(14)
            .linearGradient({ direction: GradientDirection.LeftTop,
              colors: [['#F0F9FF', 0], ['#E0F2FE', 1]] })
          Text(item.label).fontSize(10).fontColor(Hive.Color.n700).textAlign(TextAlign.Center)
        }
        .layoutWeight(1).alignItems(HorizontalAlign.Center)
        .onClick(() => { SensorDataClient.quickAccessTapped(item.label, item.deepLink) })
      })
    }
    .width('100%').backgroundColor(Hive.Color.brandWhite)
    .padding({ left: 16, right: 16, top: 12, bottom: 12 })
  }
}

@Component
struct WHPromoBanner {
  aboutToAppear() {
    SensorDataClient.promoBannerImpression('10分招財日', 'slice-promo-10', 'promo-10-finance-day')
  }

  build() {
    Row({ space: 0 }) {
      Column({ space: 4 }) {
        Text('每月10日開啓')
          .fontSize(9).fontWeight(FontWeight.Bold).fontColor('#DB0011')
          .padding({ left: 8, right: 8, top: 2, bottom: 2 })
          .borderRadius(10).backgroundColor('#FFEDED')
        Text('10分招財日').fontSize(16).fontWeight(FontWeight.Bolder).fontColor(Hive.Color.n900)
        Text('查帳單·學投資·優配置').fontSize(10).fontColor(Hive.Color.n500)
        Button('點擊參與')
          .height(32).padding({ left: 16, right: 16 })
          .borderRadius(14).backgroundColor(Hive.Color.brandPrimary)
          .fontColor(Hive.Color.brandWhite).fontSize(11).fontWeight(FontWeight.Bold)
          .margin({ top: 8 })
          .onClick(() => {
            SensorDataClient.promoBannerTapped('10分招財日', 'slice-promo-10', 'promo-10-finance-day')
          })
      }.layoutWeight(1).alignItems(HorizontalAlign.Start)

      Text('🎯').fontSize(32)
        .width(80).height(80).textAlign(TextAlign.Center)
        .borderRadius(12).backgroundColor('#14000000')
    }
    .width('100%').padding({ left: 12, right: 12, top: 12, bottom: 12 })
    .margin({ left: 12, right: 12, top: 8, bottom: 0 })
    .borderRadius(14).backgroundColor('#E8F4FD')
    .alignItems(VerticalAlign.Center)
  }
}

@Component
struct WHFunctionGrid {
  aboutToAppear() {
    SensorDataClient.sliceImpression('FUNCTION_GRID', 'slice-func-grid', 3)
  }

  build() {
    Column({ space: 6 }) {
      ForEach(FUNC_ROWS, (row: FuncItem[]) => {
        Row() {
          ForEach(row, (item: FuncItem) => {
            Column({ space: 4 }) {
              Text(item.icon).fontSize(20)
                .width(44).height(44).textAlign(TextAlign.Center)
                .borderRadius(12).backgroundColor(Hive.Color.n100)
              Text(item.label).fontSize(10).fontColor(Hive.Color.n700)
                .textAlign(TextAlign.Center).lineHeight(14)
            }
            .layoutWeight(1).alignItems(HorizontalAlign.Center)
            .onClick(() => {
              const extra: Record<string, ESObject> = {}
              extra['function_label'] = item.label   as ESObject
              extra['deep_link']      = item.deepLink as ESObject
              SensorDataClient.track('function_tap', 'Wealth', 'function_tapped', item.label,
                'wealth_hub_hk', 'wealth_hub', '', '', '', '', '', '', '', '',
                extra)
            })
          })
        }.width('100%')
      })
    }
    .width('100%').backgroundColor(Hive.Color.brandWhite)
    .padding({ left: 16, right: 16, top: 8, bottom: 8 })
  }
}

@Component
struct WHAIAssistant {
  aboutToAppear() {
    SensorDataClient.sliceImpression('AI_ASSISTANT', 'slice-ai', 4)
  }

  build() {
    Row({ space: 8 }) {
      Text('✉️').fontSize(20)
      Text('Hi，我是你的智能財富助理').fontSize(11).fontColor(Hive.Color.n600).layoutWeight(1)
      Text('›').fontSize(14).fontColor(Hive.Color.n400)
    }
    .width('100%').height(44)
    .padding({ left: 12, right: 12 })
    .margin({ left: 16, right: 16, top: 4, bottom: 4 })
    .borderRadius(10).backgroundColor(Hive.Color.n50)
    .alignItems(VerticalAlign.Center)
    .onClick(() => { SensorDataClient.aiAssistantTapped() })
  }
}

@Component
struct WHAdBanner {
  onDismiss: () => void = () => {}

  aboutToAppear() {
    SensorDataClient.sliceImpression('AD_BANNER', 'slice-ad-spring', 5)
  }

  build() {
    Stack({ alignContent: Alignment.TopEnd }) {
      Row({ space: 12 }) {
        Column({ space: 4 }) {
          Text('春季播種黃金期').fontSize(13).fontWeight(FontWeight.Bold).fontColor('#92400E')
          Text('配置正當時，播下「金種子」').fontSize(10).fontColor('#78716C')
          Button('抽體驗禮')
            .height(30).padding({ left: 14, right: 14 })
            .borderRadius(12).backgroundColor(Hive.Color.brandPrimary)
            .fontColor(Hive.Color.brandWhite).fontSize(11).fontWeight(FontWeight.Bold)
            .margin({ top: 8 })
            .onClick(() => {
              SensorDataClient.sliceTapped('AD_BANNER', 'slice-ad-spring',
                '抽體驗禮', 'hsbc://campaign/spring-investment')
            })
        }.layoutWeight(1).alignItems(HorizontalAlign.Start)

        Text('🌱').fontSize(28)
          .width(72).height(72).textAlign(TextAlign.Center)
          .borderRadius(10).backgroundColor('#14000000')
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 12, bottom: 12 })
      .borderRadius(14)
      .linearGradient({ direction: GradientDirection.LeftTop,
        colors: [['#FFFBEB', 0], ['#FEF3C7', 1]] })
      .alignItems(VerticalAlign.Center)

      Text('✕').fontSize(13).fontColor(Hive.Color.n400)
        .width(32).height(32).textAlign(TextAlign.Center)
        .onClick(() => {
          SensorDataClient.adBannerDismissed('春季播種黃金期')
          this.onDismiss()
        })
    }
    .margin({ left: 12, right: 12, top: 6, bottom: 6 })
  }
}

@Component
struct WHFlashLoan {
  aboutToAppear() {
    SensorDataClient.sliceImpression('FLASH_LOAN', 'slice-flash-loan', 6)
  }

  build() {
    Row() {
      Column({ space: 2 }) {
        Text('⚡ 閃電貸 極速放款').fontSize(11).fontWeight(FontWeight.Bold)
          .fontColor(Hive.Color.brandPrimary)
        Text('最高可借額度').fontSize(10).fontColor(Hive.Color.n500)
        Text('HKD 300,000.00').fontSize(22).fontWeight(FontWeight.Bolder)
          .fontColor(Hive.Color.n900)
      }.layoutWeight(1).alignItems(HorizontalAlign.Start)

      Button('獲取額度')
        .height(44).padding({ left: 18, right: 18 })
        .borderRadius(20).backgroundColor(Hive.Color.brandPrimary)
        .fontColor(Hive.Color.brandWhite).fontSize(12).fontWeight(FontWeight.Bold)
        .onClick(() => {
          SensorDataClient.sliceTapped('FLASH_LOAN', 'slice-flash-loan',
            '獲取額度', 'hsbc://loan/flash')
        })
    }
    .width('100%').padding({ left: 16, right: 16, top: 12, bottom: 12 })
    .margin({ left: 12, right: 12, top: 6, bottom: 6 })
    .borderRadius(14)
    .linearGradient({ direction: GradientDirection.LeftTop,
      colors: [['#FFF5F5', 0], ['#FFE4E4', 1]] })
    .alignItems(VerticalAlign.Center)
  }
}

@Component
struct WHWealthSelection {
  aboutToAppear() {
    SensorDataClient.sliceImpression('WEALTH_SELECTION', 'slice-wealth-sel', 7,
      'wealth-selection-hk-2026')
  }

  build() {
    Column({ space: 0 }) {
      Row() {
        Text('財富精選').fontSize(15).fontWeight(FontWeight.Bold)
        Blank().layoutWeight(1)
        Text('更多 ›').fontSize(12).fontColor(Hive.Color.brandPrimary)
      }.width('100%').margin({ bottom: 10 })

      ForEach(WEALTH_PRODUCTS, (p: WealthProd, index: number) => {
        Row() {
          Column({ space: 2 }) {
            Text(p.name).fontSize(12).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n900)
            Row({ space: 6 }) {
              Text(p.risk).fontSize(9).fontColor(Hive.Color.n500)
                .padding({ left: 6, right: 6, top: 1, bottom: 1 })
                .borderRadius(8).backgroundColor(Hive.Color.n100)
              Text(p.redemption).fontSize(9).fontColor(Hive.Color.n500)
                .padding({ left: 6, right: 6, top: 1, bottom: 1 })
                .borderRadius(8).backgroundColor(Hive.Color.n100)
            }
          }.layoutWeight(1).alignItems(HorizontalAlign.Start)

          Column({ space: 2 }) {
            Text(p.yield7Day).fontSize(18).fontWeight(FontWeight.Bolder)
              .fontColor(Hive.Color.brandPrimary)
            Text('7日年化').fontSize(9).fontColor(Hive.Color.n400)
            if (p.highlighted) {
              Button(p.cta)
                .height(28).padding({ left: 12, right: 12 })
                .borderRadius(12).backgroundColor(Hive.Color.brandPrimary)
                .fontColor(Hive.Color.brandWhite).fontSize(10).fontWeight(FontWeight.Bold)
                .margin({ top: 4 })
                .onClick(() => { SensorDataClient.wealthProductTapped(p.name, p.id) })
            }
          }.alignItems(HorizontalAlign.End)
        }
        .width('100%').padding({ top: 10, bottom: 10 })
        .onClick(() => { SensorDataClient.wealthProductTapped(p.name, p.id) })

        if (index < WEALTH_PRODUCTS.length - 1) {
          Divider().color(Hive.Color.n100)
        }
      })

      Blank().height(10)
      Text('💬 理財產品這么多，哪款適合我？')
        .fontSize(11).fontColor(Hive.Color.n500).textAlign(TextAlign.Center).width('100%')
    }
    .width('100%').backgroundColor(Hive.Color.brandWhite)
    .padding({ left: 16, right: 16, top: 12, bottom: 12 })
  }
}

@Component
struct WHFeaturedRankings {
  aboutToAppear() {
    SensorDataClient.sliceImpression('FEATURED_RANKINGS', 'slice-rankings', 8)
  }

  build() {
    Column({ space: 0 }) {
      Row() {
        Text('特色榜單').fontSize(15).fontWeight(FontWeight.Bold)
        Blank().layoutWeight(1)
        Text('更多 ›').fontSize(12).fontColor(Hive.Color.brandPrimary)
      }.width('100%').margin({ bottom: 10 })

      ForEach(RANKINGS, (item: RankingItem) => {
        Row({ space: 12 }) {
          Text(item.icon).fontSize(24)
          Column({ space: 2 }) {
            Text(item.badge).fontSize(9).fontWeight(FontWeight.Bold)
              .fontColor(Hive.Color.brandPrimary)
              .padding({ left: 8, right: 8, top: 2, bottom: 2 })
              .borderRadius(10).backgroundColor('#FEF2F2')
            Text(item.title).fontSize(13).fontWeight(FontWeight.Bold).fontColor(Hive.Color.n900)
            Text(item.desc).fontSize(10).fontColor(Hive.Color.n500)
          }.layoutWeight(1).alignItems(HorizontalAlign.Start)
          Text('›').fontSize(16).fontColor(Hive.Color.n400)
        }
        .width('100%').padding({ top: 8, bottom: 8 })
        .onClick(() => { SensorDataClient.rankingsTapped(item.title, item.badge) })

        Divider().color('#F9FAFB')
      })
    }
    .width('100%').backgroundColor(Hive.Color.brandWhite)
    .padding({ left: 16, right: 16, top: 12, bottom: 12 })
  }
}

@Component
struct WHLifeDeals {
  private bottomLinks: BottomLink[] = [
    { icon: '🎁', label: '達標抽好禮\n丰润守护 健康随行', deepLink: 'hsbc://campaign/health' },
    { icon: '🏦', label: '行庆招财日\n享受特惠禮遇',       deepLink: 'hsbc://campaign/anniversary' },
  ]

  aboutToAppear() {
    SensorDataClient.sliceImpression('LIFE_DEALS', 'slice-life-deals', 9)
  }

  build() {
    Column({ space: 10 }) {
      Row() {
        Text('生活特惠').fontSize(15).fontWeight(FontWeight.Bold)
        Blank().layoutWeight(1)
        Text('更多 ›').fontSize(12).fontColor(Hive.Color.brandPrimary)
      }.width('100%')

      Row({ space: 10 }) {
        ForEach(DEALS, (d: DealItem) => {
          Column({ space: 0 }) {
            Text(d.emoji).fontSize(24)
              .width('100%').height(64).textAlign(TextAlign.Center)
              .backgroundColor(Hive.Color.n100)
            Text(d.tag).fontSize(9).fontWeight(FontWeight.Bold).fontColor(Hive.Color.brandWhite)
              .width('100%').textAlign(TextAlign.Center).padding({ top: 4, bottom: 4 })
              .backgroundColor(Hive.Color.brandPrimary)
          }
          .layoutWeight(1).borderRadius(12).clip(true)
          .backgroundColor(Hive.Color.n50)
          .onClick(() => { SensorDataClient.lifeDealTapped(d.brand, d.tag) })
        })
      }.width('100%')

      Row({ space: 10 }) {
        ForEach(this.bottomLinks, (link: BottomLink) => {
          Row({ space: 8 }) {
            Text(link.icon).fontSize(24)
            Text(link.label).fontSize(10).fontColor(Hive.Color.n700).lineHeight(16)
          }
          .layoutWeight(1).padding(10).borderRadius(12)
          .backgroundColor(Hive.Color.n50)
          .alignItems(VerticalAlign.Center)
          .onClick(() => {
            const extra: Record<string, ESObject> = {}
            extra['deep_link'] = link.deepLink as ESObject
            SensorDataClient.track('bottom_link_tap', 'Wealth', 'bottom_link_tapped',
              link.label, 'wealth_hub_hk', 'wealth_hub', '', '', '', '', '', '', '', '',
              extra)
          })
        })
      }.width('100%')
    }
    .width('100%').backgroundColor(Hive.Color.brandWhite)
    .padding({ left: 16, right: 16, top: 12, bottom: 12 })
  }
}
