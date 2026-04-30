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
}
interface WealthPageView_Params {
    adDismissed?: boolean;
}
import { Hive } from "@normalized:N&&&entry/src/main/ets/common/HiveTokens&";
import { SensorDataClient } from "@normalized:N&&&entry/src/main/ets/network/SensorDataClient&";
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
export class WealthPageView extends ViewPU {
    constructor(r57, s57, t57, u57 = -1, v57 = undefined, w57) {
        super(r57, t57, u57, w57);
        if (typeof v57 === "function") {
            this.paramsGenerator_ = v57;
        }
        this.__adDismissed = new ObservedPropertySimplePU(false, this, "adDismissed");
        this.setInitiallyProvidedValue(s57);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(q57: WealthPageView_Params) {
        if (q57.adDismissed !== undefined) {
            this.adDismissed = q57.adDismissed;
        }
    }
    updateStateVars(p57: WealthPageView_Params) {
    }
    purgeVariableDependenciesOnElmtId(o57) {
        this.__adDismissed.purgeDependencyOnElmtId(o57);
    }
    aboutToBeDeleted() {
        this.__adDismissed.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __adDismissed: ObservedPropertySimplePU<boolean>;
    get adDismissed() {
        return this.__adDismissed.get();
    }
    set adDismissed(n57: boolean) {
        this.__adDismissed.set(n57);
    }
    aboutToAppear() {
        SensorDataClient.wealthHubViewed();
    }
    initialRender() {
        this.observeComponentCreation2((l57, m57) => {
            Scroll.create();
            Scroll.width('100%');
            Scroll.height('100%');
            Scroll.backgroundColor(Hive.Color.n50);
        }, Scroll);
        this.observeComponentCreation2((j57, k57) => {
            Column.create({ space: 0 });
            Column.width('100%');
        }, Column);
        {
            this.observeComponentCreation2((f57, g57) => {
                if (g57) {
                    let h57 = new WHHeaderNav(this, {}, undefined, f57, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 92, col: 9 });
                    ViewPU.create(h57);
                    let i57 = () => {
                        return {};
                    };
                    h57.paramsGenerator_ = i57;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(f57, {});
                }
            }, { name: "WHHeaderNav" });
        }
        {
            this.observeComponentCreation2((b57, c57) => {
                if (c57) {
                    let d57 = new WHQuickAccess(this, {}, undefined, b57, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 93, col: 9 });
                    ViewPU.create(d57);
                    let e57 = () => {
                        return {};
                    };
                    d57.paramsGenerator_ = e57;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(b57, {});
                }
            }, { name: "WHQuickAccess" });
        }
        {
            this.observeComponentCreation2((x56, y56) => {
                if (y56) {
                    let z56 = new WHPromoBanner(this, {}, undefined, x56, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 94, col: 9 });
                    ViewPU.create(z56);
                    let a57 = () => {
                        return {};
                    };
                    z56.paramsGenerator_ = a57;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(x56, {});
                }
            }, { name: "WHPromoBanner" });
        }
        {
            this.observeComponentCreation2((t56, u56) => {
                if (u56) {
                    let v56 = new WHFunctionGrid(this, {}, undefined, t56, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 95, col: 9 });
                    ViewPU.create(v56);
                    let w56 = () => {
                        return {};
                    };
                    v56.paramsGenerator_ = w56;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(t56, {});
                }
            }, { name: "WHFunctionGrid" });
        }
        {
            this.observeComponentCreation2((p56, q56) => {
                if (q56) {
                    let r56 = new WHAIAssistant(this, {}, undefined, p56, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 96, col: 9 });
                    ViewPU.create(r56);
                    let s56 = () => {
                        return {};
                    };
                    r56.paramsGenerator_ = s56;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(p56, {});
                }
            }, { name: "WHAIAssistant" });
        }
        this.observeComponentCreation2((j56, k56) => {
            If.create();
            if (!this.adDismissed) {
                this.ifElseBranchUpdateFunction(0, () => {
                    {
                        this.observeComponentCreation2((l56, m56) => {
                            if (m56) {
                                let n56 = new WHAdBanner(this, { onDismiss: () => { this.adDismissed = true; } }, undefined, l56, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 98, col: 11 });
                                ViewPU.create(n56);
                                let o56 = () => {
                                    return {
                                        onDismiss: () => { this.adDismissed = true; }
                                    };
                                };
                                n56.paramsGenerator_ = o56;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(l56, {});
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
            this.observeComponentCreation2((f56, g56) => {
                if (g56) {
                    let h56 = new WHFlashLoan(this, {}, undefined, f56, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 100, col: 9 });
                    ViewPU.create(h56);
                    let i56 = () => {
                        return {};
                    };
                    h56.paramsGenerator_ = i56;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(f56, {});
                }
            }, { name: "WHFlashLoan" });
        }
        {
            this.observeComponentCreation2((b56, c56) => {
                if (c56) {
                    let d56 = new WHWealthSelection(this, {}, undefined, b56, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 101, col: 9 });
                    ViewPU.create(d56);
                    let e56 = () => {
                        return {};
                    };
                    d56.paramsGenerator_ = e56;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(b56, {});
                }
            }, { name: "WHWealthSelection" });
        }
        {
            this.observeComponentCreation2((x55, y55) => {
                if (y55) {
                    let z55 = new WHFeaturedRankings(this, {}, undefined, x55, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 102, col: 9 });
                    ViewPU.create(z55);
                    let a56 = () => {
                        return {};
                    };
                    z55.paramsGenerator_ = a56;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(x55, {});
                }
            }, { name: "WHFeaturedRankings" });
        }
        {
            this.observeComponentCreation2((t55, u55) => {
                if (u55) {
                    let v55 = new WHLifeDeals(this, {}, undefined, t55, () => { }, { page: "entry/src/main/ets/wealth/WealthPage.ets", line: 103, col: 9 });
                    ViewPU.create(v55);
                    let w55 = () => {
                        return {};
                    };
                    v55.paramsGenerator_ = w55;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(t55, {});
                }
            }, { name: "WHLifeDeals" });
        }
        this.observeComponentCreation2((r55, s55) => {
            Blank.create();
            Blank.height(40);
        }, Blank);
        Blank.pop();
        Column.pop();
        Scroll.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class WHHeaderNav extends ViewPU {
    constructor(l55, m55, n55, o55 = -1, p55 = undefined, q55) {
        super(l55, n55, o55, q55);
        if (typeof p55 === "function") {
            this.paramsGenerator_ = p55;
        }
        this.setInitiallyProvidedValue(m55);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(k55: WHHeaderNav_Params) {
    }
    updateStateVars(j55: WHHeaderNav_Params) {
    }
    purgeVariableDependenciesOnElmtId(i55) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    aboutToAppear() {
        SensorDataClient.sliceImpression('HEADER_NAV', 'slice-header', 0);
    }
    initialRender() {
        this.observeComponentCreation2((g55, h55) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((e55, f55) => {
            Row.create({ space: 10 });
            Row.width('100%');
            Row.height(50);
            Row.padding({ left: 14, right: 14, top: 8, bottom: 8 });
            Row.backgroundColor(Hive.Color.brandWhite);
        }, Row);
        this.observeComponentCreation2((c55, d55) => {
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
        this.observeComponentCreation2((a55, b55) => {
            Text.create('🔍');
            Text.fontSize(13);
            Text.fontColor(Hive.Color.n400);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((y54, z54) => {
            Text.create('搜尋功能、產品');
            Text.fontSize(13);
            Text.fontColor(Hive.Color.n400);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((w54, x54) => {
            Text.create('🔔');
            Text.fontSize(20);
            Text.onClick(() => {
                SensorDataClient.track('notification_tap', 'Wealth', 'notification_tapped', '', 'wealth_hub_hk', 'wealth_hub');
            });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((u54, v54) => {
            Text.create('⬛');
            Text.fontSize(18);
            Text.onClick(() => {
                SensorDataClient.track('qr_tap', 'Wealth', 'qr_scanner_tapped', '', 'wealth_hub_hk', 'wealth_hub');
            });
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((s54, t54) => {
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
    constructor(m54, n54, o54, p54 = -1, q54 = undefined, r54) {
        super(m54, o54, p54, r54);
        if (typeof q54 === "function") {
            this.paramsGenerator_ = q54;
        }
        this.setInitiallyProvidedValue(n54);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(l54: WHQuickAccess_Params) {
    }
    updateStateVars(k54: WHQuickAccess_Params) {
    }
    purgeVariableDependenciesOnElmtId(j54) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    aboutToAppear() {
        SensorDataClient.sliceImpression('QUICK_ACCESS', 'slice-quick', 1);
    }
    initialRender() {
        this.observeComponentCreation2((h54, i54) => {
            Row.create();
            Row.width('100%');
            Row.backgroundColor(Hive.Color.brandWhite);
            Row.padding({ left: 16, right: 16, top: 12, bottom: 12 });
        }, Row);
        this.observeComponentCreation2((w53, x53) => {
            ForEach.create();
            const y53 = z53 => {
                const a54 = z53;
                this.observeComponentCreation2((f54, g54) => {
                    Column.create({ space: 5 });
                    Column.layoutWeight(1);
                    Column.alignItems(HorizontalAlign.Center);
                    Column.onClick(() => { SensorDataClient.quickAccessTapped(a54.label, a54.deepLink); });
                }, Column);
                this.observeComponentCreation2((d54, e54) => {
                    Text.create(a54.icon);
                    Text.fontSize(22);
                    Text.width(48);
                    Text.height(48);
                    Text.textAlign(TextAlign.Center);
                    Text.borderRadius(14);
                    Text.linearGradient({ direction: GradientDirection.LeftTop,
                        colors: [['#F0F9FF', 0], ['#E0F2FE', 1]] });
                }, Text);
                Text.pop();
                this.observeComponentCreation2((b54, c54) => {
                    Text.create(a54.label);
                    Text.fontSize(10);
                    Text.fontColor(Hive.Color.n700);
                    Text.textAlign(TextAlign.Center);
                }, Text);
                Text.pop();
                Column.pop();
            };
            this.forEachUpdateFunction(w53, QUICK_ITEMS, y53);
        }, ForEach);
        ForEach.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class WHPromoBanner extends ViewPU {
    constructor(q53, r53, s53, t53 = -1, u53 = undefined, v53) {
        super(q53, s53, t53, v53);
        if (typeof u53 === "function") {
            this.paramsGenerator_ = u53;
        }
        this.setInitiallyProvidedValue(r53);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(p53: WHPromoBanner_Params) {
    }
    updateStateVars(o53: WHPromoBanner_Params) {
    }
    purgeVariableDependenciesOnElmtId(n53) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    aboutToAppear() {
        SensorDataClient.promoBannerImpression('10分招財日', 'slice-promo-10', 'promo-10-finance-day');
    }
    initialRender() {
        this.observeComponentCreation2((l53, m53) => {
            Row.create({ space: 0 });
            Row.width('100%');
            Row.padding({ left: 12, right: 12, top: 12, bottom: 12 });
            Row.margin({ left: 12, right: 12, top: 8, bottom: 0 });
            Row.borderRadius(14);
            Row.backgroundColor('#E8F4FD');
            Row.alignItems(VerticalAlign.Center);
        }, Row);
        this.observeComponentCreation2((j53, k53) => {
            Column.create({ space: 4 });
            Column.layoutWeight(1);
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((h53, i53) => {
            Text.create('每月10日開啓');
            Text.fontSize(9);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor('#DB0011');
            Text.padding({ left: 8, right: 8, top: 2, bottom: 2 });
            Text.borderRadius(10);
            Text.backgroundColor('#FFEDED');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((f53, g53) => {
            Text.create('10分招財日');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bolder);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((d53, e53) => {
            Text.create('查帳單·學投資·優配置');
            Text.fontSize(10);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((b53, c53) => {
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
        this.observeComponentCreation2((z52, a53) => {
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
    constructor(t52, u52, v52, w52 = -1, x52 = undefined, y52) {
        super(t52, v52, w52, y52);
        if (typeof x52 === "function") {
            this.paramsGenerator_ = x52;
        }
        this.setInitiallyProvidedValue(u52);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(s52: WHFunctionGrid_Params) {
    }
    updateStateVars(r52: WHFunctionGrid_Params) {
    }
    purgeVariableDependenciesOnElmtId(q52) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    aboutToAppear() {
        SensorDataClient.sliceImpression('FUNCTION_GRID', 'slice-func-grid', 3);
    }
    initialRender() {
        this.observeComponentCreation2((o52, p52) => {
            Column.create({ space: 6 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.padding({ left: 16, right: 16, top: 8, bottom: 8 });
        }, Column);
        this.observeComponentCreation2((v51, w51) => {
            ForEach.create();
            const x51 = y51 => {
                const z51 = y51;
                this.observeComponentCreation2((m52, n52) => {
                    Row.create();
                    Row.width('100%');
                }, Row);
                this.observeComponentCreation2((a52, b52) => {
                    ForEach.create();
                    const c52 = d52 => {
                        const e52 = d52;
                        this.observeComponentCreation2((j52, k52) => {
                            Column.create({ space: 4 });
                            Column.layoutWeight(1);
                            Column.alignItems(HorizontalAlign.Center);
                            Column.onClick(() => {
                                const l52: Record<string, any> = {};
                                l52['function_label'] = e52.label as any;
                                l52['deep_link'] = e52.deepLink as any;
                                SensorDataClient.track('function_tap', 'Wealth', 'function_tapped', e52.label, 'wealth_hub_hk', 'wealth_hub', '', '', '', '', '', '', '', '', l52);
                            });
                        }, Column);
                        this.observeComponentCreation2((h52, i52) => {
                            Text.create(e52.icon);
                            Text.fontSize(20);
                            Text.width(44);
                            Text.height(44);
                            Text.textAlign(TextAlign.Center);
                            Text.borderRadius(12);
                            Text.backgroundColor(Hive.Color.n100);
                        }, Text);
                        Text.pop();
                        this.observeComponentCreation2((f52, g52) => {
                            Text.create(e52.label);
                            Text.fontSize(10);
                            Text.fontColor(Hive.Color.n700);
                            Text.textAlign(TextAlign.Center);
                            Text.lineHeight(14);
                        }, Text);
                        Text.pop();
                        Column.pop();
                    };
                    this.forEachUpdateFunction(a52, z51, c52);
                }, ForEach);
                ForEach.pop();
                Row.pop();
            };
            this.forEachUpdateFunction(v51, FUNC_ROWS, x51);
        }, ForEach);
        ForEach.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class WHAIAssistant extends ViewPU {
    constructor(p51, q51, r51, s51 = -1, t51 = undefined, u51) {
        super(p51, r51, s51, u51);
        if (typeof t51 === "function") {
            this.paramsGenerator_ = t51;
        }
        this.setInitiallyProvidedValue(q51);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(o51: WHAIAssistant_Params) {
    }
    updateStateVars(n51: WHAIAssistant_Params) {
    }
    purgeVariableDependenciesOnElmtId(m51) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    aboutToAppear() {
        SensorDataClient.sliceImpression('AI_ASSISTANT', 'slice-ai', 4);
    }
    initialRender() {
        this.observeComponentCreation2((k51, l51) => {
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
        this.observeComponentCreation2((i51, j51) => {
            Text.create('✉️');
            Text.fontSize(20);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((g51, h51) => {
            Text.create('Hi，我是你的智能財富助理');
            Text.fontSize(11);
            Text.fontColor(Hive.Color.n600);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((e51, f51) => {
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
    constructor(y50, z50, a51, b51 = -1, c51 = undefined, d51) {
        super(y50, a51, b51, d51);
        if (typeof c51 === "function") {
            this.paramsGenerator_ = c51;
        }
        this.onDismiss = () => { };
        this.setInitiallyProvidedValue(z50);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(x50: WHAdBanner_Params) {
        if (x50.onDismiss !== undefined) {
            this.onDismiss = x50.onDismiss;
        }
    }
    updateStateVars(w50: WHAdBanner_Params) {
    }
    purgeVariableDependenciesOnElmtId(v50) {
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
        this.observeComponentCreation2((t50, u50) => {
            Stack.create({ alignContent: Alignment.TopEnd });
            Stack.margin({ left: 12, right: 12, top: 6, bottom: 6 });
        }, Stack);
        this.observeComponentCreation2((r50, s50) => {
            Row.create({ space: 12 });
            Row.width('100%');
            Row.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            Row.borderRadius(14);
            Row.linearGradient({ direction: GradientDirection.LeftTop,
                colors: [['#FFFBEB', 0], ['#FEF3C7', 1]] });
            Row.alignItems(VerticalAlign.Center);
        }, Row);
        this.observeComponentCreation2((p50, q50) => {
            Column.create({ space: 4 });
            Column.layoutWeight(1);
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((n50, o50) => {
            Text.create('春季播種黃金期');
            Text.fontSize(13);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor('#92400E');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((l50, m50) => {
            Text.create('配置正當時，播下「金種子」');
            Text.fontSize(10);
            Text.fontColor('#78716C');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((j50, k50) => {
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
        this.observeComponentCreation2((h50, i50) => {
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
        this.observeComponentCreation2((f50, g50) => {
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
    constructor(z49, a50, b50, c50 = -1, d50 = undefined, e50) {
        super(z49, b50, c50, e50);
        if (typeof d50 === "function") {
            this.paramsGenerator_ = d50;
        }
        this.setInitiallyProvidedValue(a50);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(y49: WHFlashLoan_Params) {
    }
    updateStateVars(x49: WHFlashLoan_Params) {
    }
    purgeVariableDependenciesOnElmtId(w49) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    aboutToAppear() {
        SensorDataClient.sliceImpression('FLASH_LOAN', 'slice-flash-loan', 6);
    }
    initialRender() {
        this.observeComponentCreation2((u49, v49) => {
            Row.create();
            Row.width('100%');
            Row.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            Row.margin({ left: 12, right: 12, top: 6, bottom: 6 });
            Row.borderRadius(14);
            Row.linearGradient({ direction: GradientDirection.LeftTop,
                colors: [['#FFF5F5', 0], ['#FFE4E4', 1]] });
            Row.alignItems(VerticalAlign.Center);
        }, Row);
        this.observeComponentCreation2((s49, t49) => {
            Column.create({ space: 2 });
            Column.layoutWeight(1);
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((q49, r49) => {
            Text.create('⚡ 閃電貸 極速放款');
            Text.fontSize(11);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.brandPrimary);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((o49, p49) => {
            Text.create('最高可借額度');
            Text.fontSize(10);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((m49, n49) => {
            Text.create('HKD 300,000.00');
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Bolder);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((k49, l49) => {
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
    constructor(e49, f49, g49, h49 = -1, i49 = undefined, j49) {
        super(e49, g49, h49, j49);
        if (typeof i49 === "function") {
            this.paramsGenerator_ = i49;
        }
        this.setInitiallyProvidedValue(f49);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(d49: WHWealthSelection_Params) {
    }
    updateStateVars(c49: WHWealthSelection_Params) {
    }
    purgeVariableDependenciesOnElmtId(b49) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    aboutToAppear() {
        SensorDataClient.sliceImpression('WEALTH_SELECTION', 'slice-wealth-sel', 7, 'wealth-selection-hk-2026');
    }
    initialRender() {
        this.observeComponentCreation2((z48, a49) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.padding({ left: 16, right: 16, top: 12, bottom: 12 });
        }, Column);
        this.observeComponentCreation2((x48, y48) => {
            Row.create();
            Row.width('100%');
            Row.margin({ bottom: 10 });
        }, Row);
        this.observeComponentCreation2((v48, w48) => {
            Text.create('財富精選');
            Text.fontSize(15);
            Text.fontWeight(FontWeight.Bold);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((t48, u48) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((r48, s48) => {
            Text.create('更多 ›');
            Text.fontSize(12);
            Text.fontColor(Hive.Color.brandPrimary);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((l47, m47) => {
            ForEach.create();
            const n47 = (o47, p47: number) => {
                const q47 = o47;
                this.observeComponentCreation2((p48, q48) => {
                    Row.create();
                    Row.width('100%');
                    Row.padding({ top: 10, bottom: 10 });
                    Row.onClick(() => { SensorDataClient.wealthProductTapped(q47.name, q47.id); });
                }, Row);
                this.observeComponentCreation2((n48, o48) => {
                    Column.create({ space: 2 });
                    Column.layoutWeight(1);
                    Column.alignItems(HorizontalAlign.Start);
                }, Column);
                this.observeComponentCreation2((l48, m48) => {
                    Text.create(q47.name);
                    Text.fontSize(12);
                    Text.fontWeight(FontWeight.Medium);
                    Text.fontColor(Hive.Color.n900);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((j48, k48) => {
                    Row.create({ space: 6 });
                }, Row);
                this.observeComponentCreation2((h48, i48) => {
                    Text.create(q47.risk);
                    Text.fontSize(9);
                    Text.fontColor(Hive.Color.n500);
                    Text.padding({ left: 6, right: 6, top: 1, bottom: 1 });
                    Text.borderRadius(8);
                    Text.backgroundColor(Hive.Color.n100);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((f48, g48) => {
                    Text.create(q47.redemption);
                    Text.fontSize(9);
                    Text.fontColor(Hive.Color.n500);
                    Text.padding({ left: 6, right: 6, top: 1, bottom: 1 });
                    Text.borderRadius(8);
                    Text.backgroundColor(Hive.Color.n100);
                }, Text);
                Text.pop();
                Row.pop();
                Column.pop();
                this.observeComponentCreation2((d48, e48) => {
                    Column.create({ space: 2 });
                    Column.alignItems(HorizontalAlign.End);
                }, Column);
                this.observeComponentCreation2((b48, c48) => {
                    Text.create(q47.yield7Day);
                    Text.fontSize(18);
                    Text.fontWeight(FontWeight.Bolder);
                    Text.fontColor(Hive.Color.brandPrimary);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((z47, a48) => {
                    Text.create('7日年化');
                    Text.fontSize(9);
                    Text.fontColor(Hive.Color.n400);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((v47, w47) => {
                    If.create();
                    if (q47.highlighted) {
                        this.ifElseBranchUpdateFunction(0, () => {
                            this.observeComponentCreation2((x47, y47) => {
                                Button.createWithLabel(q47.cta);
                                Button.height(28);
                                Button.padding({ left: 12, right: 12 });
                                Button.borderRadius(12);
                                Button.backgroundColor(Hive.Color.brandPrimary);
                                Button.fontColor(Hive.Color.brandWhite);
                                Button.fontSize(10);
                                Button.fontWeight(FontWeight.Bold);
                                Button.margin({ top: 4 });
                                Button.onClick(() => { SensorDataClient.wealthProductTapped(q47.name, q47.id); });
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
                this.observeComponentCreation2((r47, s47) => {
                    If.create();
                    if (p47 < WEALTH_PRODUCTS.length - 1) {
                        this.ifElseBranchUpdateFunction(0, () => {
                            this.observeComponentCreation2((t47, u47) => {
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
            this.forEachUpdateFunction(l47, WEALTH_PRODUCTS, n47, undefined, true, false);
        }, ForEach);
        ForEach.pop();
        this.observeComponentCreation2((j47, k47) => {
            Blank.create();
            Blank.height(10);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((h47, i47) => {
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
    constructor(b47, c47, d47, e47 = -1, f47 = undefined, g47) {
        super(b47, d47, e47, g47);
        if (typeof f47 === "function") {
            this.paramsGenerator_ = f47;
        }
        this.setInitiallyProvidedValue(c47);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(a47: WHFeaturedRankings_Params) {
    }
    updateStateVars(z46: WHFeaturedRankings_Params) {
    }
    purgeVariableDependenciesOnElmtId(y46) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    aboutToAppear() {
        SensorDataClient.sliceImpression('FEATURED_RANKINGS', 'slice-rankings', 8);
    }
    initialRender() {
        this.observeComponentCreation2((w46, x46) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.padding({ left: 16, right: 16, top: 12, bottom: 12 });
        }, Column);
        this.observeComponentCreation2((u46, v46) => {
            Row.create();
            Row.width('100%');
            Row.margin({ bottom: 10 });
        }, Row);
        this.observeComponentCreation2((s46, t46) => {
            Text.create('特色榜單');
            Text.fontSize(15);
            Text.fontWeight(FontWeight.Bold);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((q46, r46) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((o46, p46) => {
            Text.create('更多 ›');
            Text.fontSize(12);
            Text.fontColor(Hive.Color.brandPrimary);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((t45, u45) => {
            ForEach.create();
            const v45 = w45 => {
                const x45 = w45;
                this.observeComponentCreation2((m46, n46) => {
                    Row.create({ space: 12 });
                    Row.width('100%');
                    Row.padding({ top: 8, bottom: 8 });
                    Row.onClick(() => { SensorDataClient.rankingsTapped(x45.title, x45.badge); });
                }, Row);
                this.observeComponentCreation2((k46, l46) => {
                    Text.create(x45.icon);
                    Text.fontSize(24);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((i46, j46) => {
                    Column.create({ space: 2 });
                    Column.layoutWeight(1);
                    Column.alignItems(HorizontalAlign.Start);
                }, Column);
                this.observeComponentCreation2((g46, h46) => {
                    Text.create(x45.badge);
                    Text.fontSize(9);
                    Text.fontWeight(FontWeight.Bold);
                    Text.fontColor(Hive.Color.brandPrimary);
                    Text.padding({ left: 8, right: 8, top: 2, bottom: 2 });
                    Text.borderRadius(10);
                    Text.backgroundColor('#FEF2F2');
                }, Text);
                Text.pop();
                this.observeComponentCreation2((e46, f46) => {
                    Text.create(x45.title);
                    Text.fontSize(13);
                    Text.fontWeight(FontWeight.Bold);
                    Text.fontColor(Hive.Color.n900);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((c46, d46) => {
                    Text.create(x45.desc);
                    Text.fontSize(10);
                    Text.fontColor(Hive.Color.n500);
                }, Text);
                Text.pop();
                Column.pop();
                this.observeComponentCreation2((a46, b46) => {
                    Text.create('›');
                    Text.fontSize(16);
                    Text.fontColor(Hive.Color.n400);
                }, Text);
                Text.pop();
                Row.pop();
                this.observeComponentCreation2((y45, z45) => {
                    Divider.create();
                    Divider.color('#F9FAFB');
                }, Divider);
            };
            this.forEachUpdateFunction(t45, RANKINGS, v45);
        }, ForEach);
        ForEach.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class WHLifeDeals extends ViewPU {
    constructor(n45, o45, p45, q45 = -1, r45 = undefined, s45) {
        super(n45, p45, q45, s45);
        if (typeof r45 === "function") {
            this.paramsGenerator_ = r45;
        }
        this.bottomLinks = [
            { icon: '🎁', label: '達標抽好禮\n丰润守护 健康随行', deepLink: 'hsbc://campaign/health' },
            { icon: '🏦', label: '行庆招财日\n享受特惠禮遇', deepLink: 'hsbc://campaign/anniversary' },
        ];
        this.setInitiallyProvidedValue(o45);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(m45: WHLifeDeals_Params) {
        if (m45.bottomLinks !== undefined) {
            this.bottomLinks = m45.bottomLinks;
        }
    }
    updateStateVars(l45: WHLifeDeals_Params) {
    }
    purgeVariableDependenciesOnElmtId(k45) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    aboutToAppear() {
        SensorDataClient.sliceImpression('LIFE_DEALS', 'slice-life-deals', 9);
    }
    private bottomLinks: BottomLink[];
    initialRender() {
        this.observeComponentCreation2((i45, j45) => {
            Column.create({ space: 10 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.padding({ left: 16, right: 16, top: 12, bottom: 12 });
        }, Column);
        this.observeComponentCreation2((g45, h45) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((e45, f45) => {
            Text.create('生活特惠');
            Text.fontSize(15);
            Text.fontWeight(FontWeight.Bold);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((c45, d45) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((a45, b45) => {
            Text.create('更多 ›');
            Text.fontSize(12);
            Text.fontColor(Hive.Color.brandPrimary);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((y44, z44) => {
            Row.create({ space: 10 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((n44, o44) => {
            ForEach.create();
            const p44 = q44 => {
                const r44 = q44;
                this.observeComponentCreation2((w44, x44) => {
                    Column.create({ space: 0 });
                    Column.layoutWeight(1);
                    Column.borderRadius(12);
                    Column.clip(true);
                    Column.backgroundColor(Hive.Color.n50);
                    Column.onClick(() => { SensorDataClient.lifeDealTapped(r44.brand, r44.tag); });
                }, Column);
                this.observeComponentCreation2((u44, v44) => {
                    Text.create(r44.emoji);
                    Text.fontSize(24);
                    Text.width('100%');
                    Text.height(64);
                    Text.textAlign(TextAlign.Center);
                    Text.backgroundColor(Hive.Color.n100);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((s44, t44) => {
                    Text.create(r44.tag);
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
            this.forEachUpdateFunction(n44, DEALS, p44);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        this.observeComponentCreation2((l44, m44) => {
            Row.create({ space: 10 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((z43, a44) => {
            ForEach.create();
            const b44 = c44 => {
                const d44 = c44;
                this.observeComponentCreation2((i44, j44) => {
                    Row.create({ space: 8 });
                    Row.layoutWeight(1);
                    Row.padding(10);
                    Row.borderRadius(12);
                    Row.backgroundColor(Hive.Color.n50);
                    Row.alignItems(VerticalAlign.Center);
                    Row.onClick(() => {
                        const k44: Record<string, any> = {};
                        k44['deep_link'] = d44.deepLink as any;
                        SensorDataClient.track('bottom_link_tap', 'Wealth', 'bottom_link_tapped', d44.label, 'wealth_hub_hk', 'wealth_hub', '', '', '', '', '', '', '', '', k44);
                    });
                }, Row);
                this.observeComponentCreation2((g44, h44) => {
                    Text.create(d44.icon);
                    Text.fontSize(24);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((e44, f44) => {
                    Text.create(d44.label);
                    Text.fontSize(10);
                    Text.fontColor(Hive.Color.n700);
                    Text.lineHeight(16);
                }, Text);
                Text.pop();
                Row.pop();
            };
            this.forEachUpdateFunction(z43, this.bottomLinks, b44);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
