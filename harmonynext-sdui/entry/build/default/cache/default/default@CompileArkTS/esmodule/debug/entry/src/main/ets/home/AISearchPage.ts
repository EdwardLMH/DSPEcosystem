if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface AISearchPage_Params {
    // Callback to dismiss this overlay and return to HomePage
    onDismiss?: () => void;
    query?: string;
    results?: SearchResultItem[];
    grouped?: GroupedCategory[];
    isLoading?: boolean;
    hasSearched?: boolean;
    errorMsg?: string;
    debounceTimer?: number;
}
import { Hive } from "@normalized:N&&&entry/src/main/ets/common/HiveTokens&";
import { SensorDataClient } from "@normalized:N&&&entry/src/main/ets/network/SensorDataClient&";
import http from "@ohos:net.http";
import promptAction from "@ohos:promptAction";
// ─── Models ────────────────────────────────────────────────────────────────────
interface SearchResultItem {
    id: string;
    type: string;
    title: string;
    description: string;
    icon: string;
    category: string;
    deepLink: string;
    score: number;
}
interface GroupedCategory {
    category: string;
    items: SearchResultItem[];
}
interface SuggestionChip {
    icon: string;
    label: string;
}
interface LocalSearchEntry {
    id: string;
    type: string;
    title: string;
    description: string;
    icon: string;
    category: string;
    deepLink: string;
    keywords: string;
}
interface ScoredLocalSearchEntry {
    item: LocalSearchEntry;
    score: number;
}
interface A2UIAction {
    type?: string;
    url?: string;
}
interface A2UIContent {
    title?: string;
    description?: string;
    icon?: string;
    category?: string;
    score?: number;
}
interface A2UIComponent {
    id: string;
    type: string;
    content: A2UIContent;
    action?: A2UIAction;
}
// ─── Constants ─────────────────────────────────────────────────────────────────
const BFF_BASE = 'http://localhost:4000';
const SUGGESTIONS: SuggestionChip[] = [
    { icon: '🌙', label: '朝朝寶' },
    { icon: '💰', label: '低風險理財' },
    { icon: '💳', label: '信用卡' },
    { icon: '💵', label: '借錢' },
    { icon: '💹', label: '基金' },
    { icon: '🥇', label: '基金榜單' },
];
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
];
export class AISearchPage extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.onDismiss = () => { };
        this.__query = new ObservedPropertySimplePU('', this, "query");
        this.__results = new ObservedPropertyObjectPU([], this, "results");
        this.__grouped = new ObservedPropertyObjectPU([], this, "grouped");
        this.__isLoading = new ObservedPropertySimplePU(false, this, "isLoading");
        this.__hasSearched = new ObservedPropertySimplePU(false, this, "hasSearched");
        this.__errorMsg = new ObservedPropertySimplePU('', this, "errorMsg");
        this.debounceTimer = -1;
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: AISearchPage_Params) {
        if (params.onDismiss !== undefined) {
            this.onDismiss = params.onDismiss;
        }
        if (params.query !== undefined) {
            this.query = params.query;
        }
        if (params.results !== undefined) {
            this.results = params.results;
        }
        if (params.grouped !== undefined) {
            this.grouped = params.grouped;
        }
        if (params.isLoading !== undefined) {
            this.isLoading = params.isLoading;
        }
        if (params.hasSearched !== undefined) {
            this.hasSearched = params.hasSearched;
        }
        if (params.errorMsg !== undefined) {
            this.errorMsg = params.errorMsg;
        }
        if (params.debounceTimer !== undefined) {
            this.debounceTimer = params.debounceTimer;
        }
    }
    updateStateVars(params: AISearchPage_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__query.purgeDependencyOnElmtId(rmElmtId);
        this.__results.purgeDependencyOnElmtId(rmElmtId);
        this.__grouped.purgeDependencyOnElmtId(rmElmtId);
        this.__isLoading.purgeDependencyOnElmtId(rmElmtId);
        this.__hasSearched.purgeDependencyOnElmtId(rmElmtId);
        this.__errorMsg.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__query.aboutToBeDeleted();
        this.__results.aboutToBeDeleted();
        this.__grouped.aboutToBeDeleted();
        this.__isLoading.aboutToBeDeleted();
        this.__hasSearched.aboutToBeDeleted();
        this.__errorMsg.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    // Callback to dismiss this overlay and return to HomePage
    private onDismiss: () => void;
    private __query: ObservedPropertySimplePU<string>;
    get query() {
        return this.__query.get();
    }
    set query(newValue: string) {
        this.__query.set(newValue);
    }
    private __results: ObservedPropertyObjectPU<SearchResultItem[]>;
    get results() {
        return this.__results.get();
    }
    set results(newValue: SearchResultItem[]) {
        this.__results.set(newValue);
    }
    private __grouped: ObservedPropertyObjectPU<GroupedCategory[]>;
    get grouped() {
        return this.__grouped.get();
    }
    set grouped(newValue: GroupedCategory[]) {
        this.__grouped.set(newValue);
    }
    private __isLoading: ObservedPropertySimplePU<boolean>;
    get isLoading() {
        return this.__isLoading.get();
    }
    set isLoading(newValue: boolean) {
        this.__isLoading.set(newValue);
    }
    private __hasSearched: ObservedPropertySimplePU<boolean>;
    get hasSearched() {
        return this.__hasSearched.get();
    }
    set hasSearched(newValue: boolean) {
        this.__hasSearched.set(newValue);
    }
    private __errorMsg: ObservedPropertySimplePU<string>;
    get errorMsg() {
        return this.__errorMsg.get();
    }
    set errorMsg(newValue: string) {
        this.__errorMsg.set(newValue);
    }
    private debounceTimer: number;
    aboutToAppear() {
        SensorDataClient.track('ai_search_opened', 'Search', 'search_screen_viewed', '', 'ai_search', 'home_hub');
    }
    // ── Debounced search trigger ─────────────────────────────────────────────────
    private onQueryChange(value: string) {
        this.query = value;
        clearTimeout(this.debounceTimer);
        if (value.trim().length === 0) {
            this.results = [];
            this.grouped = [];
            this.hasSearched = false;
            this.errorMsg = '';
            return;
        }
        this.debounceTimer = setTimeout(() => {
            this.performSearch(value);
        }, 350);
    }
    // ── HTTP search call ─────────────────────────────────────────────────────────
    private performSearch(q: string) {
        this.isLoading = true;
        this.errorMsg = '';
        SensorDataClient.track('ai_search_query', 'Search', 'search_submitted', q, 'ai_search', 'home_hub');
        const reqBody = JSON.stringify({ query: q, limit: 10, appId: 'harmony', responseMode: 'a2ui' });
        const httpReq = http.createHttp();
        httpReq.request(`${BFF_BASE}/api/v1/search`, {
            method: http.RequestMethod.POST,
            header: { 'Content-Type': 'application/json' },
            extraData: reqBody,
            connectTimeout: 5000,
            readTimeout: 8000,
        }, (err, data) => {
            this.isLoading = false;
            if (err || data.responseCode !== 200) {
                const fallback = this.localSearch(q);
                this.errorMsg = fallback.length > 0 ? '' : '搜尋服務暫時不可用，請稍後重試。';
                this.results = fallback;
                this.grouped = this.buildGroups(fallback);
                this.hasSearched = true;
                return;
            }
            try {
                const parsed: Record<string, any> = JSON.parse(data.result as string) as Record<string, any>;
                const items: SearchResultItem[] = this.parseA2UIResults(parsed);
                const legacyItems: SearchResultItem[] = items.length > 0 ? items : this.parseLegacyResults(parsed);
                const resolvedItems = legacyItems.length > 0 ? legacyItems : this.localSearch(q);
                this.results = resolvedItems;
                this.grouped = this.buildGroups(resolvedItems);
                this.hasSearched = true;
            }
            catch (_e) {
                const fallback = this.localSearch(q);
                this.errorMsg = fallback.length > 0 ? '' : '回應解析失敗，請重試。';
                this.results = fallback;
                this.grouped = this.buildGroups(fallback);
                this.hasSearched = true;
            }
        });
    }
    private parseLegacyResults(parsed: Record<string, any>): SearchResultItem[] {
        const arr: any[] = parsed['results'] as any[];
        if (!arr)
            return [];
        return (arr as Array<Record<string, any>>).map((o: Record<string, any>) => ({
            id: o['id'] as string,
            type: o['type'] as string,
            title: o['title'] as string,
            description: o['description'] as string,
            icon: o['icon'] as string,
            category: o['category'] as string,
            deepLink: o['deepLink'] as string,
            score: o['score'] as number,
        } as SearchResultItem)).filter((item: SearchResultItem) => item.title.length > 0 && item.deepLink.length > 0);
    }
    private parseA2UIResults(parsed: Record<string, any>): SearchResultItem[] {
        const a2ui = parsed['a2ui'] as Record<string, any>;
        if (!a2ui)
            return [];
        const components = a2ui['components'] as A2UIComponent[];
        if (!components)
            return [];
        return components.map((component: A2UIComponent) => {
            const content = component.content;
            const action = component.action;
            return {
                id: component.id,
                type: component.type,
                title: content.title || '',
                description: content.description || '',
                icon: content.icon || '',
                category: content.category || '功能入口',
                deepLink: action?.url || '',
                score: content.score || 0,
            } as SearchResultItem;
        }).filter((item: SearchResultItem) => item.title.length > 0 && item.deepLink.length > 0);
    }
    private localSearch(q: string): SearchResultItem[] {
        const query = q.trim().toLowerCase();
        if (query.length === 0)
            return [];
        const scored: ScoredLocalSearchEntry[] = [];
        for (const item of LOCAL_SEARCH_CORPUS) {
            const title = item.title.toLowerCase();
            const keywords = item.keywords.toLowerCase();
            const text = `${item.title} ${item.description} ${item.keywords}`.toLowerCase();
            let score = 0;
            if (title.includes(query))
                score += 100;
            if (keywords.includes(query))
                score += 60;
            if (text.includes(query))
                score += 20;
            if (score > 0) {
                scored.push({ item: item, score: score } as ScoredLocalSearchEntry);
            }
        }
        scored.sort((a: ScoredLocalSearchEntry, b: ScoredLocalSearchEntry) => {
            return b.score - a.score;
        });
        return scored.map((entry: ScoredLocalSearchEntry) => {
            const item = entry.item;
            return {
                id: item.id,
                type: item.type,
                title: item.title,
                description: item.description,
                icon: item.icon,
                category: item.category,
                deepLink: item.deepLink,
                score: entry.score,
            } as SearchResultItem;
        });
    }
    private buildGroups(items: SearchResultItem[]): GroupedCategory[] {
        const order: string[] = [];
        const map: Record<string, SearchResultItem[]> = {};
        for (const item of items) {
            if (!map[item.category]) {
                order.push(item.category);
                map[item.category] = [];
            }
            map[item.category].push(item);
        }
        return order.map((cat: string) => ({ category: cat, items: map[cat] } as GroupedCategory));
    }
    // ── Deep-link navigation ─────────────────────────────────────────────────────
    private onResultTap(result: SearchResultItem) {
        SensorDataClient.track('ai_search_result_tapped', 'Search', 'result_selected', result.title, 'ai_search', 'home_hub');
        // Dismiss search overlay first, then simulate deep-link navigation.
        // In production this would invoke Want/startAbility with the hsbc:// URI.
        this.onDismiss();
        promptAction.showToast({
            message: `→ ${result.title}`,
            duration: 2000,
        });
        console.info(`[AISearch] navigate → ${result.deepLink}`);
    }
    // ── Badge colour helper ──────────────────────────────────────────────────────
    private typeColor(type: string): string {
        if (type === 'product')
            return '#22C55E';
        if (type === 'ranking')
            return '#F59E0B';
        if (type === 'deal')
            return '#EC4899';
        if (type === 'campaign')
            return '#8B5CF6';
        return '#DB0011';
    }
    private typeLabel(type: string): string {
        if (type === 'product')
            return '產品';
        if (type === 'ranking')
            return '榜單';
        if (type === 'deal')
            return '優惠';
        if (type === 'campaign')
            return '活動';
        return '功能';
    }
    // ── Build ────────────────────────────────────────────────────────────────────
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // ── Search bar row ────────────────────────────────────────────────────
            Row.create({ space: 8 });
            // ── Search bar row ────────────────────────────────────────────────────
            Row.width('100%');
            // ── Search bar row ────────────────────────────────────────────────────
            Row.backgroundColor(Hive.Color.brandWhite);
            // ── Search bar row ────────────────────────────────────────────────────
            Row.padding({ left: 12, right: 12, top: 8, bottom: 8 });
            // ── Search bar row ────────────────────────────────────────────────────
            Row.alignItems(VerticalAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 8 });
            Row.layoutWeight(1);
            Row.height(40);
            Row.padding({ left: 12, right: 12 });
            Row.borderRadius(20);
            Row.backgroundColor(Hive.Color.n100);
            Row.alignItems(VerticalAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isLoading) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        LoadingProgress.create();
                        LoadingProgress.width(16);
                        LoadingProgress.height(16);
                        LoadingProgress.color(Hive.Color.brandPrimary);
                    }, LoadingProgress);
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('🔍');
                        Text.fontSize(14);
                        Text.fontColor(Hive.Color.n400);
                    }, Text);
                    Text.pop();
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '搜尋功能、產品', text: this.query });
            TextInput.fontSize(14);
            TextInput.fontColor(Hive.Color.n900);
            TextInput.backgroundColor(Color.Transparent);
            TextInput.placeholderColor(Hive.Color.n400);
            TextInput.borderWidth(0);
            TextInput.padding(0);
            TextInput.layoutWeight(1);
            TextInput.onChange((val: string) => { this.onQueryChange(val); });
            TextInput.onSubmit(() => {
                if (this.query.trim().length > 0)
                    this.performSearch(this.query);
            });
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.query.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('✕');
                        Text.fontSize(14);
                        Text.fontColor(Hive.Color.n300);
                        Text.onClick(() => { this.onQueryChange(''); });
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('取消');
            Text.fontSize(14);
            Text.fontColor(Hive.Color.brandPrimary);
            Text.onClick(() => {
                SensorDataClient.track('ai_search_cancelled', 'Search', 'search_cancelled', '', 'ai_search', 'home_hub');
                this.onDismiss();
            });
        }, Text);
        Text.pop();
        // ── Search bar row ────────────────────────────────────────────────────
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.color(Hive.Color.n200);
        }, Divider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // ── Scrollable body ───────────────────────────────────────────────────
            Scroll.create();
            // ── Scrollable body ───────────────────────────────────────────────────
            Scroll.width('100%');
            // ── Scrollable body ───────────────────────────────────────────────────
            Scroll.layoutWeight(1);
            // ── Scrollable body ───────────────────────────────────────────────────
            Scroll.backgroundColor(Hive.Color.n50);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.query.trim().length === 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // ── Suggestions ────────────────────────────────────────────────
                        Column.create({ space: 12 });
                        // ── Suggestions ────────────────────────────────────────────────
                        Column.padding(16);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('熱門搜尋');
                        Text.fontSize(12);
                        Text.fontWeight(FontWeight.Medium);
                        Text.fontColor(Hive.Color.n500);
                        Text.width('100%');
                        Text.textAlign(TextAlign.Start);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 2 rows of 3 chips
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const rowIdx = _item;
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Row.create({ space: 8 });
                                Row.width('100%');
                            }, Row);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                ForEach.create();
                                const forEachItemGenFunction = _item => {
                                    const chip = _item;
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        Row.create({ space: 6 });
                                        Row.layoutWeight(1);
                                        Row.height(38);
                                        Row.justifyContent(FlexAlign.Center);
                                        Row.borderRadius(18);
                                        Row.backgroundColor(Hive.Color.brandWhite);
                                        Row.shadow({ radius: 4, color: '#14000000', offsetY: 1 });
                                        Row.onClick(() => {
                                            this.onQueryChange(chip.label);
                                            this.performSearch(chip.label);
                                        });
                                    }, Row);
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        Text.create(chip.icon);
                                        Text.fontSize(14);
                                    }, Text);
                                    Text.pop();
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        Text.create(chip.label);
                                        Text.fontSize(12);
                                        Text.fontColor(Hive.Color.n700);
                                    }, Text);
                                    Text.pop();
                                    Row.pop();
                                };
                                this.forEachUpdateFunction(elmtId, SUGGESTIONS.slice(rowIdx * 3, rowIdx * 3 + 3), forEachItemGenFunction);
                            }, ForEach);
                            ForEach.pop();
                            Row.pop();
                        };
                        this.forEachUpdateFunction(elmtId, [0, 1], forEachItemGenFunction);
                    }, ForEach);
                    // 2 rows of 3 chips
                    ForEach.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // AI hint
                        Row.create({ space: 8 });
                        // AI hint
                        Row.width('100%');
                        // AI hint
                        Row.padding(12);
                        // AI hint
                        Row.borderRadius(10);
                        // AI hint
                        Row.backgroundColor('#E0F2FE');
                        // AI hint
                        Row.alignItems(VerticalAlign.Top);
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('✨');
                        Text.fontSize(16);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('智能語意搜尋 — 試試「低風險穩定回報」或「咖啡優惠」');
                        Text.fontSize(11);
                        Text.fontColor('#0369A1');
                        Text.lineHeight(16);
                        Text.layoutWeight(1);
                    }, Text);
                    Text.pop();
                    // AI hint
                    Row.pop();
                    // ── Suggestions ────────────────────────────────────────────────
                    Column.pop();
                });
            }
            else if (this.hasSearched && this.grouped.length === 0) {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // ── Empty state ─────────────────────────────────────────────────
                        Column.create({ space: 12 });
                        // ── Empty state ─────────────────────────────────────────────────
                        Column.width('100%');
                        // ── Empty state ─────────────────────────────────────────────────
                        Column.alignItems(HorizontalAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('🔍');
                        Text.fontSize(40);
                        Text.margin({ top: 48 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`找不到「${this.query}」的相關結果`);
                        Text.fontSize(14);
                        Text.fontWeight(FontWeight.Medium);
                        Text.fontColor(Hive.Color.n700);
                        Text.textAlign(TextAlign.Center);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('試試其他關鍵詞，或瀏覽下方熱門搜尋');
                        Text.fontSize(12);
                        Text.fontColor(Hive.Color.n400);
                        Text.textAlign(TextAlign.Center);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (this.errorMsg.length > 0) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create(this.errorMsg);
                                    Text.fontSize(11);
                                    Text.fontColor(Hive.Color.brandPrimary);
                                    Text.textAlign(TextAlign.Center);
                                }, Text);
                                Text.pop();
                            });
                        }
                        else {
                            this.ifElseBranchUpdateFunction(1, () => {
                            });
                        }
                    }, If);
                    If.pop();
                    // ── Empty state ─────────────────────────────────────────────────
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(2, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // ── Results ─────────────────────────────────────────────────────
                        Text.create(`找到 ${this.results.length} 個相關結果`);
                        // ── Results ─────────────────────────────────────────────────────
                        Text.fontSize(11);
                        // ── Results ─────────────────────────────────────────────────────
                        Text.fontColor(Hive.Color.n400);
                        // ── Results ─────────────────────────────────────────────────────
                        Text.padding({ left: 16, right: 16, top: 10, bottom: 10 });
                        // ── Results ─────────────────────────────────────────────────────
                        Text.width('100%');
                    }, Text);
                    // ── Results ─────────────────────────────────────────────────────
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const group = _item;
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                // Category header
                                Text.create(group.category);
                                // Category header
                                Text.fontSize(11);
                                // Category header
                                Text.fontWeight(FontWeight.Medium);
                                // Category header
                                Text.fontColor(Hive.Color.n500);
                                // Category header
                                Text.width('100%');
                                // Category header
                                Text.padding({ left: 16, right: 16, top: 6, bottom: 6 });
                                // Category header
                                Text.backgroundColor(Hive.Color.n50);
                            }, Text);
                            // Category header
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                ForEach.create();
                                const forEachItemGenFunction = (_item, idx: number) => {
                                    const result = _item;
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        // Result row
                                        Row.create({ space: 12 });
                                        // Result row
                                        Row.width('100%');
                                        // Result row
                                        Row.backgroundColor(Hive.Color.brandWhite);
                                        // Result row
                                        Row.padding({ left: 16, right: 16, top: 10, bottom: 10 });
                                        // Result row
                                        Row.alignItems(VerticalAlign.Center);
                                        // Result row
                                        Row.onClick(() => { this.onResultTap(result); });
                                    }, Row);
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        // Icon box
                                        Text.create(result.icon);
                                        // Icon box
                                        Text.fontSize(20);
                                        // Icon box
                                        Text.width(44);
                                        // Icon box
                                        Text.height(44);
                                        // Icon box
                                        Text.textAlign(TextAlign.Center);
                                        // Icon box
                                        Text.borderRadius(10);
                                        // Icon box
                                        Text.backgroundColor(this.typeColor(result.type));
                                        // Icon box
                                        Text.opacity(0.12);
                                    }, Text);
                                    // Icon box
                                    Text.pop();
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        // Title + description
                                        Column.create({ space: 3 });
                                        // Title + description
                                        Column.layoutWeight(1);
                                        // Title + description
                                        Column.alignItems(HorizontalAlign.Start);
                                    }, Column);
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        Text.create(result.title);
                                        Text.fontSize(13);
                                        Text.fontWeight(FontWeight.Medium);
                                        Text.fontColor(Hive.Color.n900);
                                        Text.maxLines(1);
                                        Text.textOverflow({ overflow: TextOverflow.Ellipsis });
                                    }, Text);
                                    Text.pop();
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        Text.create(result.description);
                                        Text.fontSize(11);
                                        Text.fontColor(Hive.Color.n500);
                                        Text.maxLines(2);
                                        Text.lineHeight(15);
                                    }, Text);
                                    Text.pop();
                                    // Title + description
                                    Column.pop();
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        // Type badge
                                        Text.create(this.typeLabel(result.type));
                                        // Type badge
                                        Text.fontSize(9);
                                        // Type badge
                                        Text.fontWeight(FontWeight.Medium);
                                        // Type badge
                                        Text.fontColor(this.typeColor(result.type));
                                        // Type badge
                                        Text.padding({ left: 7, right: 7, top: 3, bottom: 3 });
                                        // Type badge
                                        Text.borderRadius(8);
                                        // Type badge
                                        Text.backgroundColor(this.typeColor(result.type));
                                        // Type badge
                                        Text.opacity(0.12);
                                    }, Text);
                                    // Type badge
                                    Text.pop();
                                    // Result row
                                    Row.pop();
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        If.create();
                                        if (idx < group.items.length - 1) {
                                            this.ifElseBranchUpdateFunction(0, () => {
                                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                                    Divider.create();
                                                    Divider.color(Hive.Color.n100);
                                                    Divider.padding({ left: 72 });
                                                }, Divider);
                                            });
                                        }
                                        else {
                                            this.ifElseBranchUpdateFunction(1, () => {
                                            });
                                        }
                                    }, If);
                                    If.pop();
                                };
                                this.forEachUpdateFunction(elmtId, group.items, forEachItemGenFunction, undefined, true, false);
                            }, ForEach);
                            ForEach.pop();
                        };
                        this.forEachUpdateFunction(elmtId, this.grouped, forEachItemGenFunction);
                    }, ForEach);
                    ForEach.pop();
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.height(32);
        }, Blank);
        Blank.pop();
        Column.pop();
        // ── Scrollable body ───────────────────────────────────────────────────
        Scroll.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
