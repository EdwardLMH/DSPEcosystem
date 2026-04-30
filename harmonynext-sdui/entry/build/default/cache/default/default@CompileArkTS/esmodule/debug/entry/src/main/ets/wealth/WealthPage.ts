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
interface WealthPageView_Params {
    adDismissed?: boolean;
    searchOpen?: boolean;
}
import { Hive } from "@normalized:N&&&entry/src/main/ets/common/HiveTokens&";
import { SensorDataClient } from "@normalized:N&&&entry/src/main/ets/network/SensorDataClient&";
import { AISearchPage } from "@normalized:N&&&entry/src/main/ets/wealth/AISearchPage&";
// ─── Data models ──────────────────────────────────────────────────────────────
// FIX: inline object type literals used as type annotations are forbidden
// (arkts-no-object-literal-type). All five were already declared as 'interface'
// which IS the correct ArkTS form — these were fine. The issue was only in
// ForEach callback parameter annotations using object literal types inline.
// The data interfaces below are properly declared interfaces.
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
// FIX: bottomLinks uses an object-literal type in ForEach. Declare a proper interface.
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
export class WealthPageView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__adDismissed = new ObservedPropertySimplePU(false, this, "adDismissed");
        this.__searchOpen = new ObservedPropertySimplePU(false, this, "searchOpen");
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
    }
    updateStateVars(params: WealthPageView_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__adDismissed.purgeDependencyOnElmtId(rmElmtId);
        this.__searchOpen.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__adDismissed.aboutToBeDeleted();
        this.__searchOpen.aboutToBeDeleted();
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
    aboutToAppear() {
        SensorDataClient.wealthHubViewed();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create({ alignContent: Alignment.TopStart });
            Stack.width('100%');
            Stack.height('100%');
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // ── Main page (always rendered beneath) ──────────────────────────────
            Scroll.create();
            // ── Main page (always rendered beneath) ──────────────────────────────
            Scroll.width('100%');
            // ── Main page (always rendered beneath) ──────────────────────────────
            Scroll.height('100%');
            // ── Main page (always rendered beneath) ──────────────────────────────
            Scroll.backgroundColor(Hive.Color.n50);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new WHHeaderNav(this, { onSearchTap: () => { this.searchOpen = true; } }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 96, col: 11 });
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
                    let componentCall = new WHQuickAccess(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 97, col: 11 });
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
                    let componentCall = new WHPromoBanner(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 98, col: 11 });
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
                    let componentCall = new WHFunctionGrid(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 99, col: 11 });
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
                    let componentCall = new WHAIAssistant(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 100, col: 11 });
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
                                let componentCall = new WHAdBanner(this, { onDismiss: () => { this.adDismissed = true; } }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 102, col: 13 });
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
                    let componentCall = new WHFlashLoan(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 104, col: 11 });
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
                    let componentCall = new WHWealthSelection(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 105, col: 11 });
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
                    let componentCall = new WHFeaturedRankings(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 106, col: 11 });
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
                    let componentCall = new WHLifeDeals(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 107, col: 11 });
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
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.height(40);
        }, Blank);
        Blank.pop();
        Column.pop();
        // ── Main page (always rendered beneath) ──────────────────────────────
        Scroll.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // ── Search overlay (slides over main page) ────────────────────────
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
                                let componentCall = new AISearchPage(this, { onDismiss: () => { this.searchOpen = false; } }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 114, col: 9 });
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
        SensorDataClient.sliceImpression('HEADER_NAV', 'slice-header', 0);
    }
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
            // Search bar
            Row.create({ space: 6 });
            // Search bar
            Row.layoutWeight(1);
            // Search bar
            Row.height(36);
            // Search bar
            Row.padding({ left: 14, right: 14 });
            // Search bar
            Row.borderRadius(18);
            // Search bar
            Row.backgroundColor(Hive.Color.n100);
            // Search bar
            Row.onClick(() => {
                SensorDataClient.track('search_tap', 'Wealth', 'search_tapped', '', 'wealth_hub_hk', 'wealth_hub');
                this.onSearchTap();
            });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🔍');
            Text.fontSize(13);
            Text.fontColor(Hive.Color.n400);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('搜尋功能、產品');
            Text.fontSize(13);
            Text.fontColor(Hive.Color.n400);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        // Search bar
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🔔');
            Text.fontSize(20);
            Text.onClick(() => {
                SensorDataClient.track('notification_tap', 'Wealth', 'notification_tapped', '', 'wealth_hub_hk', 'wealth_hub');
            });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('⬛');
            Text.fontSize(18);
            Text.onClick(() => {
                SensorDataClient.track('qr_tap', 'Wealth', 'qr_scanner_tapped', '', 'wealth_hub_hk', 'wealth_hub');
            });
        }, Text);
        Text.pop();
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
                                // FIX: arkts-no-untyped-obj-literals — build Record via index assignments.
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
            // Dismiss button
            Text.create('✕');
            // Dismiss button
            Text.fontSize(13);
            // Dismiss button
            Text.fontColor(Hive.Color.n400);
            // Dismiss button
            Text.width(32);
            // Dismiss button
            Text.height(32);
            // Dismiss button
            Text.textAlign(TextAlign.Center);
            // Dismiss button
            Text.onClick(() => {
                SensorDataClient.adBannerDismissed('春季播種黃金期');
                this.onDismiss();
            });
        }, Text);
        // Dismiss button
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
                    else // FIX: Spacer() does not support .height() modifier (arkts UI syntax error).
                     {
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
            // FIX: Spacer() does not support .height() modifier (arkts UI syntax error).
            // Use Blank().height() which is the correct ArkTS spacer with explicit sizing.
            Blank.create();
            // FIX: Spacer() does not support .height() modifier (arkts UI syntax error).
            // Use Blank().height() which is the correct ArkTS spacer with explicit sizing.
            Blank.height(10);
        }, Blank);
        // FIX: Spacer() does not support .height() modifier (arkts UI syntax error).
        // Use Blank().height() which is the correct ArkTS spacer with explicit sizing.
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
    aboutToAppear() {
        SensorDataClient.sliceImpression('LIFE_DEALS', 'slice-life-deals', 9);
    }
    // FIX: was typed implicitly as Array<{ icon: string, label: string, deepLink: string }>.
    // Declare with the proper BottomLink interface to avoid object-literal type inference
    // being used in the ForEach callback annotation.
    private bottomLinks: BottomLink[];
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
            // Deal cards
            Row.create({ space: 10 });
            // Deal cards
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
        // Deal cards
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Bottom links
            // FIX: was (link: { icon: string, label: string, deepLink: string }) =>
            // Object literal type as ForEach callback param. Now uses BottomLink interface.
            Row.create({ space: 10 });
            // Bottom links
            // FIX: was (link: { icon: string, label: string, deepLink: string }) =>
            // Object literal type as ForEach callback param. Now uses BottomLink interface.
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
                        // FIX: arkts-no-untyped-obj-literals — build Record via index assignments.
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
        // Bottom links
        // FIX: was (link: { icon: string, label: string, deepLink: string }) =>
        // Object literal type as ForEach callback param. Now uses BottomLink interface.
        Row.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
