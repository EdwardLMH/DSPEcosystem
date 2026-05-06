if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface WHLifeDeals_Params {
    bottomLinks?: BottomLink[];
}
interface WHFeaturedRankings_Params {
}
interface WHWealthSelection_Params {
}
interface WHFlashLoan_Params {
}
interface WHAdBanner_Params {
    onDismiss?: () => void;
}
interface WHAIAssistant_Params {
}
interface WHFunctionGrid_Params {
}
interface WHPromoBanner_Params {
}
interface WHQuickAccess_Params {
}
interface WHHeaderNav_Params {
    onSearchTap?: () => void;
}
interface SDUILifeDeals_Params {
    props?: Record<string, ESObject>;
}
interface SDUIFeaturedRankings_Params {
    props?: Record<string, ESObject>;
}
interface SDUIWealthSelection_Params {
    props?: Record<string, ESObject>;
}
interface SDUIFlashLoan_Params {
    props?: Record<string, ESObject>;
}
interface SDUIAdBanner_Params {
    props?: Record<string, ESObject>;
    onDismiss?: () => void;
}
interface SDUIAIAssistant_Params {
    props?: Record<string, ESObject>;
}
interface SDUIFunctionGrid_Params {
    props?: Record<string, ESObject>;
}
interface SDUIPromoBanner_Params {
    props?: Record<string, ESObject>;
}
interface SDUIQuickAccess_Params {
    props?: Record<string, ESObject>;
}
interface SDUIAISearchBar_Params {
    props?: Record<string, ESObject>;
    onSearchTap?: () => void;
}
interface SDUIHeaderNav_Params {
    props?: Record<string, ESObject>;
}
interface WealthPageView_Params {
    adDismissed?: boolean;
    searchOpen?: boolean;
    loadState?: number;
    sdui?: WealthSlice[];
}
interface SDUISliceView_Params {
    slice?: WealthSlice;
    adDismissed?: boolean;
}
import { Hive } from "@normalized:N&&&entry/src/main/ets/common/HiveTokens&";
import { SensorDataClient } from "@normalized:N&&&entry/src/main/ets/network/SensorDataClient&";
import { AISearchPage } from "@normalized:N&&&entry/src/main/ets/wealth/AISearchPage&";
import { fetchWealthScreen } from "@normalized:N&&&entry/src/main/ets/network/KYCNetworkService&";
import type { WealthSlice } from "@normalized:N&&&entry/src/main/ets/network/KYCNetworkService&";
// ─── Data models ──────────────────────────────────────────────────────────────
interface QuickItem {
    icon: string;
    label: string;
    deepLink: string;
}
interface FuncItem {
    icon: string;
    label: string;
    deepLink: string;
}
interface WealthProd {
    id: string;
    name: string;
    tag: string;
    yield7Day: string;
    risk: string;
    redemption: string;
    cta: string;
    deepLink: string;
    highlighted: boolean;
}
interface RankingItem {
    id: string;
    icon: string;
    badge: string;
    title: string;
    desc: string;
    deepLink: string;
}
interface DealItem {
    id: string;
    brand: string;
    emoji: string;
    tag: string;
    deepLink: string;
}
interface BottomLink {
    icon: string;
    label: string;
    deepLink: string;
}
const QUICK_ITEMS: QuickItem[] = [
    { icon: '🌙', label: '朝朝寶', deepLink: 'hsbc://wealth/morning-treasure' },
    { icon: '💵', label: '借錢', deepLink: 'hsbc://loan/apply' },
    { icon: '↔️', label: '轉帳', deepLink: 'hsbc://transfer' },
    { icon: '📊', label: '帳戶總覽', deepLink: 'hsbc://accounts' },
];
const FUNC_ROWS: FuncItem[][] = [
    [{ icon: '💳', label: '信用卡', deepLink: 'hsbc://cards' },
        { icon: '📄', label: '收支明細', deepLink: 'hsbc://statements' },
        { icon: '🔄', label: '他行卡轉入', deepLink: 'hsbc://transfer/external' },
        { icon: '🏙️', label: '城市服務', deepLink: 'hsbc://city-services' },
        { icon: '🔥', label: '熱門活動', deepLink: 'hsbc://events' }],
    [{ icon: '📈', label: '理財', deepLink: 'hsbc://wealth' },
        { icon: 'Ⓜ️', label: 'M+會員', deepLink: 'hsbc://membership' },
        { icon: '🎬', label: '影票', deepLink: 'hsbc://movies' },
        { icon: '💹', label: '基金', deepLink: 'hsbc://funds' },
        { icon: '⋯', label: '全部', deepLink: 'hsbc://all-services' }],
];
const WEALTH_PRODUCTS: WealthProd[] = [
    { id: 'w1', name: '活錢理財｜歷史天天正收益', tag: '代碼', yield7Day: '2.80%',
        risk: 'R1低風險', redemption: '贖回T+1到帳', cta: '去看看',
        deepLink: 'hsbc://wealth/daily-positive', highlighted: true },
    { id: 'w2', name: '主投債券', tag: '代碼', yield7Day: '3.04%',
        risk: '歷史周周正', redemption: '成立以來…', cta: '查看',
        deepLink: 'hsbc://wealth/bond-fund', highlighted: false },
    { id: 'w3', name: '年均收益率', tag: '收益確定', yield7Day: '2.31%',
        risk: '保証領取', redemption: '穩健低波', cta: '查看',
        deepLink: 'hsbc://wealth/guaranteed', highlighted: false },
];
const RANKINGS: RankingItem[] = [
    { id: 'r1', icon: '🥇', badge: '優中選優', title: '3322選基',
        desc: '近1年漲跌幅高達318.19%', deepLink: 'hsbc://rankings/top-funds' },
    { id: 'r2', icon: '🔒', badge: '固收優選', title: '穩健省心好選擇',
        desc: '歷史持有3月盈利概率高達98.23%', deepLink: 'hsbc://rankings/fixed-income' },
    { id: 'r3', icon: '📈', badge: '屢創新高', title: '屢創新高榜',
        desc: '近3年净值創新高次數達152', deepLink: 'hsbc://rankings/all-time-high' },
];
const DEALS: DealItem[] = [
    { id: 'd1', brand: 'KFC', emoji: '🍗', tag: '單品優惠', deepLink: 'hsbc://deals/kfc' },
    { id: 'd2', brand: 'Luckin Coffee', emoji: '☕', tag: '5折喝瑞幸', deepLink: 'hsbc://deals/luckin' },
    { id: 'd3', brand: 'DQ', emoji: '🍦', tag: '5折起', deepLink: 'hsbc://deals/dq' },
];
// ─── Load-state enum ──────────────────────────────────────────────────────────
// ArkTS forbids string-union @State — use a plain number enum instead.
const LOAD_IDLE = 0;
const LOAD_LOADING = 1;
const LOAD_DONE = 2;
const LOAD_ERROR = 3;
class SDUISliceView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.slice = { instanceId: '', type: '', props: {}, visible: true };
        this.__adDismissed = new ObservedPropertySimplePU(false, this, "adDismissed");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SDUISliceView_Params) {
        if (params.slice !== undefined) {
            this.slice = params.slice;
        }
        if (params.adDismissed !== undefined) {
            this.adDismissed = params.adDismissed;
        }
    }
    updateStateVars(params: SDUISliceView_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__adDismissed.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__adDismissed.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private slice: WealthSlice;
    private __adDismissed: ObservedPropertySimplePU<boolean>;
    get adDismissed() {
        return this.__adDismissed.get();
    }
    set adDismissed(newValue: boolean) {
        this.__adDismissed.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (!this.slice.visible) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                    }, Column);
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.renderSlice.bind(this)();
                });
            }
        }, If);
        If.pop();
    }
    renderSlice(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.slice.type === 'HEADER_NAV') {
                this.ifElseBranchUpdateFunction(0, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new SDUIHeaderNav(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 97, col: 7 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        props: this.slice.props
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "SDUIHeaderNav" });
                    }
                });
            }
            else if (this.slice.type === 'AI_SEARCH_BAR') {
                this.ifElseBranchUpdateFunction(1, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new SDUIAISearchBar(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 99, col: 7 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        props: this.slice.props
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "SDUIAISearchBar" });
                    }
                });
            }
            else if (this.slice.type === 'QUICK_ACCESS') {
                this.ifElseBranchUpdateFunction(2, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new SDUIQuickAccess(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 101, col: 7 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        props: this.slice.props
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "SDUIQuickAccess" });
                    }
                });
            }
            else if (this.slice.type === 'PROMO_BANNER') {
                this.ifElseBranchUpdateFunction(3, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new SDUIPromoBanner(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 103, col: 7 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        props: this.slice.props
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "SDUIPromoBanner" });
                    }
                });
            }
            else if (this.slice.type === 'FUNCTION_GRID') {
                this.ifElseBranchUpdateFunction(4, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new SDUIFunctionGrid(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 105, col: 7 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        props: this.slice.props
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "SDUIFunctionGrid" });
                    }
                });
            }
            else if (this.slice.type === 'AI_ASSISTANT') {
                this.ifElseBranchUpdateFunction(5, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new SDUIAIAssistant(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 107, col: 7 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        props: this.slice.props
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "SDUIAIAssistant" });
                    }
                });
            }
            else if (this.slice.type === 'AD_BANNER') {
                this.ifElseBranchUpdateFunction(6, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (!this.adDismissed) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                {
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        if (isInitialRender) {
                                            let componentCall = new SDUIAdBanner(this, { props: this.slice.props, onDismiss: () => { this.adDismissed = true; } }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 110, col: 9 });
                                            ViewPU.create(componentCall);
                                            let paramsLambda = () => {
                                                return {
                                                    props: this.slice.props,
                                                    onDismiss: () => { this.adDismissed = true; }
                                                };
                                            };
                                            componentCall.paramsGenerator_ = paramsLambda;
                                        }
                                        else {
                                            this.updateStateVarsOfChildByElmtId(elmtId, {});
                                        }
                                    }, { name: "SDUIAdBanner" });
                                }
                            });
                        }
                        else {
                            this.ifElseBranchUpdateFunction(1, () => {
                            });
                        }
                    }, If);
                    If.pop();
                });
            }
            else if (this.slice.type === 'FLASH_LOAN') {
                this.ifElseBranchUpdateFunction(7, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new SDUIFlashLoan(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 113, col: 7 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        props: this.slice.props
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "SDUIFlashLoan" });
                    }
                });
            }
            else if (this.slice.type === 'WEALTH_SELECTION') {
                this.ifElseBranchUpdateFunction(8, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new SDUIWealthSelection(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 115, col: 7 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        props: this.slice.props
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "SDUIWealthSelection" });
                    }
                });
            }
            else if (this.slice.type === 'FEATURED_RANKINGS') {
                this.ifElseBranchUpdateFunction(9, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new SDUIFeaturedRankings(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 117, col: 7 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        props: this.slice.props
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "SDUIFeaturedRankings" });
                    }
                });
            }
            else if (this.slice.type === 'LIFE_DEALS') {
                this.ifElseBranchUpdateFunction(10, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new SDUILifeDeals(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 119, col: 7 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        props: this.slice.props
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "SDUILifeDeals" });
                    }
                });
            }
            else if (this.slice.type === 'SPACER') {
                this.ifElseBranchUpdateFunction(11, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                        Blank.height(this.slice.props['height'] as number ?? 16);
                    }, Blank);
                    Blank.pop();
                });
            }
            // unknown types silently omitted
            else {
                this.ifElseBranchUpdateFunction(12, () => {
                });
            }
        }, If);
        If.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
export class WealthPageView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__adDismissed = new ObservedPropertySimplePU(false, this, "adDismissed");
        this.__searchOpen = new ObservedPropertySimplePU(false, this, "searchOpen");
        this.__loadState = new ObservedPropertySimplePU(LOAD_IDLE // LOAD_* constants
        , this, "loadState");
        this.__sdui = new ObservedPropertyObjectPU([] // BFF slices when loaded
        , this, "sdui");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: WealthPageView_Params) {
        if (params.adDismissed !== undefined) {
            this.adDismissed = params.adDismissed;
        }
        if (params.searchOpen !== undefined) {
            this.searchOpen = params.searchOpen;
        }
        if (params.loadState !== undefined) {
            this.loadState = params.loadState;
        }
        if (params.sdui !== undefined) {
            this.sdui = params.sdui;
        }
    }
    updateStateVars(params: WealthPageView_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__adDismissed.purgeDependencyOnElmtId(rmElmtId);
        this.__searchOpen.purgeDependencyOnElmtId(rmElmtId);
        this.__loadState.purgeDependencyOnElmtId(rmElmtId);
        this.__sdui.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__adDismissed.aboutToBeDeleted();
        this.__searchOpen.aboutToBeDeleted();
        this.__loadState.aboutToBeDeleted();
        this.__sdui.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __adDismissed: ObservedPropertySimplePU<boolean>;
    get adDismissed() {
        return this.__adDismissed.get();
    }
    set adDismissed(newValue: boolean) {
        this.__adDismissed.set(newValue);
    }
    private __searchOpen: ObservedPropertySimplePU<boolean>;
    get searchOpen() {
        return this.__searchOpen.get();
    }
    set searchOpen(newValue: boolean) {
        this.__searchOpen.set(newValue);
    }
    private __loadState: ObservedPropertySimplePU<number>; // LOAD_* constants
    get loadState() {
        return this.__loadState.get();
    }
    set loadState(newValue: number) {
        this.__loadState.set(newValue);
    }
    private __sdui: ObservedPropertyObjectPU<WealthSlice[]>; // BFF slices when loaded
    get sdui() {
        return this.__sdui.get();
    }
    set sdui(newValue: WealthSlice[]) {
        this.__sdui.set(newValue);
    }
    aboutToAppear() {
        SensorDataClient.wealthHubViewed();
        this.loadFromBFF();
    }
    private async loadFromBFF(): Promise<void> {
        this.loadState = LOAD_LOADING;
        try {
            const payload = await fetchWealthScreen();
            this.sdui = payload.layout.children.filter((s: WealthSlice) => s.visible !== false);
            this.loadState = LOAD_DONE;
        }
        catch (_e) {
            // BFF not live or unreachable — fall back to static layout
            this.loadState = LOAD_ERROR;
        }
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create({ alignContent: Alignment.TopStart });
            Stack.width('100%');
            Stack.height('100%');
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.width('100%');
            Scroll.height('100%');
            Scroll.backgroundColor(Hive.Color.n50);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.loadState === LOAD_LOADING) {
                this.ifElseBranchUpdateFunction(0, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new 
                                // Minimal loading state — show header so page doesn't flash blank
                                WHHeaderNav(this, { onSearchTap: () => { this.searchOpen = true; } }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 159, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        onSearchTap: () => { this.searchOpen = true; }
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "WHHeaderNav" });
                    }
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.width('100%');
                        Row.height(80);
                        Row.justifyContent(FlexAlign.Center);
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('載入中…');
                        Text.fontSize(13);
                        Text.fontColor(Hive.Color.n400);
                    }, Text);
                    Text.pop();
                    Row.pop();
                });
            }
            else if (this.loadState === LOAD_DONE && this.sdui.length > 0) {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // ── SDUI path: render slices from BFF ──────────────────────────
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const slice = _item;
                            {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    if (isInitialRender) {
                                        let componentCall = new SDUISliceView(this, { slice: slice }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 168, col: 15 });
                                        ViewPU.create(componentCall);
                                        let paramsLambda = () => {
                                            return {
                                                slice: slice
                                            };
                                        };
                                        componentCall.paramsGenerator_ = paramsLambda;
                                    }
                                    else {
                                        this.updateStateVarsOfChildByElmtId(elmtId, {});
                                    }
                                }, { name: "SDUISliceView" });
                            }
                        };
                        this.forEachUpdateFunction(elmtId, this.sdui, forEachItemGenFunction);
                    }, ForEach);
                    // ── SDUI path: render slices from BFF ──────────────────────────
                    ForEach.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(2, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new 
                                // ── Static fallback: BFF not live yet ──────────────────────────
                                WHHeaderNav(this, { onSearchTap: () => { this.searchOpen = true; } }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 172, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        onSearchTap: () => { this.searchOpen = true; }
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "WHHeaderNav" });
                    }
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new WHQuickAccess(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 173, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "WHQuickAccess" });
                    }
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new WHPromoBanner(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 174, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "WHPromoBanner" });
                    }
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new WHFunctionGrid(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 175, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "WHFunctionGrid" });
                    }
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new WHAIAssistant(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 176, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "WHAIAssistant" });
                    }
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (!this.adDismissed) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                {
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        if (isInitialRender) {
                                            let componentCall = new WHAdBanner(this, { onDismiss: () => { this.adDismissed = true; } }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 178, col: 15 });
                                            ViewPU.create(componentCall);
                                            let paramsLambda = () => {
                                                return {
                                                    onDismiss: () => { this.adDismissed = true; }
                                                };
                                            };
                                            componentCall.paramsGenerator_ = paramsLambda;
                                        }
                                        else {
                                            this.updateStateVarsOfChildByElmtId(elmtId, {});
                                        }
                                    }, { name: "WHAdBanner" });
                                }
                            });
                        }
                        else {
                            this.ifElseBranchUpdateFunction(1, () => {
                            });
                        }
                    }, If);
                    If.pop();
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new WHFlashLoan(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 180, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "WHFlashLoan" });
                    }
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new WHWealthSelection(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 181, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "WHWealthSelection" });
                    }
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new WHFeaturedRankings(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 182, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "WHFeaturedRankings" });
                    }
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new WHLifeDeals(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 183, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "WHLifeDeals" });
                    }
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.height(40);
        }, Blank);
        Blank.pop();
        Column.pop();
        Scroll.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.searchOpen) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        __Common__.create();
                        __Common__.width('100%');
                        __Common__.height('100%');
                        __Common__.backgroundColor(Hive.Color.brandWhite);
                        __Common__.zIndex(10);
                    }, __Common__);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AISearchPage(this, { onDismiss: () => { this.searchOpen = false; } }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 190, col: 9 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        onDismiss: () => { this.searchOpen = false; }
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "AISearchPage" });
                    }
                    __Common__.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Stack.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class SDUIHeaderNav extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SDUIHeaderNav_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
    }
    updateStateVars(params: SDUIHeaderNav_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 10 });
            Row.width('100%');
            Row.height(50);
            Row.padding({ left: 14, right: 14, top: 8, bottom: 8 });
            Row.backgroundColor(Hive.Color.brandWhite);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.layoutWeight(1);
            Row.height(36);
            Row.padding({ left: 14, right: 14 });
            Row.borderRadius(18);
            Row.backgroundColor(Hive.Color.n100);
            Row.onClick(() => {
                SensorDataClient.track('search_tap', 'Wealth', 'search_tapped', '', 'wealth_hub_hk', 'wealth_hub');
            });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🔍');
            Text.fontSize(13);
            Text.fontColor(Hive.Color.n400);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.props['searchPlaceholder'] as string ?? '搜尋功能、產品');
            Text.fontSize(13);
            Text.fontColor(Hive.Color.n400);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.props['showNotificationBell'] as boolean !== false) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('🔔');
                        Text.fontSize(20);
                        Text.onClick(() => {
                            SensorDataClient.track('notification_tap', 'Wealth', 'notification_tapped', '', 'wealth_hub_hk', 'wealth_hub');
                        });
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
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.props['showQRScanner'] as boolean !== false) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('⬛');
                        Text.fontSize(18);
                        Text.onClick(() => {
                            SensorDataClient.track('qr_tap', 'Wealth', 'qr_scanner_tapped', '', 'wealth_hub_hk', 'wealth_hub');
                        });
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
            Divider.create();
            Divider.color(Hive.Color.n200);
        }, Divider);
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class SDUIAISearchBar extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.onSearchTap = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SDUIAISearchBar_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
        if (params.onSearchTap !== undefined) {
            this.onSearchTap = params.onSearchTap;
        }
    }
    updateStateVars(params: SDUIAISearchBar_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    private onSearchTap: () => void;
    private placeholder(): string {
        return this.props['placeholder'] as string ?? '搜尋功能、產品';
    }
    private enableQRScan(): boolean { return this.props['enableQRScan'] as boolean ?? true; }
    private enableChatbot(): boolean { return this.props['enableChatbot'] as boolean ?? true; }
    private enableInbox(): boolean { return this.props['enableMessageInbox'] as boolean ?? true; }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 8 });
            Row.width('100%');
            Row.height(50);
            Row.padding({ left: 12, right: 12, top: 7, bottom: 7 });
            Row.backgroundColor('#DB0011');
            Row.alignItems(VerticalAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.enableQRScan()) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('⬜');
                        Text.fontSize(20);
                        Text.fontColor('#E6FFFFFF');
                        Text.onClick(() => {
                            SensorDataClient.track('qr_tap', 'Wealth', 'qr_scanner_tapped', '', 'ai_search_bar', 'wealth_hub');
                        });
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
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.layoutWeight(1);
            Row.height(36);
            Row.padding({ left: 12, right: 12 });
            Row.borderRadius(18);
            Row.backgroundColor('#26FFFFFF');
            Row.onClick(() => {
                SensorDataClient.track('search_tap', 'Wealth', 'search_tapped', '', 'ai_search_bar', 'wealth_hub');
                this.onSearchTap();
            });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🔍');
            Text.fontSize(13);
            Text.fontColor('#99FFFFFF');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.placeholder());
            Text.fontSize(13);
            Text.fontColor('#A6FFFFFF');
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.enableChatbot()) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('🤖');
                        Text.fontSize(20);
                        Text.fontColor('#E6FFFFFF');
                        Text.onClick(() => {
                            SensorDataClient.track('chatbot_tap', 'Wealth', 'chatbot_tapped', '', 'ai_search_bar', 'wealth_hub');
                        });
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
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.enableInbox()) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('✉️');
                        Text.fontSize(20);
                        Text.fontColor('#E6FFFFFF');
                        Text.onClick(() => {
                            SensorDataClient.track('inbox_tap', 'Wealth', 'inbox_tapped', '', 'ai_search_bar', 'wealth_hub');
                        });
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
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class SDUIQuickAccess extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SDUIQuickAccess_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
    }
    updateStateVars(params: SDUIQuickAccess_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    private items(): any[] { return this.props['items'] as any[] ?? [] as any[]; }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.backgroundColor(Hive.Color.brandWhite);
            Row.padding({ left: 16, right: 16, top: 12, bottom: 12 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const raw = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 5 });
                    Column.layoutWeight(1);
                    Column.alignItems(HorizontalAlign.Center);
                    Column.onClick(() => {
                        SensorDataClient.quickAccessTapped((raw as Record<string, string>)['label'] ?? '', (raw as Record<string, string>)['deepLink'] ?? '');
                    });
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create((raw as Record<string, string>)['icon'] ?? '');
                    Text.fontSize(22);
                    Text.width(48);
                    Text.height(48);
                    Text.textAlign(TextAlign.Center);
                    Text.borderRadius(14);
                    Text.linearGradient({ direction: GradientDirection.LeftTop,
                        colors: [['#F0F9FF', 0], ['#E0F2FE', 1]] });
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create((raw as Record<string, string>)['label'] ?? '');
                    Text.fontSize(10);
                    Text.fontColor(Hive.Color.n700);
                    Text.textAlign(TextAlign.Center);
                }, Text);
                Text.pop();
                Column.pop();
            };
            this.forEachUpdateFunction(elmtId, this.items(), forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class SDUIPromoBanner extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SDUIPromoBanner_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
    }
    updateStateVars(params: SDUIPromoBanner_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    private title(): string { return this.props['title'] as string ?? ''; }
    private subtitle(): string { return this.props['subtitle'] as string ?? ''; }
    private ctaLabel(): string { return this.props['ctaLabel'] as string ?? ''; }
    private badgeText(): string { return this.props['badgeText'] as string ?? ''; }
    private deepLink(): string { return this.props['ctaDeepLink'] as string ?? ''; }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 0 });
            Row.width('100%');
            Row.padding({ left: 12, right: 12, top: 12, bottom: 12 });
            Row.margin({ left: 12, right: 12, top: 8, bottom: 0 });
            Row.borderRadius(14);
            Row.backgroundColor(this.props['backgroundColor'] as string ?? '#E8F4FD');
            Row.alignItems(VerticalAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.layoutWeight(1);
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.badgeText().length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.badgeText());
                        Text.fontSize(9);
                        Text.fontWeight(FontWeight.Bold);
                        Text.fontColor('#DB0011');
                        Text.padding({ left: 8, right: 8, top: 2, bottom: 2 });
                        Text.borderRadius(10);
                        Text.backgroundColor('#FFEDED');
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
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.title());
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bolder);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.subtitle());
            Text.fontSize(10);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel(this.ctaLabel());
            Button.height(32);
            Button.padding({ left: 16, right: 16 });
            Button.borderRadius(14);
            Button.backgroundColor(Hive.Color.brandPrimary);
            Button.fontColor(Hive.Color.brandWhite);
            Button.fontSize(11);
            Button.fontWeight(FontWeight.Bold);
            Button.margin({ top: 8 });
            Button.onClick(() => {
                SensorDataClient.promoBannerTapped(this.title(), this.props['instanceId'] as string ?? '', this.deepLink());
            });
        }, Button);
        Button.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🎯');
            Text.fontSize(32);
            Text.width(80);
            Text.height(80);
            Text.textAlign(TextAlign.Center);
            Text.borderRadius(12);
            Text.backgroundColor('#14000000');
        }, Text);
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class SDUIFunctionGrid extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SDUIFunctionGrid_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
    }
    updateStateVars(params: SDUIFunctionGrid_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    private rows(): any[] { return this.props['rows'] as any[] ?? [] as any[]; }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 6 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.padding({ left: 16, right: 16, top: 8, bottom: 8 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const rawRow = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create();
                    Row.width('100%');
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    ForEach.create();
                    const forEachItemGenFunction = _item => {
                        const raw = _item;
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Column.create({ space: 4 });
                            Column.layoutWeight(1);
                            Column.alignItems(HorizontalAlign.Center);
                            Column.onClick(() => {
                                const extra: Record<string, any> = {};
                                extra['function_label'] = ((raw as Record<string, string>)['label'] ?? '') as any;
                                extra['deep_link'] = ((raw as Record<string, string>)['deepLink'] ?? '') as any;
                                SensorDataClient.track('function_tap', 'Wealth', 'function_tapped', (raw as Record<string, string>)['label'] ?? '', 'wealth_hub_hk', 'wealth_hub', '', '', '', '', '', '', '', '', extra);
                            });
                        }, Column);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create((raw as Record<string, string>)['icon'] ?? '');
                            Text.fontSize(20);
                            Text.width(44);
                            Text.height(44);
                            Text.textAlign(TextAlign.Center);
                            Text.borderRadius(12);
                            Text.backgroundColor(Hive.Color.n100);
                        }, Text);
                        Text.pop();
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create((raw as Record<string, string>)['label'] ?? '');
                            Text.fontSize(10);
                            Text.fontColor(Hive.Color.n700);
                            Text.textAlign(TextAlign.Center);
                            Text.lineHeight(14);
                        }, Text);
                        Text.pop();
                        Column.pop();
                    };
                    this.forEachUpdateFunction(elmtId, rawRow as any[], forEachItemGenFunction);
                }, ForEach);
                ForEach.pop();
                Row.pop();
            };
            this.forEachUpdateFunction(elmtId, this.rows(), forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class SDUIAIAssistant extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SDUIAIAssistant_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
    }
    updateStateVars(params: SDUIAIAssistant_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 8 });
            Row.width('100%');
            Row.height(44);
            Row.padding({ left: 12, right: 12 });
            Row.margin({ left: 16, right: 16, top: 4, bottom: 4 });
            Row.borderRadius(10);
            Row.backgroundColor(Hive.Color.n50);
            Row.alignItems(VerticalAlign.Center);
            Row.onClick(() => { SensorDataClient.aiAssistantTapped(); });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('✉️');
            Text.fontSize(20);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.props['greeting'] as string ?? 'Hi，我是你的智能財富助理');
            Text.fontSize(11);
            Text.fontColor(Hive.Color.n600);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('›');
            Text.fontSize(14);
            Text.fontColor(Hive.Color.n400);
        }, Text);
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class SDUIAdBanner extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.onDismiss = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SDUIAdBanner_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
        if (params.onDismiss !== undefined) {
            this.onDismiss = params.onDismiss;
        }
    }
    updateStateVars(params: SDUIAdBanner_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    private onDismiss: () => void;
    private title(): string { return this.props['title'] as string ?? ''; }
    private subtitle(): string { return this.props['subtitle'] as string ?? ''; }
    private ctaLabel(): string { return this.props['ctaLabel'] as string ?? ''; }
    private deepLink(): string { return this.props['ctaDeepLink'] as string ?? ''; }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create({ alignContent: Alignment.TopEnd });
            Stack.margin({ left: 12, right: 12, top: 6, bottom: 6 });
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.width('100%');
            Row.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            Row.borderRadius(14);
            Row.linearGradient({ direction: GradientDirection.LeftTop,
                colors: [['#FFFBEB', 0], ['#FEF3C7', 1]] });
            Row.alignItems(VerticalAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.layoutWeight(1);
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.title());
            Text.fontSize(13);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor('#92400E');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.subtitle());
            Text.fontSize(10);
            Text.fontColor('#78716C');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel(this.ctaLabel());
            Button.height(30);
            Button.padding({ left: 14, right: 14 });
            Button.borderRadius(12);
            Button.backgroundColor(Hive.Color.brandPrimary);
            Button.fontColor(Hive.Color.brandWhite);
            Button.fontSize(11);
            Button.fontWeight(FontWeight.Bold);
            Button.margin({ top: 8 });
            Button.onClick(() => {
                SensorDataClient.sliceTapped('AD_BANNER', 'slice-ad', this.ctaLabel(), this.deepLink());
            });
        }, Button);
        Button.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🌱');
            Text.fontSize(28);
            Text.width(72);
            Text.height(72);
            Text.textAlign(TextAlign.Center);
            Text.borderRadius(10);
            Text.backgroundColor('#14000000');
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('✕');
            Text.fontSize(13);
            Text.fontColor(Hive.Color.n400);
            Text.width(32);
            Text.height(32);
            Text.textAlign(TextAlign.Center);
            Text.onClick(() => {
                SensorDataClient.adBannerDismissed(this.title());
                this.onDismiss();
            });
        }, Text);
        Text.pop();
        Stack.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class SDUIFlashLoan extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SDUIFlashLoan_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
    }
    updateStateVars(params: SDUIFlashLoan_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    private productName(): string { return this.props['productName'] as string ?? '閃電貸 極速放款'; }
    private tagline(): string { return this.props['tagline'] as string ?? '最高可借額度'; }
    private currency(): string { return this.props['currency'] as string ?? 'HKD'; }
    private maxAmount(): number { return this.props['maxAmount'] as number ?? 300000; }
    private ctaLabel(): string { return this.props['ctaLabel'] as string ?? '獲取額度'; }
    private deepLink(): string { return this.props['ctaDeepLink'] as string ?? 'hsbc://loan/flash'; }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            Row.margin({ left: 12, right: 12, top: 6, bottom: 6 });
            Row.borderRadius(14);
            Row.linearGradient({ direction: GradientDirection.LeftTop,
                colors: [['#FFF5F5', 0], ['#FFE4E4', 1]] });
            Row.alignItems(VerticalAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 2 });
            Column.layoutWeight(1);
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`⚡ ${this.productName()}`);
            Text.fontSize(11);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.brandPrimary);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.tagline());
            Text.fontSize(10);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.currency()} ${this.maxAmount().toLocaleString()}.00`);
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Bolder);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel(this.ctaLabel());
            Button.height(44);
            Button.padding({ left: 18, right: 18 });
            Button.borderRadius(20);
            Button.backgroundColor(Hive.Color.brandPrimary);
            Button.fontColor(Hive.Color.brandWhite);
            Button.fontSize(12);
            Button.fontWeight(FontWeight.Bold);
            Button.onClick(() => {
                SensorDataClient.sliceTapped('FLASH_LOAN', 'slice-flash-loan', this.ctaLabel(), this.deepLink());
            });
        }, Button);
        Button.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class SDUIWealthSelection extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SDUIWealthSelection_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
    }
    updateStateVars(params: SDUIWealthSelection_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    private sectionTitle(): string { return this.props['sectionTitle'] as string ?? '財富精選'; }
    private products(): any[] { return this.props['products'] as any[] ?? [] as any[]; }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.padding({ left: 16, right: 16, top: 12, bottom: 12 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.margin({ bottom: 10 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.sectionTitle());
            Text.fontSize(15);
            Text.fontWeight(FontWeight.Bold);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('更多 ›');
            Text.fontSize(12);
            Text.fontColor(Hive.Color.brandPrimary);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = (_item, index: number) => {
                const raw = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create();
                    Row.width('100%');
                    Row.padding({ top: 10, bottom: 10 });
                    Row.onClick(() => {
                        SensorDataClient.wealthProductTapped((raw as Record<string, any>)['productName'] as string ?? '', (raw as Record<string, any>)['id'] as string ?? '');
                    });
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 2 });
                    Column.layoutWeight(1);
                    Column.alignItems(HorizontalAlign.Start);
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create((raw as Record<string, any>)['productName'] as string ?? '');
                    Text.fontSize(12);
                    Text.fontWeight(FontWeight.Medium);
                    Text.fontColor(Hive.Color.n900);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create({ space: 6 });
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create((raw as Record<string, any>)['riskLevel'] as string ?? '');
                    Text.fontSize(9);
                    Text.fontColor(Hive.Color.n500);
                    Text.padding({ left: 6, right: 6, top: 1, bottom: 1 });
                    Text.borderRadius(8);
                    Text.backgroundColor(Hive.Color.n100);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create((raw as Record<string, any>)['redemption'] as string ?? '');
                    Text.fontSize(9);
                    Text.fontColor(Hive.Color.n500);
                    Text.padding({ left: 6, right: 6, top: 1, bottom: 1 });
                    Text.borderRadius(8);
                    Text.backgroundColor(Hive.Color.n100);
                }, Text);
                Text.pop();
                Row.pop();
                Column.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 2 });
                    Column.alignItems(HorizontalAlign.End);
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create((raw as Record<string, any>)['yield7Day'] as string ?? '');
                    Text.fontSize(18);
                    Text.fontWeight(FontWeight.Bolder);
                    Text.fontColor(Hive.Color.brandPrimary);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create('7日年化');
                    Text.fontSize(9);
                    Text.fontColor(Hive.Color.n400);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    If.create();
                    if ((raw as Record<string, any>)['highlighted'] as boolean === true) {
                        this.ifElseBranchUpdateFunction(0, () => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Button.createWithLabel((raw as Record<string, any>)['ctaLabel'] as string ?? '查看');
                                Button.height(28);
                                Button.padding({ left: 12, right: 12 });
                                Button.borderRadius(12);
                                Button.backgroundColor(Hive.Color.brandPrimary);
                                Button.fontColor(Hive.Color.brandWhite);
                                Button.fontSize(10);
                                Button.fontWeight(FontWeight.Bold);
                                Button.margin({ top: 4 });
                                Button.onClick(() => {
                                    SensorDataClient.wealthProductTapped((raw as Record<string, any>)['productName'] as string ?? '', (raw as Record<string, any>)['id'] as string ?? '');
                                });
                            }, Button);
                            Button.pop();
                        });
                    }
                    else {
                        this.ifElseBranchUpdateFunction(1, () => {
                        });
                    }
                }, If);
                If.pop();
                Column.pop();
                Row.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    If.create();
                    if (index < this.products().length - 1) {
                        this.ifElseBranchUpdateFunction(0, () => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Divider.create();
                                Divider.color(Hive.Color.n100);
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
            this.forEachUpdateFunction(elmtId, this.products(), forEachItemGenFunction, undefined, true, false);
        }, ForEach);
        ForEach.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.height(10);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('💬 理財產品這么多，哪款適合我？');
            Text.fontSize(11);
            Text.fontColor(Hive.Color.n500);
            Text.textAlign(TextAlign.Center);
            Text.width('100%');
        }, Text);
        Text.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class SDUIFeaturedRankings extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SDUIFeaturedRankings_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
    }
    updateStateVars(params: SDUIFeaturedRankings_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    private sectionTitle(): string { return this.props['sectionTitle'] as string ?? '特色榜單'; }
    private items(): any[] { return this.props['items'] as any[] ?? [] as any[]; }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.padding({ left: 16, right: 16, top: 12, bottom: 12 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.margin({ bottom: 10 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.sectionTitle());
            Text.fontSize(15);
            Text.fontWeight(FontWeight.Bold);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('更多 ›');
            Text.fontSize(12);
            Text.fontColor(Hive.Color.brandPrimary);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const raw = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create({ space: 12 });
                    Row.width('100%');
                    Row.padding({ top: 8, bottom: 8 });
                    Row.onClick(() => {
                        SensorDataClient.rankingsTapped((raw as Record<string, string>)['title'] ?? '', (raw as Record<string, string>)['badge'] ?? '');
                    });
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create((raw as Record<string, string>)['icon'] ?? '');
                    Text.fontSize(24);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 2 });
                    Column.layoutWeight(1);
                    Column.alignItems(HorizontalAlign.Start);
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create((raw as Record<string, string>)['badge'] ?? '');
                    Text.fontSize(9);
                    Text.fontWeight(FontWeight.Bold);
                    Text.fontColor(Hive.Color.brandPrimary);
                    Text.padding({ left: 8, right: 8, top: 2, bottom: 2 });
                    Text.borderRadius(10);
                    Text.backgroundColor('#FEF2F2');
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create((raw as Record<string, string>)['title'] ?? '');
                    Text.fontSize(13);
                    Text.fontWeight(FontWeight.Bold);
                    Text.fontColor(Hive.Color.n900);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create((raw as Record<string, string>)['description'] ?? '');
                    Text.fontSize(10);
                    Text.fontColor(Hive.Color.n500);
                }, Text);
                Text.pop();
                Column.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create('›');
                    Text.fontSize(16);
                    Text.fontColor(Hive.Color.n400);
                }, Text);
                Text.pop();
                Row.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Divider.create();
                    Divider.color('#F9FAFB');
                }, Divider);
            };
            this.forEachUpdateFunction(elmtId, this.items(), forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class SDUILifeDeals extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SDUILifeDeals_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
    }
    updateStateVars(params: SDUILifeDeals_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    private sectionTitle(): string { return this.props['sectionTitle'] as string ?? '生活特惠'; }
    private deals(): any[] { return this.props['deals'] as any[] ?? [] as any[]; }
    private links(): any[] { return this.props['bottomLinks'] as any[] ?? [] as any[]; }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 10 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.padding({ left: 16, right: 16, top: 12, bottom: 12 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.sectionTitle());
            Text.fontSize(15);
            Text.fontWeight(FontWeight.Bold);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('更多 ›');
            Text.fontSize(12);
            Text.fontColor(Hive.Color.brandPrimary);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 10 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const raw = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 0 });
                    Column.layoutWeight(1);
                    Column.borderRadius(12);
                    Column.clip(true);
                    Column.backgroundColor(Hive.Color.n50);
                    Column.onClick(() => {
                        SensorDataClient.lifeDealTapped((raw as Record<string, string>)['brandName'] ?? '', (raw as Record<string, string>)['tag'] ?? '');
                    });
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create((raw as Record<string, string>)['logoUrl'] || '🏷');
                    Text.fontSize(24);
                    Text.width('100%');
                    Text.height(64);
                    Text.textAlign(TextAlign.Center);
                    Text.backgroundColor(Hive.Color.n100);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create((raw as Record<string, string>)['tag'] ?? '');
                    Text.fontSize(9);
                    Text.fontWeight(FontWeight.Bold);
                    Text.fontColor(Hive.Color.brandWhite);
                    Text.width('100%');
                    Text.textAlign(TextAlign.Center);
                    Text.padding({ top: 4, bottom: 4 });
                    Text.backgroundColor(Hive.Color.brandPrimary);
                }, Text);
                Text.pop();
                Column.pop();
            };
            this.forEachUpdateFunction(elmtId, this.deals(), forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 10 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const raw = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create({ space: 8 });
                    Row.layoutWeight(1);
                    Row.padding(10);
                    Row.borderRadius(12);
                    Row.backgroundColor(Hive.Color.n50);
                    Row.alignItems(VerticalAlign.Center);
                    Row.onClick(() => {
                        const extra: Record<string, any> = {};
                        extra['deep_link'] = ((raw as Record<string, string>)['deepLink'] ?? '') as any;
                        SensorDataClient.track('bottom_link_tap', 'Wealth', 'bottom_link_tapped', (raw as Record<string, string>)['label'] ?? '', 'wealth_hub_hk', 'wealth_hub', '', '', '', '', '', '', '', '', extra);
                    });
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create((raw as Record<string, string>)['icon'] ?? '');
                    Text.fontSize(24);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create((raw as Record<string, string>)['label'] ?? '');
                    Text.fontSize(10);
                    Text.fontColor(Hive.Color.n700);
                    Text.lineHeight(16);
                }, Text);
                Text.pop();
                Row.pop();
            };
            this.forEachUpdateFunction(elmtId, this.links(), forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class WHHeaderNav extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.onSearchTap = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: WHHeaderNav_Params) {
        if (params.onSearchTap !== undefined) {
            this.onSearchTap = params.onSearchTap;
        }
    }
    updateStateVars(params: WHHeaderNav_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private onSearchTap: () => void;
    aboutToAppear() {
        SensorDataClient.sliceImpression('AI_SEARCH_BAR', 'slice-header', 0);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 8 });
            Row.width('100%');
            Row.height(50);
            Row.padding({ left: 12, right: 12, top: 7, bottom: 7 });
            Row.backgroundColor('#DB0011');
            Row.alignItems(VerticalAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('⬜');
            Text.fontSize(20);
            Text.fontColor('#E6FFFFFF');
            Text.onClick(() => {
                SensorDataClient.track('qr_tap', 'Wealth', 'qr_scanner_tapped', '', 'ai_search_bar', 'wealth_hub');
            });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.layoutWeight(1);
            Row.height(36);
            Row.padding({ left: 12, right: 12 });
            Row.borderRadius(18);
            Row.backgroundColor('#26FFFFFF');
            Row.onClick(() => {
                SensorDataClient.track('search_tap', 'Wealth', 'search_tapped', '', 'ai_search_bar', 'wealth_hub');
                this.onSearchTap();
            });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🔍');
            Text.fontSize(13);
            Text.fontColor('#99FFFFFF');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('搜尋功能、產品');
            Text.fontSize(13);
            Text.fontColor('#A6FFFFFF');
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🤖');
            Text.fontSize(20);
            Text.fontColor('#E6FFFFFF');
            Text.onClick(() => {
                SensorDataClient.track('chatbot_tap', 'Wealth', 'chatbot_tapped', '', 'ai_search_bar', 'wealth_hub');
            });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('✉️');
            Text.fontSize(20);
            Text.fontColor('#E6FFFFFF');
            Text.onClick(() => {
                SensorDataClient.track('inbox_tap', 'Wealth', 'inbox_tapped', '', 'ai_search_bar', 'wealth_hub');
            });
        }, Text);
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class WHQuickAccess extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: WHQuickAccess_Params) {
    }
    updateStateVars(params: WHQuickAccess_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    aboutToAppear() {
        SensorDataClient.sliceImpression('QUICK_ACCESS', 'slice-quick', 1);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.backgroundColor(Hive.Color.brandWhite);
            Row.padding({ left: 16, right: 16, top: 12, bottom: 12 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const item = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 5 });
                    Column.layoutWeight(1);
                    Column.alignItems(HorizontalAlign.Center);
                    Column.onClick(() => { SensorDataClient.quickAccessTapped(item.label, item.deepLink); });
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(item.icon);
                    Text.fontSize(22);
                    Text.width(48);
                    Text.height(48);
                    Text.textAlign(TextAlign.Center);
                    Text.borderRadius(14);
                    Text.linearGradient({ direction: GradientDirection.LeftTop,
                        colors: [['#F0F9FF', 0], ['#E0F2FE', 1]] });
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(item.label);
                    Text.fontSize(10);
                    Text.fontColor(Hive.Color.n700);
                    Text.textAlign(TextAlign.Center);
                }, Text);
                Text.pop();
                Column.pop();
            };
            this.forEachUpdateFunction(elmtId, QUICK_ITEMS, forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class WHPromoBanner extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: WHPromoBanner_Params) {
    }
    updateStateVars(params: WHPromoBanner_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    aboutToAppear() {
        SensorDataClient.promoBannerImpression('10分招財日', 'slice-promo-10', 'promo-10-finance-day');
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 0 });
            Row.width('100%');
            Row.padding({ left: 12, right: 12, top: 12, bottom: 12 });
            Row.margin({ left: 12, right: 12, top: 8, bottom: 0 });
            Row.borderRadius(14);
            Row.backgroundColor('#E8F4FD');
            Row.alignItems(VerticalAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.layoutWeight(1);
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('每月10日開啓');
            Text.fontSize(9);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor('#DB0011');
            Text.padding({ left: 8, right: 8, top: 2, bottom: 2 });
            Text.borderRadius(10);
            Text.backgroundColor('#FFEDED');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('10分招財日');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bolder);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('查帳單·學投資·優配置');
            Text.fontSize(10);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('點擊參與');
            Button.height(32);
            Button.padding({ left: 16, right: 16 });
            Button.borderRadius(14);
            Button.backgroundColor(Hive.Color.brandPrimary);
            Button.fontColor(Hive.Color.brandWhite);
            Button.fontSize(11);
            Button.fontWeight(FontWeight.Bold);
            Button.margin({ top: 8 });
            Button.onClick(() => {
                SensorDataClient.promoBannerTapped('10分招財日', 'slice-promo-10', 'promo-10-finance-day');
            });
        }, Button);
        Button.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🎯');
            Text.fontSize(32);
            Text.width(80);
            Text.height(80);
            Text.textAlign(TextAlign.Center);
            Text.borderRadius(12);
            Text.backgroundColor('#14000000');
        }, Text);
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class WHFunctionGrid extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: WHFunctionGrid_Params) {
    }
    updateStateVars(params: WHFunctionGrid_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    aboutToAppear() {
        SensorDataClient.sliceImpression('FUNCTION_GRID', 'slice-func-grid', 3);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 6 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.padding({ left: 16, right: 16, top: 8, bottom: 8 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const row = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create();
                    Row.width('100%');
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    ForEach.create();
                    const forEachItemGenFunction = _item => {
                        const item = _item;
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Column.create({ space: 4 });
                            Column.layoutWeight(1);
                            Column.alignItems(HorizontalAlign.Center);
                            Column.onClick(() => {
                                const extra: Record<string, any> = {};
                                extra['function_label'] = item.label as any;
                                extra['deep_link'] = item.deepLink as any;
                                SensorDataClient.track('function_tap', 'Wealth', 'function_tapped', item.label, 'wealth_hub_hk', 'wealth_hub', '', '', '', '', '', '', '', '', extra);
                            });
                        }, Column);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(item.icon);
                            Text.fontSize(20);
                            Text.width(44);
                            Text.height(44);
                            Text.textAlign(TextAlign.Center);
                            Text.borderRadius(12);
                            Text.backgroundColor(Hive.Color.n100);
                        }, Text);
                        Text.pop();
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(item.label);
                            Text.fontSize(10);
                            Text.fontColor(Hive.Color.n700);
                            Text.textAlign(TextAlign.Center);
                            Text.lineHeight(14);
                        }, Text);
                        Text.pop();
                        Column.pop();
                    };
                    this.forEachUpdateFunction(elmtId, row, forEachItemGenFunction);
                }, ForEach);
                ForEach.pop();
                Row.pop();
            };
            this.forEachUpdateFunction(elmtId, FUNC_ROWS, forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class WHAIAssistant extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: WHAIAssistant_Params) {
    }
    updateStateVars(params: WHAIAssistant_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    aboutToAppear() {
        SensorDataClient.sliceImpression('AI_ASSISTANT', 'slice-ai', 4);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 8 });
            Row.width('100%');
            Row.height(44);
            Row.padding({ left: 12, right: 12 });
            Row.margin({ left: 16, right: 16, top: 4, bottom: 4 });
            Row.borderRadius(10);
            Row.backgroundColor(Hive.Color.n50);
            Row.alignItems(VerticalAlign.Center);
            Row.onClick(() => { SensorDataClient.aiAssistantTapped(); });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('✉️');
            Text.fontSize(20);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Hi，我是你的智能財富助理');
            Text.fontSize(11);
            Text.fontColor(Hive.Color.n600);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('›');
            Text.fontSize(14);
            Text.fontColor(Hive.Color.n400);
        }, Text);
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class WHAdBanner extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.onDismiss = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: WHAdBanner_Params) {
        if (params.onDismiss !== undefined) {
            this.onDismiss = params.onDismiss;
        }
    }
    updateStateVars(params: WHAdBanner_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private onDismiss: () => void;
    aboutToAppear() {
        SensorDataClient.sliceImpression('AD_BANNER', 'slice-ad-spring', 5);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create({ alignContent: Alignment.TopEnd });
            Stack.margin({ left: 12, right: 12, top: 6, bottom: 6 });
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.width('100%');
            Row.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            Row.borderRadius(14);
            Row.linearGradient({ direction: GradientDirection.LeftTop,
                colors: [['#FFFBEB', 0], ['#FEF3C7', 1]] });
            Row.alignItems(VerticalAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.layoutWeight(1);
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('春季播種黃金期');
            Text.fontSize(13);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor('#92400E');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('配置正當時，播下「金種子」');
            Text.fontSize(10);
            Text.fontColor('#78716C');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('抽體驗禮');
            Button.height(30);
            Button.padding({ left: 14, right: 14 });
            Button.borderRadius(12);
            Button.backgroundColor(Hive.Color.brandPrimary);
            Button.fontColor(Hive.Color.brandWhite);
            Button.fontSize(11);
            Button.fontWeight(FontWeight.Bold);
            Button.margin({ top: 8 });
            Button.onClick(() => {
                SensorDataClient.sliceTapped('AD_BANNER', 'slice-ad-spring', '抽體驗禮', 'hsbc://campaign/spring-investment');
            });
        }, Button);
        Button.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🌱');
            Text.fontSize(28);
            Text.width(72);
            Text.height(72);
            Text.textAlign(TextAlign.Center);
            Text.borderRadius(10);
            Text.backgroundColor('#14000000');
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('✕');
            Text.fontSize(13);
            Text.fontColor(Hive.Color.n400);
            Text.width(32);
            Text.height(32);
            Text.textAlign(TextAlign.Center);
            Text.onClick(() => {
                SensorDataClient.adBannerDismissed('春季播種黃金期');
                this.onDismiss();
            });
        }, Text);
        Text.pop();
        Stack.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class WHFlashLoan extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: WHFlashLoan_Params) {
    }
    updateStateVars(params: WHFlashLoan_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    aboutToAppear() {
        SensorDataClient.sliceImpression('FLASH_LOAN', 'slice-flash-loan', 6);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            Row.margin({ left: 12, right: 12, top: 6, bottom: 6 });
            Row.borderRadius(14);
            Row.linearGradient({ direction: GradientDirection.LeftTop,
                colors: [['#FFF5F5', 0], ['#FFE4E4', 1]] });
            Row.alignItems(VerticalAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 2 });
            Column.layoutWeight(1);
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('⚡ 閃電貸 極速放款');
            Text.fontSize(11);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.brandPrimary);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('最高可借額度');
            Text.fontSize(10);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('HKD 300,000.00');
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Bolder);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('獲取額度');
            Button.height(44);
            Button.padding({ left: 18, right: 18 });
            Button.borderRadius(20);
            Button.backgroundColor(Hive.Color.brandPrimary);
            Button.fontColor(Hive.Color.brandWhite);
            Button.fontSize(12);
            Button.fontWeight(FontWeight.Bold);
            Button.onClick(() => {
                SensorDataClient.sliceTapped('FLASH_LOAN', 'slice-flash-loan', '獲取額度', 'hsbc://loan/flash');
            });
        }, Button);
        Button.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class WHWealthSelection extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: WHWealthSelection_Params) {
    }
    updateStateVars(params: WHWealthSelection_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    aboutToAppear() {
        SensorDataClient.sliceImpression('WEALTH_SELECTION', 'slice-wealth-sel', 7, 'wealth-selection-hk-2026');
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.padding({ left: 16, right: 16, top: 12, bottom: 12 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.margin({ bottom: 10 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('財富精選');
            Text.fontSize(15);
            Text.fontWeight(FontWeight.Bold);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('更多 ›');
            Text.fontSize(12);
            Text.fontColor(Hive.Color.brandPrimary);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = (_item, index: number) => {
                const p = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create();
                    Row.width('100%');
                    Row.padding({ top: 10, bottom: 10 });
                    Row.onClick(() => { SensorDataClient.wealthProductTapped(p.name, p.id); });
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 2 });
                    Column.layoutWeight(1);
                    Column.alignItems(HorizontalAlign.Start);
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(p.name);
                    Text.fontSize(12);
                    Text.fontWeight(FontWeight.Medium);
                    Text.fontColor(Hive.Color.n900);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create({ space: 6 });
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(p.risk);
                    Text.fontSize(9);
                    Text.fontColor(Hive.Color.n500);
                    Text.padding({ left: 6, right: 6, top: 1, bottom: 1 });
                    Text.borderRadius(8);
                    Text.backgroundColor(Hive.Color.n100);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(p.redemption);
                    Text.fontSize(9);
                    Text.fontColor(Hive.Color.n500);
                    Text.padding({ left: 6, right: 6, top: 1, bottom: 1 });
                    Text.borderRadius(8);
                    Text.backgroundColor(Hive.Color.n100);
                }, Text);
                Text.pop();
                Row.pop();
                Column.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 2 });
                    Column.alignItems(HorizontalAlign.End);
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(p.yield7Day);
                    Text.fontSize(18);
                    Text.fontWeight(FontWeight.Bolder);
                    Text.fontColor(Hive.Color.brandPrimary);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create('7日年化');
                    Text.fontSize(9);
                    Text.fontColor(Hive.Color.n400);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    If.create();
                    if (p.highlighted) {
                        this.ifElseBranchUpdateFunction(0, () => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Button.createWithLabel(p.cta);
                                Button.height(28);
                                Button.padding({ left: 12, right: 12 });
                                Button.borderRadius(12);
                                Button.backgroundColor(Hive.Color.brandPrimary);
                                Button.fontColor(Hive.Color.brandWhite);
                                Button.fontSize(10);
                                Button.fontWeight(FontWeight.Bold);
                                Button.margin({ top: 4 });
                                Button.onClick(() => { SensorDataClient.wealthProductTapped(p.name, p.id); });
                            }, Button);
                            Button.pop();
                        });
                    }
                    else {
                        this.ifElseBranchUpdateFunction(1, () => {
                        });
                    }
                }, If);
                If.pop();
                Column.pop();
                Row.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    If.create();
                    if (index < WEALTH_PRODUCTS.length - 1) {
                        this.ifElseBranchUpdateFunction(0, () => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Divider.create();
                                Divider.color(Hive.Color.n100);
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
            this.forEachUpdateFunction(elmtId, WEALTH_PRODUCTS, forEachItemGenFunction, undefined, true, false);
        }, ForEach);
        ForEach.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.height(10);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('💬 理財產品這么多，哪款適合我？');
            Text.fontSize(11);
            Text.fontColor(Hive.Color.n500);
            Text.textAlign(TextAlign.Center);
            Text.width('100%');
        }, Text);
        Text.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class WHFeaturedRankings extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: WHFeaturedRankings_Params) {
    }
    updateStateVars(params: WHFeaturedRankings_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    aboutToAppear() {
        SensorDataClient.sliceImpression('FEATURED_RANKINGS', 'slice-rankings', 8);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.padding({ left: 16, right: 16, top: 12, bottom: 12 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.margin({ bottom: 10 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('特色榜單');
            Text.fontSize(15);
            Text.fontWeight(FontWeight.Bold);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('更多 ›');
            Text.fontSize(12);
            Text.fontColor(Hive.Color.brandPrimary);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const item = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create({ space: 12 });
                    Row.width('100%');
                    Row.padding({ top: 8, bottom: 8 });
                    Row.onClick(() => { SensorDataClient.rankingsTapped(item.title, item.badge); });
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(item.icon);
                    Text.fontSize(24);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 2 });
                    Column.layoutWeight(1);
                    Column.alignItems(HorizontalAlign.Start);
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(item.badge);
                    Text.fontSize(9);
                    Text.fontWeight(FontWeight.Bold);
                    Text.fontColor(Hive.Color.brandPrimary);
                    Text.padding({ left: 8, right: 8, top: 2, bottom: 2 });
                    Text.borderRadius(10);
                    Text.backgroundColor('#FEF2F2');
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(item.title);
                    Text.fontSize(13);
                    Text.fontWeight(FontWeight.Bold);
                    Text.fontColor(Hive.Color.n900);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(item.desc);
                    Text.fontSize(10);
                    Text.fontColor(Hive.Color.n500);
                }, Text);
                Text.pop();
                Column.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create('›');
                    Text.fontSize(16);
                    Text.fontColor(Hive.Color.n400);
                }, Text);
                Text.pop();
                Row.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Divider.create();
                    Divider.color('#F9FAFB');
                }, Divider);
            };
            this.forEachUpdateFunction(elmtId, RANKINGS, forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class WHLifeDeals extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.bottomLinks = [
            { icon: '🎁', label: '達標抽好禮\n丰润守护 健康随行', deepLink: 'hsbc://campaign/health' },
            { icon: '🏦', label: '行庆招财日\n享受特惠禮遇', deepLink: 'hsbc://campaign/anniversary' },
        ];
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: WHLifeDeals_Params) {
        if (params.bottomLinks !== undefined) {
            this.bottomLinks = params.bottomLinks;
        }
    }
    updateStateVars(params: WHLifeDeals_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private bottomLinks: BottomLink[];
    aboutToAppear() {
        SensorDataClient.sliceImpression('LIFE_DEALS', 'slice-life-deals', 9);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 10 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.padding({ left: 16, right: 16, top: 12, bottom: 12 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('生活特惠');
            Text.fontSize(15);
            Text.fontWeight(FontWeight.Bold);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('更多 ›');
            Text.fontSize(12);
            Text.fontColor(Hive.Color.brandPrimary);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 10 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const d = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 0 });
                    Column.layoutWeight(1);
                    Column.borderRadius(12);
                    Column.clip(true);
                    Column.backgroundColor(Hive.Color.n50);
                    Column.onClick(() => { SensorDataClient.lifeDealTapped(d.brand, d.tag); });
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(d.emoji);
                    Text.fontSize(24);
                    Text.width('100%');
                    Text.height(64);
                    Text.textAlign(TextAlign.Center);
                    Text.backgroundColor(Hive.Color.n100);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(d.tag);
                    Text.fontSize(9);
                    Text.fontWeight(FontWeight.Bold);
                    Text.fontColor(Hive.Color.brandWhite);
                    Text.width('100%');
                    Text.textAlign(TextAlign.Center);
                    Text.padding({ top: 4, bottom: 4 });
                    Text.backgroundColor(Hive.Color.brandPrimary);
                }, Text);
                Text.pop();
                Column.pop();
            };
            this.forEachUpdateFunction(elmtId, DEALS, forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 10 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const link = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create({ space: 8 });
                    Row.layoutWeight(1);
                    Row.padding(10);
                    Row.borderRadius(12);
                    Row.backgroundColor(Hive.Color.n50);
                    Row.alignItems(VerticalAlign.Center);
                    Row.onClick(() => {
                        const extra: Record<string, any> = {};
                        extra['deep_link'] = link.deepLink as any;
                        SensorDataClient.track('bottom_link_tap', 'Wealth', 'bottom_link_tapped', link.label, 'wealth_hub_hk', 'wealth_hub', '', '', '', '', '', '', '', '', extra);
                    });
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(link.icon);
                    Text.fontSize(24);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(link.label);
                    Text.fontSize(10);
                    Text.fontColor(Hive.Color.n700);
                    Text.lineHeight(16);
                }, Text);
                Text.pop();
                Row.pop();
            };
            this.forEachUpdateFunction(elmtId, this.bottomLinks, forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
