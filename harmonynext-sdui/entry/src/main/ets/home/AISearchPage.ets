// AISearchPage.ets
// HarmonyOS Next — AI Semantic Search overlay for Home Hub (HK)
// Activated when user taps the search placeholder in WHHeaderNav.

import { Hive } from '../common/HiveTokens'
import { SensorDataClient } from '../network/SensorDataClient'
import http from '@ohos.net.http'
import promptAction from '@ohos.promptAction'

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

interface LocalSearchEntry {
  id: string
  type: string
  title: string
  description: string
  icon: string
  category: string
  deepLink: string
  keywords: string
}

interface ScoredLocalSearchEntry {
  item: LocalSearchEntry
  score: number
}

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

const LOCAL_SEARCH_CORPUS: LocalSearchEntry[] = [
  { id: 'fn-morning-treasure', type: 'function', title: '朝朝寶',
    description: '朝朝寶每日活期存款高息理財產品 morning treasure daily wealth',
    icon: '🌙', category: '快捷功能', deepLink: 'hsbc://wealth/morning-treasure',
    keywords: '朝朝寶,daily interest,活期,高息,morning,treasure,每日收益' },
  { id: 'fn-loan', type: 'function', title: '借錢 / 貸款',
    description: '個人貸款申請 閃電貸 極速放款 loan apply borrow cash',
    icon: '💵', category: '快捷功能', deepLink: 'hsbc://loan/apply',
    keywords: '借錢,貸款,loan,borrow,申請,cash,分期,repayment' },
  { id: 'fn-transfer', type: 'function', title: '轉帳',
    description: '本地轉帳 跨行轉賬 即時支付 transfer money bank FPS PayNow',
    icon: '↔️', category: '快捷功能', deepLink: 'hsbc://transfer',
    keywords: '轉帳,轉賬,transfer,匯款,FPS,即時,跨行,他行' },
  { id: 'fn-accounts', type: 'function', title: '帳戶總覽',
    description: '所有帳戶餘額查詢 收支明細 account overview balance statement',
    icon: '📊', category: '快捷功能', deepLink: 'hsbc://accounts',
    keywords: '帳戶,accounts,餘額,balance,總覽,overview,明細' },
  { id: 'fn-credit-card', type: 'function', title: '信用卡',
    description: '信用卡管理 賬單 還款 積分 credit card bill repayment reward points',
    icon: '💳', category: '功能入口', deepLink: 'hsbc://cards',
    keywords: '信用卡,credit card,Visa,Mastercard,賬單,帳單,積分,還款,cashback' },
  { id: 'fn-statements', type: 'function', title: '收支明細',
    description: '交易記錄 月結單 收入支出分析 transaction history statement analysis',
    icon: '📄', category: '功能入口', deepLink: 'hsbc://statements',
    keywords: '收支明細,statement,交易,transaction,記錄,history,分析' },
  { id: 'fn-external-transfer', type: 'function', title: '他行卡轉入',
    description: '從其他銀行轉入資金 外部轉賬 external bank transfer fund in',
    icon: '🔄', category: '功能入口', deepLink: 'hsbc://transfer/external',
    keywords: '他行,external,轉入,fund in,其他銀行,跨行' },
  { id: 'fn-city-services', type: 'function', title: '城市服務',
    description: '繳費 水電煤 交通罰款 政府繳費 city services bill payment utilities',
    icon: '🏙️', category: '功能入口', deepLink: 'hsbc://city-services',
    keywords: '城市服務,utilities,繳費,水電,罰款,government,bill payment' },
  { id: 'fn-events', type: 'function', title: '熱門活動',
    description: '最新優惠活動 推廣 限時優惠 promotions hot events offers',
    icon: '🔥', category: '功能入口', deepLink: 'hsbc://events',
    keywords: '熱門活動,events,優惠,promotions,活動,限時,campaigns' },
  { id: 'fn-wealth', type: 'function', title: '理財',
    description: '理財產品 投資 基金 債券 wealth management investment products',
    icon: '📈', category: '功能入口', deepLink: 'hsbc://wealth',
    keywords: '理財,wealth,investment,投資,管理,products,fund' },
  { id: 'fn-membership', type: 'function', title: 'M+會員',
    description: 'HSBC M+會員計劃 積分 特權 HSBC membership programme rewards privileges',
    icon: 'Ⓜ️', category: '功能入口', deepLink: 'hsbc://membership',
    keywords: 'M+,會員,membership,積分,特權,rewards,privileges,premier' },
  { id: 'fn-movies', type: 'function', title: '影票優惠',
    description: '電影票優惠 折扣 cinema movie ticket discount',
    icon: '🎬', category: '功能入口', deepLink: 'hsbc://movies',
    keywords: '影票,movie,cinema,電影,discount,ticket,折扣' },
  { id: 'fn-funds', type: 'function', title: '基金',
    description: '基金投資 互惠基金 ETF fund investment mutual fund',
    icon: '💹', category: '功能入口', deepLink: 'hsbc://funds',
    keywords: '基金,fund,ETF,互惠基金,investment,unit trust,NAV' },
  { id: 'fn-all-services', type: 'function', title: '全部功能',
    description: '所有銀行服務功能列表 all banking services full menu',
    icon: '⋯', category: '功能入口', deepLink: 'hsbc://all-services',
    keywords: '全部,all,services,功能,more,menu,more services' },
  { id: 'fn-ai-assistant', type: 'function', title: '智能財富助理',
    description: 'AI智能財富助理 投資建議 產品推薦 AI wealth advisor recommendation',
    icon: '✉️', category: '快捷功能', deepLink: 'hsbc://ai-assistant',
    keywords: 'AI,智能,助理,advisor,wealth,建議,recommendation,chatbot,聊天' },
  { id: 'camp-flash-loan', type: 'function', title: '閃電貸 — 極速放款',
    description: '閃電貸最高可借HKD300,000 極速放款 flash loan instant approval',
    icon: '⚡', category: '快捷功能', deepLink: 'hsbc://loan/flash',
    keywords: '閃電貸,flash loan,極速,instant,300000,HKD,放款,approval' },
  { id: 'fn-notifications', type: 'function', title: '通知 / 訊息',
    description: '銀行通知 賬戶提醒 交易提示 notifications alerts messages',
    icon: '🔔', category: '功能入口', deepLink: 'hsbc://notifications',
    keywords: '通知,notification,提醒,alert,訊息,message,inbox' },
  { id: 'fn-qr-scan', type: 'function', title: 'QR碼掃描 / 付款',
    description: '二維碼掃碼付款 收款 QR code scan pay receive',
    icon: '⬛', category: '功能入口', deepLink: 'hsbc://qr-scan',
    keywords: 'QR,二維碼,掃碼,scan,pay,收款,付款,payment' },
  { id: 'prod-daily-positive', type: 'product', title: '活錢理財｜歷史天天正收益',
    description: 'R1低風險理財產品 7日年化2.80% 贖回T+1到帳 daily positive return low risk',
    icon: '💰', category: '財富精選', deepLink: 'hsbc://wealth/daily-positive',
    keywords: '活錢理財,天天正,daily positive,低風險,R1,2.80%,贖回,T+1,活期理財' },
  { id: 'rank-top-funds', type: 'ranking', title: '3322選基 — 優中選優',
    description: '精選基金榜單 近1年漲跌幅高達318.19% best performing funds selection methodology',
    icon: '🥇', category: '特色榜單', deepLink: 'hsbc://rankings/top-funds',
    keywords: '3322,選基,top funds,榜單,ranking,優中選優,318%,performance' },
  { id: 'deal-kfc', type: 'deal', title: 'KFC 單品優惠',
    description: '肯德基單品優惠 fast food dining discount KFC',
    icon: '🍗', category: '生活特惠', deepLink: 'hsbc://deals/kfc',
    keywords: 'KFC,肯德基,fast food,單品,優惠,dining,discount' },
]

// ─── Root search page ──────────────────────────────────────────────────────────

@Component
export struct AISearchPage {
  // Callback to dismiss this overlay and return to HomePage
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
      'ai_search', 'home_hub')
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
      'ai_search', 'home_hub')

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
        const fallback = this.localSearch(q)
        this.errorMsg = fallback.length > 0 ? '' : '搜尋服務暫時不可用，請稍後重試。'
        this.results = fallback
        this.grouped = this.buildGroups(fallback)
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
        const resolvedItems = items.length > 0 ? items : this.localSearch(q)
        this.results = resolvedItems
        this.grouped = this.buildGroups(resolvedItems)
        this.hasSearched = true
      } catch (_e) {
        const fallback = this.localSearch(q)
        this.errorMsg = fallback.length > 0 ? '' : '回應解析失敗，請重試。'
        this.results = fallback
        this.grouped = this.buildGroups(fallback)
        this.hasSearched = true
      }
    })
  }

  private localSearch(q: string): SearchResultItem[] {
    const query = q.trim().toLowerCase()
    if (query.length === 0) return []

    const scored: ScoredLocalSearchEntry[] = []
    for (const item of LOCAL_SEARCH_CORPUS) {
      const title = item.title.toLowerCase()
      const keywords = item.keywords.toLowerCase()
      const text = `${item.title} ${item.description} ${item.keywords}`.toLowerCase()
      let score = 0
      if (title.includes(query)) score += 100
      if (keywords.includes(query)) score += 60
      if (text.includes(query)) score += 20
      if (score > 0) {
        scored.push({ item: item, score: score } as ScoredLocalSearchEntry)
      }
    }

    scored.sort((a: ScoredLocalSearchEntry, b: ScoredLocalSearchEntry) => {
      return b.score - a.score
    })

    return scored.map((entry: ScoredLocalSearchEntry) => {
      const item = entry.item
      return {
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        icon: item.icon,
        category: item.category,
        deepLink: item.deepLink,
        score: entry.score,
      } as SearchResultItem
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
      result.title, 'ai_search', 'home_hub')
    // Dismiss search overlay first, then simulate deep-link navigation.
    // In production this would invoke Want/startAbility with the hsbc:// URI.
    this.onDismiss()
    promptAction.showToast({
      message: `→ ${result.title}`,
      duration: 2000,
    })
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
            .borderWidth(0)
            .padding(0)
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
              'ai_search', 'home_hub')
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
