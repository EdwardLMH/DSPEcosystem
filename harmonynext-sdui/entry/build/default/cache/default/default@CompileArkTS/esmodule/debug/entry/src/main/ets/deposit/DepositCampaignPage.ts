if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface DepositHardcodedFAQ_Params {
    expandedIdx?: number;
    faqs?: FAQItem[];
}
interface DepositHardcodedCTA_Params {
}
interface DepositHardcodedRateTable_Params {
    rates?: RateRow[];
}
interface DepositCalloutBanner_Params {
}
interface DepositHeroBanner_Params {
}
interface DepositFAQSection_Params {
    props?: Record<string, ESObject>;
    expandedId?: string;
}
interface DepositOpenCTA_Params {
    props?: Record<string, ESObject>;
}
interface DepositRateTable_Params {
    props?: Record<string, ESObject>;
}
interface DepositPromoBanner_Params {
    props?: Record<string, ESObject>;
}
interface DepositHeaderBar_Params {
    title?: string;
    showBack?: boolean;
    onBack?: () => void;
}
interface DepositCampaignView_Params {
    loadState?: number;
    sdui?: WealthSlice[];
    onBack?: () => void;
}
interface DepositSDUISliceView_Params {
    slice?: WealthSlice;
    onBack?: () => void;
}
import { Hive } from "@normalized:N&&&entry/src/main/ets/common/HiveTokens&";
import { SensorDataClient } from "@normalized:N&&&entry/src/main/ets/network/SensorDataClient&";
import { fetchDepositCampaignScreen } from "@normalized:N&&&entry/src/main/ets/network/KYCNetworkService&";
import type { WealthSlice } from "@normalized:N&&&entry/src/main/ets/network/KYCNetworkService&";
// ─── Load-state enum ──────────────────────────────────────────────────────────
// ArkTS forbids string-union @State — plain number constants are used instead.
const LOAD_IDLE = 0;
const LOAD_LOADING = 1;
const LOAD_DONE = 2;
const LOAD_ERROR = 3;
class DepositSDUISliceView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.slice = { instanceId: '', type: '', props: {}, visible: true };
        this.onBack = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: DepositSDUISliceView_Params) {
        if (params.slice !== undefined) {
            this.slice = params.slice;
        }
        if (params.onBack !== undefined) {
            this.onBack = params.onBack;
        }
    }
    updateStateVars(params: DepositSDUISliceView_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private slice: WealthSlice;
    private onBack: () => void;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.slice.visible === false) {
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
                                let componentCall = new DepositHeaderBar(this, {
                                    title: this.slice.props['title'] as string ?? 'Renminbi Savings Offers',
                                    showBack: this.slice.props['showBackButton'] as boolean ?? true,
                                    onBack: this.onBack
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/deposit/DepositCampaignPage.ets", line: 35, col: 7 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        title: this.slice.props['title'] as string ?? 'Renminbi Savings Offers',
                                        showBack: this.slice.props['showBackButton'] as boolean ?? true,
                                        onBack: this.onBack
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "DepositHeaderBar" });
                    }
                });
            }
            else if (this.slice.type === 'PROMO_BANNER') {
                this.ifElseBranchUpdateFunction(1, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new DepositPromoBanner(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/deposit/DepositCampaignPage.ets", line: 41, col: 7 });
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
                        }, { name: "DepositPromoBanner" });
                    }
                });
            }
            else if (this.slice.type === 'DEPOSIT_RATE_TABLE') {
                this.ifElseBranchUpdateFunction(2, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new DepositRateTable(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/deposit/DepositCampaignPage.ets", line: 43, col: 7 });
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
                        }, { name: "DepositRateTable" });
                    }
                });
            }
            else if (this.slice.type === 'DEPOSIT_OPEN_CTA') {
                this.ifElseBranchUpdateFunction(3, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new DepositOpenCTA(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/deposit/DepositCampaignPage.ets", line: 45, col: 7 });
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
                        }, { name: "DepositOpenCTA" });
                    }
                });
            }
            else if (this.slice.type === 'DEPOSIT_FAQ') {
                this.ifElseBranchUpdateFunction(4, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new DepositFAQSection(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/deposit/DepositCampaignPage.ets", line: 47, col: 7 });
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
                        }, { name: "DepositFAQSection" });
                    }
                });
            }
            else if (this.slice.type === 'SPACER') {
                this.ifElseBranchUpdateFunction(5, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                        Blank.height((this.slice.props['height'] as number) ?? 16);
                    }, Blank);
                    Blank.pop();
                });
            }
            // unknown types silently omitted
            else {
                this.ifElseBranchUpdateFunction(6, () => {
                });
            }
        }, If);
        If.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
export class DepositCampaignView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__loadState = new ObservedPropertySimplePU(LOAD_IDLE, this, "loadState");
        this.__sdui = new ObservedPropertyObjectPU([], this, "sdui");
        this.onBack = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: DepositCampaignView_Params) {
        if (params.loadState !== undefined) {
            this.loadState = params.loadState;
        }
        if (params.sdui !== undefined) {
            this.sdui = params.sdui;
        }
        if (params.onBack !== undefined) {
            this.onBack = params.onBack;
        }
    }
    updateStateVars(params: DepositCampaignView_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__loadState.purgeDependencyOnElmtId(rmElmtId);
        this.__sdui.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__loadState.aboutToBeDeleted();
        this.__sdui.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __loadState: ObservedPropertySimplePU<number>;
    get loadState() {
        return this.__loadState.get();
    }
    set loadState(newValue: number) {
        this.__loadState.set(newValue);
    }
    private __sdui: ObservedPropertyObjectPU<WealthSlice[]>;
    get sdui() {
        return this.__sdui.get();
    }
    set sdui(newValue: WealthSlice[]) {
        this.__sdui.set(newValue);
    }
    private onBack: () => void;
    aboutToAppear() {
        SensorDataClient.track('deposit_campaign_viewed', 'Deposit', 'page_viewed', '', 'deposit_campaign_hk', 'deposit_campaign');
        this.loadFromBFF();
    }
    private async loadFromBFF(): Promise<void> {
        this.loadState = LOAD_LOADING;
        try {
            const payload = await fetchDepositCampaignScreen();
            this.sdui = payload.layout.children.filter((s: WealthSlice) => s.visible !== false);
            this.loadState = LOAD_DONE;
        }
        catch (_e) {
            this.loadState = LOAD_ERROR;
        }
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.height('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.loadState === LOAD_LOADING) {
                this.ifElseBranchUpdateFunction(0, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new DepositHeaderBar(this, { title: 'Renminbi Savings Offers', showBack: true, onBack: this.onBack }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/deposit/DepositCampaignPage.ets", line: 83, col: 9 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        title: 'Renminbi Savings Offers',
                                        showBack: true,
                                        onBack: this.onBack
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "DepositHeaderBar" });
                    }
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.width('100%');
                        Row.layoutWeight(1);
                        Row.justifyContent(FlexAlign.Center);
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        LoadingProgress.create();
                        LoadingProgress.width(36);
                        LoadingProgress.height(36);
                        LoadingProgress.color(Hive.Color.brandPrimary);
                    }, LoadingProgress);
                    Row.pop();
                });
            }
            else if (this.loadState === LOAD_DONE && this.sdui.length > 0) {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // SDUI path — render all slices from BFF
                        Scroll.create();
                        // SDUI path — render all slices from BFF
                        Scroll.width('100%');
                        // SDUI path — render all slices from BFF
                        Scroll.layoutWeight(1);
                        // SDUI path — render all slices from BFF
                        Scroll.backgroundColor(Hive.Color.n50);
                    }, Scroll);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 0 });
                        Column.width('100%');
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const slice = _item;
                            {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    if (isInitialRender) {
                                        let componentCall = new DepositSDUISliceView(this, { slice: slice, onBack: this.onBack }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/deposit/DepositCampaignPage.ets", line: 96, col: 17 });
                                        ViewPU.create(componentCall);
                                        let paramsLambda = () => {
                                            return {
                                                slice: slice,
                                                onBack: this.onBack
                                            };
                                        };
                                        componentCall.paramsGenerator_ = paramsLambda;
                                    }
                                    else {
                                        this.updateStateVarsOfChildByElmtId(elmtId, {});
                                    }
                                }, { name: "DepositSDUISliceView" });
                            }
                        };
                        this.forEachUpdateFunction(elmtId, this.sdui, forEachItemGenFunction);
                    }, ForEach);
                    ForEach.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                        Blank.height(32);
                    }, Blank);
                    Blank.pop();
                    Column.pop();
                    // SDUI path — render all slices from BFF
                    Scroll.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(2, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // Static fallback
                        Scroll.create();
                        // Static fallback
                        Scroll.width('100%');
                        // Static fallback
                        Scroll.layoutWeight(1);
                        // Static fallback
                        Scroll.backgroundColor(Hive.Color.n50);
                    }, Scroll);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 0 });
                        Column.width('100%');
                    }, Column);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new DepositHeaderBar(this, { title: 'Renminbi Savings Offers', showBack: true, onBack: this.onBack }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/deposit/DepositCampaignPage.ets", line: 107, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        title: 'Renminbi Savings Offers',
                                        showBack: true,
                                        onBack: this.onBack
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "DepositHeaderBar" });
                    }
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new DepositHeroBanner(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/deposit/DepositCampaignPage.ets", line: 108, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "DepositHeroBanner" });
                    }
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new DepositCalloutBanner(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/deposit/DepositCampaignPage.ets", line: 109, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "DepositCalloutBanner" });
                    }
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new DepositHardcodedRateTable(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/deposit/DepositCampaignPage.ets", line: 110, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "DepositHardcodedRateTable" });
                    }
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new DepositHardcodedCTA(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/deposit/DepositCampaignPage.ets", line: 111, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "DepositHardcodedCTA" });
                    }
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                        Blank.height(16);
                    }, Blank);
                    Blank.pop();
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new DepositHardcodedFAQ(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/deposit/DepositCampaignPage.ets", line: 113, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "DepositHardcodedFAQ" });
                    }
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                        Blank.height(32);
                    }, Blank);
                    Blank.pop();
                    Column.pop();
                    // Static fallback
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
class DepositHeaderBar extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.title = 'Renminbi Savings Offers';
        this.showBack = true;
        this.onBack = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: DepositHeaderBar_Params) {
        if (params.title !== undefined) {
            this.title = params.title;
        }
        if (params.showBack !== undefined) {
            this.showBack = params.showBack;
        }
        if (params.onBack !== undefined) {
            this.onBack = params.onBack;
        }
    }
    updateStateVars(params: DepositHeaderBar_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private title: string;
    private showBack: boolean;
    private onBack: () => void;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.width('100%');
            Row.height(50);
            Row.padding({ left: 14, right: 14, top: 8, bottom: 8 });
            Row.backgroundColor(Hive.Color.brandWhite);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.showBack) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('‹');
                        Text.fontSize(22);
                        Text.fontColor(Hive.Color.n800);
                        Text.onClick(() => {
                            SensorDataClient.track('back_tap', 'Deposit', 'back_tapped', '', 'deposit_campaign_hk', 'deposit_campaign');
                            this.onBack();
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
            Text.create(this.title);
            Text.fontSize(17);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
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
class DepositPromoBanner extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: DepositPromoBanner_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
    }
    updateStateVars(params: DepositPromoBanner_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    private bgColor(): string { return this.props['backgroundColor'] as string ?? '#FFFFFF'; }
    private imageUrl(): string {
        const raw = this.props['imageUrl'] as string ?? '';
        // If BFF returned a full URL with localhost, rewrite host to emulator loopback
        if (raw.indexOf('http://localhost:4000') === 0) {
            return raw.replace('http://localhost:4000', 'http://10.0.2.2:4000');
        }
        // If BFF returned a relative /media/ path, prepend emulator base
        if (raw.indexOf('/media/') === 0) {
            return 'http://10.0.2.2:4000' + raw;
        }
        // Already an absolute URL pointing to the right host — use as-is
        return raw;
    }
    private title(): string { return this.props['title'] as string ?? ''; }
    private subtitle(): string { return this.props['subtitle'] as string ?? ''; }
    private badge(): string { return this.props['badgeText'] as string ?? ''; }
    private textColor(): string { return this.props['textColor'] as string ?? '#92400E'; }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.props['imageUrl'] !== undefined && this.imageUrl().length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // Full-width image banner
                        Image.create(this.imageUrl());
                        // Full-width image banner
                        Image.width('100%');
                        // Full-width image banner
                        Image.height(200);
                        // Full-width image banner
                        Image.objectFit(ImageFit.Cover);
                    }, Image);
                });
            }
            else if (this.title().length > 0) {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // Text-only callout banner
                        Column.create({ space: 8 });
                        // Text-only callout banner
                        Column.width('100%');
                        // Text-only callout banner
                        Column.alignItems(HorizontalAlign.Start);
                        // Text-only callout banner
                        Column.padding(16);
                        // Text-only callout banner
                        Column.backgroundColor(this.bgColor());
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (this.badge().length > 0) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create(this.badge());
                                    Text.fontSize(10);
                                    Text.fontWeight(FontWeight.Bold);
                                    Text.fontColor(this.textColor());
                                    Text.padding({ left: 10, right: 10, top: 3, bottom: 3 });
                                    Text.backgroundColor('#1A92400E');
                                    Text.borderRadius(20);
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
                        Text.fontWeight(FontWeight.Bold);
                        Text.fontColor(this.textColor());
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (this.subtitle().length > 0) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create(this.subtitle());
                                    Text.fontSize(13);
                                    Text.fontColor(this.textColor());
                                    Text.opacity(0.8);
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
                    // Text-only callout banner
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(2, () => {
                });
            }
        }, If);
        If.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
// ─── 3. Deposit Rate Table ────────────────────────────────────────────────────
interface RateRow {
    term: string;
    rate: string;
}
class DepositRateTable extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: DepositRateTable_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
    }
    updateStateVars(params: DepositRateTable_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    private sectionTitle(): string { return this.props['sectionTitle'] as string ?? 'Time Deposit Rate:'; }
    private asAtDate(): string { return this.props['asAtDate'] as string ?? ''; }
    private footnote(): string { return this.props['footnote'] as string ?? ''; }
    private rows(): RateRow[] {
        const raw = this.props['rates'] as Array<Record<string, string>>;
        if (!raw) {
            return [];
        }
        return raw.map((row: Record<string, string>) => {
            return { term: row['term'] ?? '', rate: row['rate'] ?? '' } as RateRow;
        });
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.onAppear(() => {
                SensorDataClient.track('slice_impression', 'Deposit', 'DEPOSIT_RATE_TABLE', 'dep-rate-table', 'deposit_campaign_hk', 'deposit_campaign');
            });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Section header
            Row.create();
            // Section header
            Row.width('100%');
            // Section header
            Row.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            // Section header
            Row.backgroundColor(Hive.Color.n50);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.sectionTitle());
            Text.fontSize(13);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.asAtDate().length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('As at ' + this.asAtDate());
                        Text.fontSize(10);
                        Text.fontColor(Hive.Color.n400);
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
        // Section header
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Column headers
            Row.create();
            // Column headers
            Row.width('100%');
            // Column headers
            Row.padding({ left: 16, right: 16, top: 8, bottom: 8 });
            // Column headers
            Row.backgroundColor('#F5F6F8');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Term');
            Text.fontSize(12);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(Hive.Color.n500);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Interest Rate (p.a.)');
            Text.fontSize(12);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        // Column headers
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Rate rows
            ForEach.create();
            const forEachItemGenFunction = (_item, idx: number) => {
                const row = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 0 });
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create();
                    Row.width('100%');
                    Row.padding({ left: 16, right: 16, top: 12, bottom: 12 });
                    Row.backgroundColor(idx % 2 === 0 ? Hive.Color.brandWhite : Hive.Color.n50);
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(row.term);
                    Text.fontSize(13);
                    Text.fontColor(Hive.Color.n700);
                    Text.layoutWeight(1);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(row.rate + '%');
                    Text.fontSize(15);
                    Text.fontWeight(FontWeight.Bold);
                    Text.fontColor(Hive.Color.brandPrimary);
                }, Text);
                Text.pop();
                Row.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Divider.create();
                    Divider.color(Hive.Color.n100);
                    Divider.margin({ left: 16 });
                }, Divider);
                Column.pop();
            };
            this.forEachUpdateFunction(elmtId, this.rows(), forEachItemGenFunction, undefined, true, false);
        }, ForEach);
        // Rate rows
        ForEach.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // Footnote
            if (this.footnote().length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.footnote());
                        Text.fontSize(10);
                        Text.fontColor(Hive.Color.n400);
                        Text.width('100%');
                        Text.padding({ left: 16, right: 16, top: 10, bottom: 10 });
                        Text.backgroundColor(Hive.Color.n50);
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
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class DepositOpenCTA extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: DepositOpenCTA_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
    }
    updateStateVars(params: DepositOpenCTA_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    private label(): string { return this.props['label'] as string ?? 'Open a Deposit'; }
    private bgColor(): string { return this.props['backgroundColor'] as string ?? '#C41E3A'; }
    private deepLink(): string { return this.props['deepLink'] as string ?? 'hsbc://deposit/open'; }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel(this.label());
            Button.width('100%');
            Button.height(52);
            Button.fontSize(16);
            Button.fontWeight(FontWeight.Bold);
            Button.fontColor('#FFFFFF');
            Button.backgroundColor(this.bgColor());
            Button.borderRadius(12);
            Button.margin({ left: 16, right: 16, top: 12, bottom: 12 });
            Button.onClick(() => {
                SensorDataClient.track('deposit_cta_tap', 'Deposit', 'open_deposit_tapped', this.deepLink(), 'deposit_campaign_hk', 'deposit_campaign');
            });
            Button.onAppear(() => {
                SensorDataClient.track('slice_impression', 'Deposit', 'DEPOSIT_OPEN_CTA', 'dep-open-cta', 'deposit_campaign_hk', 'deposit_campaign');
            });
        }, Button);
        Button.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
// ─── 5. FAQ Section ───────────────────────────────────────────────────────────
interface FAQItem {
    id: string;
    question: string;
    answer: string;
}
class DepositFAQSection extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.__expandedId = new ObservedPropertySimplePU('', this, "expandedId");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: DepositFAQSection_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
        if (params.expandedId !== undefined) {
            this.expandedId = params.expandedId;
        }
    }
    updateStateVars(params: DepositFAQSection_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__expandedId.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__expandedId.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    private __expandedId: ObservedPropertySimplePU<string>;
    get expandedId() {
        return this.__expandedId.get();
    }
    set expandedId(newValue: string) {
        this.__expandedId.set(newValue);
    }
    private sectionTitle(): string { return this.props['sectionTitle'] as string ?? 'Frequently Asked Questions'; }
    private items(): FAQItem[] {
        const raw = this.props['items'] as Array<Record<string, string>>;
        if (!raw) {
            return [];
        }
        return raw.map((item: Record<string, string>) => {
            return { id: item['id'] ?? '', question: item['question'] ?? '', answer: item['answer'] ?? '' } as FAQItem;
        });
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.onAppear(() => {
                SensorDataClient.track('slice_impression', 'Deposit', 'DEPOSIT_FAQ', 'dep-faq', 'deposit_campaign_hk', 'deposit_campaign');
            });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Section header
            Text.create(this.sectionTitle());
            // Section header
            Text.fontSize(13);
            // Section header
            Text.fontWeight(FontWeight.Medium);
            // Section header
            Text.fontColor(Hive.Color.n700);
            // Section header
            Text.width('100%');
            // Section header
            Text.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            // Section header
            Text.backgroundColor(Hive.Color.n50);
        }, Text);
        // Section header
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = (_item, idx: number) => {
                const item = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 0 });
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    // Question row
                    Row.create({ space: 12 });
                    // Question row
                    Row.width('100%');
                    // Question row
                    Row.padding({ left: 16, right: 16, top: 14, bottom: 14 });
                    // Question row
                    Row.backgroundColor(Hive.Color.brandWhite);
                    // Question row
                    Row.onClick(() => {
                        this.expandedId = this.expandedId === item.id ? '' : item.id;
                    });
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(item.question);
                    Text.fontSize(13);
                    Text.fontColor(Hive.Color.n800);
                    Text.layoutWeight(1);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(this.expandedId === item.id ? '∧' : '∨');
                    Text.fontSize(13);
                    Text.fontColor(Hive.Color.n400);
                }, Text);
                Text.pop();
                // Question row
                Row.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    If.create();
                    // Answer (shown when expanded)
                    if (this.expandedId === item.id) {
                        this.ifElseBranchUpdateFunction(0, () => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create(item.answer);
                                Text.fontSize(13);
                                Text.fontColor(Hive.Color.n500);
                                Text.width('100%');
                                Text.padding({ left: 16, right: 16, bottom: 14 });
                                Text.backgroundColor(Hive.Color.brandWhite);
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
                    Divider.create();
                    Divider.color(Hive.Color.n100);
                    Divider.margin({ left: 16 });
                }, Divider);
                Column.pop();
            };
            this.forEachUpdateFunction(elmtId, this.items(), forEachItemGenFunction, undefined, true, false);
        }, ForEach);
        ForEach.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class DepositHeroBanner extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: DepositHeroBanner_Params) {
    }
    updateStateVars(params: DepositHeroBanner_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create({ alignContent: Alignment.Center });
            Stack.width('100%');
            Stack.height(200);
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.height(200);
            Column.backgroundColor('#1A3A6B');
        }, Column);
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 8 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🏦');
            Text.fontSize(48);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('New Fund Deposit Campaign');
            Text.fontSize(13);
            Text.fontColor('#D9FFFFFF');
            Text.textAlign(TextAlign.Center);
            Text.padding({ left: 16, right: 16 });
        }, Text);
        Text.pop();
        Column.pop();
        Stack.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class DepositCalloutBanner extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: DepositCalloutBanner_Params) {
    }
    updateStateVars(params: DepositCalloutBanner_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 8 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
            Column.padding(16);
            Column.backgroundColor('#FFF7ED');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🔥 New Funds Only');
            Text.fontSize(10);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor('#92400E');
            Text.padding({ left: 10, right: 10, top: 3, bottom: 3 });
            Text.backgroundColor('#1A92400E');
            Text.borderRadius(20);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🌟 Up to 1.15% p.a. Annual Equivalent Rate');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor('#92400E');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('3-Month New Fund CNY Transferable CD — exclusively for new deposits. Don\'t miss this limited-time rate.');
            Text.fontSize(13);
            Text.fontColor('#92400E');
            Text.opacity(0.8);
        }, Text);
        Text.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class DepositHardcodedRateTable extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.rates = [
            { term: '3 Month Time Deposit', rate: '0.65' },
            { term: '6 Month Time Deposit', rate: '0.85' },
            { term: '12 Month Time Deposit', rate: '0.95' },
            { term: '24 Month Time Deposit', rate: '1.05' },
            { term: '36 Month Time Deposit', rate: '1.25' },
            { term: '60 Month Time Deposit', rate: '1.30' },
        ];
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: DepositHardcodedRateTable_Params) {
        if (params.rates !== undefined) {
            this.rates = params.rates;
        }
    }
    updateStateVars(params: DepositHardcodedRateTable_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private readonly rates: RateRow[];
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            Row.backgroundColor(Hive.Color.n50);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Time Deposit Rate:');
            Text.fontSize(13);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('As at 5/22/2025');
            Text.fontSize(10);
            Text.fontColor(Hive.Color.n400);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.padding({ left: 16, right: 16, top: 8, bottom: 8 });
            Row.backgroundColor('#F5F6F8');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Term');
            Text.fontSize(12);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(Hive.Color.n500);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Interest Rate (p.a.)');
            Text.fontSize(12);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = (_item, idx: number) => {
                const row = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 0 });
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create();
                    Row.width('100%');
                    Row.padding({ left: 16, right: 16, top: 12, bottom: 12 });
                    Row.backgroundColor(idx % 2 === 0 ? Hive.Color.brandWhite : Hive.Color.n50);
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(row.term);
                    Text.fontSize(13);
                    Text.fontColor(Hive.Color.n700);
                    Text.layoutWeight(1);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(row.rate + '%');
                    Text.fontSize(15);
                    Text.fontWeight(FontWeight.Bold);
                    Text.fontColor(Hive.Color.brandPrimary);
                }, Text);
                Text.pop();
                Row.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Divider.create();
                    Divider.color(Hive.Color.n100);
                    Divider.margin({ left: 16 });
                }, Divider);
                Column.pop();
            };
            this.forEachUpdateFunction(elmtId, this.rates, forEachItemGenFunction, undefined, true, false);
        }, ForEach);
        ForEach.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Time deposit minimum balance for Personal Banking customers: RMB50. New Fund refers to funds not previously held with HSBC.');
            Text.fontSize(10);
            Text.fontColor(Hive.Color.n400);
            Text.width('100%');
            Text.padding({ left: 16, right: 16, top: 10, bottom: 10 });
            Text.backgroundColor(Hive.Color.n50);
        }, Text);
        Text.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class DepositHardcodedCTA extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: DepositHardcodedCTA_Params) {
    }
    updateStateVars(params: DepositHardcodedCTA_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('Open a Deposit');
            Button.width('100%');
            Button.height(52);
            Button.fontSize(16);
            Button.fontWeight(FontWeight.Bold);
            Button.fontColor('#FFFFFF');
            Button.backgroundColor('#C41E3A');
            Button.borderRadius(12);
            Button.margin({ left: 16, right: 16, top: 12, bottom: 12 });
            Button.onClick(() => {
                SensorDataClient.track('deposit_cta_tap', 'Deposit', 'open_deposit_tapped', 'hsbc://deposit/open?currency=CNY&campaign=new-fund', 'deposit_campaign_hk', 'deposit_campaign');
            });
        }, Button);
        Button.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class DepositHardcodedFAQ extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__expandedIdx = new ObservedPropertySimplePU(-1, this, "expandedIdx");
        this.faqs = [
            { id: 'faq-1', question: 'Can I withdraw my time deposit before it matures?',
                answer: 'Yes, you can. But you\'ll earn less or no interest, and may have to pay an early withdrawal fee. For foreign currency deposits, visit a bank branch.' },
            { id: 'faq-2', question: 'What happens if I don\'t withdraw my money after maturity?',
                answer: 'If you don\'t take out your money when it matures, most banks will automatically renew your deposit for the same term at the current interest rate. You can also choose to withdraw it or change the term before maturity.' },
            { id: 'faq-3', question: 'How long can I keep a time deposit?',
                answer: 'Banks usually offer terms like 3 months, 6 months, 1 year, 2 years, 3 years, 5 years, or even 10 years. Longer terms usually have higher interest rates.' },
            { id: 'faq-4', question: 'Why is the interest rate higher for time deposits than regular savings accounts?',
                answer: 'Banks can offer better rates because they know you\'ll keep your money in the account for a fixed period. This lets them use the funds for longer-term investments, so they share more of the profit with you as interest.' },
        ];
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: DepositHardcodedFAQ_Params) {
        if (params.expandedIdx !== undefined) {
            this.expandedIdx = params.expandedIdx;
        }
        if (params.faqs !== undefined) {
            this.faqs = params.faqs;
        }
    }
    updateStateVars(params: DepositHardcodedFAQ_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__expandedIdx.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__expandedIdx.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __expandedIdx: ObservedPropertySimplePU<number>;
    get expandedIdx() {
        return this.__expandedIdx.get();
    }
    set expandedIdx(newValue: number) {
        this.__expandedIdx.set(newValue);
    }
    private readonly faqs: FAQItem[];
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Frequently Asked Questions');
            Text.fontSize(13);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(Hive.Color.n700);
            Text.width('100%');
            Text.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            Text.backgroundColor(Hive.Color.n50);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = (_item, idx: number) => {
                const item = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 0 });
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create({ space: 12 });
                    Row.width('100%');
                    Row.padding({ left: 16, right: 16, top: 14, bottom: 14 });
                    Row.backgroundColor(Hive.Color.brandWhite);
                    Row.onClick(() => { this.expandedIdx = this.expandedIdx === idx ? -1 : idx; });
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(item.question);
                    Text.fontSize(13);
                    Text.fontColor(Hive.Color.n800);
                    Text.layoutWeight(1);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(this.expandedIdx === idx ? '∧' : '∨');
                    Text.fontSize(13);
                    Text.fontColor(Hive.Color.n400);
                }, Text);
                Text.pop();
                Row.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    If.create();
                    if (this.expandedIdx === idx) {
                        this.ifElseBranchUpdateFunction(0, () => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create(item.answer);
                                Text.fontSize(13);
                                Text.fontColor(Hive.Color.n500);
                                Text.width('100%');
                                Text.padding({ left: 16, right: 16, bottom: 14 });
                                Text.backgroundColor(Hive.Color.brandWhite);
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
                    Divider.create();
                    Divider.color(Hive.Color.n100);
                    Divider.margin({ left: 16 });
                }, Divider);
                Column.pop();
            };
            this.forEachUpdateFunction(elmtId, this.faqs, forEachItemGenFunction, undefined, true, false);
        }, ForEach);
        ForEach.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
