if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface HSBCLogoView_Params {
}
interface KYCCompletionView_Params {
}
interface KYCStepContent_Params {
    state?: KYCState;
}
interface KYCJourneyView_Params {
    state?: KYCState;
    dispatch?: (a: KYCAction) => void;
}
interface KYCWelcomeView_Params {
    state?: KYCState;
    dispatch?: (a: KYCAction) => void;
}
interface KYCRootView_Params {
    store?: KYCStore;
    screenReady?: boolean;
    isComplete?: boolean;
}
import { Hive } from "@normalized:N&&&entry/src/main/ets/common/HiveTokens&";
import type { KYCState, KYCAction, SDUIScreenPayload } from '../models/SDUIModels';
import { KYCStore } from "@normalized:N&&&entry/src/main/ets/kyc/KYCStore&";
import { KYCNameDobStep, KYCNationalityStep, KYCHKIDStep, KYCMainlandIDStep, KYCPassportStep, KYCDocumentStep, KYCContactStep, KYCAddressStep, KYCEmploymentIncomeStep, KYCSourceOfFundsStep, KYCLivenessStep, KYCOpenBankingStep, KYCDeclarationStep, } from "@normalized:N&&&entry/src/main/ets/kyc/KYCStepViews&";
// ─── Primary question extractor ───────────────────────────────────────────────
// Uses children[0].id (typed string) — avoids ESObject implicit-type error from
// props['questionId'] index access. BFF sets node.id = q.questionId.
function primaryQuestionId(payload: SDUIScreenPayload): string {
    const children = payload.layout.children;
    if (children === null || children === undefined)
        return '';
    if (children.length === 0)
        return '';
    return children[0].id;
}
// ─── Step title (mirrors iOS KYCStepTitleView / Android kycStepTitle()) ───────
function stepTitle(primaryQ: string): string {
    if (primaryQ === 'q_first_name')
        return '👤 Full Legal Name & Date of Birth';
    if (primaryQ === 'q_nationality')
        return '🌍 Nationality';
    if (primaryQ === 'q_hkid_number')
        return '🪪 Hong Kong Identity Card';
    if (primaryQ === 'q_mainland_id')
        return '🪪 Mainland China ID';
    if (primaryQ === 'q_passport_number')
        return '🛂 Passport';
    if (primaryQ === 'q_hkid_front')
        return '📄 Upload Identity Document';
    if (primaryQ === 'q_email')
        return '📱 Contact Details';
    if (primaryQ === 'q_addr_line1' ||
        primaryQ === 'q_addr_line2' ||
        primaryQ === 'q_addr_district')
        return '🏠 Residential Address';
    if (primaryQ === 'q_employment_status')
        return '💼 Employment & Income';
    if (primaryQ === 'q_source_of_funds')
        return '🏦 Source of Funds';
    if (primaryQ === 'q_liveness')
        return '😊 Selfie & Liveness Check';
    if (primaryQ === 'q_ob_consent')
        return '🔗 Connect Your Bank';
    if (primaryQ === 'q_pep_status')
        return '✍️ Legal Declarations';
    return '📋 Application';
}
// ─── Inline item interfaces for ForEach callbacks ─────────────────────────────
interface WelcomeItem {
    icon: string;
    title: string;
    desc: string;
}
interface CompletionItem {
    icon: string;
    text: string;
}
export class KYCRootView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.store = new KYCStore();
        this.__screenReady = new ObservedPropertySimplePU(false, this, "screenReady");
        this.__isComplete = new ObservedPropertySimplePU(false, this, "isComplete");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: KYCRootView_Params) {
        if (params.store !== undefined) {
            this.store = params.store;
        }
        if (params.screenReady !== undefined) {
            this.screenReady = params.screenReady;
        }
        if (params.isComplete !== undefined) {
            this.isComplete = params.isComplete;
        }
    }
    updateStateVars(params: KYCRootView_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__screenReady.purgeDependencyOnElmtId(rmElmtId);
        this.__isComplete.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__screenReady.aboutToBeDeleted();
        this.__isComplete.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    // The store itself is not reactive — only KYCState (which is @Observed) is.
    // We keep @State copies of the two flags that drive the root branch switch so
    // that KYCRootView re-renders when dispatch() changes them.
    private store: KYCStore;
    private __screenReady: ObservedPropertySimplePU<boolean>;
    get screenReady() {
        return this.__screenReady.get();
    }
    set screenReady(newValue: boolean) {
        this.__screenReady.set(newValue);
    }
    private __isComplete: ObservedPropertySimplePU<boolean>;
    get isComplete() {
        return this.__isComplete.get();
    }
    set isComplete(newValue: boolean) {
        this.__isComplete.set(newValue);
    }
    aboutToAppear() {
        this.store.onScreenReady = () => { this.screenReady = true; };
        this.store.onComplete = () => { this.isComplete = true; };
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isComplete) {
                this.ifElseBranchUpdateFunction(0, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new KYCCompletionView(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 89, col: 7 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "KYCCompletionView" });
                    }
                });
            }
            else if (this.screenReady) {
                this.ifElseBranchUpdateFunction(1, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new KYCJourneyView(this, { state: this.store.state, dispatch: (a: KYCAction) => this.store.dispatch(a) }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 91, col: 7 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        state: this.store.state,
                                        dispatch: (a: KYCAction) => this.store.dispatch(a)
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    state: this.store.state
                                });
                            }
                        }, { name: "KYCJourneyView" });
                    }
                });
            }
            else {
                this.ifElseBranchUpdateFunction(2, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new KYCWelcomeView(this, { state: this.store.state, dispatch: (a: KYCAction) => this.store.dispatch(a) }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 93, col: 7 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        state: this.store.state,
                                        dispatch: (a: KYCAction) => this.store.dispatch(a)
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    state: this.store.state
                                });
                            }
                        }, { name: "KYCWelcomeView" });
                    }
                });
            }
        }, If);
        If.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class KYCWelcomeView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state = new SynchedPropertyNesedObjectPU(params.state, this, "state");
        this.dispatch = (_a: KYCAction) => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: KYCWelcomeView_Params) {
        this.__state.set(params.state);
        if (params.dispatch !== undefined) {
            this.dispatch = params.dispatch;
        }
    }
    updateStateVars(params: KYCWelcomeView_Params) {
        this.__state.set(params.state);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__state.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__state.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __state: SynchedPropertyNesedObjectPU<KYCState>;
    get state() {
        return this.__state.get();
    }
    private dispatch: (a: KYCAction) => void;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.width('100%');
            Scroll.backgroundColor(Hive.Color.n50);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.height(6);
            Row.backgroundColor(Hive.Color.brandPrimary);
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s6 });
            Column.padding(Hive.Spacing.s6);
            Column.width('100%');
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new HSBCLogoView(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 111, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {};
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {});
                }
            }, { name: "HSBCLogoView" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s2 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Open Banking\nAccount Opening');
            Text.fontSize(Hive.Typography.displayLarge);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.n900);
            Text.lineHeight(36);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Complete your KYC verification in minutes using Open Banking. Fully regulated by the HKMA.');
            Text.fontSize(Hive.Typography.bodyBase);
            Text.fontColor(Hive.Color.n600);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s2 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const item = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create({ space: Hive.Spacing.s3 });
                    Row.width('100%');
                    Row.padding(Hive.Spacing.s4);
                    Row.borderRadius(Hive.Radius.md);
                    Row.backgroundColor(Hive.Color.brandWhite);
                    Row.shadow({ radius: 4, color: '#0A000000', offsetY: 2 });
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(item.icon);
                    Text.fontSize(22);
                    Text.width(44);
                    Text.height(44);
                    Text.textAlign(TextAlign.Center);
                    Text.borderRadius(Hive.Radius.md);
                    Text.backgroundColor('#FFEEEF');
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 2 });
                    Column.layoutWeight(1);
                    Column.alignItems(HorizontalAlign.Start);
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(item.title);
                    Text.fontSize(14);
                    Text.fontWeight(FontWeight.Medium);
                    Text.fontColor(Hive.Color.n800);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(item.desc);
                    Text.fontSize(12);
                    Text.fontColor(Hive.Color.n500);
                }, Text);
                Text.pop();
                Column.pop();
                Row.pop();
            };
            this.forEachUpdateFunction(elmtId, [
                { icon: '👤', title: 'Personal Details', desc: 'Name, DOB, nationality, address' } as WelcomeItem,
                { icon: '🪪', title: 'Identity Verification', desc: 'Government ID + liveness selfie' } as WelcomeItem,
                { icon: '💼', title: 'Due Diligence', desc: 'Occupation & source of funds' } as WelcomeItem,
                { icon: '🏦', title: 'Open Banking', desc: 'Connect bank for instant verification' } as WelcomeItem,
                { icon: '✍️', title: 'Declarations', desc: 'Legal declarations & consent' } as WelcomeItem,
            ], forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: Hive.Spacing.s2 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🔒');
            Text.fontSize(14);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Regulated by HKMA · Data protected under PDPO Cap. 486');
            Text.fontSize(12);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.state.errorMessage !== '') {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.state.errorMessage);
                        Text.fontSize(13);
                        Text.fontColor(Hive.Color.error);
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
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel(this.state.isLoading ? 'Starting…' : 'Begin Application');
            Button.width('100%');
            Button.height(Hive.Component.Button.height);
            Button.borderRadius(Hive.Radius.base);
            Button.backgroundColor(Hive.Color.brandPrimary);
            Button.fontColor(Hive.Color.brandWhite);
            Button.fontWeight(FontWeight.Medium);
            Button.enabled(!this.state.isLoading);
            Button.onClick(() => { this.dispatch({ type: 'START_SESSION' }); });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.height(Hive.Spacing.s8);
        }, Blank);
        Blank.pop();
        Column.pop();
        Column.pop();
        Scroll.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class KYCJourneyView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state = new SynchedPropertyNesedObjectPU(params.state, this, "state");
        this.dispatch = (_a: KYCAction) => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: KYCJourneyView_Params) {
        this.__state.set(params.state);
        if (params.dispatch !== undefined) {
            this.dispatch = params.dispatch;
        }
    }
    updateStateVars(params: KYCJourneyView_Params) {
        this.__state.set(params.state);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__state.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__state.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __state: SynchedPropertyNesedObjectPU<KYCState>;
    get state() {
        return this.__state.get();
    }
    private dispatch: (a: KYCAction) => void;
    progress(): number {
        return this.state.totalSteps > 0
            ? this.state.currentStepIndex / this.state.totalSteps * 100
            : 0;
    }
    currentStepTitle(): string {
        const payload = this.state.screenPayload;
        if (payload === null || payload === undefined)
            return '📋 Application';
        return stepTitle(primaryQuestionId(payload as SDUIScreenPayload));
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor(Hive.Color.n50);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Header
            Row.create();
            // Header
            Row.width('100%');
            // Header
            Row.height(56);
            // Header
            Row.padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4 });
            // Header
            Row.backgroundColor(Hive.Color.brandWhite);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new HSBCLogoView(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 198, col: 9 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {};
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {});
                }
            }, { name: "HSBCLogoView" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Save & Exit');
            Text.fontSize(13);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        // Header
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.color(Hive.Color.n200);
        }, Divider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Progress bar
            Column.create({ space: Hive.Spacing.s2 });
            // Progress bar
            Column.width('100%');
            // Progress bar
            Column.padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4, top: 10, bottom: 10 });
            // Progress bar
            Column.backgroundColor(Hive.Color.brandWhite);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.state.sectionTitle);
            Text.fontSize(Hive.Typography.caption);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`Step ${this.state.currentStepIndex} of ${this.state.totalSteps}`);
            Text.fontSize(Hive.Typography.caption);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Progress.create({ value: this.progress(), total: 100, type: ProgressType.Linear });
            Progress.color(Hive.Color.brandPrimary);
            Progress.width('100%');
        }, Progress);
        // Progress bar
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.color(Hive.Color.n200);
        }, Divider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Step content (scrollable)
            Scroll.create();
            // Step content (scrollable)
            Scroll.layoutWeight(1);
            // Step content (scrollable)
            Scroll.backgroundColor(Hive.Color.n50);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s4 });
            Column.padding(Hive.Spacing.s4);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s2 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: Hive.Spacing.s1 });
            Row.padding({ left: 12, right: 12, top: 4, bottom: 4 });
            Row.borderRadius(Hive.Radius.full);
            Row.backgroundColor('#FFEEEF');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.state.sectionTitle);
            Text.fontSize(12);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(Hive.Color.brandPrimary);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.state.screenPayload !== null) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.currentStepTitle());
                        Text.fontSize(Hive.Typography.headingMd);
                        Text.fontWeight(FontWeight.Bold);
                        Text.fontColor(Hive.Color.n900);
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
            Column.create({ space: 0 });
            Column.width('100%');
            Column.padding(Hive.Spacing.s4);
            Column.borderRadius(Hive.Radius.lg);
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.shadow({ radius: 8, color: '#0F000000', offsetY: 2 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.state.screenPayload !== null) {
                this.ifElseBranchUpdateFunction(0, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new KYCStepContent(this, { state: this.state }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 244, col: 15 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCStepContent" });
                    }
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
            If.create();
            if (this.state.errorMessage !== '') {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.state.errorMessage);
                        Text.fontSize(13);
                        Text.fontColor(Hive.Color.error);
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
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.height(100);
        }, Blank);
        Blank.pop();
        Column.pop();
        // Step content (scrollable)
        Scroll.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.color(Hive.Color.n200);
        }, Divider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: Hive.Spacing.s3 });
            Row.width('100%');
            Row.padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4, top: 12, bottom: 28 });
            Row.backgroundColor(Hive.Color.brandWhite);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.state.currentStepIndex > 1) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('← Back');
                        Button.height(52);
                        Button.padding({ left: 16, right: 16 });
                        Button.borderRadius(Hive.Radius.base);
                        Button.backgroundColor(Hive.Color.brandWhite);
                        Button.fontColor(Hive.Color.n700);
                        Button.border({ width: 1, color: Hive.Color.n300, radius: Hive.Radius.base });
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
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel(this.state.isSubmitting ? 'Submitting…' :
                this.state.currentStepIndex >= this.state.totalSteps
                    ? 'Submit Application' : 'Continue');
            Button.layoutWeight(1);
            Button.height(52);
            Button.borderRadius(Hive.Radius.base);
            Button.backgroundColor(this.state.isSubmitting ? Hive.Color.n300 : Hive.Color.brandPrimary);
            Button.fontColor(Hive.Color.brandWhite);
            Button.fontWeight(FontWeight.Medium);
            Button.enabled(!this.state.isSubmitting);
            Button.onClick(() => { this.dispatch({ type: 'SUBMIT_STEP' }); });
        }, Button);
        Button.pop();
        Row.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class KYCStepContent extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state = new SynchedPropertyNesedObjectPU(params.state, this, "state");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: KYCStepContent_Params) {
        this.__state.set(params.state);
    }
    updateStateVars(params: KYCStepContent_Params) {
        this.__state.set(params.state);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__state.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__state.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __state: SynchedPropertyNesedObjectPU<KYCState>;
    get state() {
        return this.__state.get();
    }
    primaryQ(): string {
        const payload = this.state.screenPayload;
        if (payload === null || payload === undefined)
            return '';
        return primaryQuestionId(payload as SDUIScreenPayload);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.primaryQ() === 'q_first_name') {
                this.ifElseBranchUpdateFunction(0, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new KYCNameDobStep(this, { state: this.state }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 306, col: 9 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCNameDobStep" });
                    }
                });
            }
            else if (this.primaryQ() === 'q_nationality') {
                this.ifElseBranchUpdateFunction(1, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new KYCNationalityStep(this, { state: this.state }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 308, col: 9 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCNationalityStep" });
                    }
                });
            }
            else if (this.primaryQ() === 'q_hkid_number') {
                this.ifElseBranchUpdateFunction(2, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new KYCHKIDStep(this, { state: this.state }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 310, col: 9 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCHKIDStep" });
                    }
                });
            }
            else if (this.primaryQ() === 'q_mainland_id') {
                this.ifElseBranchUpdateFunction(3, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new KYCMainlandIDStep(this, { state: this.state }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 312, col: 9 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCMainlandIDStep" });
                    }
                });
            }
            else if (this.primaryQ() === 'q_passport_number') {
                this.ifElseBranchUpdateFunction(4, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new KYCPassportStep(this, { state: this.state }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 314, col: 9 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCPassportStep" });
                    }
                });
            }
            else if (this.primaryQ() === 'q_hkid_front') {
                this.ifElseBranchUpdateFunction(5, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new KYCDocumentStep(this, { state: this.state }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 316, col: 9 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCDocumentStep" });
                    }
                });
            }
            else if (this.primaryQ() === 'q_email') {
                this.ifElseBranchUpdateFunction(6, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new KYCContactStep(this, { state: this.state }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 318, col: 9 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCContactStep" });
                    }
                });
            }
            else if (this.primaryQ() === 'q_addr_line1' || this.primaryQ() === 'q_addr_line2' ||
                this.primaryQ() === 'q_addr_district') {
                this.ifElseBranchUpdateFunction(7, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new KYCAddressStep(this, { state: this.state }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 321, col: 9 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCAddressStep" });
                    }
                });
            }
            else if (this.primaryQ() === 'q_employment_status') {
                this.ifElseBranchUpdateFunction(8, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new KYCEmploymentIncomeStep(this, { state: this.state }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 323, col: 9 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCEmploymentIncomeStep" });
                    }
                });
            }
            else if (this.primaryQ() === 'q_source_of_funds') {
                this.ifElseBranchUpdateFunction(9, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new KYCSourceOfFundsStep(this, { state: this.state }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 325, col: 9 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCSourceOfFundsStep" });
                    }
                });
            }
            else if (this.primaryQ() === 'q_liveness') {
                this.ifElseBranchUpdateFunction(10, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new KYCLivenessStep(this, { state: this.state }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 327, col: 9 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCLivenessStep" });
                    }
                });
            }
            else if (this.primaryQ() === 'q_ob_consent') {
                this.ifElseBranchUpdateFunction(11, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new KYCOpenBankingStep(this, { state: this.state }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 329, col: 9 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCOpenBankingStep" });
                    }
                });
            }
            else if (this.primaryQ() === 'q_pep_status' ||
                this.primaryQ() === 'decl_truthful' ||
                this.primaryQ() === 'decl_fatca') {
                this.ifElseBranchUpdateFunction(12, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new KYCDeclarationStep(this, { state: this.state }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 333, col: 9 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCDeclarationStep" });
                    }
                });
            }
            else {
                this.ifElseBranchUpdateFunction(13, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: Hive.Spacing.s3 });
                        Column.padding(Hive.Spacing.s6);
                        Column.width('100%');
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('⚠️');
                        Text.fontSize(32);
                        Text.textAlign(TextAlign.Center);
                        Text.width('100%');
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('Unknown step');
                        Text.fontSize(14);
                        Text.fontWeight(FontWeight.Medium);
                        Text.fontColor(Hive.Color.n600);
                        Text.textAlign(TextAlign.Center);
                        Text.width('100%');
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('stepId: ' + this.state.currentStepId);
                        Text.fontSize(12);
                        Text.fontColor(Hive.Color.n400);
                        Text.textAlign(TextAlign.Center);
                        Text.width('100%');
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('primaryQ: ' + (this.primaryQ() !== '' ? this.primaryQ() : '(none — no children)'));
                        Text.fontSize(12);
                        Text.fontColor(Hive.Color.n400);
                        Text.textAlign(TextAlign.Center);
                        Text.width('100%');
                    }, Text);
                    Text.pop();
                    Column.pop();
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
class KYCCompletionView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: KYCCompletionView_Params) {
    }
    updateStateVars(params: KYCCompletionView_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s6 });
            Column.width('100%');
            Column.height('100%');
            Column.padding(Hive.Spacing.s6);
            Column.backgroundColor(Hive.Color.n50);
            Column.alignItems(HorizontalAlign.Center);
            Column.justifyContent(FlexAlign.Center);
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new HSBCLogoView(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 355, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {};
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {});
                }
            }, { name: "HSBCLogoView" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('✅');
            Text.fontSize(72);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Application Submitted');
            Text.fontSize(Hive.Typography.headingXL);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.success);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s3 });
            Column.width('100%');
            Column.padding(Hive.Spacing.s5);
            Column.borderRadius(Hive.Radius.md);
            Column.backgroundColor(Hive.Color.n50);
            Column.border({ width: 1, color: Hive.Color.n200, radius: Hive.Radius.md });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const item = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create({ space: Hive.Spacing.s3 });
                    Row.width('100%');
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(item.icon);
                    Text.fontSize(16);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(item.text);
                    Text.fontSize(14);
                    Text.fontColor(Hive.Color.n700);
                }, Text);
                Text.pop();
                Row.pop();
            };
            this.forEachUpdateFunction(elmtId, [
                { icon: '📧', text: 'Confirmation email sent' } as CompletionItem,
                { icon: '📱', text: 'SMS notification will follow' } as CompletionItem,
                { icon: '⏱', text: 'Decision within 3 working days' } as CompletionItem,
                { icon: '🔒', text: 'Data encrypted per PDPO Cap. 486' } as CompletionItem,
            ], forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`Reference: OBKYC-${Math.floor(Math.random() * 900000 + 100000)}`);
            Text.fontSize(12);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
export class HSBCLogoView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: HSBCLogoView_Params) {
    }
    updateStateVars(params: HSBCLogoView_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: Hive.Spacing.s2 });
            Row.alignItems(VerticalAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Grid.create();
            Grid.columnsTemplate('1fr 1fr');
            Grid.rowsTemplate('1fr 1fr');
            Grid.width(28);
            Grid.height(28);
            Grid.border({ width: 0.5, color: Hive.Color.n200 });
        }, Grid);
        {
            const itemCreation2 = (elmtId, isInitialRender) => {
                GridItem.create(() => { }, false);
            };
            const observedDeepRender = () => {
                this.observeComponentCreation2(itemCreation2, GridItem);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create();
                    Row.width(14);
                    Row.height(14);
                    Row.backgroundColor(Hive.Color.brandPrimary);
                }, Row);
                Row.pop();
                GridItem.pop();
            };
            observedDeepRender();
        }
        {
            const itemCreation2 = (elmtId, isInitialRender) => {
                GridItem.create(() => { }, false);
            };
            const observedDeepRender = () => {
                this.observeComponentCreation2(itemCreation2, GridItem);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create();
                    Row.width(14);
                    Row.height(14);
                    Row.backgroundColor(Hive.Color.brandWhite);
                }, Row);
                Row.pop();
                GridItem.pop();
            };
            observedDeepRender();
        }
        {
            const itemCreation2 = (elmtId, isInitialRender) => {
                GridItem.create(() => { }, false);
            };
            const observedDeepRender = () => {
                this.observeComponentCreation2(itemCreation2, GridItem);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create();
                    Row.width(14);
                    Row.height(14);
                    Row.backgroundColor(Hive.Color.brandWhite);
                }, Row);
                Row.pop();
                GridItem.pop();
            };
            observedDeepRender();
        }
        {
            const itemCreation2 = (elmtId, isInitialRender) => {
                GridItem.create(() => { }, false);
            };
            const observedDeepRender = () => {
                this.observeComponentCreation2(itemCreation2, GridItem);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create();
                    Row.width(14);
                    Row.height(14);
                    Row.backgroundColor(Hive.Color.brandPrimary);
                }, Row);
                Row.pop();
                GridItem.pop();
            };
            observedDeepRender();
        }
        Grid.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('HSBC');
            Text.fontSize(20);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.n900);
            Text.letterSpacing(1);
        }, Text);
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
