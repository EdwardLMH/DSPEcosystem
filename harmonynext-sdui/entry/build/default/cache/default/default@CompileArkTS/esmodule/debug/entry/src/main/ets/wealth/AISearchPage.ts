if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface AISearchPage_Params {
    // Callback to dismiss this overlay and return to WealthPage
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
    // Callback to dismiss this overlay and return to WealthPage
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
        SensorDataClient.track('ai_search_opened', 'Search', 'search_screen_viewed', '', 'ai_search', 'wealth_hub');
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
        SensorDataClient.track('ai_search_query', 'Search', 'search_submitted', q, 'ai_search', 'wealth_hub');
        const reqBody = JSON.stringify({ query: q, limit: 10 });
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
                this.errorMsg = '搜尋服務暫時不可用，請稍後重試。';
                this.results = [];
                this.grouped = [];
                this.hasSearched = true;
                return;
            }
            try {
                const parsed: Record<string, any> = JSON.parse(data.result as string) as Record<string, any>;
                const arr: any[] = parsed['results'] as any[];
                const items: SearchResultItem[] = (arr as Array<Record<string, any>>).map((o: Record<string, any>) => ({
                    id: o['id'] as string,
                    type: o['type'] as string,
                    title: o['title'] as string,
                    description: o['description'] as string,
                    icon: o['icon'] as string,
                    category: o['category'] as string,
                    deepLink: o['deepLink'] as string,
                    score: o['score'] as number,
                } as SearchResultItem));
                this.results = items;
                this.grouped = this.buildGroups(items);
                this.hasSearched = true;
            }
            catch (_e) {
                this.errorMsg = '回應解析失敗，請重試。';
                this.results = [];
                this.grouped = [];
                this.hasSearched = true;
            }
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
        SensorDataClient.track('ai_search_result_tapped', 'Search', 'result_selected', result.title, 'ai_search', 'wealth_hub');
        this.onDismiss();
        // In HarmonyOS, deep links are opened via Want / router; log and dismiss here.
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
                SensorDataClient.track('ai_search_cancelled', 'Search', 'search_cancelled', '', 'ai_search', 'wealth_hub');
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
