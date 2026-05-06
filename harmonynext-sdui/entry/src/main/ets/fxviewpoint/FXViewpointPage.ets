// FXViewpointPage.ets
// HarmonyNext ArkTS — FX Viewpoint EUR & GBP (HK) page
// Loads slice layout from the UCP BFF (GET /api/v1/screen/fx-viewpoint-hk).
// The page is always LIVE in mock-bff so it never falls back to the static layout
// unless the BFF is unreachable.

import { Hive } from '../common/HiveTokens'
import { SensorDataClient } from '../network/SensorDataClient'
import { fetchFXViewpointScreen, WealthSlice } from '../network/KYCNetworkService'

// ─── Load-state enum ──────────────────────────────────────────────────────────
// ArkTS forbids string-union @State — plain number constants are used instead.
const LOAD_IDLE    = 0
const LOAD_LOADING = 1
const LOAD_DONE    = 2
const LOAD_ERROR   = 3

// ─── SDUI slice renderer ──────────────────────────────────────────────────────

@Component
struct FXSDUISliceView {
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
      FXHeaderNavBar({
        title: this.slice.props['title'] as string ?? 'FX Viewpoint',
        showBackButton: this.slice.props['showBackButton'] as boolean ?? true,
        onBack: this.onBack
      })
    } else if (this.slice.type === 'VIDEO_PLAYER' || this.slice.type === 'MARKET_INSIGHT_VIDEO') {
      FXVideoPlayer({ props: this.slice.props })
    } else if (this.slice.type === 'MARKET_BRIEFING_TEXT') {
      FXMarketBriefing({ props: this.slice.props })
    } else if (this.slice.type === 'CONTACT_RM_CTA') {
      // Rendered as sticky overlay in root; skip inline rendering
      Column() {}
    }
    // unknown types silently omitted
  }
}

// ─── Root view ────────────────────────────────────────────────────────────────

@Component
export struct FXViewpointView {
  @State loadState: number   = LOAD_IDLE
  @State sdui: WealthSlice[] = []
  onBack: () => void = () => {}

  aboutToAppear() {
    SensorDataClient.track('fx_viewpoint_viewed', 'FXViewpoint', 'page_viewed', '',
      'fx_viewpoint_hk', 'fx_viewpoint')
    this.loadFromBFF()
  }

  private async loadFromBFF(): Promise<void> {
    this.loadState = LOAD_LOADING
    try {
      const payload = await fetchFXViewpointScreen()
      this.sdui = payload.layout.children.filter((s: WealthSlice) => s.visible !== false)
      this.loadState = LOAD_DONE
    } catch (_e) {
      this.loadState = LOAD_ERROR
    }
  }

  private stickySlice(): WealthSlice | undefined {
    return this.sdui.find(
      (s: WealthSlice) => s.type === 'CONTACT_RM_CTA' && (s.props['sticky'] as boolean) === true
    )
  }

  build() {
    Stack({ alignContent: Alignment.Bottom }) {
      Scroll() {
        Column({ space: 0 }) {
          if (this.loadState === LOAD_LOADING) {
            FXHeaderNavBar({ title: 'FX Viewpoint', showBackButton: true, onBack: this.onBack })
            Row() {
              Text('Loading…').fontSize(13).fontColor(Hive.Color.n400)
            }
            .width('100%').height(80).justifyContent(FlexAlign.Center)

          } else if (this.loadState === LOAD_DONE && this.sdui.length > 0) {
            // SDUI path — render body slices (skip sticky CTA; rendered below)
            ForEach(
              this.sdui.filter((s: WealthSlice) => s.type !== 'CONTACT_RM_CTA'),
              (slice: WealthSlice) => {
                FXSDUISliceView({ slice: slice, onBack: this.onBack })
              }
            )
          } else {
            // Static fallback
            FXHeaderNavBar({ title: 'FX Viewpoint', showBackButton: true, onBack: this.onBack })
            FXVideoThumbnail({
              title: 'FX Viewpoint — EUR & GBP Market Insights (May 2026)',
              presenterName: 'Jackie Wong',
              presenterTitle: 'FX Strategist, HSBC Global Research',
              onPlay: () => {}
            })
            FXHardcodedBriefing()
          }

          // Bottom padding so content clears the sticky CTA
          Blank().height(72)
        }.width('100%')
      }.width('100%').height('100%').backgroundColor(Hive.Color.n50)

      // ── Sticky Contact RM CTA ─────────────────────────────────────────────
      if (this.loadState === LOAD_DONE && this.stickySlice() !== undefined) {
        FXContactRMCTA({
          label: this.stickySlice()!.props['label'] as string ?? 'Contact Your RM',
          subLabel: this.stickySlice()!.props['subLabel'] as string ?? '',
          bgColor: this.stickySlice()!.props['backgroundColor'] as string ?? '#DB0011'
        })
      } else {
        FXContactRMCTA({
          label: 'Contact Your RM',
          subLabel: 'Speak to your Relationship Manager about FX opportunities',
          bgColor: '#DB0011'
        })
      }
    }.width('100%').height('100%')
  }
}

// ─── 1. Header Nav Bar ────────────────────────────────────────────────────────

@Component
struct FXHeaderNavBar {
  title: string = 'FX Viewpoint'
  showBackButton: boolean = true
  onBack: () => void = () => {}

  build() {
    Column() {
      Row({ space: 12 }) {
        if (this.showBackButton) {
          Text('‹').fontSize(22).fontColor(Hive.Color.n800)
            .onClick(() => {
              SensorDataClient.track('back_tap', 'FXViewpoint', 'back_tapped', '',
                'fx_viewpoint_hk', 'fx_viewpoint')
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

// ─── 2. Video Player ──────────────────────────────────────────────────────────

@Component
struct FXVideoPlayer {
  props: Record<string, ESObject> = {}
  @State isPlaying: boolean = false

  private videoUrl(): string {
    const raw = this.props['videoUrl'] as string ?? ''
    return raw.replace('http://localhost:4000', 'http://10.0.2.2:4000')
      || 'http://10.0.2.2:4000/media/fx-viewpoint.mov'
  }

  build() {
    Column() {
      if (this.isPlaying) {
        Video({ src: this.videoUrl(), previewUri: '' })
          .width('100%').height(210)
          .autoPlay(true)
          .controls(true)
          .onFinish(() => { this.isPlaying = false })
      } else {
        FXVideoThumbnail({
          title: this.props['title'] as string ?? '',
          presenterName: this.props['presenterName'] as string ?? '',
          presenterTitle: this.props['presenterTitle'] as string ?? '',
          onPlay: () => { this.isPlaying = true }
        })
      }
    }
  }
}

@Component
struct FXVideoThumbnail {
  title: string = ''
  presenterName: string = ''
  presenterTitle: string = ''
  onPlay: () => void = () => {}

  build() {
    Column() {
      Stack({ alignContent: Alignment.Center }) {
        Column()
          .width('100%').height(210)
          .backgroundColor('#003366')
        Column({ space: 8 }) {
          Stack({ alignContent: Alignment.Center }) {
            Column()
              .width(64).height(64)
              .borderRadius(32)
              .backgroundColor('#33FFFFFF')
            Text('▶').fontSize(28).fontColor('#FFFFFF')
          }
          Text(this.title)
            .fontSize(13).fontColor('#D9FFFFFF')
            .textAlign(TextAlign.Center)
            .padding({ left: 16, right: 16 })
        }
      }
      .width('100%').height(210)
      .onClick(() => { this.onPlay() })

      // Presenter info bar
      Row({ space: 10 }) {
        Text('👤')
          .fontSize(18)
          .width(40).height(40)
          .textAlign(TextAlign.Center)
          .backgroundColor('#1A003366')
          .borderRadius(20)
        Column({ space: 2 }) {
          Text(this.presenterName)
            .fontSize(14).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n900)
          Text(this.presenterTitle)
            .fontSize(12).fontColor(Hive.Color.n500)
        }
        .alignItems(HorizontalAlign.Start)
        Blank()
      }
      .width('100%').backgroundColor(Hive.Color.brandWhite)
      .padding({ left: 16, right: 16, top: 12, bottom: 12 })

      Divider().color(Hive.Color.n200)
    }
  }
}

// ─── 3. Market Briefing Text ──────────────────────────────────────────────────

@Component
struct FXMarketBriefing {
  props: Record<string, ESObject> = {}

  private sectionTitle(): string { return this.props['sectionTitle'] as string ?? 'Key takeaways' }
  private rawPoints(): ESObject[] { return this.props['bulletPoints'] as ESObject[] ?? [] }
  private disclaimer(): string { return this.props['disclaimer'] as string ?? '' }

  build() {
    Column({ space: 16 }) {
      Text(this.sectionTitle())
        .fontSize(16).fontWeight(FontWeight.Bold).fontColor(Hive.Color.n900)

      Column({ space: 10 }) {
        ForEach(this.rawPoints(), (raw: ESObject) => {
          Row({ space: 8 }) {
            Text('●').fontSize(6).fontColor('#003366').margin({ top: 5 })
            Text(raw as string).fontSize(14).fontColor(Hive.Color.n700).layoutWeight(1)
          }.alignItems(VerticalAlign.Top)
        })
      }

      if (this.disclaimer().length > 0) {
        Text(this.disclaimer())
          .fontSize(10).fontColor(Hive.Color.n400)
          .padding(10)
          .backgroundColor(Hive.Color.n100)
          .borderRadius(6)
          .width('100%')
      }
    }
    .width('100%').backgroundColor(Hive.Color.brandWhite)
    .padding(16).alignItems(HorizontalAlign.Start)
  }
}

// ─── Hardcoded briefing fallback ──────────────────────────────────────────────

@Component
struct FXHardcodedBriefing {
  private readonly bullets: string[] = [
    'A weak USD is likely to persist into 2026, providing temporary support for the EUR and GBP.',
    'With the ECB expected to maintain its policy rate in 2026, the EUR should remain broadly stable.',
    'BoE delivered a 25 bps cut in May 2026 — further easing is data-dependent and market pricing appears stretched.',
    'GBP/USD faces near-term resistance at 1.3200 amid mixed UK growth signals.',
    'Investors should consider diversified FX exposure to manage downside risk against a volatile USD backdrop.',
  ]

  build() {
    Column({ space: 16 }) {
      Text('Key takeaways')
        .fontSize(16).fontWeight(FontWeight.Bold).fontColor(Hive.Color.n900)

      Column({ space: 10 }) {
        ForEach(this.bullets, (point: string) => {
          Row({ space: 8 }) {
            Text('●').fontSize(6).fontColor('#003366').margin({ top: 5 })
            Text(point).fontSize(14).fontColor(Hive.Color.n700).layoutWeight(1)
          }.alignItems(VerticalAlign.Top)
        })
      }

      Text('This material is issued by HSBC and is for information purposes only. ' +
        'It does not constitute investment advice or a recommendation to buy or sell any financial instrument.')
        .fontSize(10).fontColor(Hive.Color.n400)
        .padding(10).backgroundColor(Hive.Color.n100)
        .borderRadius(6).width('100%')
    }
    .width('100%').backgroundColor(Hive.Color.brandWhite)
    .padding(16).alignItems(HorizontalAlign.Start)
  }
}

// ─── 4. Contact RM CTA (sticky bottom bar) ────────────────────────────────────

@Component
struct FXContactRMCTA {
  label: string    = 'Contact Your RM'
  subLabel: string = ''
  bgColor: string  = '#DB0011'

  build() {
    Row() {
      Column({ space: 2 }) {
        Text(this.label)
          .fontSize(14).fontWeight(FontWeight.Medium).fontColor('#FFFFFF')
        if (this.subLabel.length > 0) {
          Text(this.subLabel)
            .fontSize(12).fontColor('#D9FFFFFF')
        }
      }
      .alignItems(HorizontalAlign.Start).layoutWeight(1)
      Text('›').fontSize(20).fontColor('#FFFFFF')
    }
    .width('100%')
    .padding({ left: 20, right: 20, top: 14, bottom: 14 })
    .backgroundColor(this.bgColor)
    .onClick(() => {
      SensorDataClient.track('contact_rm_tap', 'FXViewpoint', 'contact_rm_tapped', '',
        'fx_viewpoint_hk', 'fx_viewpoint')
    })
  }
}
