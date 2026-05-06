if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface FXContactRMCTA_Params {
    label?: string;
    subLabel?: string;
    bgColor?: string;
}
interface FXHardcodedBriefing_Params {
    bullets?: string[];
}
interface FXMarketBriefing_Params {
    props?: Record<string, ESObject>;
}
interface FXVideoThumbnail_Params {
    title?: string;
    presenterName?: string;
    presenterTitle?: string;
    onPlay?: () => void;
}
interface FXVideoPlayer_Params {
    props?: Record<string, ESObject>;
    isPlaying?: boolean;
}
interface FXHeaderNavBar_Params {
    title?: string;
    showBackButton?: boolean;
    onBack?: () => void;
}
interface FXViewpointView_Params {
    loadState?: number;
    sdui?: WealthSlice[];
    onBack?: () => void;
}
interface FXSDUISliceView_Params {
    slice?: WealthSlice;
    onBack?: () => void;
}
import { Hive } from "@normalized:N&&&entry/src/main/ets/common/HiveTokens&";
import { SensorDataClient } from "@normalized:N&&&entry/src/main/ets/network/SensorDataClient&";
import { fetchFXViewpointScreen } from "@normalized:N&&&entry/src/main/ets/network/KYCNetworkService&";
import type { WealthSlice } from "@normalized:N&&&entry/src/main/ets/network/KYCNetworkService&";
// ─── Load-state enum ──────────────────────────────────────────────────────────
// ArkTS forbids string-union @State — plain number constants are used instead.
const LOAD_IDLE = 0;
const LOAD_LOADING = 1;
const LOAD_DONE = 2;
const LOAD_ERROR = 3;
class FXSDUISliceView extends ViewPU {
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
    setInitiallyProvidedValue(params: FXSDUISliceView_Params) {
        if (params.slice !== undefined) {
            this.slice = params.slice;
        }
        if (params.onBack !== undefined) {
            this.onBack = params.onBack;
        }
    }
    updateStateVars(params: FXSDUISliceView_Params) {
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
                                let componentCall = new FXHeaderNavBar(this, {
                                    title: this.slice.props['title'] as string ?? 'FX Viewpoint',
                                    showBackButton: this.slice.props['showBackButton'] as boolean ?? true,
                                    onBack: this.onBack
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/fxviewpoint/FXViewpointPage.ets", line: 35, col: 7 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        title: this.slice.props['title'] as string ?? 'FX Viewpoint',
                                        showBackButton: this.slice.props['showBackButton'] as boolean ?? true,
                                        onBack: this.onBack
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "FXHeaderNavBar" });
                    }
                });
            }
            else if (this.slice.type === 'VIDEO_PLAYER' || this.slice.type === 'MARKET_INSIGHT_VIDEO') {
                this.ifElseBranchUpdateFunction(1, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new FXVideoPlayer(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/fxviewpoint/FXViewpointPage.ets", line: 41, col: 7 });
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
                        }, { name: "FXVideoPlayer" });
                    }
                });
            }
            else if (this.slice.type === 'MARKET_BRIEFING_TEXT') {
                this.ifElseBranchUpdateFunction(2, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new FXMarketBriefing(this, { props: this.slice.props }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/fxviewpoint/FXViewpointPage.ets", line: 43, col: 7 });
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
                        }, { name: "FXMarketBriefing" });
                    }
                });
            }
            else if (this.slice.type === 'CONTACT_RM_CTA') {
                this.ifElseBranchUpdateFunction(3, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // Rendered as sticky overlay in root; skip inline rendering
                        Column.create();
                    }, Column);
                    // Rendered as sticky overlay in root; skip inline rendering
                    Column.pop();
                });
            }
            // unknown types silently omitted
            else {
                this.ifElseBranchUpdateFunction(4, () => {
                });
            }
        }, If);
        If.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
export class FXViewpointView extends ViewPU {
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
    setInitiallyProvidedValue(params: FXViewpointView_Params) {
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
    updateStateVars(params: FXViewpointView_Params) {
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
        SensorDataClient.track('fx_viewpoint_viewed', 'FXViewpoint', 'page_viewed', '', 'fx_viewpoint_hk', 'fx_viewpoint');
        this.loadFromBFF();
    }
    private async loadFromBFF(): Promise<void> {
        this.loadState = LOAD_LOADING;
        try {
            const payload = await fetchFXViewpointScreen();
            this.sdui = payload.layout.children.filter((s: WealthSlice) => s.visible !== false);
            this.loadState = LOAD_DONE;
        }
        catch (_e) {
            this.loadState = LOAD_ERROR;
        }
    }
    private stickySlice(): WealthSlice | undefined {
        return this.sdui.find((s: WealthSlice) => s.type === 'CONTACT_RM_CTA' && (s.props['sticky'] as boolean) === true);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create({ alignContent: Alignment.Bottom });
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
                                let componentCall = new FXHeaderNavBar(this, { title: 'FX Viewpoint', showBackButton: true, onBack: this.onBack }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/fxviewpoint/FXViewpointPage.ets", line: 88, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        title: 'FX Viewpoint',
                                        showBackButton: true,
                                        onBack: this.onBack
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "FXHeaderNavBar" });
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
                        // SDUI path — render body slices (skip sticky CTA; rendered below)
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const slice = _item;
                            {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    if (isInitialRender) {
                                        let componentCall = new FXSDUISliceView(this, { slice: slice, onBack: this.onBack }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/fxviewpoint/FXViewpointPage.ets", line: 99, col: 17 });
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
                                }, { name: "FXSDUISliceView" });
                            }
                        };
                        this.forEachUpdateFunction(elmtId, this.sdui.filter((s: WealthSlice) => s.type !== 'CONTACT_RM_CTA'), forEachItemGenFunction);
                    }, ForEach);
                    // SDUI path — render body slices (skip sticky CTA; rendered below)
                    ForEach.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(2, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new 
                                // Static fallback
                                FXHeaderNavBar(this, { title: 'FX Viewpoint', showBackButton: true, onBack: this.onBack }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/fxviewpoint/FXViewpointPage.ets", line: 104, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        title: 'FX Viewpoint',
                                        showBackButton: true,
                                        onBack: this.onBack
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "FXHeaderNavBar" });
                    }
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new FXVideoThumbnail(this, {
                                    title: 'FX Viewpoint — EUR & GBP Market Insights (May 2026)',
                                    presenterName: 'Jackie Wong',
                                    presenterTitle: 'FX Strategist, HSBC Global Research',
                                    onPlay: () => { }
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/fxviewpoint/FXViewpointPage.ets", line: 105, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        title: 'FX Viewpoint — EUR & GBP Market Insights (May 2026)',
                                        presenterName: 'Jackie Wong',
                                        presenterTitle: 'FX Strategist, HSBC Global Research',
                                        onPlay: () => { }
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "FXVideoThumbnail" });
                    }
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new FXHardcodedBriefing(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/fxviewpoint/FXViewpointPage.ets", line: 111, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "FXHardcodedBriefing" });
                    }
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Bottom padding so content clears the sticky CTA
            Blank.create();
            // Bottom padding so content clears the sticky CTA
            Blank.height(72);
        }, Blank);
        // Bottom padding so content clears the sticky CTA
        Blank.pop();
        Column.pop();
        Scroll.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // ── Sticky Contact RM CTA ─────────────────────────────────────────────
            if (this.loadState === LOAD_DONE && this.stickySlice() !== undefined) {
                this.ifElseBranchUpdateFunction(0, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new FXContactRMCTA(this, {
                                    label: this.stickySlice()!.props['label'] as string ?? 'Contact Your RM',
                                    subLabel: this.stickySlice()!.props['subLabel'] as string ?? '',
                                    bgColor: this.stickySlice()!.props['backgroundColor'] as string ?? '#DB0011'
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/fxviewpoint/FXViewpointPage.ets", line: 121, col: 9 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        label: this.stickySlice()!.props['label'] as string ?? 'Contact Your RM',
                                        subLabel: this.stickySlice()!.props['subLabel'] as string ?? '',
                                        bgColor: this.stickySlice()!.props['backgroundColor'] as string ?? '#DB0011'
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "FXContactRMCTA" });
                    }
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new FXContactRMCTA(this, {
                                    label: 'Contact Your RM',
                                    subLabel: 'Speak to your Relationship Manager about FX opportunities',
                                    bgColor: '#DB0011'
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/fxviewpoint/FXViewpointPage.ets", line: 127, col: 9 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        label: 'Contact Your RM',
                                        subLabel: 'Speak to your Relationship Manager about FX opportunities',
                                        bgColor: '#DB0011'
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "FXContactRMCTA" });
                    }
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
class FXHeaderNavBar extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.title = 'FX Viewpoint';
        this.showBackButton = true;
        this.onBack = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: FXHeaderNavBar_Params) {
        if (params.title !== undefined) {
            this.title = params.title;
        }
        if (params.showBackButton !== undefined) {
            this.showBackButton = params.showBackButton;
        }
        if (params.onBack !== undefined) {
            this.onBack = params.onBack;
        }
    }
    updateStateVars(params: FXHeaderNavBar_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private title: string;
    private showBackButton: boolean;
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
            if (this.showBackButton) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('‹');
                        Text.fontSize(22);
                        Text.fontColor(Hive.Color.n800);
                        Text.onClick(() => {
                            SensorDataClient.track('back_tap', 'FXViewpoint', 'back_tapped', '', 'fx_viewpoint_hk', 'fx_viewpoint');
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
class FXVideoPlayer extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.__isPlaying = new ObservedPropertySimplePU(false, this, "isPlaying");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: FXVideoPlayer_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
        if (params.isPlaying !== undefined) {
            this.isPlaying = params.isPlaying;
        }
    }
    updateStateVars(params: FXVideoPlayer_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__isPlaying.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__isPlaying.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    private __isPlaying: ObservedPropertySimplePU<boolean>;
    get isPlaying() {
        return this.__isPlaying.get();
    }
    set isPlaying(newValue: boolean) {
        this.__isPlaying.set(newValue);
    }
    private videoUrl(): string {
        const raw = this.props['videoUrl'] as string ?? '';
        return raw.replace('http://localhost:4000', 'http://10.0.2.2:4000')
            || 'http://10.0.2.2:4000/media/fx-viewpoint.mov';
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isPlaying) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Video.create({ src: this.videoUrl(), previewUri: '' });
                        Video.width('100%');
                        Video.height(210);
                        Video.autoPlay(true);
                        Video.controls(true);
                        Video.onFinish(() => { this.isPlaying = false; });
                    }, Video);
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new FXVideoThumbnail(this, {
                                    title: this.props['title'] as string ?? '',
                                    presenterName: this.props['presenterName'] as string ?? '',
                                    presenterTitle: this.props['presenterTitle'] as string ?? '',
                                    onPlay: () => { this.isPlaying = true; }
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/fxviewpoint/FXViewpointPage.ets", line: 190, col: 9 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        title: this.props['title'] as string ?? '',
                                        presenterName: this.props['presenterName'] as string ?? '',
                                        presenterTitle: this.props['presenterTitle'] as string ?? '',
                                        onPlay: () => { this.isPlaying = true; }
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "FXVideoThumbnail" });
                    }
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
class FXVideoThumbnail extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.title = '';
        this.presenterName = '';
        this.presenterTitle = '';
        this.onPlay = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: FXVideoThumbnail_Params) {
        if (params.title !== undefined) {
            this.title = params.title;
        }
        if (params.presenterName !== undefined) {
            this.presenterName = params.presenterName;
        }
        if (params.presenterTitle !== undefined) {
            this.presenterTitle = params.presenterTitle;
        }
        if (params.onPlay !== undefined) {
            this.onPlay = params.onPlay;
        }
    }
    updateStateVars(params: FXVideoThumbnail_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private title: string;
    private presenterName: string;
    private presenterTitle: string;
    private onPlay: () => void;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create({ alignContent: Alignment.Center });
            Stack.width('100%');
            Stack.height(210);
            Stack.onClick(() => { this.onPlay(); });
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.height(210);
            Column.backgroundColor('#003366');
        }, Column);
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 8 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create({ alignContent: Alignment.Center });
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width(64);
            Column.height(64);
            Column.borderRadius(32);
            Column.backgroundColor('#33FFFFFF');
        }, Column);
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('▶');
            Text.fontSize(28);
            Text.fontColor('#FFFFFF');
        }, Text);
        Text.pop();
        Stack.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.title);
            Text.fontSize(13);
            Text.fontColor('#D9FFFFFF');
            Text.textAlign(TextAlign.Center);
            Text.padding({ left: 16, right: 16 });
        }, Text);
        Text.pop();
        Column.pop();
        Stack.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Presenter info bar
            Row.create({ space: 10 });
            // Presenter info bar
            Row.width('100%');
            // Presenter info bar
            Row.backgroundColor(Hive.Color.brandWhite);
            // Presenter info bar
            Row.padding({ left: 16, right: 16, top: 12, bottom: 12 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('👤');
            Text.fontSize(18);
            Text.width(40);
            Text.height(40);
            Text.textAlign(TextAlign.Center);
            Text.backgroundColor('#1A003366');
            Text.borderRadius(20);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 2 });
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.presenterName);
            Text.fontSize(14);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.presenterTitle);
            Text.fontSize(12);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        // Presenter info bar
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
class FXMarketBriefing extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.props = {};
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: FXMarketBriefing_Params) {
        if (params.props !== undefined) {
            this.props = params.props;
        }
    }
    updateStateVars(params: FXMarketBriefing_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private props: Record<string, any>;
    private sectionTitle(): string { return this.props['sectionTitle'] as string ?? 'Key takeaways'; }
    private rawPoints(): any[] { return this.props['bulletPoints'] as any[] ?? []; }
    private disclaimer(): string { return this.props['disclaimer'] as string ?? ''; }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.padding(16);
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.sectionTitle());
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 10 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const raw = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create({ space: 8 });
                    Row.alignItems(VerticalAlign.Top);
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create('●');
                    Text.fontSize(6);
                    Text.fontColor('#003366');
                    Text.margin({ top: 5 });
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(raw as string);
                    Text.fontSize(14);
                    Text.fontColor(Hive.Color.n700);
                    Text.layoutWeight(1);
                }, Text);
                Text.pop();
                Row.pop();
            };
            this.forEachUpdateFunction(elmtId, this.rawPoints(), forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.disclaimer().length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.disclaimer());
                        Text.fontSize(10);
                        Text.fontColor(Hive.Color.n400);
                        Text.padding(10);
                        Text.backgroundColor(Hive.Color.n100);
                        Text.borderRadius(6);
                        Text.width('100%');
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
class FXHardcodedBriefing extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.bullets = [
            'A weak USD is likely to persist into 2026, providing temporary support for the EUR and GBP.',
            'With the ECB expected to maintain its policy rate in 2026, the EUR should remain broadly stable.',
            'BoE delivered a 25 bps cut in May 2026 — further easing is data-dependent and market pricing appears stretched.',
            'GBP/USD faces near-term resistance at 1.3200 amid mixed UK growth signals.',
            'Investors should consider diversified FX exposure to manage downside risk against a volatile USD backdrop.',
        ];
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: FXHardcodedBriefing_Params) {
        if (params.bullets !== undefined) {
            this.bullets = params.bullets;
        }
    }
    updateStateVars(params: FXHardcodedBriefing_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private readonly bullets: string[];
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.width('100%');
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.padding(16);
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Key takeaways');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 10 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const point = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create({ space: 8 });
                    Row.alignItems(VerticalAlign.Top);
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create('●');
                    Text.fontSize(6);
                    Text.fontColor('#003366');
                    Text.margin({ top: 5 });
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(point);
                    Text.fontSize(14);
                    Text.fontColor(Hive.Color.n700);
                    Text.layoutWeight(1);
                }, Text);
                Text.pop();
                Row.pop();
            };
            this.forEachUpdateFunction(elmtId, this.bullets, forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('This material is issued by HSBC and is for information purposes only. ' +
                'It does not constitute investment advice or a recommendation to buy or sell any financial instrument.');
            Text.fontSize(10);
            Text.fontColor(Hive.Color.n400);
            Text.padding(10);
            Text.backgroundColor(Hive.Color.n100);
            Text.borderRadius(6);
            Text.width('100%');
        }, Text);
        Text.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class FXContactRMCTA extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.label = 'Contact Your RM';
        this.subLabel = '';
        this.bgColor = '#DB0011';
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: FXContactRMCTA_Params) {
        if (params.label !== undefined) {
            this.label = params.label;
        }
        if (params.subLabel !== undefined) {
            this.subLabel = params.subLabel;
        }
        if (params.bgColor !== undefined) {
            this.bgColor = params.bgColor;
        }
    }
    updateStateVars(params: FXContactRMCTA_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private label: string;
    private subLabel: string;
    private bgColor: string;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.padding({ left: 20, right: 20, top: 14, bottom: 14 });
            Row.backgroundColor(this.bgColor);
            Row.onClick(() => {
                SensorDataClient.track('contact_rm_tap', 'FXViewpoint', 'contact_rm_tapped', '', 'fx_viewpoint_hk', 'fx_viewpoint');
            });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 2 });
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.label);
            Text.fontSize(14);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor('#FFFFFF');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.subLabel.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.subLabel);
                        Text.fontSize(12);
                        Text.fontColor('#D9FFFFFF');
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
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('›');
            Text.fontSize(20);
            Text.fontColor('#FFFFFF');
        }, Text);
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
