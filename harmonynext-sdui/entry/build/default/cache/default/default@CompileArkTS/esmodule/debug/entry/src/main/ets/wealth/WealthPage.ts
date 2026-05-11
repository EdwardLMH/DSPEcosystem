if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface WHDiscoverMore_Params {
}
interface WHFXWatchlist_Params {
}
interface WHGuidesInsights_Params {
}
interface WHWealthStudioCarousel_Params {
}
interface WHFeatureProduct_Params {
    activeTab?: number;
    fundTabs?: string[];
}
interface WHQuestBanner_Params {
}
interface WHCardActivationBanner_Params {
}
interface WHComboQuickAccess_Params {
    activeTab?: number;
    tabs?: string[];
}
interface WHHomeSearchHeader_Params {
    onSearchTap?: () => void;
}
interface SDUIDiscoverMore_Params {
    props?: Record<string, ESObject>;
}
interface SDUIFXWatchlist_Params {
    props?: Record<string, ESObject>;
}
interface SDUIGuidesInsights_Params {
    props?: Record<string, ESObject>;
}
interface SDUIWealthStudioCarousel_Params {
    props?: Record<string, ESObject>;
    playingUrl?: string;
}
interface SDUIFeatureProduct_Params {
    props?: Record<string, ESObject>;
    activeTab?: number;
}
interface SDUIQuestBanner_Params {
    props?: Record<string, ESObject>;
}
interface SDUICardActivationBanner_Params {
    props?: Record<string, ESObject>;
}
interface SDUIComboQuickAccess_Params {
    props?: Record<string, ESObject>;
    activeTab?: number;
}
interface SDUIHomeSearchHeader_Params {
    props?: Record<string, ESObject>;
    onSearchTap?: () => void;
}
interface WealthPageView_Params {
    searchOpen?: boolean;
    loadState?: number;
    sdui?: WealthSlice[];
    staticDist?: SDUIStaticDistribution;
    selfPickForceUpdate?: boolean;
}
interface SDUISliceView_Params {
    slice?: WealthSlice;
    onSearchTap?: () => void;
}
import { Hive } from "@normalized:N&&&entry/src/main/ets/common/HiveTokens&";
import { SensorDataClient } from "@normalized:N&&&entry/src/main/ets/network/SensorDataClient&";
import { AISearchPage } from "@normalized:N&&&entry/src/main/ets/wealth/AISearchPage&";
import { fetchWealthScreen } from "@normalized:N&&&entry/src/main/ets/network/KYCNetworkService&";
import type { WealthSlice } from "@normalized:N&&&entry/src/main/ets/network/KYCNetworkService&";
import { SDUIStaticDistribution } from "@normalized:N&&&entry/src/main/ets/network/SDUIStaticDistribution&";
// ─── Data models ──────────────────────────────────────────────────────────────
interface QuickItem {
    icon: string;
    label: string;
    deepLink: string;
}
interface FundItem {
    id: string;
    name: string;
    code: string;
    return1Y: string;
    tags: string[];
    deepLink: string;
}
interface EpisodeItem {
    id: string;
    title: string;
    duration: string;
    thumbnail: string;
    deepLink: string;
}
interface GuideItem {
    id: string;
    title: string;
    category: string;
    imageEmoji: string;
    deepLink: string;
    date?: string;
}
interface FXPair {
    base: string;
    quote: string;
    rate: string;
    change: string;
    positive: boolean;
}
interface CampaignCard {
    id: string;
    title: string;
    tag: string;
    imageEmoji: string;
    deepLink: string;
}
interface StaticScreenPayload {
    layout: StaticLayout;
}
interface StaticLayout {
    children: WealthSlice[];
}
// ─── Static fallback data ─────────────────────────────────────────────────────
// Mirrors OCDP mockData.ts — used on LOAD_ERROR path.
const QUICK_ROW1: QuickItem[] = [
    { icon: '👤', label: 'Account', deepLink: 'hsbc://accounts' },
    { icon: '🌐', label: 'Transfer', deepLink: 'hsbc://transfer' },
    { icon: '💱', label: 'FX', deepLink: 'hsbc://fx' },
    { icon: '📈', label: 'Stock', deepLink: 'hsbc://stock' },
    { icon: '⏰', label: 'Deposit', deepLink: 'hsbc://deposit' },
];
const QUICK_ROW2: QuickItem[] = [
    { icon: '📊', label: 'Holding', deepLink: 'hsbc://holding' },
    { icon: '💰', label: 'Safe', deepLink: 'hsbc://safe' },
    { icon: '↔️', label: 'FPS', deepLink: 'hsbc://fps' },
    { icon: '📷', label: 'Scan', deepLink: 'hsbc://scan' },
    { icon: '⊞', label: 'All', deepLink: 'hsbc://all-services' },
];
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
];
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
];
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
];
const STATIC_FX_PAIRS: FXPair[] = [
    { base: 'USD', quote: 'HKD', rate: '7.7851', change: '+0.02%', positive: true },
    { base: 'EUR', quote: 'HKD', rate: '8.4302', change: '-0.11%', positive: false },
    { base: 'GBP', quote: 'HKD', rate: '9.8154', change: '+0.08%', positive: true },
    { base: 'JPY', quote: 'HKD', rate: '0.0514', change: '-0.05%', positive: false },
    { base: 'CNH', quote: 'HKD', rate: '1.0722', change: '+0.01%', positive: true },
];
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
];
// ─── Load-state enum ──────────────────────────────────────────────────────────
// ArkTS forbids string-union @State — use plain number constants.
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
        this.onSearchTap = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SDUISliceView_Params) {
        if (params.slice !== undefined) {
            this.slice = params.slice;
        }
        if (params.onSearchTap !== undefined) {
            this.onSearchTap = params.onSearchTap;
        }
    }
    updateStateVars(params: SDUISliceView_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private slice: WealthSlice;
    private onSearchTap: () => void;
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
            if (this.slice.type === 'HOME_SEARCH_HEADER') {
                this.ifElseBranchUpdateFunction(0, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new SDUIHomeSearchHeader(this, { props: this.slice.props,
                                    onSearchTap: () => { this.onSearchTap(); } }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 142, col: 7 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        props: this.slice.props,
                                        onSearchTap: () => { this.onSearchTap(); }
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "SDUIHomeSearchHeader" });
                    }
                });
            }
            else if (this.slice.type === 'COMBO_QUICK_ACCESS') {
                this.ifElseBranchUpdateFunction(1, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new SDUIComboQuickAccess(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 145, col: 7 });
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
                        }, { name: "SDUIComboQuickAccess" });
                    }
                });
            }
            else if (this.slice.type === 'SELF_PICK_ENTRY_POINTS') {
                this.ifElseBranchUpdateFunction(2, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new 
                                // Self-pick items have already been merged by WealthPageView before render
                                SDUIComboQuickAccess(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 148, col: 7 });
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
                        }, { name: "SDUIComboQuickAccess" });
                    }
                });
            }
            else if (this.slice.type === 'CARD_ACTIVATION_BANNER') {
                this.ifElseBranchUpdateFunction(3, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new SDUICardActivationBanner(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 150, col: 7 });
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
                        }, { name: "SDUICardActivationBanner" });
                    }
                });
            }
            else if (this.slice.type === 'QUEST_BANNER') {
                this.ifElseBranchUpdateFunction(4, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new SDUIQuestBanner(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 152, col: 7 });
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
                        }, { name: "SDUIQuestBanner" });
                    }
                });
            }
            else if (this.slice.type === 'FEATURE_PRODUCT') {
                this.ifElseBranchUpdateFunction(5, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new SDUIFeatureProduct(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 154, col: 7 });
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
                        }, { name: "SDUIFeatureProduct" });
                    }
                });
            }
            else if (this.slice.type === 'WEALTH_STUDIO_CAROUSEL') {
                this.ifElseBranchUpdateFunction(6, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new SDUIWealthStudioCarousel(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 156, col: 7 });
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
                        }, { name: "SDUIWealthStudioCarousel" });
                    }
                });
            }
            else if (this.slice.type === 'GUIDES_INSIGHTS_CAROUSEL') {
                this.ifElseBranchUpdateFunction(7, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new SDUIGuidesInsights(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 158, col: 7 });
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
                        }, { name: "SDUIGuidesInsights" });
                    }
                });
            }
            else if (this.slice.type === 'FX_WATCHLIST') {
                this.ifElseBranchUpdateFunction(8, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new SDUIFXWatchlist(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 160, col: 7 });
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
                        }, { name: "SDUIFXWatchlist" });
                    }
                });
            }
            else if (this.slice.type === 'DISCOVER_MORE_CAROUSEL') {
                this.ifElseBranchUpdateFunction(9, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new SDUIDiscoverMore(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 162, col: 7 });
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
                        }, { name: "SDUIDiscoverMore" });
                    }
                });
            }
            else if (this.slice.type === 'SPACER') {
                this.ifElseBranchUpdateFunction(10, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                        Blank.height(this.slice.props['height'] as number ?? 16);
                    }, Blank);
                    Blank.pop();
                });
            }
            // unknown types silently omitted
            else {
                this.ifElseBranchUpdateFunction(11, () => {
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
        this.__searchOpen = new ObservedPropertySimplePU(false, this, "searchOpen");
        this.__loadState = new ObservedPropertySimplePU(LOAD_IDLE // LOAD_* constants
        , this, "loadState");
        this.__sdui = new ObservedPropertyObjectPU([] // BFF / static slices when loaded
        // Static distribution manager (userId would come from auth context in production)
        , this, "sdui");
        this.staticDist = new SDUIStaticDistribution(getContext(this), 'anonymous');
        this.selfPickForceUpdate = false;
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: WealthPageView_Params) {
        if (params.searchOpen !== undefined) {
            this.searchOpen = params.searchOpen;
        }
        if (params.loadState !== undefined) {
            this.loadState = params.loadState;
        }
        if (params.sdui !== undefined) {
            this.sdui = params.sdui;
        }
        if (params.staticDist !== undefined) {
            this.staticDist = params.staticDist;
        }
        if (params.selfPickForceUpdate !== undefined) {
            this.selfPickForceUpdate = params.selfPickForceUpdate;
        }
    }
    updateStateVars(params: WealthPageView_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__searchOpen.purgeDependencyOnElmtId(rmElmtId);
        this.__loadState.purgeDependencyOnElmtId(rmElmtId);
        this.__sdui.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__searchOpen.aboutToBeDeleted();
        this.__loadState.aboutToBeDeleted();
        this.__sdui.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
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
    private __sdui: ObservedPropertyObjectPU<WealthSlice[]>; // BFF / static slices when loaded
    get sdui() {
        return this.__sdui.get();
    }
    set sdui(newValue: WealthSlice[]) {
        this.__sdui.set(newValue);
    }
    // Static distribution manager (userId would come from auth context in production)
    private staticDist: SDUIStaticDistribution;
    private selfPickForceUpdate: boolean;
    aboutToAppear() {
        SensorDataClient.wealthHubViewed();
        this.loadWithStaticChain();
    }
    // ── 3-tier resolution chain ─────────────────────────────────────────────────
    private async loadWithStaticChain(): Promise<void> {
        this.loadState = LOAD_LOADING;
        try {
            // Step 1 — CDN static distribution (concurrent with BFF call)
            const staticPromise = this.staticDist.resolve('home-wealth-hk');
            const bffPromise = fetchWealthScreen().catch(() => null);
            // Await both; prefer the BFF if it succeeds (personalised/A-B), else use static
            const results = await Promise.all([staticPromise, bffPromise]);
            const staticResult = results[0];
            const bffPayload = results[1];
            if (bffPayload !== null) {
                // BFF success — use personalised payload
                const slices: WealthSlice[] = bffPayload.layout.children.filter((s: WealthSlice) => s.visible !== false);
                await this.mergeSelfPick(slices);
                this.sdui = slices;
                this.loadState = LOAD_DONE;
                return;
            }
            if (staticResult.json !== null) {
                // Static / local / bundled baseline
                try {
                    const parsed = JSON.parse(staticResult.json) as StaticScreenPayload;
                    const slices: WealthSlice[] = parsed.layout.children.filter((s: WealthSlice) => s.visible !== false);
                    await this.mergeSelfPick(slices);
                    this.sdui = slices;
                    this.loadState = LOAD_DONE;
                }
                catch (e) {
                    this.loadState = LOAD_ERROR;
                }
                return;
            }
            // All tiers exhausted — render hardcoded static fallback
            this.loadState = LOAD_ERROR;
        }
        catch (e) {
            // Safety net: any unhandled crash must not leave loadState at LOAD_LOADING
            this.loadState = LOAD_ERROR;
        }
    }
    // Merge self-pick preferences into any SELF_PICK_ENTRY_POINTS slices
    private async mergeSelfPick(slices: WealthSlice[]): Promise<void> {
        for (let i = 0; i < slices.length; i++) {
            const slice = slices[i];
            if (slice.type === 'SELF_PICK_ENTRY_POINTS' || slice.type === 'COMBO_QUICK_ACCESS') {
                const remoteRow1: Record<string, string>[] = (slice.props['row1Items'] as Record<string, string>[]) ?? [];
                const merged = await this.staticDist.resolvedSelfPickItems('home-wealth-hk', remoteRow1, this.selfPickForceUpdate);
                const updatedProps = slice.props;
                updatedProps['row1Items'] = merged as any;
                slices[i] = { instanceId: slice.instanceId, type: slice.type,
                    props: updatedProps, visible: slice.visible };
            }
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
                                WHHomeSearchHeader(this, { onSearchTap: () => { this.searchOpen = true; } }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 263, col: 13 });
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
                        }, { name: "WHHomeSearchHeader" });
                    }
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.width('100%');
                        Row.height(80);
                        Row.justifyContent(FlexAlign.Center);
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('Loading…');
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
                                        let componentCall = new SDUISliceView(this, { slice: slice, onSearchTap: () => { this.searchOpen = true; } }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 272, col: 15 });
                                        ViewPU.create(componentCall);
                                        let paramsLambda = () => {
                                            return {
                                                slice: slice,
                                                onSearchTap: () => { this.searchOpen = true; }
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
                                // ── Static fallback: BFF not live yet (LOAD_IDLE or LOAD_ERROR) ─
                                WHHomeSearchHeader(this, { onSearchTap: () => { this.searchOpen = true; } }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 276, col: 13 });
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
                        }, { name: "WHHomeSearchHeader" });
                    }
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new WHComboQuickAccess(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 277, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "WHComboQuickAccess" });
                    }
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new WHCardActivationBanner(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 278, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "WHCardActivationBanner" });
                    }
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new WHQuestBanner(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 279, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "WHQuestBanner" });
                    }
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new WHFeatureProduct(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 280, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "WHFeatureProduct" });
                    }
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new WHWealthStudioCarousel(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 281, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "WHWealthStudioCarousel" });
                    }
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new WHGuidesInsights(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 282, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "WHGuidesInsights" });
                    }
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new WHFXWatchlist(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 283, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "WHFXWatchlist" });
                    }
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new WHDiscoverMore(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 284, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "WHDiscoverMore" });
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
                                let componentCall = new AISearchPage(this, { onDismiss: () => { this.searchOpen = false; } }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 291, col: 9 });
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
class SDUIHomeSearchHeader extends ViewPU {
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
    setInitiallyProvidedValue(params: SDUIHomeSearchHeader_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
        if (params.onSearchTap !== undefined) {
            this.onSearchTap = params.onSearchTap;
        }
    }
    updateStateVars(params: SDUIHomeSearchHeader_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    private onSearchTap: () => void;
    private title(): string { return this.props['title'] as string ?? 'HSBC Premier'; }
    private placeholder(): string { return this.props['searchPlaceholder'] as string ?? 'Search with AI'; }
    private showBell(): boolean { return this.props['showNotificationBell'] as boolean ?? true; }
    private showHeadset(): boolean { return this.props['showHeadset'] as boolean ?? true; }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.backgroundColor('#DB0011');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Top bar: segment label + bell + headset
            Row.create({ space: 0 });
            // Top bar: segment label + bell + headset
            Row.width('100%');
            // Top bar: segment label + bell + headset
            Row.padding({ left: 16, right: 16, top: 14, bottom: 8 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.title());
            Text.fontSize(17);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.brandWhite);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.showBell()) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('🔔');
                        Text.fontSize(20);
                        Text.fontColor(Hive.Color.brandWhite);
                        Text.margin({ right: 12 });
                        Text.onClick(() => {
                            SensorDataClient.track('notification_tap', 'Wealth', 'notification_tapped', '', 'home_search_header', 'wealth_hub');
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
            if (this.showHeadset()) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('🎧');
                        Text.fontSize(20);
                        Text.fontColor(Hive.Color.brandWhite);
                        Text.onClick(() => {
                            SensorDataClient.track('headset_tap', 'Wealth', 'headset_tapped', '', 'home_search_header', 'wealth_hub');
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
        // Top bar: segment label + bell + headset
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Search bar row with AI badge
            Row.create({ space: 8 });
            // Search bar row with AI badge
            Row.width('100%');
            // Search bar row with AI badge
            Row.padding({ left: 16, right: 16, bottom: 12 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.layoutWeight(1);
            Row.height(36);
            Row.padding({ left: 12, right: 12 });
            Row.borderRadius(18);
            Row.backgroundColor(Hive.Color.brandWhite);
            Row.onClick(() => {
                SensorDataClient.track('search_tap', 'Wealth', 'search_tapped', '', 'home_search_header', 'wealth_hub');
                this.onSearchTap();
            });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🔍');
            Text.fontSize(13);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.placeholder());
            Text.fontSize(13);
            Text.fontColor(Hive.Color.n400);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // AI badge
            Text.create('AI');
            // AI badge
            Text.fontSize(9);
            // AI badge
            Text.fontWeight(FontWeight.Bold);
            // AI badge
            Text.fontColor('#DB0011');
            // AI badge
            Text.padding({ left: 5, right: 5, top: 2, bottom: 2 });
            // AI badge
            Text.borderRadius(6);
            // AI badge
            Text.backgroundColor('#FFEDED');
        }, Text);
        // AI badge
        Text.pop();
        Row.pop();
        // Search bar row with AI badge
        Row.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class SDUIComboQuickAccess extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.__activeTab = new ObservedPropertySimplePU(0, this, "activeTab");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SDUIComboQuickAccess_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
        if (params.activeTab !== undefined) {
            this.activeTab = params.activeTab;
        }
    }
    updateStateVars(params: SDUIComboQuickAccess_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__activeTab.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__activeTab.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    private __activeTab: ObservedPropertySimplePU<number>;
    get activeTab() {
        return this.__activeTab.get();
    }
    set activeTab(newValue: number) {
        this.__activeTab.set(newValue);
    }
    private tabs(): string[] {
        const raw: any[] = this.props['tabs'] as any[];
        if (raw && raw.length > 0) {
            return raw.map((t: any) => (t as Record<string, string>)['label'] ?? '');
        }
        return ['My pick', 'Invest', 'Global', 'HK Daily'];
    }
    private row1(): any[] { return this.props['row1Items'] as any[] ?? [] as any[]; }
    private row2(): any[] { return this.props['row2Items'] as any[] ?? [] as any[]; }
    // Map BFF icon identifier strings to display emojis
    private resolveIcon(id: string): string {
        if (id === 'account')
            return '👤';
        if (id === 'transfer')
            return '🌐';
        if (id === 'fx')
            return '💱';
        if (id === 'stock')
            return '📈';
        if (id === 'deposit')
            return '⏰';
        if (id === 'holding')
            return '📊';
        if (id === 'safe')
            return '💰';
        if (id === 'fps')
            return '↔️';
        if (id === 'scan')
            return '📷';
        if (id === 'all')
            return '⊞';
        return id; // fallback: render as-is (emoji or unknown)
    }
    // Shorten long BFF labels to fit under icon
    private shortLabel(label: string): string {
        if (label === 'Account overview')
            return 'Account';
        if (label === 'Transfer Globally')
            return 'Transfer';
        if (label === 'Foreign exchange')
            return 'FX';
        if (label === 'Trade stock')
            return 'Stock';
        if (label === 'Time deposit')
            return 'Deposit';
        if (label === 'My holding details')
            return 'Holding';
        if (label === 'Money safe')
            return 'Safe';
        if (label === 'Local transfer/FPS')
            return 'FPS';
        if (label === 'Scan to pay')
            return 'Scan';
        if (label === 'All product & services')
            return 'All';
        return label;
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Tab bar — pill/capsule style (active=red, inactive=gray)
            Scroll.create();
            // Tab bar — pill/capsule style (active=red, inactive=gray)
            Scroll.scrollable(ScrollDirection.Horizontal);
            // Tab bar — pill/capsule style (active=red, inactive=gray)
            Scroll.scrollBar(BarState.Off);
            // Tab bar — pill/capsule style (active=red, inactive=gray)
            Scroll.width('100%');
            // Tab bar — pill/capsule style (active=red, inactive=gray)
            Scroll.backgroundColor(Hive.Color.brandWhite);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 8 });
            Row.padding({ left: 16, right: 16, top: 10, bottom: 10 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = (_item, idx: number) => {
                const tab = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(tab);
                    Text.fontSize(13);
                    Text.fontWeight(this.activeTab === idx ? FontWeight.Bold : FontWeight.Normal);
                    Text.fontColor(this.activeTab === idx ? Hive.Color.brandWhite : Hive.Color.n700);
                    Text.padding({ left: 16, right: 16, top: 7, bottom: 7 });
                    Text.borderRadius(18);
                    Text.backgroundColor(this.activeTab === idx ? '#DB0011' : '#E4E4E4');
                    Text.onClick(() => { this.activeTab = idx; });
                }, Text);
                Text.pop();
            };
            this.forEachUpdateFunction(elmtId, this.tabs(), forEachItemGenFunction, undefined, true, false);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        // Tab bar — pill/capsule style (active=red, inactive=gray)
        Scroll.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Row 1 — 5 icons
            Row.create({ space: 0 });
            // Row 1 — 5 icons
            Row.width('100%');
            // Row 1 — 5 icons
            Row.backgroundColor(Hive.Color.brandWhite);
            // Row 1 — 5 icons
            Row.padding({ left: 8, right: 8 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const raw = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 5 });
                    Column.layoutWeight(1);
                    Column.alignItems(HorizontalAlign.Center);
                    Column.padding({ top: 10 });
                    Column.onClick(() => {
                        SensorDataClient.quickAccessTapped((raw as Record<string, string>)['label'] ?? '', (raw as Record<string, string>)['deepLink'] ?? '');
                    });
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(this.resolveIcon((raw as Record<string, string>)['icon'] ?? ''));
                    Text.fontSize(22);
                    Text.width(48);
                    Text.height(48);
                    Text.textAlign(TextAlign.Center);
                    Text.borderRadius(14);
                    Text.backgroundColor(Hive.Color.n100);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(this.shortLabel((raw as Record<string, string>)['label'] ?? ''));
                    Text.fontSize(10);
                    Text.fontColor(Hive.Color.n700);
                    Text.textAlign(TextAlign.Center);
                }, Text);
                Text.pop();
                Column.pop();
            };
            this.forEachUpdateFunction(elmtId, this.row1(), forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        // Row 1 — 5 icons
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Row 2 — 5 icons
            Row.create({ space: 0 });
            // Row 2 — 5 icons
            Row.width('100%');
            // Row 2 — 5 icons
            Row.backgroundColor(Hive.Color.brandWhite);
            // Row 2 — 5 icons
            Row.padding({ left: 8, right: 8 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const raw = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 5 });
                    Column.layoutWeight(1);
                    Column.alignItems(HorizontalAlign.Center);
                    Column.padding({ bottom: 10 });
                    Column.onClick(() => {
                        SensorDataClient.quickAccessTapped((raw as Record<string, string>)['label'] ?? '', (raw as Record<string, string>)['deepLink'] ?? '');
                    });
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(this.resolveIcon((raw as Record<string, string>)['icon'] ?? ''));
                    Text.fontSize(22);
                    Text.width(48);
                    Text.height(48);
                    Text.textAlign(TextAlign.Center);
                    Text.borderRadius(14);
                    Text.backgroundColor(Hive.Color.n100);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(this.shortLabel((raw as Record<string, string>)['label'] ?? ''));
                    Text.fontSize(10);
                    Text.fontColor(Hive.Color.n700);
                    Text.textAlign(TextAlign.Center);
                }, Text);
                Text.pop();
                Column.pop();
            };
            this.forEachUpdateFunction(elmtId, this.row2(), forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        // Row 2 — 5 icons
        Row.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class SDUICardActivationBanner extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SDUICardActivationBanner_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
    }
    updateStateVars(params: SDUICardActivationBanner_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    private message(): string { return this.props['message'] as string ?? 'Your card needs to be activated'; }
    private ctaLabel(): string { return this.props['ctaLabel'] as string ?? 'Activate now'; }
    private deepLink(): string { return this.props['deepLink'] as string ?? 'hsbc://cards/activate'; }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 10 });
            Row.width('100%');
            Row.padding({ left: 16, right: 16, top: 10, bottom: 10 });
            Row.backgroundColor('#FFF5F5');
            Row.borderWidth({ bottom: 1 });
            Row.borderColor(Hive.Color.n100);
            Row.alignItems(VerticalAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('💳');
            Text.fontSize(18);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.message());
            Text.fontSize(13);
            Text.fontColor(Hive.Color.n900);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.ctaLabel());
            Text.fontSize(12);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor('#DB0011');
            Text.onClick(() => {
                SensorDataClient.sliceTapped('CARD_ACTIVATION_BANNER', this.props['instanceId'] as string ?? 'slice-card-activation', this.ctaLabel(), this.deepLink());
            });
        }, Text);
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class SDUIQuestBanner extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SDUIQuestBanner_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
    }
    updateStateVars(params: SDUIQuestBanner_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    private questTitle(): string { return this.props['questTitle'] as string ?? 'Getting started'; }
    private desc(): string { return this.props['description'] as string ?? 'Complete setup to unlock your full Premier benefits'; }
    private ctaLabel(): string { return this.props['ctaLabel'] as string ?? 'Continue'; }
    private deepLink(): string { return this.props['deepLink'] as string ?? 'hsbc://onboarding/checklist'; }
    private progress(): number { return this.props['progress'] as number ?? 40; }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.width('100%');
            Row.padding({ left: 16, right: 16, top: 14, bottom: 14 });
            Row.margin({ top: 8, bottom: 0 });
            Row.backgroundColor(Hive.Color.brandWhite);
            Row.alignItems(VerticalAlign.Top);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // HSBC hexagon icon
            Text.create('🏦');
            // HSBC hexagon icon
            Text.fontSize(28);
            // HSBC hexagon icon
            Text.width(52);
            // HSBC hexagon icon
            Text.height(52);
            // HSBC hexagon icon
            Text.textAlign(TextAlign.Center);
            // HSBC hexagon icon
            Text.borderRadius(14);
            // HSBC hexagon icon
            Text.backgroundColor('#FEF2F2');
        }, Text);
        // HSBC hexagon icon
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 6 });
            Column.layoutWeight(1);
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.questTitle());
            Text.fontSize(14);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.desc());
            Text.fontSize(11);
            Text.fontColor(Hive.Color.n500);
            Text.maxLines(2);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Progress bar
            Stack.create({ alignContent: Alignment.Start });
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.height(4);
            Row.borderRadius(2);
            Row.backgroundColor(Hive.Color.n100);
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width(`${this.progress()}%`);
            Row.height(4);
            Row.borderRadius(2);
            Row.backgroundColor('#DB0011');
        }, Row);
        Row.pop();
        // Progress bar
        Stack.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel(this.ctaLabel());
            Button.height(30);
            Button.padding({ left: 16, right: 16 });
            Button.borderRadius(14);
            Button.backgroundColor('#DB0011');
            Button.fontColor(Hive.Color.brandWhite);
            Button.fontSize(11);
            Button.fontWeight(FontWeight.Bold);
            Button.onClick(() => {
                SensorDataClient.sliceTapped('QUEST_BANNER', this.props['instanceId'] as string ?? 'slice-quest', this.ctaLabel(), this.deepLink());
            });
        }, Button);
        Button.pop();
        Column.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class SDUIFeatureProduct extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.__activeTab = new ObservedPropertySimplePU(0, this, "activeTab");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SDUIFeatureProduct_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
        if (params.activeTab !== undefined) {
            this.activeTab = params.activeTab;
        }
    }
    updateStateVars(params: SDUIFeatureProduct_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__activeTab.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__activeTab.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    private __activeTab: ObservedPropertySimplePU<number>;
    get activeTab() {
        return this.__activeTab.get();
    }
    set activeTab(newValue: number) {
        this.__activeTab.set(newValue);
    }
    private sectionTitle(): string { return this.props['sectionTitle'] as string ?? 'Feature product'; }
    private tabs(): string[] {
        const raw: Array<string> = this.props['tabs'] as Array<string>;
        if (raw && raw.length > 0) {
            return raw;
        }
        return ['All', 'Equity', 'Bond', 'Multi-Asset'];
    }
    private funds(): any[] { return this.props['funds'] as any[] ?? [] as any[]; }
    private fundTags(fund: any): Array<string> {
        const tags: Array<string> = (fund as Record<string, any>)['tags'] as Array<string>;
        return tags ?? [];
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.margin({ top: 8 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Section header
            Row.create();
            // Section header
            Row.width('100%');
            // Section header
            Row.padding({ left: 16, right: 16, top: 14, bottom: 8 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.sectionTitle());
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('More ›');
            Text.fontSize(12);
            Text.fontColor('#DB0011');
        }, Text);
        Text.pop();
        // Section header
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Sub-tabs
            Scroll.create();
            // Sub-tabs
            Scroll.scrollable(ScrollDirection.Horizontal);
            // Sub-tabs
            Scroll.scrollBar(BarState.Off);
            // Sub-tabs
            Scroll.width('100%');
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 8 });
            Row.padding({ left: 16, right: 16, bottom: 8 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = (_item, idx: number) => {
                const tab = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(tab);
                    Text.fontSize(12);
                    Text.fontWeight(this.activeTab === idx ? FontWeight.Bold : FontWeight.Normal);
                    Text.fontColor(this.activeTab === idx ? Hive.Color.brandWhite : Hive.Color.n700);
                    Text.padding({ left: 14, right: 14, top: 6, bottom: 6 });
                    Text.borderRadius(16);
                    Text.backgroundColor(this.activeTab === idx ? '#DB0011' : Hive.Color.n100);
                    Text.onClick(() => { this.activeTab = idx; });
                }, Text);
                Text.pop();
            };
            this.forEachUpdateFunction(elmtId, this.tabs(), forEachItemGenFunction, undefined, true, false);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        // Sub-tabs
        Scroll.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Fund rows
            Column.create({ space: 0 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = (_item, index: number) => {
                const raw = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create({ space: 12 });
                    Row.width('100%');
                    Row.padding({ left: 16, right: 16, top: 12, bottom: 12 });
                    Row.onClick(() => {
                        SensorDataClient.wealthProductTapped((raw as Record<string, string>)['name'] ?? '', (raw as Record<string, string>)['id'] ?? '');
                    });
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 4 });
                    Column.layoutWeight(1);
                    Column.alignItems(HorizontalAlign.Start);
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create((raw as Record<string, string>)['name'] ?? '');
                    Text.fontSize(13);
                    Text.fontWeight(FontWeight.Medium);
                    Text.fontColor(Hive.Color.n900);
                    Text.maxLines(2);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create((raw as Record<string, string>)['code'] ?? '');
                    Text.fontSize(11);
                    Text.fontColor(Hive.Color.n500);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    // Tags
                    Row.create({ space: 4 });
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    ForEach.create();
                    const forEachItemGenFunction = _item => {
                        const tag = _item;
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(tag);
                            Text.fontSize(9);
                            Text.fontColor('#DB0011');
                            Text.padding({ left: 6, right: 6, top: 2, bottom: 2 });
                            Text.borderRadius(8);
                            Text.backgroundColor('#FEF2F2');
                        }, Text);
                        Text.pop();
                    };
                    this.forEachUpdateFunction(elmtId, this.fundTags(raw), forEachItemGenFunction);
                }, ForEach);
                ForEach.pop();
                // Tags
                Row.pop();
                Column.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 2 });
                    Column.alignItems(HorizontalAlign.End);
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create((raw as Record<string, string>)['return1Y'] ?? '');
                    Text.fontSize(18);
                    Text.fontWeight(FontWeight.Bold);
                    Text.fontColor((raw as Record<string, string>)['return1Y']?.startsWith('+') ? '#16A34A' : '#DC2626');
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create('1Y return');
                    Text.fontSize(9);
                    Text.fontColor(Hive.Color.n400);
                }, Text);
                Text.pop();
                Column.pop();
                Row.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    If.create();
                    if (index < this.funds().length - 1) {
                        this.ifElseBranchUpdateFunction(0, () => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Divider.create();
                                Divider.color(Hive.Color.n100);
                                Divider.margin({ left: 16, right: 16 });
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
            this.forEachUpdateFunction(elmtId, this.funds(), forEachItemGenFunction, undefined, true, false);
        }, ForEach);
        ForEach.pop();
        // Fund rows
        Column.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class SDUIWealthStudioCarousel extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.__playingUrl = new ObservedPropertySimplePU('', this, "playingUrl");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SDUIWealthStudioCarousel_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
        if (params.playingUrl !== undefined) {
            this.playingUrl = params.playingUrl;
        }
    }
    updateStateVars(params: SDUIWealthStudioCarousel_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__playingUrl.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__playingUrl.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    private __playingUrl: ObservedPropertySimplePU<string>;
    get playingUrl() {
        return this.__playingUrl.get();
    }
    set playingUrl(newValue: string) {
        this.__playingUrl.set(newValue);
    }
    private sectionTitle(): string { return this.props['sectionTitle'] as string ?? 'Premier Elite Wealth Studio'; }
    private moreLabel(): string { return this.props['moreLabel'] as string ?? 'View all'; }
    private items(): any[] { return this.props['items'] as any[] ?? [] as any[]; }
    private numColumns(): number {
        const asNum: number = this.props['numColumns'] as number;
        if (!isNaN(asNum))
            return Math.max(1, asNum);
        const asStr: string = this.props['numColumns'] as string;
        if (asStr) {
            const n: number = parseInt(asStr, 10);
            return isNaN(n) ? 1 : Math.max(1, n);
        }
        return 1;
    }
    private resolveVideoUrl(raw: string): string {
        return raw.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create({ alignContent: Alignment.TopStart });
            Stack.width('100%');
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.margin({ top: 8 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.padding({ left: 16, right: 16, top: 14, bottom: 10 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.sectionTitle());
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.moreLabel()} ›`);
            Text.fontSize(12);
            Text.fontColor('#DB0011');
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.numColumns() > 1) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // Grid mode — wrap items in rows of numColumns
                        Flex.create({ wrap: FlexWrap.Wrap, direction: FlexDirection.Row, alignItems: ItemAlign.Start });
                        // Grid mode — wrap items in rows of numColumns
                        Flex.padding({ left: 16, right: 16, bottom: 14 });
                        // Grid mode — wrap items in rows of numColumns
                        Flex.width('100%');
                    }, Flex);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const raw = _item;
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Column.create({ space: 0 });
                                Column.borderRadius(10);
                                Column.clip(true);
                                Column.shadow({ radius: 4, color: '#14000000', offsetX: 0, offsetY: 2 });
                                Column.width(`${Math.floor(100 / this.numColumns()) - 2}%`);
                                Column.margin({ right: 8, bottom: 10 });
                                Column.onClick(() => {
                                    SensorDataClient.wealthStudioTapped((raw as Record<string, string>)['title'] ?? '', (raw as Record<string, string>)['id'] ?? '');
                                    const vUrl: string = (raw as Record<string, string>)['videoUrl'] ?? '';
                                    if (vUrl) {
                                        this.playingUrl = this.resolveVideoUrl(vUrl);
                                    }
                                });
                            }, Column);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Stack.create({ alignContent: Alignment.BottomStart });
                            }, Stack);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create('📹');
                                Text.fontSize(32);
                                Text.width('100%');
                                Text.height(100);
                                Text.textAlign(TextAlign.Center);
                                Text.backgroundColor((raw as Record<string, string>)['imageColor'] ?? Hive.Color.n700);
                                Text.borderRadius({ topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 });
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create('▶');
                                Text.fontSize(20);
                                Text.fontColor(Hive.Color.brandWhite);
                                Text.width(36);
                                Text.height(36);
                                Text.textAlign(TextAlign.Center);
                                Text.borderRadius(18);
                                Text.backgroundColor('#80000000');
                                Text.position({ x: '38%', y: 32 });
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                If.create();
                                if ((raw as Record<string, string>)['liveBadge']) {
                                    this.ifElseBranchUpdateFunction(0, () => {
                                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                                            Text.create((raw as Record<string, string>)['liveBadge'] ?? '');
                                            Text.fontSize(8);
                                            Text.fontWeight(FontWeight.Bold);
                                            Text.fontColor(Hive.Color.brandWhite);
                                            Text.padding({ left: 6, right: 6, top: 2, bottom: 2 });
                                            Text.borderRadius(3);
                                            Text.backgroundColor('#DB0011');
                                            Text.margin({ left: 8, bottom: 8 });
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
                            Stack.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Column.create({ space: 4 });
                                Column.alignItems(HorizontalAlign.Start);
                                Column.width('100%');
                                Column.padding({ left: 8, right: 8, top: 8, bottom: 8 });
                                Column.backgroundColor(Hive.Color.brandWhite);
                                Column.borderRadius({ topLeft: 0, topRight: 0, bottomLeft: 10, bottomRight: 10 });
                            }, Column);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create((raw as Record<string, string>)['episodeLabel'] ?? '');
                                Text.fontSize(9);
                                Text.fontColor(Hive.Color.n400);
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create((raw as Record<string, string>)['title'] ?? '');
                                Text.fontSize(11);
                                Text.fontWeight(FontWeight.Bold);
                                Text.fontColor(Hive.Color.n900);
                                Text.maxLines(2);
                                Text.width('100%');
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                If.create();
                                if ((raw as Record<string, string>)['ctaLabel']) {
                                    this.ifElseBranchUpdateFunction(0, () => {
                                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                                            Button.createWithLabel((raw as Record<string, string>)['ctaLabel'] ?? 'Watch now');
                                            Button.height(28);
                                            Button.width('100%');
                                            Button.backgroundColor('#DB0011');
                                            Button.fontColor(Hive.Color.brandWhite);
                                            Button.fontSize(10);
                                            Button.fontWeight(FontWeight.Bold);
                                            Button.borderRadius(14);
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
                            Column.pop();
                        };
                        this.forEachUpdateFunction(elmtId, this.items(), forEachItemGenFunction);
                    }, ForEach);
                    ForEach.pop();
                    // Grid mode — wrap items in rows of numColumns
                    Flex.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Scroll.create();
                        Scroll.scrollable(ScrollDirection.Horizontal);
                        Scroll.scrollBar(BarState.Off);
                        Scroll.width('100%');
                    }, Scroll);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 12 });
                        Row.padding({ left: 16, right: 16, bottom: 14 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const raw = _item;
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Column.create({ space: 0 });
                                Column.borderRadius(10);
                                Column.clip(true);
                                Column.shadow({ radius: 4, color: '#14000000', offsetX: 0, offsetY: 2 });
                                Column.onClick(() => {
                                    SensorDataClient.wealthStudioTapped((raw as Record<string, string>)['title'] ?? '', (raw as Record<string, string>)['id'] ?? '');
                                    const vUrl: string = (raw as Record<string, string>)['videoUrl'] ?? '';
                                    if (vUrl) {
                                        this.playingUrl = this.resolveVideoUrl(vUrl);
                                    }
                                });
                            }, Column);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                // Image area — fixed 100px height
                                Stack.create({ alignContent: Alignment.BottomStart });
                            }, Stack);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create('📹');
                                Text.fontSize(32);
                                Text.width(180);
                                Text.height(100);
                                Text.textAlign(TextAlign.Center);
                                Text.backgroundColor((raw as Record<string, string>)['imageColor'] ?? Hive.Color.n700);
                                Text.borderRadius({ topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 });
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create('▶');
                                Text.fontSize(20);
                                Text.fontColor(Hive.Color.brandWhite);
                                Text.width(36);
                                Text.height(36);
                                Text.textAlign(TextAlign.Center);
                                Text.borderRadius(18);
                                Text.backgroundColor('#80000000');
                                Text.position({ x: 72, y: 32 });
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create((raw as Record<string, string>)['liveBadge'] ?? '');
                                Text.fontSize(8);
                                Text.fontWeight(FontWeight.Bold);
                                Text.fontColor(Hive.Color.brandWhite);
                                Text.padding({ left: 6, right: 6, top: 2, bottom: 2 });
                                Text.borderRadius(3);
                                Text.backgroundColor('#DB0011');
                                Text.margin({ left: 8, bottom: 8 });
                            }, Text);
                            Text.pop();
                            // Image area — fixed 100px height
                            Stack.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                // Text area — fixed 72px height so cards align
                                Column.create({ space: 4 });
                                // Text area — fixed 72px height so cards align
                                Column.alignItems(HorizontalAlign.Start);
                                // Text area — fixed 72px height so cards align
                                Column.width(180);
                                // Text area — fixed 72px height so cards align
                                Column.height(72);
                                // Text area — fixed 72px height so cards align
                                Column.padding({ left: 10, right: 10, top: 8, bottom: 8 });
                                // Text area — fixed 72px height so cards align
                                Column.backgroundColor(Hive.Color.brandWhite);
                                // Text area — fixed 72px height so cards align
                                Column.borderRadius({ topLeft: 0, topRight: 0, bottomLeft: 10, bottomRight: 10 });
                            }, Column);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create((raw as Record<string, string>)['episodeLabel'] ?? '');
                                Text.fontSize(9);
                                Text.fontColor(Hive.Color.n400);
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create((raw as Record<string, string>)['title'] ?? '');
                                Text.fontSize(11);
                                Text.fontWeight(FontWeight.Bold);
                                Text.fontColor(Hive.Color.n900);
                                Text.maxLines(2);
                                Text.width(180);
                            }, Text);
                            Text.pop();
                            // Text area — fixed 72px height so cards align
                            Column.pop();
                            Column.pop();
                        };
                        this.forEachUpdateFunction(elmtId, this.items(), forEachItemGenFunction);
                    }, ForEach);
                    ForEach.pop();
                    Row.pop();
                    Scroll.pop();
                });
            }
        }, If);
        If.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // Full-screen video overlay
            if (this.playingUrl !== '') {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.width('100%');
                        Column.backgroundColor(Color.Black);
                        Column.position({ x: 0, y: 0 });
                        Column.zIndex(100);
                        Column.onClick(() => { this.playingUrl = ''; });
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Stack.create({ alignContent: Alignment.TopEnd });
                    }, Stack);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Video.create({ src: this.playingUrl });
                        Video.width('100%');
                        Video.aspectRatio(16 / 9);
                        Video.autoPlay(true);
                        Video.controls(true);
                    }, Video);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('✕');
                        Text.fontSize(22);
                        Text.fontColor(Color.White);
                        Text.width(40);
                        Text.height(40);
                        Text.textAlign(TextAlign.Center);
                        Text.borderRadius(20);
                        Text.backgroundColor('#80000000');
                        Text.margin({ top: 8, right: 8 });
                        Text.onClick(() => { this.playingUrl = ''; });
                    }, Text);
                    Text.pop();
                    Stack.pop();
                    Column.pop();
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
class SDUIGuidesInsights extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SDUIGuidesInsights_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
    }
    updateStateVars(params: SDUIGuidesInsights_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    private sectionTitle(): string { return this.props['sectionTitle'] as string ?? 'Guides and insights'; }
    private moreLabel(): string { return this.props['moreLabel'] as string ?? 'View all'; }
    private items(): any[] { return this.props['items'] as any[] ?? [] as any[]; }
    private numColumns(): number {
        const asNum: number = this.props['numColumns'] as number;
        if (!isNaN(asNum))
            return Math.max(1, asNum);
        const asStr: string = this.props['numColumns'] as string;
        if (asStr) {
            const n: number = parseInt(asStr, 10);
            return isNaN(n) ? 1 : Math.max(1, n);
        }
        return 1;
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.margin({ top: 8 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.padding({ left: 16, right: 16, top: 14, bottom: 10 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.sectionTitle());
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.moreLabel()} ›`);
            Text.fontSize(12);
            Text.fontColor('#DB0011');
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.numColumns() > 1) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Flex.create({ wrap: FlexWrap.Wrap, direction: FlexDirection.Row, alignItems: ItemAlign.Start });
                        Flex.padding({ left: 16, right: 16, bottom: 14 });
                        Flex.width('100%');
                    }, Flex);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const raw = _item;
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Column.create({ space: 0 });
                                Column.borderRadius(10);
                                Column.clip(true);
                                Column.shadow({ radius: 4, color: '#14000000', offsetX: 0, offsetY: 2 });
                                Column.width(`${Math.floor(100 / this.numColumns()) - 2}%`);
                                Column.margin({ right: 8, bottom: 10 });
                                Column.onClick(() => {
                                    SensorDataClient.guidesTapped((raw as Record<string, string>)['title'] ?? '', (raw as Record<string, string>)['id'] ?? '');
                                });
                            }, Column);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create('📖');
                                Text.fontSize(36);
                                Text.width('100%');
                                Text.height(90);
                                Text.textAlign(TextAlign.Center);
                                Text.backgroundColor((raw as Record<string, string>)['imageColor'] ?? Hive.Color.n100);
                                Text.borderRadius({ topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 });
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Column.create({ space: 4 });
                                Column.alignItems(HorizontalAlign.Start);
                                Column.width('100%');
                                Column.padding({ left: 8, right: 8, top: 8, bottom: 8 });
                                Column.backgroundColor(Hive.Color.brandWhite);
                                Column.borderRadius({ topLeft: 0, topRight: 0, bottomLeft: 10, bottomRight: 10 });
                            }, Column);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create((raw as Record<string, string>)['title'] ?? '');
                                Text.fontSize(11);
                                Text.fontWeight(FontWeight.Medium);
                                Text.fontColor(Hive.Color.n900);
                                Text.maxLines(3);
                                Text.width('100%');
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                If.create();
                                if ((raw as Record<string, string>)['description']) {
                                    this.ifElseBranchUpdateFunction(0, () => {
                                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                                            Text.create((raw as Record<string, string>)['description'] ?? '');
                                            Text.fontSize(10);
                                            Text.fontColor(Hive.Color.n500);
                                            Text.maxLines(2);
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
                                Text.create((raw as Record<string, string>)['date'] ?? '');
                                Text.fontSize(9);
                                Text.fontColor(Hive.Color.n400);
                            }, Text);
                            Text.pop();
                            Column.pop();
                            Column.pop();
                        };
                        this.forEachUpdateFunction(elmtId, this.items(), forEachItemGenFunction);
                    }, ForEach);
                    ForEach.pop();
                    Flex.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Scroll.create();
                        Scroll.scrollable(ScrollDirection.Horizontal);
                        Scroll.scrollBar(BarState.Off);
                        Scroll.width('100%');
                    }, Scroll);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 12 });
                        Row.padding({ left: 16, right: 16, bottom: 14 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const raw = _item;
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Column.create({ space: 0 });
                                Column.borderRadius(10);
                                Column.clip(true);
                                Column.shadow({ radius: 4, color: '#14000000', offsetX: 0, offsetY: 2 });
                                Column.onClick(() => {
                                    SensorDataClient.guidesTapped((raw as Record<string, string>)['title'] ?? '', (raw as Record<string, string>)['id'] ?? '');
                                });
                            }, Column);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                // Fixed-height image area
                                Text.create('📖');
                                // Fixed-height image area
                                Text.fontSize(36);
                                // Fixed-height image area
                                Text.width(160);
                                // Fixed-height image area
                                Text.height(90);
                                // Fixed-height image area
                                Text.textAlign(TextAlign.Center);
                                // Fixed-height image area
                                Text.backgroundColor((raw as Record<string, string>)['imageColor'] ?? Hive.Color.n100);
                                // Fixed-height image area
                                Text.borderRadius({ topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 });
                            }, Text);
                            // Fixed-height image area
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                // Fixed-height text area so cards stay same height
                                Column.create({ space: 4 });
                                // Fixed-height text area so cards stay same height
                                Column.alignItems(HorizontalAlign.Start);
                                // Fixed-height text area so cards stay same height
                                Column.width(160);
                                // Fixed-height text area so cards stay same height
                                Column.height(72);
                                // Fixed-height text area so cards stay same height
                                Column.padding({ left: 8, right: 8, top: 8, bottom: 8 });
                                // Fixed-height text area so cards stay same height
                                Column.backgroundColor(Hive.Color.brandWhite);
                                // Fixed-height text area so cards stay same height
                                Column.borderRadius({ topLeft: 0, topRight: 0, bottomLeft: 10, bottomRight: 10 });
                            }, Column);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create((raw as Record<string, string>)['title'] ?? '');
                                Text.fontSize(11);
                                Text.fontWeight(FontWeight.Medium);
                                Text.fontColor(Hive.Color.n900);
                                Text.maxLines(3);
                                Text.width(160);
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                If.create();
                                if ((raw as Record<string, string>)['description']) {
                                    this.ifElseBranchUpdateFunction(0, () => {
                                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                                            Text.create((raw as Record<string, string>)['description'] ?? '');
                                            Text.fontSize(10);
                                            Text.fontColor(Hive.Color.n500);
                                            Text.maxLines(2);
                                            Text.width(160);
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
                                Text.create((raw as Record<string, string>)['date'] ?? '');
                                Text.fontSize(9);
                                Text.fontColor(Hive.Color.n400);
                            }, Text);
                            Text.pop();
                            // Fixed-height text area so cards stay same height
                            Column.pop();
                            Column.pop();
                        };
                        this.forEachUpdateFunction(elmtId, this.items(), forEachItemGenFunction);
                    }, ForEach);
                    ForEach.pop();
                    Row.pop();
                    Scroll.pop();
                });
            }
        }, If);
        If.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class SDUIFXWatchlist extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SDUIFXWatchlist_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
    }
    updateStateVars(params: SDUIFXWatchlist_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    private sectionTitle(): string { return this.props['sectionTitle'] as string ?? 'FX watchlist'; }
    private tierBadge(): string { return this.props['tierBadge'] as string ?? 'Premier'; }
    private moreLabel(): string { return this.props['moreLabel'] as string ?? 'View all'; }
    private pairs(): any[] { return this.props['pairs'] as any[] ?? [] as any[]; }
    // BFF shape: { pair: "USD/JPY", sellRate: "148.44", buyRate: "148.12", sellLabel, buyLabel }
    private pairLabel(raw: any): string {
        const p = (raw as Record<string, string>)['pair'] ?? '';
        return p.replace('/', ' / ');
    }
    private pairSellRate(raw: any): string {
        const r = raw as Record<string, string>;
        return r['sellRate'] ?? r['rate'] ?? '';
    }
    private pairBuyRate(raw: any): string {
        const r = raw as Record<string, string>;
        return r['buyRate'] ?? r['change'] ?? '';
    }
    private pairId(raw: any): string {
        return (raw as Record<string, string>)['pair'] ?? '';
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.margin({ top: 8 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Header row
            Row.create({ space: 8 });
            // Header row
            Row.width('100%');
            // Header row
            Row.padding({ left: 16, right: 16, top: 14, bottom: 8 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.sectionTitle());
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.tierBadge());
            Text.fontSize(9);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor('#DB0011');
            Text.padding({ left: 8, right: 8, top: 3, bottom: 3 });
            Text.borderRadius(10);
            Text.backgroundColor('#FEF2F2');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.moreLabel()} ›`);
            Text.fontSize(12);
            Text.fontColor('#DB0011');
        }, Text);
        Text.pop();
        // Header row
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Column headers — match BFF field names
            Row.create();
            // Column headers — match BFF field names
            Row.width('100%');
            // Column headers — match BFF field names
            Row.padding({ left: 16, right: 16, bottom: 6 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Currency pair');
            Text.fontSize(11);
            Text.fontColor(Hive.Color.n400);
            Text.layoutWeight(2);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Sell');
            Text.fontSize(11);
            Text.fontColor(Hive.Color.n400);
            Text.layoutWeight(1);
            Text.textAlign(TextAlign.End);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Buy');
            Text.fontSize(11);
            Text.fontColor(Hive.Color.n400);
            Text.layoutWeight(1);
            Text.textAlign(TextAlign.End);
        }, Text);
        Text.pop();
        // Column headers — match BFF field names
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.color(Hive.Color.n100);
            Divider.margin({ left: 16, right: 16 });
        }, Divider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // FX rows — BFF uses 'pair', 'sellRate', 'buyRate'
            ForEach.create();
            const forEachItemGenFunction = (_item, index: number) => {
                const raw = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create({ space: 0 });
                    Row.width('100%');
                    Row.padding({ left: 16, right: 16, top: 10, bottom: 10 });
                    Row.onClick(() => {
                        SensorDataClient.track('fx_pair_tap', 'Wealth', 'fx_pair_tapped', this.pairId(raw), 'fx_watchlist', 'wealth_hub');
                    });
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(this.pairLabel(raw));
                    Text.fontSize(13);
                    Text.fontWeight(FontWeight.Medium);
                    Text.fontColor(Hive.Color.n900);
                    Text.layoutWeight(2);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(this.pairSellRate(raw));
                    Text.fontSize(13);
                    Text.fontColor(Hive.Color.n900);
                    Text.layoutWeight(1);
                    Text.textAlign(TextAlign.End);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(this.pairBuyRate(raw));
                    Text.fontSize(13);
                    Text.fontColor(Hive.Color.n500);
                    Text.layoutWeight(1);
                    Text.textAlign(TextAlign.End);
                }, Text);
                Text.pop();
                Row.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    If.create();
                    if (index < this.pairs().length - 1) {
                        this.ifElseBranchUpdateFunction(0, () => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Divider.create();
                                Divider.color(Hive.Color.n100);
                                Divider.margin({ left: 16, right: 16 });
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
            this.forEachUpdateFunction(elmtId, this.pairs(), forEachItemGenFunction, undefined, true, false);
        }, ForEach);
        // FX rows — BFF uses 'pair', 'sellRate', 'buyRate'
        ForEach.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.height(12);
        }, Blank);
        Blank.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class SDUIDiscoverMore extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SDUIDiscoverMore_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
    }
    updateStateVars(params: SDUIDiscoverMore_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    private sectionTitle(): string { return this.props['sectionTitle'] as string ?? 'Discover more'; }
    private items(): any[] { return this.props['items'] as any[] ?? [] as any[]; }
    private numColumns(): number {
        const asNum: number = this.props['numColumns'] as number;
        if (!isNaN(asNum))
            return Math.max(1, asNum);
        const asStr: string = this.props['numColumns'] as string;
        if (asStr) {
            const n: number = parseInt(asStr, 10);
            return isNaN(n) ? 1 : Math.max(1, n);
        }
        return 1;
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.n50);
            Column.margin({ top: 8 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.padding({ left: 16, right: 16, top: 14, bottom: 10 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.sectionTitle());
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.numColumns() > 1) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Flex.create({ wrap: FlexWrap.Wrap, direction: FlexDirection.Row, alignItems: ItemAlign.Start });
                        Flex.padding({ left: 16, right: 16, bottom: 14 });
                        Flex.width('100%');
                    }, Flex);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const raw = _item;
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Column.create({ space: 0 });
                                Column.borderRadius(12);
                                Column.clip(true);
                                Column.backgroundColor(Hive.Color.brandWhite);
                                Column.shadow({ radius: 4, color: '#14000000', offsetX: 0, offsetY: 2 });
                                Column.width(`${Math.floor(100 / this.numColumns()) - 2}%`);
                                Column.margin({ right: 8, bottom: 10 });
                                Column.onClick(() => {
                                    SensorDataClient.discoverMoreTapped((raw as Record<string, string>)['title'] ?? '', (raw as Record<string, string>)['tag'] ?? '');
                                });
                            }, Column);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Stack.create({ alignContent: Alignment.TopStart });
                            }, Stack);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create('🏦');
                                Text.fontSize(40);
                                Text.width('100%');
                                Text.height(110);
                                Text.textAlign(TextAlign.Center);
                                Text.backgroundColor((raw as Record<string, string>)['imageColor'] ?? Hive.Color.n700);
                                Text.borderRadius({ topLeft: 12, topRight: 12, bottomLeft: 0, bottomRight: 0 });
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create((raw as Record<string, string>)['tag'] ?? '');
                                Text.fontSize(9);
                                Text.fontWeight(FontWeight.Bold);
                                Text.fontColor(Hive.Color.brandWhite);
                                Text.padding({ left: 8, right: 8, top: 4, bottom: 4 });
                                Text.borderRadius(10);
                                Text.backgroundColor((raw as Record<string, string>)['tagColor'] ?? '#DB0011');
                                Text.margin({ left: 10, top: 10 });
                            }, Text);
                            Text.pop();
                            Stack.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Column.create({ space: 4 });
                                Column.alignItems(HorizontalAlign.Start);
                                Column.width('100%');
                                Column.padding({ left: 10, right: 10, top: 8, bottom: 8 });
                                Column.backgroundColor(Hive.Color.brandWhite);
                                Column.borderRadius({ topLeft: 0, topRight: 0, bottomLeft: 12, bottomRight: 12 });
                            }, Column);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create((raw as Record<string, string>)['title'] ?? '');
                                Text.fontSize(12);
                                Text.fontWeight(FontWeight.Medium);
                                Text.fontColor(Hive.Color.n900);
                                Text.maxLines(2);
                                Text.width('100%');
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create((raw as Record<string, string>)['description'] ?? (raw as Record<string, string>)['subtitle'] ?? '');
                                Text.fontSize(10);
                                Text.fontColor(Hive.Color.n400);
                                Text.maxLines(2);
                                Text.width('100%');
                            }, Text);
                            Text.pop();
                            Column.pop();
                            Column.pop();
                        };
                        this.forEachUpdateFunction(elmtId, this.items(), forEachItemGenFunction);
                    }, ForEach);
                    ForEach.pop();
                    Flex.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Scroll.create();
                        Scroll.scrollable(ScrollDirection.Horizontal);
                        Scroll.scrollBar(BarState.Off);
                        Scroll.width('100%');
                    }, Scroll);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 12 });
                        Row.padding({ left: 16, right: 16, bottom: 14 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const raw = _item;
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Column.create({ space: 0 });
                                Column.borderRadius(12);
                                Column.clip(true);
                                Column.backgroundColor(Hive.Color.brandWhite);
                                Column.shadow({ radius: 4, color: '#14000000', offsetX: 0, offsetY: 2 });
                                Column.onClick(() => {
                                    SensorDataClient.discoverMoreTapped((raw as Record<string, string>)['title'] ?? '', (raw as Record<string, string>)['tag'] ?? '');
                                });
                            }, Column);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                // Fixed-height image area with tag chip
                                Stack.create({ alignContent: Alignment.TopStart });
                            }, Stack);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create('🏦');
                                Text.fontSize(40);
                                Text.width(200);
                                Text.height(110);
                                Text.textAlign(TextAlign.Center);
                                Text.backgroundColor((raw as Record<string, string>)['imageColor'] ?? Hive.Color.n700);
                                Text.borderRadius({ topLeft: 12, topRight: 12, bottomLeft: 0, bottomRight: 0 });
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create((raw as Record<string, string>)['tag'] ?? '');
                                Text.fontSize(9);
                                Text.fontWeight(FontWeight.Bold);
                                Text.fontColor(Hive.Color.brandWhite);
                                Text.padding({ left: 8, right: 8, top: 4, bottom: 4 });
                                Text.borderRadius(10);
                                Text.backgroundColor((raw as Record<string, string>)['tagColor'] ?? '#DB0011');
                                Text.margin({ left: 10, top: 10 });
                            }, Text);
                            Text.pop();
                            // Fixed-height image area with tag chip
                            Stack.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                // Fixed-height text area
                                Column.create({ space: 4 });
                                // Fixed-height text area
                                Column.alignItems(HorizontalAlign.Start);
                                // Fixed-height text area
                                Column.width(200);
                                // Fixed-height text area
                                Column.height(72);
                                // Fixed-height text area
                                Column.padding({ left: 10, right: 10, top: 8, bottom: 8 });
                                // Fixed-height text area
                                Column.backgroundColor(Hive.Color.brandWhite);
                                // Fixed-height text area
                                Column.borderRadius({ topLeft: 0, topRight: 0, bottomLeft: 12, bottomRight: 12 });
                            }, Column);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create((raw as Record<string, string>)['title'] ?? '');
                                Text.fontSize(12);
                                Text.fontWeight(FontWeight.Medium);
                                Text.fontColor(Hive.Color.n900);
                                Text.maxLines(2);
                                Text.width(200);
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create((raw as Record<string, string>)['description'] ?? (raw as Record<string, string>)['subtitle'] ?? '');
                                Text.fontSize(10);
                                Text.fontColor(Hive.Color.n400);
                                Text.maxLines(2);
                                Text.width(200);
                            }, Text);
                            Text.pop();
                            // Fixed-height text area
                            Column.pop();
                            Column.pop();
                        };
                        this.forEachUpdateFunction(elmtId, this.items(), forEachItemGenFunction);
                    }, ForEach);
                    ForEach.pop();
                    Row.pop();
                    Scroll.pop();
                });
            }
        }, If);
        If.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class WHHomeSearchHeader extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.onSearchTap = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: WHHomeSearchHeader_Params) {
        if (params.onSearchTap !== undefined) {
            this.onSearchTap = params.onSearchTap;
        }
    }
    updateStateVars(params: WHHomeSearchHeader_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private onSearchTap: () => void;
    aboutToAppear() {
        SensorDataClient.sliceImpression('HOME_SEARCH_HEADER', 'slice-home-search-hdr', 0);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.backgroundColor('#DB0011');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Top bar
            Row.create({ space: 0 });
            // Top bar
            Row.width('100%');
            // Top bar
            Row.padding({ left: 16, right: 16, top: 14, bottom: 8 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('HSBC Premier');
            Text.fontSize(17);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.brandWhite);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🔔');
            Text.fontSize(20);
            Text.fontColor(Hive.Color.brandWhite);
            Text.margin({ right: 12 });
            Text.onClick(() => {
                SensorDataClient.track('notification_tap', 'Wealth', 'notification_tapped', '', 'home_search_header', 'wealth_hub');
            });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🎧');
            Text.fontSize(20);
            Text.fontColor(Hive.Color.brandWhite);
            Text.onClick(() => {
                SensorDataClient.track('headset_tap', 'Wealth', 'headset_tapped', '', 'home_search_header', 'wealth_hub');
            });
        }, Text);
        Text.pop();
        // Top bar
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Search bar
            Row.create({ space: 8 });
            // Search bar
            Row.width('100%');
            // Search bar
            Row.padding({ left: 16, right: 16, bottom: 12 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.layoutWeight(1);
            Row.height(36);
            Row.padding({ left: 12, right: 12 });
            Row.borderRadius(18);
            Row.backgroundColor(Hive.Color.brandWhite);
            Row.onClick(() => {
                SensorDataClient.track('search_tap', 'Wealth', 'search_tapped', '', 'home_search_header', 'wealth_hub');
                this.onSearchTap();
            });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🔍');
            Text.fontSize(13);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Search with AI');
            Text.fontSize(13);
            Text.fontColor(Hive.Color.n400);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('AI');
            Text.fontSize(9);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor('#DB0011');
            Text.padding({ left: 5, right: 5, top: 2, bottom: 2 });
            Text.borderRadius(6);
            Text.backgroundColor('#FFEDED');
        }, Text);
        Text.pop();
        Row.pop();
        // Search bar
        Row.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class WHComboQuickAccess extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__activeTab = new ObservedPropertySimplePU(0, this, "activeTab");
        this.tabs = ['My pick', 'Invest', 'Global', 'HK Daily'];
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: WHComboQuickAccess_Params) {
        if (params.activeTab !== undefined) {
            this.activeTab = params.activeTab;
        }
        if (params.tabs !== undefined) {
            this.tabs = params.tabs;
        }
    }
    updateStateVars(params: WHComboQuickAccess_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__activeTab.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__activeTab.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __activeTab: ObservedPropertySimplePU<number>;
    get activeTab() {
        return this.__activeTab.get();
    }
    set activeTab(newValue: number) {
        this.__activeTab.set(newValue);
    }
    private tabs: string[];
    aboutToAppear() {
        SensorDataClient.sliceImpression('COMBO_QUICK_ACCESS', 'slice-combo-quick', 1);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Tab bar — pill/capsule style (active=red, inactive=gray)
            Scroll.create();
            // Tab bar — pill/capsule style (active=red, inactive=gray)
            Scroll.scrollable(ScrollDirection.Horizontal);
            // Tab bar — pill/capsule style (active=red, inactive=gray)
            Scroll.scrollBar(BarState.Off);
            // Tab bar — pill/capsule style (active=red, inactive=gray)
            Scroll.width('100%');
            // Tab bar — pill/capsule style (active=red, inactive=gray)
            Scroll.backgroundColor(Hive.Color.brandWhite);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 8 });
            Row.padding({ left: 16, right: 16, top: 10, bottom: 10 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = (_item, idx: number) => {
                const tab = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(tab);
                    Text.fontSize(13);
                    Text.fontWeight(this.activeTab === idx ? FontWeight.Bold : FontWeight.Normal);
                    Text.fontColor(this.activeTab === idx ? Hive.Color.brandWhite : Hive.Color.n700);
                    Text.padding({ left: 16, right: 16, top: 7, bottom: 7 });
                    Text.borderRadius(18);
                    Text.backgroundColor(this.activeTab === idx ? '#DB0011' : '#E4E4E4');
                    Text.onClick(() => { this.activeTab = idx; });
                }, Text);
                Text.pop();
            };
            this.forEachUpdateFunction(elmtId, this.tabs, forEachItemGenFunction, undefined, true, false);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        // Tab bar — pill/capsule style (active=red, inactive=gray)
        Scroll.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Row 1
            Row.create({ space: 0 });
            // Row 1
            Row.width('100%');
            // Row 1
            Row.backgroundColor(Hive.Color.brandWhite);
            // Row 1
            Row.padding({ left: 8, right: 8 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const item = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 5 });
                    Column.layoutWeight(1);
                    Column.alignItems(HorizontalAlign.Center);
                    Column.padding({ top: 10 });
                    Column.onClick(() => { SensorDataClient.quickAccessTapped(item.label, item.deepLink); });
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(item.icon);
                    Text.fontSize(22);
                    Text.width(48);
                    Text.height(48);
                    Text.textAlign(TextAlign.Center);
                    Text.borderRadius(14);
                    Text.backgroundColor(Hive.Color.n100);
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
            this.forEachUpdateFunction(elmtId, QUICK_ROW1, forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        // Row 1
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Row 2
            Row.create({ space: 0 });
            // Row 2
            Row.width('100%');
            // Row 2
            Row.backgroundColor(Hive.Color.brandWhite);
            // Row 2
            Row.padding({ left: 8, right: 8 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const item = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 5 });
                    Column.layoutWeight(1);
                    Column.alignItems(HorizontalAlign.Center);
                    Column.padding({ bottom: 10 });
                    Column.onClick(() => { SensorDataClient.quickAccessTapped(item.label, item.deepLink); });
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(item.icon);
                    Text.fontSize(22);
                    Text.width(48);
                    Text.height(48);
                    Text.textAlign(TextAlign.Center);
                    Text.borderRadius(14);
                    Text.backgroundColor(Hive.Color.n100);
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
            this.forEachUpdateFunction(elmtId, QUICK_ROW2, forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        // Row 2
        Row.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class WHCardActivationBanner extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: WHCardActivationBanner_Params) {
    }
    updateStateVars(params: WHCardActivationBanner_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    aboutToAppear() {
        SensorDataClient.sliceImpression('CARD_ACTIVATION_BANNER', 'slice-card-act', 2);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 10 });
            Row.width('100%');
            Row.padding({ left: 16, right: 16, top: 10, bottom: 10 });
            Row.backgroundColor('#FFF5F5');
            Row.borderWidth({ bottom: 1 });
            Row.borderColor(Hive.Color.n100);
            Row.alignItems(VerticalAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('💳');
            Text.fontSize(18);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Your card needs to be activated');
            Text.fontSize(13);
            Text.fontColor(Hive.Color.n900);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Activate now');
            Text.fontSize(12);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor('#DB0011');
            Text.onClick(() => {
                SensorDataClient.sliceTapped('CARD_ACTIVATION_BANNER', 'slice-card-act', 'Activate now', 'hsbc://cards/activate');
            });
        }, Text);
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class WHQuestBanner extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: WHQuestBanner_Params) {
    }
    updateStateVars(params: WHQuestBanner_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    aboutToAppear() {
        SensorDataClient.sliceImpression('QUEST_BANNER', 'slice-quest', 3);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.width('100%');
            Row.padding({ left: 16, right: 16, top: 14, bottom: 14 });
            Row.margin({ top: 8 });
            Row.backgroundColor(Hive.Color.brandWhite);
            Row.alignItems(VerticalAlign.Top);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🏦');
            Text.fontSize(28);
            Text.width(52);
            Text.height(52);
            Text.textAlign(TextAlign.Center);
            Text.borderRadius(14);
            Text.backgroundColor('#FEF2F2');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 6 });
            Column.layoutWeight(1);
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Getting started');
            Text.fontSize(14);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Complete setup to unlock your full Premier benefits');
            Text.fontSize(11);
            Text.fontColor(Hive.Color.n500);
            Text.maxLines(2);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Progress bar at 40%
            Stack.create({ alignContent: Alignment.Start });
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.height(4);
            Row.borderRadius(2);
            Row.backgroundColor(Hive.Color.n100);
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('40%');
            Row.height(4);
            Row.borderRadius(2);
            Row.backgroundColor('#DB0011');
        }, Row);
        Row.pop();
        // Progress bar at 40%
        Stack.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('Continue');
            Button.height(30);
            Button.padding({ left: 16, right: 16 });
            Button.borderRadius(14);
            Button.backgroundColor('#DB0011');
            Button.fontColor(Hive.Color.brandWhite);
            Button.fontSize(11);
            Button.fontWeight(FontWeight.Bold);
            Button.onClick(() => {
                SensorDataClient.sliceTapped('QUEST_BANNER', 'slice-quest', 'Continue', 'hsbc://onboarding/checklist');
            });
        }, Button);
        Button.pop();
        Column.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class WHFeatureProduct extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__activeTab = new ObservedPropertySimplePU(0, this, "activeTab");
        this.fundTabs = ['All', 'Equity', 'Bond', 'Multi-Asset'];
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: WHFeatureProduct_Params) {
        if (params.activeTab !== undefined) {
            this.activeTab = params.activeTab;
        }
        if (params.fundTabs !== undefined) {
            this.fundTabs = params.fundTabs;
        }
    }
    updateStateVars(params: WHFeatureProduct_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__activeTab.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__activeTab.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __activeTab: ObservedPropertySimplePU<number>;
    get activeTab() {
        return this.__activeTab.get();
    }
    set activeTab(newValue: number) {
        this.__activeTab.set(newValue);
    }
    private fundTabs: string[];
    aboutToAppear() {
        SensorDataClient.sliceImpression('FEATURE_PRODUCT', 'slice-feature-product', 4);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.margin({ top: 8 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.padding({ left: 16, right: 16, top: 14, bottom: 8 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Feature product');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('More ›');
            Text.fontSize(12);
            Text.fontColor('#DB0011');
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.scrollable(ScrollDirection.Horizontal);
            Scroll.scrollBar(BarState.Off);
            Scroll.width('100%');
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 8 });
            Row.padding({ left: 16, right: 16, bottom: 8 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = (_item, idx: number) => {
                const tab = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(tab);
                    Text.fontSize(12);
                    Text.fontWeight(this.activeTab === idx ? FontWeight.Bold : FontWeight.Normal);
                    Text.fontColor(this.activeTab === idx ? Hive.Color.brandWhite : Hive.Color.n700);
                    Text.padding({ left: 14, right: 14, top: 6, bottom: 6 });
                    Text.borderRadius(16);
                    Text.backgroundColor(this.activeTab === idx ? '#DB0011' : Hive.Color.n100);
                    Text.onClick(() => { this.activeTab = idx; });
                }, Text);
                Text.pop();
            };
            this.forEachUpdateFunction(elmtId, this.fundTabs, forEachItemGenFunction, undefined, true, false);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        Scroll.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = (_item, index: number) => {
                const fund = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create({ space: 12 });
                    Row.width('100%');
                    Row.padding({ left: 16, right: 16, top: 12, bottom: 12 });
                    Row.onClick(() => { SensorDataClient.wealthProductTapped(fund.name, fund.id); });
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 4 });
                    Column.layoutWeight(1);
                    Column.alignItems(HorizontalAlign.Start);
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(fund.name);
                    Text.fontSize(13);
                    Text.fontWeight(FontWeight.Medium);
                    Text.fontColor(Hive.Color.n900);
                    Text.maxLines(2);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(fund.code);
                    Text.fontSize(11);
                    Text.fontColor(Hive.Color.n500);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create({ space: 4 });
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    ForEach.create();
                    const forEachItemGenFunction = _item => {
                        const tag = _item;
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(tag);
                            Text.fontSize(9);
                            Text.fontColor('#DB0011');
                            Text.padding({ left: 6, right: 6, top: 2, bottom: 2 });
                            Text.borderRadius(8);
                            Text.backgroundColor('#FEF2F2');
                        }, Text);
                        Text.pop();
                    };
                    this.forEachUpdateFunction(elmtId, fund.tags, forEachItemGenFunction);
                }, ForEach);
                ForEach.pop();
                Row.pop();
                Column.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 2 });
                    Column.alignItems(HorizontalAlign.End);
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(fund.return1Y);
                    Text.fontSize(18);
                    Text.fontWeight(FontWeight.Bold);
                    Text.fontColor(fund.return1Y.startsWith('+') ? '#16A34A' : '#DC2626');
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create('1Y return');
                    Text.fontSize(9);
                    Text.fontColor(Hive.Color.n400);
                }, Text);
                Text.pop();
                Column.pop();
                Row.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    If.create();
                    if (index < STATIC_FUNDS.length - 1) {
                        this.ifElseBranchUpdateFunction(0, () => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Divider.create();
                                Divider.color(Hive.Color.n100);
                                Divider.margin({ left: 16, right: 16 });
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
            this.forEachUpdateFunction(elmtId, STATIC_FUNDS, forEachItemGenFunction, undefined, true, false);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class WHWealthStudioCarousel extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: WHWealthStudioCarousel_Params) {
    }
    updateStateVars(params: WHWealthStudioCarousel_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    aboutToAppear() {
        SensorDataClient.sliceImpression('WEALTH_STUDIO_CAROUSEL', 'slice-wealth-studio', 5);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.margin({ top: 8 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.padding({ left: 16, right: 16, top: 14, bottom: 10 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Premier Elite Wealth Studio');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('All ›');
            Text.fontSize(12);
            Text.fontColor('#DB0011');
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.scrollable(ScrollDirection.Horizontal);
            Scroll.scrollBar(BarState.Off);
            Scroll.width('100%');
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.padding({ left: 16, right: 16, bottom: 14 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const ep = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 0 });
                    Column.borderRadius(10);
                    Column.clip(true);
                    Column.shadow({ radius: 4, color: '#14000000', offsetX: 0, offsetY: 2 });
                    Column.onClick(() => { SensorDataClient.wealthStudioTapped(ep.title, ep.id); });
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    // Fixed-height image area
                    Stack.create({ alignContent: Alignment.BottomStart });
                }, Stack);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(ep.thumbnail);
                    Text.fontSize(32);
                    Text.width(180);
                    Text.height(100);
                    Text.textAlign(TextAlign.Center);
                    Text.backgroundColor(Hive.Color.n700);
                    Text.borderRadius({ topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 });
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create('▶');
                    Text.fontSize(20);
                    Text.fontColor(Hive.Color.brandWhite);
                    Text.width(36);
                    Text.height(36);
                    Text.textAlign(TextAlign.Center);
                    Text.borderRadius(18);
                    Text.backgroundColor('#80000000');
                    Text.position({ x: 72, y: 32 });
                }, Text);
                Text.pop();
                // Fixed-height image area
                Stack.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    // Fixed-height text area
                    Column.create({ space: 4 });
                    // Fixed-height text area
                    Column.alignItems(HorizontalAlign.Start);
                    // Fixed-height text area
                    Column.width(180);
                    // Fixed-height text area
                    Column.height(72);
                    // Fixed-height text area
                    Column.padding({ left: 10, right: 10, top: 8, bottom: 8 });
                    // Fixed-height text area
                    Column.backgroundColor(Hive.Color.brandWhite);
                    // Fixed-height text area
                    Column.borderRadius({ topLeft: 0, topRight: 0, bottomLeft: 10, bottomRight: 10 });
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(ep.title);
                    Text.fontSize(11);
                    Text.fontWeight(FontWeight.Bold);
                    Text.fontColor(Hive.Color.n900);
                    Text.maxLines(2);
                    Text.width(180);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create({ space: 4 });
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create('⏱');
                    Text.fontSize(10);
                    Text.fontColor(Hive.Color.n400);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(ep.duration);
                    Text.fontSize(10);
                    Text.fontColor(Hive.Color.n400);
                }, Text);
                Text.pop();
                Row.pop();
                // Fixed-height text area
                Column.pop();
                Column.pop();
            };
            this.forEachUpdateFunction(elmtId, STATIC_EPISODES, forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        Scroll.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class WHGuidesInsights extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: WHGuidesInsights_Params) {
    }
    updateStateVars(params: WHGuidesInsights_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    aboutToAppear() {
        SensorDataClient.sliceImpression('GUIDES_INSIGHTS_CAROUSEL', 'slice-guides', 6);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.margin({ top: 8 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.padding({ left: 16, right: 16, top: 14, bottom: 10 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Guides and insights');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('More ›');
            Text.fontSize(12);
            Text.fontColor('#DB0011');
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.scrollable(ScrollDirection.Horizontal);
            Scroll.scrollBar(BarState.Off);
            Scroll.width('100%');
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.padding({ left: 16, right: 16, bottom: 14 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const guide = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 0 });
                    Column.borderRadius(10);
                    Column.clip(true);
                    Column.shadow({ radius: 4, color: '#14000000', offsetX: 0, offsetY: 2 });
                    Column.onClick(() => { SensorDataClient.guidesTapped(guide.title, guide.id); });
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(guide.imageEmoji);
                    Text.fontSize(36);
                    Text.width(160);
                    Text.height(90);
                    Text.textAlign(TextAlign.Center);
                    Text.backgroundColor(Hive.Color.n100);
                    Text.borderRadius({ topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 });
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 4 });
                    Column.alignItems(HorizontalAlign.Start);
                    Column.width(160);
                    Column.height(72);
                    Column.padding({ left: 8, right: 8, top: 8, bottom: 8 });
                    Column.backgroundColor(Hive.Color.brandWhite);
                    Column.borderRadius({ topLeft: 0, topRight: 0, bottomLeft: 10, bottomRight: 10 });
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(guide.title);
                    Text.fontSize(11);
                    Text.fontWeight(FontWeight.Medium);
                    Text.fontColor(Hive.Color.n900);
                    Text.maxLines(3);
                    Text.width(160);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(guide.date ?? '');
                    Text.fontSize(9);
                    Text.fontColor(Hive.Color.n400);
                }, Text);
                Text.pop();
                Column.pop();
                Column.pop();
            };
            this.forEachUpdateFunction(elmtId, STATIC_GUIDES, forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        Scroll.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class WHFXWatchlist extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: WHFXWatchlist_Params) {
    }
    updateStateVars(params: WHFXWatchlist_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    aboutToAppear() {
        SensorDataClient.sliceImpression('FX_WATCHLIST', 'slice-fx-watchlist', 7);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.margin({ top: 8 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 8 });
            Row.width('100%');
            Row.padding({ left: 16, right: 16, top: 14, bottom: 8 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('FX watchlist');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Premier');
            Text.fontSize(9);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor('#DB0011');
            Text.padding({ left: 8, right: 8, top: 3, bottom: 3 });
            Text.borderRadius(10);
            Text.backgroundColor('#FEF2F2');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('View all ›');
            Text.fontSize(12);
            Text.fontColor('#DB0011');
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.padding({ left: 16, right: 16, bottom: 6 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Currency pair');
            Text.fontSize(11);
            Text.fontColor(Hive.Color.n400);
            Text.layoutWeight(2);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Rate');
            Text.fontSize(11);
            Text.fontColor(Hive.Color.n400);
            Text.layoutWeight(1);
            Text.textAlign(TextAlign.End);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Change');
            Text.fontSize(11);
            Text.fontColor(Hive.Color.n400);
            Text.layoutWeight(1);
            Text.textAlign(TextAlign.End);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.color(Hive.Color.n100);
            Divider.margin({ left: 16, right: 16 });
        }, Divider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = (_item, index: number) => {
                const pair = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create({ space: 0 });
                    Row.width('100%');
                    Row.padding({ left: 16, right: 16, top: 10, bottom: 10 });
                    Row.onClick(() => {
                        SensorDataClient.track('fx_pair_tap', 'Wealth', 'fx_pair_tapped', `${pair.base}/${pair.quote}`, 'fx_watchlist', 'wealth_hub');
                    });
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(`${pair.base} / ${pair.quote}`);
                    Text.fontSize(13);
                    Text.fontWeight(FontWeight.Medium);
                    Text.fontColor(Hive.Color.n900);
                    Text.layoutWeight(2);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(pair.rate);
                    Text.fontSize(13);
                    Text.fontColor(Hive.Color.n900);
                    Text.layoutWeight(1);
                    Text.textAlign(TextAlign.End);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(pair.change);
                    Text.fontSize(13);
                    Text.fontWeight(FontWeight.Medium);
                    Text.fontColor(pair.positive ? '#16A34A' : '#DC2626');
                    Text.layoutWeight(1);
                    Text.textAlign(TextAlign.End);
                }, Text);
                Text.pop();
                Row.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    If.create();
                    if (index < STATIC_FX_PAIRS.length - 1) {
                        this.ifElseBranchUpdateFunction(0, () => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Divider.create();
                                Divider.color(Hive.Color.n100);
                                Divider.margin({ left: 16, right: 16 });
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
            this.forEachUpdateFunction(elmtId, STATIC_FX_PAIRS, forEachItemGenFunction, undefined, true, false);
        }, ForEach);
        ForEach.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.height(12);
        }, Blank);
        Blank.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class WHDiscoverMore extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: WHDiscoverMore_Params) {
    }
    updateStateVars(params: WHDiscoverMore_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    aboutToAppear() {
        SensorDataClient.sliceImpression('DISCOVER_MORE_CAROUSEL', 'slice-discover-more', 8);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.n50);
            Column.margin({ top: 8 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.padding({ left: 16, right: 16, top: 14, bottom: 10 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Discover more');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('All ›');
            Text.fontSize(12);
            Text.fontColor('#DB0011');
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.scrollable(ScrollDirection.Horizontal);
            Scroll.scrollBar(BarState.Off);
            Scroll.width('100%');
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.padding({ left: 16, right: 16, bottom: 14 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const card = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 0 });
                    Column.borderRadius(12);
                    Column.clip(true);
                    Column.backgroundColor(Hive.Color.brandWhite);
                    Column.shadow({ radius: 4, color: '#14000000', offsetX: 0, offsetY: 2 });
                    Column.onClick(() => { SensorDataClient.discoverMoreTapped(card.title, card.tag); });
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Stack.create({ alignContent: Alignment.TopStart });
                }, Stack);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(card.imageEmoji);
                    Text.fontSize(40);
                    Text.width(200);
                    Text.height(110);
                    Text.textAlign(TextAlign.Center);
                    Text.backgroundColor(Hive.Color.n700);
                    Text.borderRadius({ topLeft: 12, topRight: 12, bottomLeft: 0, bottomRight: 0 });
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(card.tag);
                    Text.fontSize(9);
                    Text.fontWeight(FontWeight.Bold);
                    Text.fontColor(Hive.Color.brandWhite);
                    Text.padding({ left: 8, right: 8, top: 4, bottom: 4 });
                    Text.borderRadius(10);
                    Text.backgroundColor('#DB0011');
                    Text.margin({ left: 10, top: 10 });
                }, Text);
                Text.pop();
                Stack.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 4 });
                    Column.alignItems(HorizontalAlign.Start);
                    Column.width(200);
                    Column.height(60);
                    Column.padding({ left: 10, right: 10, top: 8, bottom: 8 });
                    Column.backgroundColor(Hive.Color.brandWhite);
                    Column.borderRadius({ topLeft: 0, topRight: 0, bottomLeft: 12, bottomRight: 12 });
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(card.title);
                    Text.fontSize(12);
                    Text.fontWeight(FontWeight.Medium);
                    Text.fontColor(Hive.Color.n900);
                    Text.maxLines(2);
                    Text.width(200);
                }, Text);
                Text.pop();
                Column.pop();
                Column.pop();
            };
            this.forEachUpdateFunction(elmtId, STATIC_CAMPAIGNS, forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        Scroll.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
