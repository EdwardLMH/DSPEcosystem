// AISearchPage.ets
// HarmonyOS Next — AI Semantic Search overlay for Wealth Hub HK
// Activated when user taps the search placeholder in WHHeaderNav.

import { Hive } from '../common/HiveTokens'
import { SensorDataClient } from '../network/SensorDataClient'
import http from '@ohos.net.http'

// ─── Models ────────────────────────────────────────────────────────────────────

interface SearchResultItem {
  id: string
  type: string
  title: string
  description: string
  icon: string
  category: string
  deepLink: string
  score: number
}

interface GroupedCategory {
  category: string
  items: SearchResultItem[]
}

interface SuggestionChip { icon: string; label: string }

// ─── Constants ─────────────────────────────────────────────────────────────────

const BFF_BASE = 'http://localhost:4000'

const SUGGESTIONS: SuggestionChip[] = [
  { icon: '🌙', label: '朝朝寶' },
  { icon: '💰', label: '低風險理財' },
  { icon: '💳', label: '信用卡' },
  { icon: '💵', label: '借錢' },
  { icon: '💹', label: '基金' },
  { icon: '🥇', label: '基金榜單' },
]

// ─── Root search page ──────────────────────────────────────────────────────────

@Component
export struct AISearchPage {
  // Callback to dismiss this overlay and return to WealthPage
  onDismiss: () => void = () => {}

  @State private query: string = ''
  @State private results: SearchResultItem[] = []
  @State private grouped: GroupedCategory[] = []
  @State private isLoading: boolean = false
  @State private hasSearched: boolean = false
  @State private errorMsg: string = ''

  private debounceTimer: number = -1

  aboutToAppear() {
    SensorDataClient.track('ai_search_opened', 'Search', 'search_screen_viewed', '',
      'ai_search', 'wealth_hub')
  }

  // ── Debounced search trigger ─────────────────────────────────────────────────

  private onQueryChange(value: string) {
    this.query = value
    clearTimeout(this.debounceTimer)
    if (value.trim().length === 0) {
      this.results = []
      this.grouped = []
      this.hasSearched = false
      this.errorMsg = ''
      return
    }
    this.debounceTimer = setTimeout(() => {
      this.performSearch(value)
    }, 350)
  }

  // ── HTTP search call ─────────────────────────────────────────────────────────

  private performSearch(q: string) {
    this.isLoading = true
    this.errorMsg = ''

    SensorDataClient.track('ai_search_query', 'Search', 'search_submitted', q,
      'ai_search', 'wealth_hub')

    const reqBody = JSON.stringify({ query: q, limit: 10 })
    const httpReq = http.createHttp()

    httpReq.request(`${BFF_BASE}/api/v1/search`, {
      method: http.RequestMethod.POST,
      header: { 'Content-Type': 'application/json' },
      extraData: reqBody,
      connectTimeout: 5000,
      readTimeout: 8000,
    }, (err, data) => {
      this.isLoading = false
      if (err || data.responseCode !== 200) {
        this.errorMsg = '搜尋服務暫時不可用，請稍後重試。'
        this.results = []
        this.grouped = []
        this.hasSearched = true
        return
      }
      try {
        const parsed: Record<string, ESObject> = JSON.parse(data.result as string) as Record<string, ESObject>
        const arr: ESObject[] = parsed['results'] as ESObject[]
        const items: SearchResultItem[] = (arr as Array<Record<string, ESObject>>).map(
          (o: Record<string, ESObject>) => ({
            id:          o['id'] as string,
            type:        o['type'] as string,
            title:       o['title'] as string,
            description: o['description'] as string,
            icon:        o['icon'] as string,
            category:    o['category'] as string,
            deepLink:    o['deepLink'] as string,
            score:       o['score'] as number,
          } as SearchResultItem)
        )
        this.results = items
        this.grouped = this.buildGroups(items)
        this.hasSearched = true
      } catch (_e) {
        this.errorMsg = '回應解析失敗，請重試。'
        this.results = []
        this.grouped = []
        this.hasSearched = true
      }
    })
  }

  private buildGroups(items: SearchResultItem[]): GroupedCategory[] {
    const order: string[] = []
    const map: Record<string, SearchResultItem[]> = {}
    for (const item of items) {
      if (!map[item.category]) {
        order.push(item.category)
        map[item.category] = []
      }
      map[item.category].push(item)
    }
    return order.map((cat: string) => ({ category: cat, items: map[cat] } as GroupedCategory))
  }

  // ── Deep-link navigation ─────────────────────────────────────────────────────

  private onResultTap(result: SearchResultItem) {
    SensorDataClient.track('ai_search_result_tapped', 'Search', 'result_selected',
      result.title, 'ai_search', 'wealth_hub')
    this.onDismiss()
    // In HarmonyOS, deep links are opened via Want / router; log and dismiss here.
    console.info(`[AISearch] navigate → ${result.deepLink}`)
  }

  // ── Badge colour helper ──────────────────────────────────────────────────────

  private typeColor(type: string): string {
    if (type === 'product')  return '#22C55E'
    if (type === 'ranking')  return '#F59E0B'
    if (type === 'deal')     return '#EC4899'
    if (type === 'campaign') return '#8B5CF6'
    return '#DB0011'
  }

  private typeLabel(type: string): string {
    if (type === 'product')  return '產品'
    if (type === 'ranking')  return '榜單'
    if (type === 'deal')     return '優惠'
    if (type === 'campaign') return '活動'
    return '功能'
  }

  // ── Build ────────────────────────────────────────────────────────────────────

  build() {
    Column({ space: 0 }) {

      // ── Search bar row ────────────────────────────────────────────────────
      Row({ space: 8 }) {
        Row({ space: 8 }) {
          if (this.isLoading) {
            LoadingProgress()
              .width(16).height(16).color(Hive.Color.brandPrimary)
          } else {
            Text('🔍').fontSize(14).fontColor(Hive.Color.n400)
          }

          TextInput({ placeholder: '搜尋功能、產品', text: this.query })
            .fontSize(14).fontColor(Hive.Color.n900)
            .backgroundColor(Color.Transparent)
            .placeholderColor(Hive.Color.n400)
            .layoutWeight(1)
            .onChange((val: string) => { this.onQueryChange(val) })
            .onSubmit(() => {
              if (this.query.trim().length > 0) this.performSearch(this.query)
            })

          if (this.query.length > 0) {
            Text('✕').fontSize(14).fontColor(Hive.Color.n300)
              .onClick(() => { this.onQueryChange('') })
          }
        }
        .layoutWeight(1).height(40)
        .padding({ left: 12, right: 12 })
        .borderRadius(20).backgroundColor(Hive.Color.n100)
        .alignItems(VerticalAlign.Center)

        Text('取消').fontSize(14).fontColor(Hive.Color.brandPrimary)
          .onClick(() => {
            SensorDataClient.track('ai_search_cancelled', 'Search', 'search_cancelled', '',
              'ai_search', 'wealth_hub')
            this.onDismiss()
          })
      }
      .width('100%').backgroundColor(Hive.Color.brandWhite)
      .padding({ left: 12, right: 12, top: 8, bottom: 8 })
      .alignItems(VerticalAlign.Center)

      Divider().color(Hive.Color.n200)

      // ── Scrollable body ───────────────────────────────────────────────────
      Scroll() {
        Column({ space: 0 }) {

          if (this.query.trim().length === 0) {
            // ── Suggestions ────────────────────────────────────────────────
            Column({ space: 12 }) {
              Text('熱門搜尋')
                .fontSize(12).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n500)
                .width('100%').textAlign(TextAlign.Start)

              // 2 rows of 3 chips
              ForEach([0, 1], (rowIdx: number) => {
                Row({ space: 8 }) {
                  ForEach(SUGGESTIONS.slice(rowIdx * 3, rowIdx * 3 + 3),
                    (chip: SuggestionChip) => {
                      Row({ space: 6 }) {
                        Text(chip.icon).fontSize(14)
                        Text(chip.label).fontSize(12).fontColor(Hive.Color.n700)
                      }
                      .layoutWeight(1).height(38)
                      .justifyContent(FlexAlign.Center)
                      .borderRadius(18).backgroundColor(Hive.Color.brandWhite)
                      .shadow({ radius: 4, color: '#14000000', offsetY: 1 })
                      .onClick(() => {
                        this.onQueryChange(chip.label)
                        this.performSearch(chip.label)
                      })
                    })
                }.width('100%')
              })

              // AI hint
              Row({ space: 8 }) {
                Text('✨').fontSize(16)
                Text('智能語意搜尋 — 試試「低風險穩定回報」或「咖啡優惠」')
                  .fontSize(11).fontColor('#0369A1').lineHeight(16).layoutWeight(1)
              }
              .width('100%').padding(12)
              .borderRadius(10).backgroundColor('#E0F2FE')
              .alignItems(VerticalAlign.Top)

            }.padding(16)

          } else if (this.hasSearched && this.grouped.length === 0) {
            // ── Empty state ─────────────────────────────────────────────────
            Column({ space: 12 }) {
              Text('🔍').fontSize(40).margin({ top: 48 })
              Text(`找不到「${this.query}」的相關結果`)
                .fontSize(14).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n700)
                .textAlign(TextAlign.Center)
              Text('試試其他關鍵詞，或瀏覽下方熱門搜尋')
                .fontSize(12).fontColor(Hive.Color.n400).textAlign(TextAlign.Center)
              if (this.errorMsg.length > 0) {
                Text(this.errorMsg)
                  .fontSize(11).fontColor(Hive.Color.brandPrimary).textAlign(TextAlign.Center)
              }
            }.width('100%').alignItems(HorizontalAlign.Center)

          } else {
            // ── Results ─────────────────────────────────────────────────────
            Text(`找到 ${this.results.length} 個相關結果`)
              .fontSize(11).fontColor(Hive.Color.n400)
              .padding({ left: 16, right: 16, top: 10, bottom: 10 })
              .width('100%')

            ForEach(this.grouped, (group: GroupedCategory) => {
              // Category header
              Text(group.category)
                .fontSize(11).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n500)
                .width('100%')
                .padding({ left: 16, right: 16, top: 6, bottom: 6 })
                .backgroundColor(Hive.Color.n50)

              ForEach(group.items, (result: SearchResultItem, idx: number) => {
                // Result row
                Row({ space: 12 }) {
                  // Icon box
                  Text(result.icon).fontSize(20)
                    .width(44).height(44).textAlign(TextAlign.Center)
                    .borderRadius(10)
                    .backgroundColor(this.typeColor(result.type))
                    .opacity(0.12)

                  // Title + description
                  Column({ space: 3 }) {
                    Text(result.title)
                      .fontSize(13).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n900)
                      .maxLines(1).textOverflow({ overflow: TextOverflow.Ellipsis })
                    Text(result.description)
                      .fontSize(11).fontColor(Hive.Color.n500)
                      .maxLines(2).lineHeight(15)
                  }.layoutWeight(1).alignItems(HorizontalAlign.Start)

                  // Type badge
                  Text(this.typeLabel(result.type))
                    .fontSize(9).fontWeight(FontWeight.Medium)
                    .fontColor(this.typeColor(result.type))
                    .padding({ left: 7, right: 7, top: 3, bottom: 3 })
                    .borderRadius(8)
                    .backgroundColor(this.typeColor(result.type))
                    .opacity(0.12)
                }
                .width('100%').backgroundColor(Hive.Color.brandWhite)
                .padding({ left: 16, right: 16, top: 10, bottom: 10 })
                .alignItems(VerticalAlign.Center)
                .onClick(() => { this.onResultTap(result) })

                if (idx < group.items.length - 1) {
                  Divider().color(Hive.Color.n100).padding({ left: 72 })
                }
              })
            })
          }

          Blank().height(32)
        }.width('100%')
      }.width('100%').layoutWeight(1).backgroundColor(Hive.Color.n50)

    }.width('100%').height('100%').backgroundColor(Hive.Color.brandWhite)
  }
}
