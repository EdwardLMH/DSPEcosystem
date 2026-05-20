if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface AnnouncementAccountRow_Params {
    title?: string;
    value?: string;
}
interface AnnouncementBackdrop_Params {
}
interface AnnouncementPage_Params {
    kind?: number;
    onBack?: () => void;
    loadState?: number;
    slice?: ScreenSlice;
    dontShowAgain?: boolean;
}
import { Hive } from "@normalized:N&&&entry/src/main/ets/common/HiveTokens&";
import { SensorDataClient } from "@normalized:N&&&entry/src/main/ets/network/SensorDataClient&";
import { fetchAnnouncementScreen } from "@normalized:N&&&entry/src/main/ets/network/NetworkService&";
import type { ScreenSlice } from "@normalized:N&&&entry/src/main/ets/network/NetworkService&";
const LOAD_LOADING = 1;
const LOAD_DONE = 2;
const LOAD_ERROR = 3;
export const ANNOUNCEMENT_SPECIAL = 0;
export const ANNOUNCEMENT_FORCE_UPDATE = 1;
interface AnnouncementAction {
    id: string;
    label: string;
    style: string;
}
export class AnnouncementPage extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.kind = ANNOUNCEMENT_SPECIAL;
        this.onBack = () => { };
        this.__loadState = new ObservedPropertySimplePU(LOAD_LOADING, this, "loadState");
        this.__slice = new ObservedPropertyObjectPU({ instanceId: '', type: '', props: {}, visible: true }, this, "slice");
        this.__dontShowAgain = new ObservedPropertySimplePU(false, this, "dontShowAgain");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: AnnouncementPage_Params) {
        if (params.kind !== undefined) {
            this.kind = params.kind;
        }
        if (params.onBack !== undefined) {
            this.onBack = params.onBack;
        }
        if (params.loadState !== undefined) {
            this.loadState = params.loadState;
        }
        if (params.slice !== undefined) {
            this.slice = params.slice;
        }
        if (params.dontShowAgain !== undefined) {
            this.dontShowAgain = params.dontShowAgain;
        }
    }
    updateStateVars(params: AnnouncementPage_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__loadState.purgeDependencyOnElmtId(rmElmtId);
        this.__slice.purgeDependencyOnElmtId(rmElmtId);
        this.__dontShowAgain.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__loadState.aboutToBeDeleted();
        this.__slice.aboutToBeDeleted();
        this.__dontShowAgain.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private kind: number;
    private onBack: () => void;
    private __loadState: ObservedPropertySimplePU<number>;
    get loadState() {
        return this.__loadState.get();
    }
    set loadState(newValue: number) {
        this.__loadState.set(newValue);
    }
    private __slice: ObservedPropertyObjectPU<ScreenSlice>;
    get slice() {
        return this.__slice.get();
    }
    set slice(newValue: ScreenSlice) {
        this.__slice.set(newValue);
    }
    private __dontShowAgain: ObservedPropertySimplePU<boolean>;
    get dontShowAgain() {
        return this.__dontShowAgain.get();
    }
    set dontShowAgain(newValue: boolean) {
        this.__dontShowAgain.set(newValue);
    }
    aboutToAppear() {
        SensorDataClient.track('announcement_viewed', 'Announcement', 'page_viewed', '', this.screenName(), 'announcement');
        this.loadFromBFF();
    }
    private screenId(): string {
        return this.kind === ANNOUNCEMENT_FORCE_UPDATE
            ? 'announcement-force-update-hk'
            : 'announcement-overlay-hk';
    }
    private screenName(): string {
        return this.kind === ANNOUNCEMENT_FORCE_UPDATE
            ? 'announcement_force_update_hk'
            : 'announcement_overlay_hk';
    }
    private fallbackTitle(): string {
        return this.kind === ANNOUNCEMENT_FORCE_UPDATE ? 'Get ready for eLaisee' : 'Special announcement';
    }
    private fallbackStyle(): string {
        return this.kind === ANNOUNCEMENT_FORCE_UPDATE ? 'INLINE_FORCE_UPDATE' : 'ENVELOPE_CARD';
    }
    private async loadFromBFF(): Promise<void> {
        this.loadState = LOAD_LOADING;
        try {
            const payload = await fetchAnnouncementScreen(this.screenId());
            const slices = payload.layout.children.filter((s: ScreenSlice) => {
                return s.visible !== false && s.type === 'ANNOUNCEMENT_OVERLAY';
            });
            if (slices.length > 0) {
                this.slice = slices[0];
                this.loadState = LOAD_DONE;
            }
            else {
                this.loadState = LOAD_ERROR;
            }
        }
        catch (_e) {
            this.loadState = LOAD_ERROR;
        }
    }
    private activeProps(): Record<string, any> {
        if (this.loadState === LOAD_DONE) {
            return this.slice.props;
        }
        const props: Record<string, any> = {};
        props['styleVariant'] = this.fallbackStyle() as any;
        props['title'] = this.fallbackTitle() as any;
        const body: string[] = ['Announcement content is temporarily unavailable. Please try again later.'];
        const closeAction: AnnouncementAction = { id: 'close', label: 'Close', style: 'primary' };
        const actions: AnnouncementAction[] = [closeAction];
        props['body'] = body as any;
        props['actions'] = actions as any;
        props['blockInteraction'] = false as any;
        return props;
    }
    private bodyLines(props: Record<string, any>): string[] {
        return props['body'] as string[] ?? [];
    }
    private hotlines(props: Record<string, any>): Array<Record<string, string>> {
        return props['hotlines'] as Array<Record<string, string>> ?? [];
    }
    private actions(props: Record<string, any>): Array<Record<string, string>> {
        return props['actions'] as Array<Record<string, string>> ?? [];
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create({ alignContent: Alignment.Center });
            Stack.width('100%');
            Stack.height('100%');
        }, Stack);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AnnouncementBackdrop(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/announcement/AnnouncementPage.ets", line: 103, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {};
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {});
                }
            }, { name: "AnnouncementBackdrop" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.loadState === LOAD_LOADING) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        LoadingProgress.create();
                        LoadingProgress.width(36);
                        LoadingProgress.height(36);
                        LoadingProgress.color(Hive.Color.brandPrimary);
                    }, LoadingProgress);
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.renderCard.bind(this)(this.activeProps());
                });
            }
        }, If);
        If.pop();
        Stack.pop();
    }
    renderCard(props: Record<string, any>, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('88%');
            Column.alignItems(HorizontalAlign.Center);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create((props['styleVariant'] as string ?? 'ENVELOPE_CARD') === 'INLINE_FORCE_UPDATE' ? '🧧' : '◆');
            Text.fontSize((props['styleVariant'] as string ?? '') === 'INLINE_FORCE_UPDATE' ? 54 : 66);
            Text.fontColor(Hive.Color.brandPrimary);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 14 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
            Column.padding(18);
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.borderRadius(2);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(props['title'] as string ?? 'Special announcement');
            Text.fontSize(24);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const line = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(line);
                    Text.fontSize(14);
                    Text.fontColor(Hive.Color.n700);
                    Text.width('100%');
                }, Text);
                Text.pop();
            };
            this.forEachUpdateFunction(elmtId, this.bodyLines(props), forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const item = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 3 });
                    Column.width('100%');
                    Column.alignItems(HorizontalAlign.Start);
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(item['label'] ?? '');
                    Text.fontSize(13);
                    Text.fontWeight(FontWeight.Medium);
                    Text.fontColor(Hive.Color.n900);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(item['phone'] ?? '');
                    Text.fontSize(13);
                    Text.fontColor(Hive.Color.n500);
                }, Text);
                Text.pop();
                Column.pop();
            };
            this.forEachUpdateFunction(elmtId, this.hotlines(props), forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.dontShowEnabled(props)) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 10 });
                        Row.width('100%');
                        Row.alignItems(VerticalAlign.Center);
                        Row.onClick(() => { this.dontShowAgain = !this.dontShowAgain; });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.dontShowAgain ? '☑' : '☐');
                        Text.fontSize(18);
                        Text.fontColor(Hive.Color.brandPrimary);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(((props['dontShowAgain'] as Record<string, any>)['label'] as string) ?? "Don't show this message again");
                        Text.fontSize(13);
                        Text.fontColor(Hive.Color.n700);
                    }, Text);
                    Text.pop();
                    Row.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const action = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Button.createWithLabel(action['label'] ?? 'Close');
                    Button.height(42);
                    Button.layoutWeight(1);
                    Button.borderRadius(2);
                    Button.backgroundColor((action['style'] ?? 'primary') === 'secondary' ? Hive.Color.brandWhite : Hive.Color.brandPrimary);
                    Button.fontColor((action['style'] ?? 'primary') === 'secondary' ? Hive.Color.n900 : Hive.Color.brandWhite);
                    Button.fontSize(14);
                    Button.fontWeight(FontWeight.Medium);
                    Button.border({
                        width: 1,
                        color: (action['style'] ?? 'primary') === 'secondary' ? Hive.Color.n200 : Hive.Color.brandPrimary
                    });
                    Button.onClick(() => { this.onBack(); });
                }, Button);
                Button.pop();
            };
            this.forEachUpdateFunction(elmtId, this.actions(props), forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if ((props['legalEntityText'] as string ?? '').length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(props['legalEntityText'] as string);
                        Text.fontSize(10);
                        Text.fontColor('#BFFFFFFF');
                        Text.margin({ top: 18 });
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
    private dontShowEnabled(props: Record<string, any>): boolean {
        const raw = props['dontShowAgain'] as Record<string, any>;
        if (!raw) {
            return false;
        }
        return raw['enabled'] as boolean ?? false;
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class AnnouncementBackdrop extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: AnnouncementBackdrop_Params) {
    }
    updateStateVars(params: AnnouncementBackdrop_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create();
            Stack.width('100%');
            Stack.height('100%');
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.height('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 18 });
            Row.width('100%');
            Row.padding({ left: 18, right: 18, top: 44, bottom: 18 });
            Row.backgroundColor('#111827');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('⌂');
            Text.fontSize(20);
            Text.fontColor(Hive.Color.brandWhite);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Pay');
            Text.fontSize(14);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(Hive.Color.brandWhite);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Cards');
            Text.fontSize(14);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(Hive.Color.brandWhite);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Wealth');
            Text.fontSize(14);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(Hive.Color.brandWhite);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('☰');
            Text.fontSize(20);
            Text.fontColor(Hive.Color.brandWhite);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 14 });
            Column.width('100%');
            Column.padding(18);
            Column.layoutWeight(1);
            Column.backgroundColor(Hive.Color.n50);
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AnnouncementAccountRow(this, { title: 'HSBC Red Credit Card', value: '-2,321.53 HKD' }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/announcement/AnnouncementPage.ets", line: 203, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            title: 'HSBC Red Credit Card',
                            value: '-2,321.53 HKD'
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {});
                }
            }, { name: "AnnouncementAccountRow" });
        }
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AnnouncementAccountRow(this, { title: 'Link a non-HSBC account', value: '+' }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/announcement/AnnouncementPage.ets", line: 204, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            title: 'Link a non-HSBC account',
                            value: '+'
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {});
                }
            }, { name: "AnnouncementAccountRow" });
        }
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AnnouncementAccountRow(this, { title: 'Investments', value: '' }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/announcement/AnnouncementPage.ets", line: 205, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            title: 'Investments',
                            value: ''
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {});
                }
            }, { name: "AnnouncementAccountRow" });
        }
        Column.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.height('100%');
            Row.backgroundColor('#73000000');
        }, Row);
        Row.pop();
        Stack.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class AnnouncementAccountRow extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.title = '';
        this.value = '';
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: AnnouncementAccountRow_Params) {
        if (params.title !== undefined) {
            this.title = params.title;
        }
        if (params.value !== undefined) {
            this.value = params.value;
        }
    }
    updateStateVars(params: AnnouncementAccountRow_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private title: string;
    private value: string;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.padding(14);
            Row.backgroundColor(Hive.Color.brandWhite);
            Row.borderRadius(6);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.title);
            Text.fontSize(13);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.value);
            Text.fontSize(13);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
