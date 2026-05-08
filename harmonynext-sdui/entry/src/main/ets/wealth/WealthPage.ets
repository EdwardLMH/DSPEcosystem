// WealthPage.ets
// HarmonyNext ArkTS — Home Hub HK page (OCDP "Home Hub (HK)" design)
// Loads slice layout from the OCDP BFF (GET /api/v1/screen/home-wealth-hk) when a
// LIVE page has been approved and published.  Falls back to the static layout when
// the BFF has no live page yet (404 / connection refused).
//
// Slice order (OCDP design):
//   1. HOME_SEARCH_HEADER       — red header + search bar
//   2. COMBO_QUICK_ACCESS       — tab bar + 2×5 quick-access icons
//   3. CARD_ACTIVATION_BANNER   — card activation notification strip
//   4. QUEST_BANNER             — "Getting started" quest card
//   5. FEATURE_PRODUCT          — featured fund list with tabs
//   6. WEALTH_STUDIO_CAROUSEL   — Premier Elite Wealth Studio episodes
//   7. GUIDES_INSIGHTS_CAROUSEL          — Guides and insights card carousel
//   8. FX_WATCHLIST             — FX watchlist with tier badge + table
//   9. DISCOVER_MORE_CAROUSEL            — Discover more campaign card carousel

import { Hive } from '../common/HiveTokens'
import { SensorDataClient } from '../network/SensorDataClient'
import { AISearchPage } from './AISearchPage'
import { fetchWealthScreen, WealthSlice } from '../network/KYCNetworkService'

// ─── Data models ──────────────────────────────────────────────────────────────

interface QuickItem  { icon: string; label: string; deepLink: string }
interface FundItem   { id: string; name: string; code: string; return1Y: string
                       tags: string[]; deepLink: string }
interface EpisodeItem { id: string; title: string; duration: string
                        thumbnail: string; deepLink: string }
interface GuideItem  { id: string; title: string; category: string
                       imageEmoji: string; deepLink: string; date?: string }
interface FXPair     { base: string; quote: string; rate: string
                       change: string; positive: boolean }
interface CampaignCard { id: string; title: string; tag: string
                         imageEmoji: string; deepLink: string }

// ─── Static fallback data ─────────────────────────────────────────────────────
// Mirrors OCDP mockData.ts — used on LOAD_ERROR path.

const QUICK_ROW1: QuickItem[] = [
  { icon: '👤', label: 'Account',  deepLink: 'hsbc://accounts' },
  { icon: '🌐', label: 'Transfer', deepLink: 'hsbc://transfer' },
  { icon: '💱', label: 'FX',       deepLink: 'hsbc://fx' },
  { icon: '📈', label: 'Stock',    deepLink: 'hsbc://stock' },
  { icon: '⏰', label: 'Deposit',  deepLink: 'hsbc://deposit' },
]

const QUICK_ROW2: QuickItem[] = [
  { icon: '📊', label: 'Holding', deepLink: 'hsbc://holding' },
  { icon: '💰', label: 'Safe',    deepLink: 'hsbc://safe' },
  { icon: '↔️', label: 'FPS',     deepLink: 'hsbc://fps' },
  { icon: '📷', label: 'Scan',    deepLink: 'hsbc://scan' },
  { icon: '⊞',  label: 'All',     deepLink: 'hsbc://all-services' },
]

const STATIC_FUNDS: FundItem[] = [
  { id: 'f1', name: 'HSBC GIF – Asia ex Japan Equity',
    code: 'HKAIEX', return1Y: '+18.4%',
    tags: ['Equity', 'Asia'],
    deepLink: 'hsbc://funds/HKAIEX' },
  { id: 'f2', name: 'HSBC GIF – Global Bond Fund',
    code: 'HKGBF', return1Y: '+4.2%',
    tags: ['Bond', 'Global'],
    deepLink: 'hsbc://funds/HKGBF' },
  { id: 'f3', name: 'HSBC GIF – Multi-Asset Growth',
    code: 'HKMAG', return1Y: '+9.7%',
    tags: ['Multi-Asset'],
    deepLink: 'hsbc://funds/HKMAG' },
]

const STATIC_EPISODES: EpisodeItem[] = [
  { id: 'e1', title: 'Market Outlook Q2 2026',
    duration: '18 min', thumbnail: '📹',
    deepLink: 'hsbc://studio/market-outlook-q2-2026' },
  { id: 'e2', title: 'Diversification in Volatile Markets',
    duration: '24 min', thumbnail: '📹',
    deepLink: 'hsbc://studio/diversification' },
  { id: 'e3', title: 'Premier Elite: Bespoke Portfolio',
    duration: '31 min', thumbnail: '📹',
    deepLink: 'hsbc://studio/bespoke-portfolio' },
]

const STATIC_GUIDES: GuideItem[] = [
  { id: 'g1', title: 'Getting the most from your Premier account',
    category: 'Premier Tips', imageEmoji: '🏦', date: '8 Apr 2024',
    deepLink: 'hsbc://guides/premier-tips' },
  { id: 'g2', title: 'Understanding fund risk levels',
    category: 'Investments', imageEmoji: '📊', date: '2 Apr 2024',
    deepLink: 'hsbc://guides/fund-risk' },
  { id: 'g3', title: 'FX strategy: hedging your HKD exposure',
    category: 'FX', imageEmoji: '💱', date: '28 Mar 2024',
    deepLink: 'hsbc://guides/fx-hedging' },
]

const STATIC_FX_PAIRS: FXPair[] = [
  { base: 'USD', quote: 'HKD', rate: '7.7851', change: '+0.02%', positive: true },
  { base: 'EUR', quote: 'HKD', rate: '8.4302', change: '-0.11%', positive: false },
  { base: 'GBP', quote: 'HKD', rate: '9.8154', change: '+0.08%', positive: true },
  { base: 'JPY', quote: 'HKD', rate: '0.0514', change: '-0.05%', positive: false },
  { base: 'CNH', quote: 'HKD', rate: '1.0722', change: '+0.01%', positive: true },
]

const STATIC_CAMPAIGNS: CampaignCard[] = [
  { id: 'c1', title: 'Earn up to 5% p.a. on new funds',
    tag: 'Time-limited', imageEmoji: '💎',
    deepLink: 'hsbc://campaign/new-funds-promo' },
  { id: 'c2', title: 'Premier Elite — exclusive art advisory',
    tag: 'Premier Elite', imageEmoji: '🖼️',
    deepLink: 'hsbc://campaign/art-advisory' },
  { id: 'c3', title: 'Global Reach: open a UK account',
    tag: 'Global Banking', imageEmoji: '🌍',
    deepLink: 'hsbc://campaign/global-reach' },
]

// ─── Load-state enum ──────────────────────────────────────────────────────────
// ArkTS forbids string-union @State — use plain number constants.
const LOAD_IDLE    = 0
const LOAD_LOADING = 1
const LOAD_DONE    = 2
const LOAD_ERROR   = 3

// ─── SDUI slice dispatcher ────────────────────────────────────────────────────
// Renders one BFF-supplied slice by type.  Unknown types are silently skipped.

@Component
struct SDUISliceView {
  slice: WealthSlice = { instanceId: '', type: '', props: {}, visible: true }
  onSearchTap: () => void = () => {}

  build() {
    if (!this.slice.visible) {
      Column() {}   // hidden slice — render nothing
    } else {
      this.renderSlice()
    }
  }

  @Builder renderSlice() {
    if (this.slice.type === 'HOME_SEARCH_HEADER') {
      SDUIHomeSearchHeader({ props: this.slice.props,
        onSearchTap: () => { this.onSearchTap() } })
    } else if (this.slice.type === 'COMBO_QUICK_ACCESS') {
      SDUIComboQuickAccess({ props: this.slice.props })
    } else if (this.slice.type === 'CARD_ACTIVATION_BANNER') {
      SDUICardActivationBanner({ props: this.slice.props })
    } else if (this.slice.type === 'QUEST_BANNER') {
      SDUIQuestBanner({ props: this.slice.props })
    } else if (this.slice.type === 'FEATURE_PRODUCT') {
      SDUIFeatureProduct({ props: this.slice.props })
    } else if (this.slice.type === 'WEALTH_STUDIO_CAROUSEL') {
      SDUIWealthStudioCarousel({ props: this.slice.props })
    } else if (this.slice.type === 'GUIDES_INSIGHTS_CAROUSEL') {
      SDUIGuidesInsights({ props: this.slice.props })
    } else if (this.slice.type === 'FX_WATCHLIST') {
      SDUIFXWatchlist({ props: this.slice.props })
    } else if (this.slice.type === 'DISCOVER_MORE_CAROUSEL') {
      SDUIDiscoverMore({ props: this.slice.props })
    } else if (this.slice.type === 'SPACER') {
      Blank().height(this.slice.props['height'] as number ?? 16)
    }
    // unknown types silently omitted
  }
}

// ─── Root view ─────────────────────────────────────────────────────────────────

@Component
export struct WealthPageView {
  @State searchOpen: boolean  = false
  @State loadState: number    = LOAD_IDLE    // LOAD_* constants
  @State sdui: WealthSlice[]  = []           // BFF slices when loaded

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
            WHHomeSearchHeader({ onSearchTap: () => { this.searchOpen = true } })
            Row() {
              Text('Loading…').fontSize(13).fontColor(Hive.Color.n400)
            }
            .width('100%').height(80)
            .justifyContent(FlexAlign.Center)
          } else if (this.loadState === LOAD_DONE && this.sdui.length > 0) {
            // ── SDUI path: render slices from BFF ──────────────────────────
            ForEach(this.sdui, (slice: WealthSlice) => {
              SDUISliceView({ slice: slice, onSearchTap: () => { this.searchOpen = true } })
            })
          } else {
            // ── Static fallback: BFF not live yet (LOAD_IDLE or LOAD_ERROR) ─
            WHHomeSearchHeader({ onSearchTap: () => { this.searchOpen = true } })
            WHComboQuickAccess()
            WHCardActivationBanner()
            WHQuestBanner()
            WHFeatureProduct()
            WHWealthStudioCarousel()
            WHGuidesInsights()
            WHFXWatchlist()
            WHDiscoverMore()
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

// ═══════════════════════════════════════════════════════════════════════════════
// SDUI slice components — BFF-driven renderers
// Each reads from props: Record<string, ESObject> delivered by the BFF.
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. HOME_SEARCH_HEADER ─────────────────────────────────────────────────────
// Segment-adaptive red header with "HSBC Premier", notification bell,
// headset icon, and a frosted white search bar with AI badge below.

@Component
struct SDUIHomeSearchHeader {
  props: Record<string, ESObject> = {}
  onSearchTap: () => void = () => {}

  private title(): string       { return this.props['title'] as string ?? 'HSBC Premier' }
  private placeholder(): string { return this.props['searchPlaceholder'] as string ?? 'Search with AI' }
  private showBell(): boolean   { return this.props['showNotificationBell'] as boolean ?? true }
  private showHeadset(): boolean { return this.props['showHeadset'] as boolean ?? true }

  build() {
    Column({ space: 0 }) {
      // Top bar: segment label + bell + headset
      Row({ space: 0 }) {
        Text(this.title())
          .fontSize(17).fontWeight(FontWeight.Bold).fontColor(Hive.Color.brandWhite)
          .layoutWeight(1)
        if (this.showBell()) {
          Text('🔔').fontSize(20).fontColor(Hive.Color.brandWhite)
            .margin({ right: 12 })
            .onClick(() => {
              SensorDataClient.track('notification_tap', 'Wealth', 'notification_tapped', '',
                'home_search_header', 'wealth_hub')
            })
        }
        if (this.showHeadset()) {
          Text('🎧').fontSize(20).fontColor(Hive.Color.brandWhite)
            .onClick(() => {
              SensorDataClient.track('headset_tap', 'Wealth', 'headset_tapped', '',
                'home_search_header', 'wealth_hub')
            })
        }
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 14, bottom: 8 })

      // Search bar row with AI badge
      Row({ space: 8 }) {
        Row({ space: 6 }) {
          Text('🔍').fontSize(13).fontColor(Hive.Color.n500)
          Text(this.placeholder()).fontSize(13).fontColor(Hive.Color.n400).layoutWeight(1)
          // AI badge
          Text('AI')
            .fontSize(9).fontWeight(FontWeight.Bold).fontColor('#DB0011')
            .padding({ left: 5, right: 5, top: 2, bottom: 2 })
            .borderRadius(6).backgroundColor('#FFEDED')
        }
        .layoutWeight(1).height(36)
        .padding({ left: 12, right: 12 })
        .borderRadius(18)
        .backgroundColor(Hive.Color.brandWhite)
        .onClick(() => {
          SensorDataClient.track('search_tap', 'Wealth', 'search_tapped', '',
            'home_search_header', 'wealth_hub')
          this.onSearchTap()
        })
      }
      .width('100%')
      .padding({ left: 16, right: 16, bottom: 12 })
    }
    .width('100%')
    .backgroundColor('#DB0011')
  }
}

// ── 2. COMBO_QUICK_ACCESS ─────────────────────────────────────────────────────
// Tab bar (My pick / Invest / Global / HK Daily) + 2 rows of 5 quick-access icons.

@Component
struct SDUIComboQuickAccess {
  props: Record<string, ESObject> = {}
  @State activeTab: number = 0

  private tabs(): string[] {
    const raw: ESObject[] = this.props['tabs'] as ESObject[]
    if (raw && raw.length > 0) {
      return raw.map((t: ESObject) => (t as Record<string, string>)['label'] ?? '')
    }
    return ['My pick', 'Invest', 'Global', 'HK Daily']
  }

  private row1(): ESObject[] { return this.props['row1Items'] as ESObject[] ?? [] as ESObject[] }
  private row2(): ESObject[] { return this.props['row2Items'] as ESObject[] ?? [] as ESObject[] }

  // Map BFF icon identifier strings to display emojis
  private resolveIcon(id: string): string {
    if (id === 'account')  return '👤'
    if (id === 'transfer') return '🌐'
    if (id === 'fx')       return '💱'
    if (id === 'stock')    return '📈'
    if (id === 'deposit')  return '⏰'
    if (id === 'holding')  return '📊'
    if (id === 'safe')     return '💰'
    if (id === 'fps')      return '↔️'
    if (id === 'scan')     return '📷'
    if (id === 'all')      return '⊞'
    return id  // fallback: render as-is (emoji or unknown)
  }

  // Shorten long BFF labels to fit under icon
  private shortLabel(label: string): string {
    if (label === 'Account overview')     return 'Account'
    if (label === 'Transfer Globally')    return 'Transfer'
    if (label === 'Foreign exchange')     return 'FX'
    if (label === 'Trade stock')          return 'Stock'
    if (label === 'Time deposit')         return 'Deposit'
    if (label === 'My holding details')   return 'Holding'
    if (label === 'Money safe')           return 'Safe'
    if (label === 'Local transfer/FPS')   return 'FPS'
    if (label === 'Scan to pay')          return 'Scan'
    if (label === 'All product & services') return 'All'
    return label
  }

  build() {
    Column({ space: 0 }) {
      // Tab bar — pill/capsule style (active=red, inactive=gray)
      Scroll() {
        Row({ space: 8 }) {
          ForEach(this.tabs(), (tab: string, idx: number) => {
            Text(tab)
              .fontSize(13)
              .fontWeight(this.activeTab === idx ? FontWeight.Bold : FontWeight.Normal)
              .fontColor(this.activeTab === idx ? Hive.Color.brandWhite : Hive.Color.n700)
              .padding({ left: 16, right: 16, top: 7, bottom: 7 })
              .borderRadius(18)
              .backgroundColor(this.activeTab === idx ? '#DB0011' : '#E4E4E4')
              .onClick(() => { this.activeTab = idx })
          })
        }
        .padding({ left: 16, right: 16, top: 10, bottom: 10 })
      }
      .scrollable(ScrollDirection.Horizontal)
      .scrollBar(BarState.Off)
      .width('100%')
      .backgroundColor(Hive.Color.brandWhite)

      // Row 1 — 5 icons
      Row({ space: 0 }) {
        ForEach(this.row1(), (raw: ESObject) => {
          Column({ space: 5 }) {
            Text(this.resolveIcon((raw as Record<string, string>)['icon'] ?? '')).fontSize(22)
              .width(48).height(48).textAlign(TextAlign.Center)
              .borderRadius(14).backgroundColor(Hive.Color.n100)
            Text(this.shortLabel((raw as Record<string, string>)['label'] ?? ''))
              .fontSize(10).fontColor(Hive.Color.n700).textAlign(TextAlign.Center)
          }
          .layoutWeight(1).alignItems(HorizontalAlign.Center)
          .padding({ top: 10 })
          .onClick(() => {
            SensorDataClient.quickAccessTapped(
              (raw as Record<string, string>)['label'] ?? '',
              (raw as Record<string, string>)['deepLink'] ?? '')
          })
        })
      }
      .width('100%').backgroundColor(Hive.Color.brandWhite)
      .padding({ left: 8, right: 8 })

      // Row 2 — 5 icons
      Row({ space: 0 }) {
        ForEach(this.row2(), (raw: ESObject) => {
          Column({ space: 5 }) {
            Text(this.resolveIcon((raw as Record<string, string>)['icon'] ?? '')).fontSize(22)
              .width(48).height(48).textAlign(TextAlign.Center)
              .borderRadius(14).backgroundColor(Hive.Color.n100)
            Text(this.shortLabel((raw as Record<string, string>)['label'] ?? ''))
              .fontSize(10).fontColor(Hive.Color.n700).textAlign(TextAlign.Center)
          }
          .layoutWeight(1).alignItems(HorizontalAlign.Center)
          .padding({ bottom: 10 })
          .onClick(() => {
            SensorDataClient.quickAccessTapped(
              (raw as Record<string, string>)['label'] ?? '',
              (raw as Record<string, string>)['deepLink'] ?? '')
          })
        })
      }
      .width('100%').backgroundColor(Hive.Color.brandWhite)
      .padding({ left: 8, right: 8 })
    }
    .width('100%')
  }
}

// ── 3. CARD_ACTIVATION_BANNER ─────────────────────────────────────────────────
// "Your card needs to be activated" notification strip.

@Component
struct SDUICardActivationBanner {
  props: Record<string, ESObject> = {}

  private message(): string  { return this.props['message'] as string ?? 'Your card needs to be activated' }
  private ctaLabel(): string { return this.props['ctaLabel'] as string ?? 'Activate now' }
  private deepLink(): string { return this.props['deepLink'] as string ?? 'hsbc://cards/activate' }

  build() {
    Row({ space: 10 }) {
      Text('💳').fontSize(18)
      Text(this.message())
        .fontSize(13).fontColor(Hive.Color.n900).layoutWeight(1)
      Text(this.ctaLabel())
        .fontSize(12).fontWeight(FontWeight.Bold).fontColor('#DB0011')
        .onClick(() => {
          SensorDataClient.sliceTapped('CARD_ACTIVATION_BANNER',
            this.props['instanceId'] as string ?? 'slice-card-activation',
            this.ctaLabel(), this.deepLink())
        })
    }
    .width('100%')
    .padding({ left: 16, right: 16, top: 10, bottom: 10 })
    .backgroundColor('#FFF5F5')
    .borderWidth({ bottom: 1 }).borderColor(Hive.Color.n100)
    .alignItems(VerticalAlign.Center)
  }
}

// ── 4. QUEST_BANNER ───────────────────────────────────────────────────────────
// "Getting started" quest card with HSBC icon, description, CTA.

@Component
struct SDUIQuestBanner {
  props: Record<string, ESObject> = {}

  private questTitle(): string { return this.props['questTitle'] as string ?? 'Getting started' }
  private desc(): string       { return this.props['description'] as string ?? 'Complete setup to unlock your full Premier benefits' }
  private ctaLabel(): string   { return this.props['ctaLabel'] as string ?? 'Continue' }
  private deepLink(): string   { return this.props['deepLink'] as string ?? 'hsbc://onboarding/checklist' }
  private progress(): number   { return this.props['progress'] as number ?? 40 }

  build() {
    Row({ space: 12 }) {
      // HSBC hexagon icon
      Text('🏦')
        .fontSize(28).width(52).height(52)
        .textAlign(TextAlign.Center)
        .borderRadius(14)
        .backgroundColor('#FEF2F2')

      Column({ space: 6 }) {
        Text(this.questTitle())
          .fontSize(14).fontWeight(FontWeight.Bold).fontColor(Hive.Color.n900)
        Text(this.desc())
          .fontSize(11).fontColor(Hive.Color.n500).maxLines(2)

        // Progress bar
        Stack({ alignContent: Alignment.Start }) {
          Row().width('100%').height(4).borderRadius(2).backgroundColor(Hive.Color.n100)
          Row().width(`${this.progress()}%`).height(4).borderRadius(2).backgroundColor('#DB0011')
        }

        Button(this.ctaLabel())
          .height(30).padding({ left: 16, right: 16 })
          .borderRadius(14).backgroundColor('#DB0011')
          .fontColor(Hive.Color.brandWhite).fontSize(11).fontWeight(FontWeight.Bold)
          .onClick(() => {
            SensorDataClient.sliceTapped('QUEST_BANNER',
              this.props['instanceId'] as string ?? 'slice-quest',
              this.ctaLabel(), this.deepLink())
          })
      }.layoutWeight(1).alignItems(HorizontalAlign.Start)
    }
    .width('100%')
    .padding({ left: 16, right: 16, top: 14, bottom: 14 })
    .margin({ top: 8, bottom: 0 })
    .backgroundColor(Hive.Color.brandWhite)
    .alignItems(VerticalAlign.Top)
  }
}

// ── 5. FEATURE_PRODUCT ────────────────────────────────────────────────────────
// "Feature product" section with tabs + fund list (name, code, 1Y return, tags).

@Component
struct SDUIFeatureProduct {
  props: Record<string, ESObject> = {}
  @State activeTab: number = 0

  private sectionTitle(): string { return this.props['sectionTitle'] as string ?? 'Feature product' }
  private tabs(): string[] {
    const raw: Array<string> = this.props['tabs'] as Array<string>
    if (raw && raw.length > 0) { return raw }
    return ['All', 'Equity', 'Bond', 'Multi-Asset']
  }
  private funds(): ESObject[] { return this.props['funds'] as ESObject[] ?? [] as ESObject[] }

  private fundTags(fund: ESObject): Array<string> {
    const tags: Array<string> = (fund as Record<string, ESObject>)['tags'] as Array<string>
    return tags ?? []
  }

  build() {
    Column({ space: 0 }) {
      // Section header
      Row() {
        Text(this.sectionTitle())
          .fontSize(16).fontWeight(FontWeight.Bold).fontColor(Hive.Color.n900)
        Blank().layoutWeight(1)
        Text('More ›').fontSize(12).fontColor('#DB0011')
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 14, bottom: 8 })

      // Sub-tabs
      Scroll() {
        Row({ space: 8 }) {
          ForEach(this.tabs(), (tab: string, idx: number) => {
            Text(tab)
              .fontSize(12)
              .fontWeight(this.activeTab === idx ? FontWeight.Bold : FontWeight.Normal)
              .fontColor(this.activeTab === idx ? Hive.Color.brandWhite : Hive.Color.n700)
              .padding({ left: 14, right: 14, top: 6, bottom: 6 })
              .borderRadius(16)
              .backgroundColor(this.activeTab === idx ? '#DB0011' : Hive.Color.n100)
              .onClick(() => { this.activeTab = idx })
          })
        }
        .padding({ left: 16, right: 16, bottom: 8 })
      }
      .scrollable(ScrollDirection.Horizontal)
      .scrollBar(BarState.Off)
      .width('100%')

      // Fund rows
      Column({ space: 0 }) {
        ForEach(this.funds(), (raw: ESObject, index: number) => {
          Row({ space: 12 }) {
            Column({ space: 4 }) {
              Text((raw as Record<string, string>)['name'] ?? '')
                .fontSize(13).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n900)
                .maxLines(2)
              Text((raw as Record<string, string>)['code'] ?? '')
                .fontSize(11).fontColor(Hive.Color.n500)
              // Tags
              Row({ space: 4 }) {
                ForEach(this.fundTags(raw), (tag: string) => {
                  Text(tag)
                    .fontSize(9).fontColor('#DB0011')
                    .padding({ left: 6, right: 6, top: 2, bottom: 2 })
                    .borderRadius(8).backgroundColor('#FEF2F2')
                })
              }
            }.layoutWeight(1).alignItems(HorizontalAlign.Start)

            Column({ space: 2 }) {
              Text((raw as Record<string, string>)['return1Y'] ?? '')
                .fontSize(18).fontWeight(FontWeight.Bold)
                .fontColor((raw as Record<string, string>)['return1Y']?.startsWith('+') ? '#16A34A' : '#DC2626')
              Text('1Y return').fontSize(9).fontColor(Hive.Color.n400)
            }.alignItems(HorizontalAlign.End)
          }
          .width('100%')
          .padding({ left: 16, right: 16, top: 12, bottom: 12 })
          .onClick(() => {
            SensorDataClient.wealthProductTapped(
              (raw as Record<string, string>)['name'] ?? '',
              (raw as Record<string, string>)['id'] ?? '')
          })

          if (index < this.funds().length - 1) {
            Divider().color(Hive.Color.n100).margin({ left: 16, right: 16 })
          }
        })
      }
    }
    .width('100%').backgroundColor(Hive.Color.brandWhite)
    .margin({ top: 8 })
  }
}

// ── 6. WEALTH_STUDIO_CAROUSEL ─────────────────────────────────────────────────
// "Premier Elite Wealth Studio" horizontal carousel with episode cards.

@Component
struct SDUIWealthStudioCarousel {
  props: Record<string, ESObject> = {}

  private sectionTitle(): string { return this.props['sectionTitle'] as string ?? 'Premier Elite Wealth Studio' }
  private moreLabel(): string    { return this.props['moreLabel'] as string ?? 'View all' }
  private items(): ESObject[]    { return this.props['items'] as ESObject[] ?? [] as ESObject[] }

  build() {
    Column({ space: 0 }) {
      Row() {
        Text(this.sectionTitle())
          .fontSize(16).fontWeight(FontWeight.Bold).fontColor(Hive.Color.n900)
        Blank().layoutWeight(1)
        Text(`${this.moreLabel()} ›`).fontSize(12).fontColor('#DB0011')
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 14, bottom: 10 })

      Scroll() {
        Row({ space: 12 }) {
          ForEach(this.items(), (raw: ESObject) => {
            Column({ space: 0 }) {
              // Image area — fixed 100px height
              Stack({ alignContent: Alignment.BottomStart }) {
                Text('📹')
                  .fontSize(32)
                  .width(180).height(100)
                  .textAlign(TextAlign.Center)
                  .backgroundColor((raw as Record<string, string>)['imageColor'] ?? Hive.Color.n700)
                  .borderRadius({ topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 })
                // Play button centred
                Text('▶')
                  .fontSize(20).fontColor(Hive.Color.brandWhite)
                  .width(36).height(36).textAlign(TextAlign.Center)
                  .borderRadius(18).backgroundColor('#80000000')
                  .position({ x: 72, y: 32 })
                // Live badge bottom-left
                Text((raw as Record<string, string>)['liveBadge'] ?? '')
                  .fontSize(8).fontWeight(FontWeight.Bold).fontColor(Hive.Color.brandWhite)
                  .padding({ left: 6, right: 6, top: 2, bottom: 2 })
                  .borderRadius(3).backgroundColor('#DB0011')
                  .margin({ left: 8, bottom: 8 })
              }
              // Text area — fixed 72px height so cards align
              Column({ space: 4 }) {
                Text((raw as Record<string, string>)['episodeLabel'] ?? '')
                  .fontSize(9).fontColor(Hive.Color.n400)
                Text((raw as Record<string, string>)['title'] ?? '')
                  .fontSize(11).fontWeight(FontWeight.Bold).fontColor(Hive.Color.n900)
                  .maxLines(2).width(180)
              }
              .alignItems(HorizontalAlign.Start)
              .width(180).height(72)
              .padding({ left: 10, right: 10, top: 8, bottom: 8 })
              .backgroundColor(Hive.Color.brandWhite)
              .borderRadius({ topLeft: 0, topRight: 0, bottomLeft: 10, bottomRight: 10 })
            }
            .borderRadius(10).clip(true)
            .shadow({ radius: 4, color: '#14000000', offsetX: 0, offsetY: 2 })
            .onClick(() => {
              SensorDataClient.wealthStudioTapped(
                (raw as Record<string, string>)['title'] ?? '',
                (raw as Record<string, string>)['id'] ?? '')
            })
          })
        }
        .padding({ left: 16, right: 16, bottom: 14 })
      }
      .scrollable(ScrollDirection.Horizontal)
      .scrollBar(BarState.Off)
      .width('100%')
    }
    .width('100%').backgroundColor(Hive.Color.brandWhite)
    .margin({ top: 8 })
  }
}

// ── 7. GUIDES_INSIGHTS_CAROUSEL ────────────────────────────────────────────────────────
// "Guides and insights" horizontal card carousel.

@Component
struct SDUIGuidesInsights {
  props: Record<string, ESObject> = {}

  private sectionTitle(): string { return this.props['sectionTitle'] as string ?? 'Guides and insights' }
  private moreLabel(): string    { return this.props['moreLabel'] as string ?? 'View all' }
  private items(): ESObject[]    { return this.props['items'] as ESObject[] ?? [] as ESObject[] }

  build() {
    Column({ space: 0 }) {
      Row() {
        Text(this.sectionTitle())
          .fontSize(16).fontWeight(FontWeight.Bold).fontColor(Hive.Color.n900)
        Blank().layoutWeight(1)
        Text(`${this.moreLabel()} ›`).fontSize(12).fontColor('#DB0011')
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 14, bottom: 10 })

      Scroll() {
        Row({ space: 12 }) {
          ForEach(this.items(), (raw: ESObject) => {
            Column({ space: 0 }) {
              // Fixed-height image area
              Text('📖')
                .fontSize(36)
                .width(160).height(90)
                .textAlign(TextAlign.Center)
                .backgroundColor((raw as Record<string, string>)['imageColor'] ?? Hive.Color.n100)
                .borderRadius({ topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 })
              // Fixed-height text area so cards stay same height
              Column({ space: 4 }) {
                Text((raw as Record<string, string>)['title'] ?? '')
                  .fontSize(11).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n900)
                  .maxLines(3).width(160)
                Text((raw as Record<string, string>)['date'] ?? '')
                  .fontSize(9).fontColor(Hive.Color.n400)
              }
              .alignItems(HorizontalAlign.Start)
              .width(160).height(72)
              .padding({ left: 8, right: 8, top: 8, bottom: 8 })
              .backgroundColor(Hive.Color.brandWhite)
              .borderRadius({ topLeft: 0, topRight: 0, bottomLeft: 10, bottomRight: 10 })
            }
            .borderRadius(10).clip(true)
            .shadow({ radius: 4, color: '#14000000', offsetX: 0, offsetY: 2 })
            .onClick(() => {
              SensorDataClient.guidesTapped(
                (raw as Record<string, string>)['title'] ?? '',
                (raw as Record<string, string>)['id'] ?? '')
            })
          })
        }
        .padding({ left: 16, right: 16, bottom: 14 })
      }
      .scrollable(ScrollDirection.Horizontal)
      .scrollBar(BarState.Off)
      .width('100%')
    }
    .width('100%').backgroundColor(Hive.Color.brandWhite)
    .margin({ top: 8 })
  }
}

// ── 8. FX_WATCHLIST ───────────────────────────────────────────────────────────
// "FX watchlist" with tier badge and currency pair table.

@Component
struct SDUIFXWatchlist {
  props: Record<string, ESObject> = {}

  private sectionTitle(): string { return this.props['sectionTitle'] as string ?? 'FX watchlist' }
  private tierBadge(): string    { return this.props['tierBadge'] as string ?? 'Premier' }
  private pairs(): ESObject[]    { return this.props['pairs'] as ESObject[] ?? [] as ESObject[] }

  build() {
    Column({ space: 0 }) {
      // Header row
      Row({ space: 8 }) {
        Text(this.sectionTitle())
          .fontSize(16).fontWeight(FontWeight.Bold).fontColor(Hive.Color.n900)
        Text(this.tierBadge())
          .fontSize(9).fontWeight(FontWeight.Bold).fontColor('#DB0011')
          .padding({ left: 8, right: 8, top: 3, bottom: 3 })
          .borderRadius(10).backgroundColor('#FEF2F2')
        Blank().layoutWeight(1)
        Text('View all ›').fontSize(12).fontColor('#DB0011')
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 14, bottom: 8 })

      // Column headers
      Row() {
        Text('Currency pair').fontSize(11).fontColor(Hive.Color.n400).layoutWeight(2)
        Text('Rate').fontSize(11).fontColor(Hive.Color.n400).layoutWeight(1).textAlign(TextAlign.End)
        Text('Change').fontSize(11).fontColor(Hive.Color.n400).layoutWeight(1).textAlign(TextAlign.End)
      }
      .width('100%')
      .padding({ left: 16, right: 16, bottom: 6 })

      Divider().color(Hive.Color.n100).margin({ left: 16, right: 16 })

      // FX rows
      ForEach(this.pairs(), (raw: ESObject, index: number) => {
        Row({ space: 0 }) {
          Text(`${(raw as Record<string, string>)['base'] ?? ''} / ${(raw as Record<string, string>)['quote'] ?? ''}`)
            .fontSize(13).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n900).layoutWeight(2)
          Text((raw as Record<string, string>)['rate'] ?? '')
            .fontSize(13).fontColor(Hive.Color.n900).layoutWeight(1).textAlign(TextAlign.End)
          Text((raw as Record<string, string>)['change'] ?? '')
            .fontSize(13).fontWeight(FontWeight.Medium)
            .fontColor((raw as Record<string, boolean>)['positive'] ? '#16A34A' : '#DC2626')
            .layoutWeight(1).textAlign(TextAlign.End)
        }
        .width('100%')
        .padding({ left: 16, right: 16, top: 10, bottom: 10 })
        .onClick(() => {
          SensorDataClient.track('fx_pair_tap', 'Wealth', 'fx_pair_tapped',
            `${(raw as Record<string, string>)['base'] ?? ''}/${(raw as Record<string, string>)['quote'] ?? ''}`,
            'fx_watchlist', 'wealth_hub')
        })

        if (index < this.pairs().length - 1) {
          Divider().color(Hive.Color.n100).margin({ left: 16, right: 16 })
        }
      })

      Blank().height(12)
    }
    .width('100%').backgroundColor(Hive.Color.brandWhite)
    .margin({ top: 8 })
  }
}

// ── 9. DISCOVER_MORE_CAROUSEL ──────────────────────────────────────────────────────────
// "Discover more" horizontal campaign card carousel.

@Component
struct SDUIDiscoverMore {
  props: Record<string, ESObject> = {}

  private sectionTitle(): string   { return this.props['sectionTitle'] as string ?? 'Discover more' }
  private items(): ESObject[]      { return this.props['items'] as ESObject[] ?? [] as ESObject[] }

  build() {
    Column({ space: 0 }) {
      Row() {
        Text(this.sectionTitle())
          .fontSize(16).fontWeight(FontWeight.Bold).fontColor(Hive.Color.n900)
        Blank().layoutWeight(1)
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 14, bottom: 10 })

      Scroll() {
        Row({ space: 12 }) {
          ForEach(this.items(), (raw: ESObject) => {
            Column({ space: 0 }) {
              // Fixed-height image area with tag chip
              Stack({ alignContent: Alignment.TopStart }) {
                Text('🏦')
                  .fontSize(40)
                  .width(200).height(110)
                  .textAlign(TextAlign.Center)
                  .backgroundColor((raw as Record<string, string>)['imageColor'] ?? Hive.Color.n700)
                  .borderRadius({ topLeft: 12, topRight: 12, bottomLeft: 0, bottomRight: 0 })
                Text((raw as Record<string, string>)['tag'] ?? '')
                  .fontSize(9).fontWeight(FontWeight.Bold).fontColor(Hive.Color.brandWhite)
                  .padding({ left: 8, right: 8, top: 4, bottom: 4 })
                  .borderRadius(10)
                  .backgroundColor((raw as Record<string, string>)['tagColor'] ?? '#DB0011')
                  .margin({ left: 10, top: 10 })
              }
              // Fixed-height text area
              Column({ space: 4 }) {
                Text((raw as Record<string, string>)['title'] ?? '')
                  .fontSize(12).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n900)
                  .maxLines(2).width(200)
                Text((raw as Record<string, string>)['subtitle'] ?? '')
                  .fontSize(10).fontColor(Hive.Color.n400).maxLines(2).width(200)
              }
              .alignItems(HorizontalAlign.Start)
              .width(200).height(72)
              .padding({ left: 10, right: 10, top: 8, bottom: 8 })
              .backgroundColor(Hive.Color.brandWhite)
              .borderRadius({ topLeft: 0, topRight: 0, bottomLeft: 12, bottomRight: 12 })
            }
            .borderRadius(12).clip(true)
            .backgroundColor(Hive.Color.brandWhite)
            .shadow({ radius: 4, color: '#14000000', offsetX: 0, offsetY: 2 })
            .onClick(() => {
              SensorDataClient.discoverMoreTapped(
                (raw as Record<string, string>)['title'] ?? '',
                (raw as Record<string, string>)['tag'] ?? '')
            })
          })
        }
        .padding({ left: 16, right: 16, bottom: 14 })
      }
      .scrollable(ScrollDirection.Horizontal)
      .scrollBar(BarState.Off)
      .width('100%')
    }
    .width('100%').backgroundColor(Hive.Color.n50)
    .margin({ top: 8 })
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Static fallback components — WHxxx
// Used when the BFF has no LIVE page published yet (LOAD_IDLE or LOAD_ERROR).
// Hardcoded data mirrors OCDP mockData.ts.
// ═══════════════════════════════════════════════════════════════════════════════

// ── WH 1: WHHomeSearchHeader ──────────────────────────────────────────────────

@Component
struct WHHomeSearchHeader {
  onSearchTap: () => void = () => {}

  aboutToAppear() {
    SensorDataClient.sliceImpression('HOME_SEARCH_HEADER', 'slice-home-search-hdr', 0)
  }

  build() {
    Column({ space: 0 }) {
      // Top bar
      Row({ space: 0 }) {
        Text('HSBC Premier')
          .fontSize(17).fontWeight(FontWeight.Bold).fontColor(Hive.Color.brandWhite)
          .layoutWeight(1)
        Text('🔔').fontSize(20).fontColor(Hive.Color.brandWhite)
          .margin({ right: 12 })
          .onClick(() => {
            SensorDataClient.track('notification_tap', 'Wealth', 'notification_tapped', '',
              'home_search_header', 'wealth_hub')
          })
        Text('🎧').fontSize(20).fontColor(Hive.Color.brandWhite)
          .onClick(() => {
            SensorDataClient.track('headset_tap', 'Wealth', 'headset_tapped', '',
              'home_search_header', 'wealth_hub')
          })
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 14, bottom: 8 })

      // Search bar
      Row({ space: 8 }) {
        Row({ space: 6 }) {
          Text('🔍').fontSize(13).fontColor(Hive.Color.n500)
          Text('Search with AI').fontSize(13).fontColor(Hive.Color.n400).layoutWeight(1)
          Text('AI')
            .fontSize(9).fontWeight(FontWeight.Bold).fontColor('#DB0011')
            .padding({ left: 5, right: 5, top: 2, bottom: 2 })
            .borderRadius(6).backgroundColor('#FFEDED')
        }
        .layoutWeight(1).height(36)
        .padding({ left: 12, right: 12 })
        .borderRadius(18)
        .backgroundColor(Hive.Color.brandWhite)
        .onClick(() => {
          SensorDataClient.track('search_tap', 'Wealth', 'search_tapped', '',
            'home_search_header', 'wealth_hub')
          this.onSearchTap()
        })
      }
      .width('100%')
      .padding({ left: 16, right: 16, bottom: 12 })
    }
    .width('100%')
    .backgroundColor('#DB0011')
  }
}

// ── WH 2: WHComboQuickAccess ──────────────────────────────────────────────────

@Component
struct WHComboQuickAccess {
  @State activeTab: number = 0
  private tabs: string[] = ['My pick', 'Invest', 'Global', 'HK Daily']

  aboutToAppear() {
    SensorDataClient.sliceImpression('COMBO_QUICK_ACCESS', 'slice-combo-quick', 1)
  }

  build() {
    Column({ space: 0 }) {
      // Tab bar — pill/capsule style (active=red, inactive=gray)
      Scroll() {
        Row({ space: 8 }) {
          ForEach(this.tabs, (tab: string, idx: number) => {
            Text(tab)
              .fontSize(13)
              .fontWeight(this.activeTab === idx ? FontWeight.Bold : FontWeight.Normal)
              .fontColor(this.activeTab === idx ? Hive.Color.brandWhite : Hive.Color.n700)
              .padding({ left: 16, right: 16, top: 7, bottom: 7 })
              .borderRadius(18)
              .backgroundColor(this.activeTab === idx ? '#DB0011' : '#E4E4E4')
              .onClick(() => { this.activeTab = idx })
          })
        }
        .padding({ left: 16, right: 16, top: 10, bottom: 10 })
      }
      .scrollable(ScrollDirection.Horizontal)
      .scrollBar(BarState.Off)
      .width('100%')
      .backgroundColor(Hive.Color.brandWhite)

      // Row 1
      Row({ space: 0 }) {
        ForEach(QUICK_ROW1, (item: QuickItem) => {
          Column({ space: 5 }) {
            Text(item.icon).fontSize(22)
              .width(48).height(48).textAlign(TextAlign.Center)
              .borderRadius(14).backgroundColor(Hive.Color.n100)
            Text(item.label).fontSize(10).fontColor(Hive.Color.n700).textAlign(TextAlign.Center)
          }
          .layoutWeight(1).alignItems(HorizontalAlign.Center)
          .padding({ top: 10 })
          .onClick(() => { SensorDataClient.quickAccessTapped(item.label, item.deepLink) })
        })
      }
      .width('100%').backgroundColor(Hive.Color.brandWhite)
      .padding({ left: 8, right: 8 })

      // Row 2
      Row({ space: 0 }) {
        ForEach(QUICK_ROW2, (item: QuickItem) => {
          Column({ space: 5 }) {
            Text(item.icon).fontSize(22)
              .width(48).height(48).textAlign(TextAlign.Center)
              .borderRadius(14).backgroundColor(Hive.Color.n100)
            Text(item.label).fontSize(10).fontColor(Hive.Color.n700).textAlign(TextAlign.Center)
          }
          .layoutWeight(1).alignItems(HorizontalAlign.Center)
          .padding({ bottom: 10 })
          .onClick(() => { SensorDataClient.quickAccessTapped(item.label, item.deepLink) })
        })
      }
      .width('100%').backgroundColor(Hive.Color.brandWhite)
      .padding({ left: 8, right: 8 })
    }
    .width('100%')
  }
}

// ── WH 3: WHCardActivationBanner ─────────────────────────────────────────────

@Component
struct WHCardActivationBanner {
  aboutToAppear() {
    SensorDataClient.sliceImpression('CARD_ACTIVATION_BANNER', 'slice-card-act', 2)
  }

  build() {
    Row({ space: 10 }) {
      Text('💳').fontSize(18)
      Text('Your card needs to be activated')
        .fontSize(13).fontColor(Hive.Color.n900).layoutWeight(1)
      Text('Activate now')
        .fontSize(12).fontWeight(FontWeight.Bold).fontColor('#DB0011')
        .onClick(() => {
          SensorDataClient.sliceTapped('CARD_ACTIVATION_BANNER', 'slice-card-act',
            'Activate now', 'hsbc://cards/activate')
        })
    }
    .width('100%')
    .padding({ left: 16, right: 16, top: 10, bottom: 10 })
    .backgroundColor('#FFF5F5')
    .borderWidth({ bottom: 1 }).borderColor(Hive.Color.n100)
    .alignItems(VerticalAlign.Center)
  }
}

// ── WH 4: WHQuestBanner ───────────────────────────────────────────────────────

@Component
struct WHQuestBanner {
  aboutToAppear() {
    SensorDataClient.sliceImpression('QUEST_BANNER', 'slice-quest', 3)
  }

  build() {
    Row({ space: 12 }) {
      Text('🏦')
        .fontSize(28).width(52).height(52)
        .textAlign(TextAlign.Center)
        .borderRadius(14).backgroundColor('#FEF2F2')

      Column({ space: 6 }) {
        Text('Getting started')
          .fontSize(14).fontWeight(FontWeight.Bold).fontColor(Hive.Color.n900)
        Text('Complete setup to unlock your full Premier benefits')
          .fontSize(11).fontColor(Hive.Color.n500).maxLines(2)

        // Progress bar at 40%
        Stack({ alignContent: Alignment.Start }) {
          Row().width('100%').height(4).borderRadius(2).backgroundColor(Hive.Color.n100)
          Row().width('40%').height(4).borderRadius(2).backgroundColor('#DB0011')
        }

        Button('Continue')
          .height(30).padding({ left: 16, right: 16 })
          .borderRadius(14).backgroundColor('#DB0011')
          .fontColor(Hive.Color.brandWhite).fontSize(11).fontWeight(FontWeight.Bold)
          .onClick(() => {
            SensorDataClient.sliceTapped('QUEST_BANNER', 'slice-quest',
              'Continue', 'hsbc://onboarding/checklist')
          })
      }.layoutWeight(1).alignItems(HorizontalAlign.Start)
    }
    .width('100%')
    .padding({ left: 16, right: 16, top: 14, bottom: 14 })
    .margin({ top: 8 })
    .backgroundColor(Hive.Color.brandWhite)
    .alignItems(VerticalAlign.Top)
  }
}

// ── WH 5: WHFeatureProduct ────────────────────────────────────────────────────

@Component
struct WHFeatureProduct {
  @State activeTab: number = 0
  private fundTabs: string[] = ['All', 'Equity', 'Bond', 'Multi-Asset']

  aboutToAppear() {
    SensorDataClient.sliceImpression('FEATURE_PRODUCT', 'slice-feature-product', 4)
  }

  build() {
    Column({ space: 0 }) {
      Row() {
        Text('Feature product')
          .fontSize(16).fontWeight(FontWeight.Bold).fontColor(Hive.Color.n900)
        Blank().layoutWeight(1)
        Text('More ›').fontSize(12).fontColor('#DB0011')
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 14, bottom: 8 })

      Scroll() {
        Row({ space: 8 }) {
          ForEach(this.fundTabs, (tab: string, idx: number) => {
            Text(tab)
              .fontSize(12)
              .fontWeight(this.activeTab === idx ? FontWeight.Bold : FontWeight.Normal)
              .fontColor(this.activeTab === idx ? Hive.Color.brandWhite : Hive.Color.n700)
              .padding({ left: 14, right: 14, top: 6, bottom: 6 })
              .borderRadius(16)
              .backgroundColor(this.activeTab === idx ? '#DB0011' : Hive.Color.n100)
              .onClick(() => { this.activeTab = idx })
          })
        }
        .padding({ left: 16, right: 16, bottom: 8 })
      }
      .scrollable(ScrollDirection.Horizontal).scrollBar(BarState.Off).width('100%')

      Column({ space: 0 }) {
        ForEach(STATIC_FUNDS, (fund: FundItem, index: number) => {
          Row({ space: 12 }) {
            Column({ space: 4 }) {
              Text(fund.name)
                .fontSize(13).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n900).maxLines(2)
              Text(fund.code).fontSize(11).fontColor(Hive.Color.n500)
              Row({ space: 4 }) {
                ForEach(fund.tags, (tag: string) => {
                  Text(tag)
                    .fontSize(9).fontColor('#DB0011')
                    .padding({ left: 6, right: 6, top: 2, bottom: 2 })
                    .borderRadius(8).backgroundColor('#FEF2F2')
                })
              }
            }.layoutWeight(1).alignItems(HorizontalAlign.Start)

            Column({ space: 2 }) {
              Text(fund.return1Y)
                .fontSize(18).fontWeight(FontWeight.Bold)
                .fontColor(fund.return1Y.startsWith('+') ? '#16A34A' : '#DC2626')
              Text('1Y return').fontSize(9).fontColor(Hive.Color.n400)
            }.alignItems(HorizontalAlign.End)
          }
          .width('100%')
          .padding({ left: 16, right: 16, top: 12, bottom: 12 })
          .onClick(() => { SensorDataClient.wealthProductTapped(fund.name, fund.id) })

          if (index < STATIC_FUNDS.length - 1) {
            Divider().color(Hive.Color.n100).margin({ left: 16, right: 16 })
          }
        })
      }
    }
    .width('100%').backgroundColor(Hive.Color.brandWhite)
    .margin({ top: 8 })
  }
}

// ── WH 6: WHWealthStudioCarousel ──────────────────────────────────────────────

@Component
struct WHWealthStudioCarousel {
  aboutToAppear() {
    SensorDataClient.sliceImpression('WEALTH_STUDIO_CAROUSEL', 'slice-wealth-studio', 5)
  }

  build() {
    Column({ space: 0 }) {
      Row() {
        Text('Premier Elite Wealth Studio')
          .fontSize(16).fontWeight(FontWeight.Bold).fontColor(Hive.Color.n900)
        Blank().layoutWeight(1)
        Text('All ›').fontSize(12).fontColor('#DB0011')
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 14, bottom: 10 })

      Scroll() {
        Row({ space: 12 }) {
          ForEach(STATIC_EPISODES, (ep: EpisodeItem) => {
            Column({ space: 0 }) {
              // Fixed-height image area
              Stack({ alignContent: Alignment.BottomStart }) {
                Text(ep.thumbnail).fontSize(32)
                  .width(180).height(100).textAlign(TextAlign.Center)
                  .backgroundColor(Hive.Color.n700)
                  .borderRadius({ topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 })
                Text('▶').fontSize(20).fontColor(Hive.Color.brandWhite)
                  .width(36).height(36).textAlign(TextAlign.Center)
                  .borderRadius(18).backgroundColor('#80000000')
                  .position({ x: 72, y: 32 })
              }
              // Fixed-height text area
              Column({ space: 4 }) {
                Text(ep.title)
                  .fontSize(11).fontWeight(FontWeight.Bold).fontColor(Hive.Color.n900)
                  .maxLines(2).width(180)
                Row({ space: 4 }) {
                  Text('⏱').fontSize(10).fontColor(Hive.Color.n400)
                  Text(ep.duration).fontSize(10).fontColor(Hive.Color.n400)
                }
              }
              .alignItems(HorizontalAlign.Start)
              .width(180).height(72)
              .padding({ left: 10, right: 10, top: 8, bottom: 8 })
              .backgroundColor(Hive.Color.brandWhite)
              .borderRadius({ topLeft: 0, topRight: 0, bottomLeft: 10, bottomRight: 10 })
            }
            .borderRadius(10).clip(true)
            .shadow({ radius: 4, color: '#14000000', offsetX: 0, offsetY: 2 })
            .onClick(() => { SensorDataClient.wealthStudioTapped(ep.title, ep.id) })
          })
        }
        .padding({ left: 16, right: 16, bottom: 14 })
      }
      .scrollable(ScrollDirection.Horizontal).scrollBar(BarState.Off).width('100%')
    }
    .width('100%').backgroundColor(Hive.Color.brandWhite)
    .margin({ top: 8 })
  }
}

// ── WH 7: WHGuidesInsights ────────────────────────────────────────────────────

@Component
struct WHGuidesInsights {
  aboutToAppear() {
    SensorDataClient.sliceImpression('GUIDES_INSIGHTS_CAROUSEL', 'slice-guides', 6)
  }

  build() {
    Column({ space: 0 }) {
      Row() {
        Text('Guides and insights')
          .fontSize(16).fontWeight(FontWeight.Bold).fontColor(Hive.Color.n900)
        Blank().layoutWeight(1)
        Text('More ›').fontSize(12).fontColor('#DB0011')
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 14, bottom: 10 })

      Scroll() {
        Row({ space: 12 }) {
          ForEach(STATIC_GUIDES, (guide: GuideItem) => {
            Column({ space: 0 }) {
              Text(guide.imageEmoji).fontSize(36)
                .width(160).height(90).textAlign(TextAlign.Center)
                .backgroundColor(Hive.Color.n100)
                .borderRadius({ topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 })
              Column({ space: 4 }) {
                Text(guide.title)
                  .fontSize(11).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n900)
                  .maxLines(3).width(160)
                Text(guide.date ?? '')
                  .fontSize(9).fontColor(Hive.Color.n400)
              }
              .alignItems(HorizontalAlign.Start)
              .width(160).height(72)
              .padding({ left: 8, right: 8, top: 8, bottom: 8 })
              .backgroundColor(Hive.Color.brandWhite)
              .borderRadius({ topLeft: 0, topRight: 0, bottomLeft: 10, bottomRight: 10 })
            }
            .borderRadius(10).clip(true)
            .shadow({ radius: 4, color: '#14000000', offsetX: 0, offsetY: 2 })
            .onClick(() => { SensorDataClient.guidesTapped(guide.title, guide.id) })
          })
        }
        .padding({ left: 16, right: 16, bottom: 14 })
      }
      .scrollable(ScrollDirection.Horizontal).scrollBar(BarState.Off).width('100%')
    }
    .width('100%').backgroundColor(Hive.Color.brandWhite)
    .margin({ top: 8 })
  }
}

// ── WH 8: WHFXWatchlist ───────────────────────────────────────────────────────

@Component
struct WHFXWatchlist {
  aboutToAppear() {
    SensorDataClient.sliceImpression('FX_WATCHLIST', 'slice-fx-watchlist', 7)
  }

  build() {
    Column({ space: 0 }) {
      Row({ space: 8 }) {
        Text('FX watchlist')
          .fontSize(16).fontWeight(FontWeight.Bold).fontColor(Hive.Color.n900)
        Text('Premier')
          .fontSize(9).fontWeight(FontWeight.Bold).fontColor('#DB0011')
          .padding({ left: 8, right: 8, top: 3, bottom: 3 })
          .borderRadius(10).backgroundColor('#FEF2F2')
        Blank().layoutWeight(1)
        Text('View all ›').fontSize(12).fontColor('#DB0011')
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 14, bottom: 8 })

      Row() {
        Text('Currency pair').fontSize(11).fontColor(Hive.Color.n400).layoutWeight(2)
        Text('Rate').fontSize(11).fontColor(Hive.Color.n400).layoutWeight(1).textAlign(TextAlign.End)
        Text('Change').fontSize(11).fontColor(Hive.Color.n400).layoutWeight(1).textAlign(TextAlign.End)
      }
      .width('100%').padding({ left: 16, right: 16, bottom: 6 })

      Divider().color(Hive.Color.n100).margin({ left: 16, right: 16 })

      ForEach(STATIC_FX_PAIRS, (pair: FXPair, index: number) => {
        Row({ space: 0 }) {
          Text(`${pair.base} / ${pair.quote}`)
            .fontSize(13).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n900).layoutWeight(2)
          Text(pair.rate)
            .fontSize(13).fontColor(Hive.Color.n900).layoutWeight(1).textAlign(TextAlign.End)
          Text(pair.change)
            .fontSize(13).fontWeight(FontWeight.Medium)
            .fontColor(pair.positive ? '#16A34A' : '#DC2626')
            .layoutWeight(1).textAlign(TextAlign.End)
        }
        .width('100%')
        .padding({ left: 16, right: 16, top: 10, bottom: 10 })
        .onClick(() => {
          SensorDataClient.track('fx_pair_tap', 'Wealth', 'fx_pair_tapped',
            `${pair.base}/${pair.quote}`, 'fx_watchlist', 'wealth_hub')
        })

        if (index < STATIC_FX_PAIRS.length - 1) {
          Divider().color(Hive.Color.n100).margin({ left: 16, right: 16 })
        }
      })

      Blank().height(12)
    }
    .width('100%').backgroundColor(Hive.Color.brandWhite)
    .margin({ top: 8 })
  }
}

// ── WH 9: WHDiscoverMore ─────────────────────────────────────────────────────

@Component
struct WHDiscoverMore {
  aboutToAppear() {
    SensorDataClient.sliceImpression('DISCOVER_MORE_CAROUSEL', 'slice-discover-more', 8)
  }

  build() {
    Column({ space: 0 }) {
      Row() {
        Text('Discover more')
          .fontSize(16).fontWeight(FontWeight.Bold).fontColor(Hive.Color.n900)
        Blank().layoutWeight(1)
        Text('All ›').fontSize(12).fontColor('#DB0011')
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 14, bottom: 10 })

      Scroll() {
        Row({ space: 12 }) {
          ForEach(STATIC_CAMPAIGNS, (card: CampaignCard) => {
            Column({ space: 0 }) {
              Stack({ alignContent: Alignment.TopStart }) {
                Text(card.imageEmoji).fontSize(40)
                  .width(200).height(110).textAlign(TextAlign.Center)
                  .backgroundColor(Hive.Color.n700)
                  .borderRadius({ topLeft: 12, topRight: 12, bottomLeft: 0, bottomRight: 0 })
                Text(card.tag)
                  .fontSize(9).fontWeight(FontWeight.Bold).fontColor(Hive.Color.brandWhite)
                  .padding({ left: 8, right: 8, top: 4, bottom: 4 })
                  .borderRadius(10).backgroundColor('#DB0011')
                  .margin({ left: 10, top: 10 })
              }
              Column({ space: 4 }) {
                Text(card.title)
                  .fontSize(12).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n900)
                  .maxLines(2).width(200)
              }
              .alignItems(HorizontalAlign.Start)
              .width(200).height(60)
              .padding({ left: 10, right: 10, top: 8, bottom: 8 })
              .backgroundColor(Hive.Color.brandWhite)
              .borderRadius({ topLeft: 0, topRight: 0, bottomLeft: 12, bottomRight: 12 })
            }
            .borderRadius(12).clip(true)
            .backgroundColor(Hive.Color.brandWhite)
            .shadow({ radius: 4, color: '#14000000', offsetX: 0, offsetY: 2 })
            .onClick(() => { SensorDataClient.discoverMoreTapped(card.title, card.tag) })
          })
        }
        .padding({ left: 16, right: 16, bottom: 14 })
      }
      .scrollable(ScrollDirection.Horizontal).scrollBar(BarState.Off).width('100%')
    }
    .width('100%').backgroundColor(Hive.Color.n50)
    .margin({ top: 8 })
  }
}
