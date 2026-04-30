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
}
interface KYCWelcomeView_Params {
    state?: KYCState;
}
interface KYCRootView_Params {
    state?: KYCState;
}
import { Hive } from "@normalized:N&&&entry/src/main/ets/common/HiveTokens&";
import type { KYCState, AnswerEntry } from '../models/SDUIModels';
import { KYCNameStep, KYCDobNationalityStep, KYCContactStep, KYCIdentifierStep, KYCAddressStep, KYCDocumentStep, KYCLivenessStep, KYCWealthStep, KYCOpenBankingStep, KYCDeclarationStep } from "@normalized:N&&&entry/src/main/ets/kyc/KYCStepViews&";
import { startSession, resume, getStep, submitStep } from "@normalized:N&&&entry/src/main/ets/network/KYCNetworkService&";
import { SensorDataClient } from "@normalized:N&&&entry/src/main/ets/network/SensorDataClient&";
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
    constructor(c11, d11, e11, f11 = -1, g11 = undefined, h11) {
        super(c11, e11, f11, h11);
        if (typeof g11 === "function") {
            this.paramsGenerator_ = g11;
        }
        this.__state = new SynchedPropertyNesedObjectPU(d11.state, this, "state");
        this.setInitiallyProvidedValue(d11);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(b11: KYCRootView_Params) {
        this.__state.set(b11.state);
    }
    updateStateVars(a11: KYCRootView_Params) {
        this.__state.set(a11.state);
    }
    purgeVariableDependenciesOnElmtId(z10) {
        this.__state.purgeDependencyOnElmtId(z10);
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
    initialRender() {
        this.observeComponentCreation2((l10, m10) => {
            If.create();
            if (this.state.isComplete) {
                this.ifElseBranchUpdateFunction(0, () => {
                    {
                        this.observeComponentCreation2((v10, w10) => {
                            if (w10) {
                                let x10 = new KYCCompletionView(this, {}, undefined, v10, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 37, col: 7 });
                                ViewPU.create(x10);
                                let y10 = () => {
                                    return {};
                                };
                                x10.paramsGenerator_ = y10;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(v10, {});
                            }
                        }, { name: "KYCCompletionView" });
                    }
                });
            }
            else if (this.state.screenPayload !== null) {
                this.ifElseBranchUpdateFunction(1, () => {
                    {
                        this.observeComponentCreation2((r10, s10) => {
                            if (s10) {
                                let t10 = new KYCJourneyView(this, { state: this.state }, undefined, r10, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 39, col: 7 });
                                ViewPU.create(t10);
                                let u10 = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                t10.paramsGenerator_ = u10;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(r10, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCJourneyView" });
                    }
                });
            }
            else {
                this.ifElseBranchUpdateFunction(2, () => {
                    {
                        this.observeComponentCreation2((n10, o10) => {
                            if (o10) {
                                let p10 = new KYCWelcomeView(this, { state: this.state }, undefined, n10, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 41, col: 7 });
                                ViewPU.create(p10);
                                let q10 = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                p10.paramsGenerator_ = q10;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(n10, {
                                    state: this.state
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
    constructor(f10, g10, h10, i10 = -1, j10 = undefined, k10) {
        super(f10, h10, i10, k10);
        if (typeof j10 === "function") {
            this.paramsGenerator_ = j10;
        }
        this.__state = new SynchedPropertyNesedObjectPU(g10.state, this, "state");
        this.setInitiallyProvidedValue(g10);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(e10: KYCWelcomeView_Params) {
        this.__state.set(e10.state);
    }
    updateStateVars(d10: KYCWelcomeView_Params) {
        this.__state.set(d10.state);
    }
    purgeVariableDependenciesOnElmtId(c10) {
        this.__state.purgeDependencyOnElmtId(c10);
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
    doStart() {
        this.state.isLoading = true;
        this.state.errorMessage = '';
        SensorDataClient.kycJourneyStarted();
        startSession('harmonynext')
            .then(b10 => {
            this.state.sessionId = b10.sessionId;
            this.state.totalSteps = b10.totalSteps;
            return resume(b10.sessionId, 'harmonynext');
        })
            .then(a10 => {
            this.state.screenPayload = a10;
            this.state.currentStepId = a10.metadata.stepId;
            this.state.currentStepIndex = a10.metadata.stepIndex;
            this.state.totalSteps = a10.metadata.totalSteps;
            this.state.sectionTitle = a10.metadata.sectionTitle;
            this.state.isLoading = false;
            SensorDataClient.kycStepViewed(a10.metadata.stepId, a10.metadata.stepIndex, a10.metadata.totalSteps, a10.metadata.sectionTitle);
        })
            .catch((z9: Error) => {
            this.state.isLoading = false;
            this.state.errorMessage = `Cannot connect to server. Is the mock BFF running?\n${z9.message}`;
        });
    }
    initialRender() {
        this.observeComponentCreation2((x9, y9) => {
            Scroll.create();
            Scroll.width('100%');
            Scroll.backgroundColor(Hive.Color.n50);
        }, Scroll);
        this.observeComponentCreation2((v9, w9) => {
            Column.create({ space: 0 });
        }, Column);
        this.observeComponentCreation2((t9, u9) => {
            Row.create();
            Row.width('100%');
            Row.height(6);
            Row.backgroundColor(Hive.Color.brandPrimary);
        }, Row);
        Row.pop();
        this.observeComponentCreation2((r9, s9) => {
            Column.create({ space: Hive.Spacing.s6 });
            Column.padding(Hive.Spacing.s6);
            Column.width('100%');
        }, Column);
        {
            this.observeComponentCreation2((n9, o9) => {
                if (o9) {
                    let p9 = new HSBCLogoView(this, {}, undefined, n9, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 86, col: 11 });
                    ViewPU.create(p9);
                    let q9 = () => {
                        return {};
                    };
                    p9.paramsGenerator_ = q9;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(n9, {});
                }
            }, { name: "HSBCLogoView" });
        }
        this.observeComponentCreation2((l9, m9) => {
            Column.create({ space: Hive.Spacing.s2 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((j9, k9) => {
            Text.create('Open Banking\nAccount Opening');
            Text.fontSize(Hive.Typography.displayLarge);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.n900);
            Text.lineHeight(36);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((h9, i9) => {
            Text.create('Complete your KYC verification in minutes using Open Banking. Fully regulated by the HKMA.');
            Text.fontSize(Hive.Typography.bodyBase);
            Text.fontColor(Hive.Color.n600);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((f9, g9) => {
            Column.create({ space: Hive.Spacing.s2 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((q8, r8) => {
            ForEach.create();
            const s8 = t8 => {
                const u8 = t8;
                this.observeComponentCreation2((d9, e9) => {
                    Row.create({ space: Hive.Spacing.s3 });
                    Row.width('100%');
                    Row.padding(Hive.Spacing.s4);
                    Row.borderRadius(Hive.Radius.md);
                    Row.backgroundColor(Hive.Color.brandWhite);
                    Row.shadow({ radius: 4, color: '#0A000000', offsetY: 2 });
                }, Row);
                this.observeComponentCreation2((b9, c9) => {
                    Text.create(u8.icon);
                    Text.fontSize(22);
                    Text.width(44);
                    Text.height(44);
                    Text.textAlign(TextAlign.Center);
                    Text.borderRadius(Hive.Radius.md);
                    Text.backgroundColor('#FFEEEF');
                }, Text);
                Text.pop();
                this.observeComponentCreation2((z8, a9) => {
                    Column.create({ space: 2 });
                    Column.layoutWeight(1);
                    Column.alignItems(HorizontalAlign.Start);
                }, Column);
                this.observeComponentCreation2((x8, y8) => {
                    Text.create(u8.title);
                    Text.fontSize(14);
                    Text.fontWeight(FontWeight.Medium);
                    Text.fontColor(Hive.Color.n800);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((v8, w8) => {
                    Text.create(u8.desc);
                    Text.fontSize(12);
                    Text.fontColor(Hive.Color.n500);
                }, Text);
                Text.pop();
                Column.pop();
                Row.pop();
            };
            this.forEachUpdateFunction(q8, [
                { icon: '👤', title: 'Personal Details', desc: 'Name, DOB, nationality, address' } as WelcomeItem,
                { icon: '🪪', title: 'Identity Verification', desc: 'Government ID + liveness selfie' } as WelcomeItem,
                { icon: '💼', title: 'Due Diligence', desc: 'Occupation & source of funds' } as WelcomeItem,
                { icon: '🏦', title: 'Open Banking', desc: 'Connect bank for instant verification' } as WelcomeItem,
                { icon: '✍️', title: 'Declarations', desc: 'Legal declarations & consent' } as WelcomeItem
            ], s8);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        this.observeComponentCreation2((o8, p8) => {
            Row.create({ space: Hive.Spacing.s2 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((m8, n8) => {
            Text.create('🔒');
            Text.fontSize(14);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((k8, l8) => {
            Text.create('Regulated by HKMA · Data protected under PDPO Cap. 486');
            Text.fontSize(12);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((g8, h8) => {
            If.create();
            if (this.state.errorMessage !== '') {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((i8, j8) => {
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
        this.observeComponentCreation2((e8, f8) => {
            Button.createWithLabel(this.state.isLoading ? 'Starting…' : 'Begin Application');
            Button.width('100%');
            Button.height(Hive.Component.Button.height);
            Button.borderRadius(Hive.Radius.base);
            Button.backgroundColor(Hive.Color.brandPrimary);
            Button.fontColor(Hive.Color.brandWhite);
            Button.fontWeight(FontWeight.Medium);
            Button.onClick(() => { this.doStart(); });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((c8, d8) => {
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
    constructor(w7, x7, y7, z7 = -1, a8 = undefined, b8) {
        super(w7, y7, z7, b8);
        if (typeof a8 === "function") {
            this.paramsGenerator_ = a8;
        }
        this.__state = new SynchedPropertyNesedObjectPU(x7.state, this, "state");
        this.setInitiallyProvidedValue(x7);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(v7: KYCJourneyView_Params) {
        this.__state.set(v7.state);
    }
    updateStateVars(u7: KYCJourneyView_Params) {
        this.__state.set(u7.state);
    }
    purgeVariableDependenciesOnElmtId(t7) {
        this.__state.purgeDependencyOnElmtId(t7);
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
    progress(): number {
        return this.state.totalSteps > 0
            ? this.state.currentStepIndex / this.state.totalSteps * 100
            : 0;
    }
    doSubmit() {
        const l7 = this.state.sessionId;
        const m7 = this.state.currentStepId;
        if (!l7 || !m7)
            return;
        this.state.isSubmitting = true;
        SensorDataClient.kycStepCompleted(m7, this.state.currentStepIndex, this.state.sectionTitle);
        const n7: AnswerEntry[] = [];
        Object.keys(this.state.answers).forEach((s7: string) => {
            n7.push({ questionId: s7, value: this.state.answers[s7] });
        });
        submitStep(l7, m7, { answers: n7 })
            .then(p7 => {
            if (p7.status === 'COMPLETE') {
                SensorDataClient.kycJourneyCompleted();
                this.state.isSubmitting = false;
                this.state.isComplete = true;
            }
            else if (p7.status === 'NEXT_STEP' && p7.nextStepId) {
                this.state.totalSteps = p7.totalSteps ?? this.state.totalSteps;
                getStep(l7, p7.nextStepId, 'harmonynext')
                    .then(r7 => {
                    this.state.screenPayload = r7;
                    this.state.currentStepId = r7.metadata.stepId;
                    this.state.currentStepIndex = r7.metadata.stepIndex;
                    this.state.totalSteps = r7.metadata.totalSteps;
                    this.state.sectionTitle = r7.metadata.sectionTitle;
                    this.state.isSubmitting = false;
                    SensorDataClient.kycStepViewed(r7.metadata.stepId, r7.metadata.stepIndex, r7.metadata.totalSteps, r7.metadata.sectionTitle);
                })
                    .catch((q7: Error) => {
                    this.state.isSubmitting = false;
                    this.state.errorMessage = `Failed to load next step: ${q7.message}`;
                });
            }
            else {
                this.state.isSubmitting = false;
            }
        })
            .catch((o7: Error) => {
            this.state.isSubmitting = false;
            this.state.errorMessage = `Submission failed: ${o7.message}`;
        });
    }
    initialRender() {
        this.observeComponentCreation2((j7, k7) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor(Hive.Color.n50);
        }, Column);
        this.observeComponentCreation2((h7, i7) => {
            Row.create();
            Row.width('100%');
            Row.height(56);
            Row.padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4 });
            Row.backgroundColor(Hive.Color.brandWhite);
        }, Row);
        {
            this.observeComponentCreation2((d7, e7) => {
                if (e7) {
                    let f7 = new HSBCLogoView(this, {}, undefined, d7, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 220, col: 9 });
                    ViewPU.create(f7);
                    let g7 = () => {
                        return {};
                    };
                    f7.paramsGenerator_ = g7;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(d7, {});
                }
            }, { name: "HSBCLogoView" });
        }
        this.observeComponentCreation2((b7, c7) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((z6, a7) => {
            Text.create('Save & Exit');
            Text.fontSize(13);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((x6, y6) => {
            Divider.create();
            Divider.color(Hive.Color.n200);
        }, Divider);
        this.observeComponentCreation2((v6, w6) => {
            Column.create({ space: Hive.Spacing.s2 });
            Column.width('100%');
            Column.padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4, top: 10, bottom: 10 });
            Column.backgroundColor(Hive.Color.brandWhite);
        }, Column);
        this.observeComponentCreation2((t6, u6) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((r6, s6) => {
            Text.create(this.state.sectionTitle);
            Text.fontSize(Hive.Typography.caption);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((p6, q6) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((n6, o6) => {
            Text.create(`Step ${this.state.currentStepIndex} of ${this.state.totalSteps}`);
            Text.fontSize(Hive.Typography.caption);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((l6, m6) => {
            Progress.create({ value: this.progress(), total: 100, type: ProgressType.Linear });
            Progress.color(Hive.Color.brandPrimary);
            Progress.width('100%');
        }, Progress);
        Column.pop();
        this.observeComponentCreation2((j6, k6) => {
            Divider.create();
            Divider.color(Hive.Color.n200);
        }, Divider);
        this.observeComponentCreation2((h6, i6) => {
            Scroll.create();
            Scroll.layoutWeight(1);
            Scroll.backgroundColor(Hive.Color.n50);
        }, Scroll);
        this.observeComponentCreation2((f6, g6) => {
            Column.create({ space: Hive.Spacing.s4 });
            Column.padding(Hive.Spacing.s4);
        }, Column);
        this.observeComponentCreation2((d6, e6) => {
            Column.create({ space: Hive.Spacing.s2 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((b6, c6) => {
            Row.create({ space: Hive.Spacing.s1 });
            Row.padding({ left: 12, right: 12, top: 4, bottom: 4 });
            Row.borderRadius(Hive.Radius.full);
            Row.backgroundColor('#FFEEEF');
        }, Row);
        this.observeComponentCreation2((z5, a6) => {
            Text.create(this.state.sectionTitle);
            Text.fontSize(12);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(Hive.Color.brandPrimary);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((x5, y5) => {
            Text.create(this.stepTitle());
            Text.fontSize(Hive.Typography.headingMd);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.n900);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((v5, w5) => {
            Column.create({ space: 0 });
            Column.width('100%');
            Column.padding(Hive.Spacing.s4);
            Column.borderRadius(Hive.Radius.lg);
            Column.backgroundColor(Hive.Color.brandWhite);
            Column.shadow({ radius: 8, color: '#0F000000', offsetY: 2 });
        }, Column);
        {
            this.observeComponentCreation2((r5, s5) => {
                if (s5) {
                    let t5 = new KYCStepContent(this, { state: this.state }, undefined, r5, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 264, col: 13 });
                    ViewPU.create(t5);
                    let u5 = () => {
                        return {
                            state: this.state
                        };
                    };
                    t5.paramsGenerator_ = u5;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(r5, {
                        state: this.state
                    });
                }
            }, { name: "KYCStepContent" });
        }
        Column.pop();
        this.observeComponentCreation2((n5, o5) => {
            If.create();
            if (this.state.errorMessage !== '') {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((p5, q5) => {
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
        this.observeComponentCreation2((l5, m5) => {
            Blank.create();
            Blank.height(100);
        }, Blank);
        Blank.pop();
        Column.pop();
        Scroll.pop();
        this.observeComponentCreation2((j5, k5) => {
            Divider.create();
            Divider.color(Hive.Color.n200);
        }, Divider);
        this.observeComponentCreation2((h5, i5) => {
            Row.create({ space: Hive.Spacing.s3 });
            Row.width('100%');
            Row.padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4, top: 12, bottom: 28 });
            Row.backgroundColor(Hive.Color.brandWhite);
        }, Row);
        this.observeComponentCreation2((d5, e5) => {
            If.create();
            if (this.state.currentStepIndex > 1) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((f5, g5) => {
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
        this.observeComponentCreation2((b5, c5) => {
            Button.createWithLabel(this.state.isSubmitting ? 'Submitting…' :
                this.state.currentStepIndex >= this.state.totalSteps ? 'Submit Application' : 'Continue');
            Button.layoutWeight(1);
            Button.height(52);
            Button.borderRadius(Hive.Radius.base);
            Button.backgroundColor(this.state.isSubmitting ? Hive.Color.n300 : Hive.Color.brandPrimary);
            Button.fontColor(Hive.Color.brandWhite);
            Button.fontWeight(FontWeight.Medium);
            Button.enabled(!this.state.isSubmitting);
            Button.onClick(() => { this.doSubmit(); });
        }, Button);
        Button.pop();
        Row.pop();
        Column.pop();
    }
    stepTitle(): string {
        const a5 = this.state.currentStepId;
        if (a5.includes('name'))
            return '👤 Full Legal Name';
        if (a5.includes('dob'))
            return '🎂 Date of Birth & Nationality';
        if (a5.includes('contact'))
            return '📱 Contact Details';
        if (a5.includes('identifier'))
            return '🪪 Government ID Number';
        if (a5.includes('address'))
            return '🏠 Residential Address';
        if (a5.includes('document'))
            return '📄 Upload Identity Document';
        if (a5.includes('liveness'))
            return '😊 Selfie & Liveness Check';
        if (a5.includes('wealth'))
            return '💼 Occupation & Source of Funds';
        if (a5.includes('openbanking'))
            return '🏦 Connect Your Bank';
        if (a5.includes('declaration'))
            return '✍️ Legal Declarations';
        return 'Application';
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class KYCStepContent extends ViewPU {
    constructor(u4, v4, w4, x4 = -1, y4 = undefined, z4) {
        super(u4, w4, x4, z4);
        if (typeof y4 === "function") {
            this.paramsGenerator_ = y4;
        }
        this.__state = new SynchedPropertyNesedObjectPU(v4.state, this, "state");
        this.setInitiallyProvidedValue(v4);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(t4: KYCStepContent_Params) {
        this.__state.set(t4.state);
    }
    updateStateVars(s4: KYCStepContent_Params) {
        this.__state.set(s4.state);
    }
    purgeVariableDependenciesOnElmtId(r4) {
        this.__state.purgeDependencyOnElmtId(r4);
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
    initialRender() {
        this.observeComponentCreation2((z2, a3) => {
            If.create();
            if (this.state.currentStepId.includes('name')) {
                this.ifElseBranchUpdateFunction(0, () => {
                    {
                        this.observeComponentCreation2((n4, o4) => {
                            if (o4) {
                                let p4 = new KYCNameStep(this, { state: this.state }, undefined, n4, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 330, col: 7 });
                                ViewPU.create(p4);
                                let q4 = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                p4.paramsGenerator_ = q4;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(n4, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCNameStep" });
                    }
                });
            }
            else if (this.state.currentStepId.includes('dob')) {
                this.ifElseBranchUpdateFunction(1, () => {
                    {
                        this.observeComponentCreation2((j4, k4) => {
                            if (k4) {
                                let l4 = new KYCDobNationalityStep(this, { state: this.state }, undefined, j4, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 332, col: 7 });
                                ViewPU.create(l4);
                                let m4 = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                l4.paramsGenerator_ = m4;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(j4, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCDobNationalityStep" });
                    }
                });
            }
            else if (this.state.currentStepId.includes('contact')) {
                this.ifElseBranchUpdateFunction(2, () => {
                    {
                        this.observeComponentCreation2((f4, g4) => {
                            if (g4) {
                                let h4 = new KYCContactStep(this, { state: this.state }, undefined, f4, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 334, col: 7 });
                                ViewPU.create(h4);
                                let i4 = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                h4.paramsGenerator_ = i4;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(f4, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCContactStep" });
                    }
                });
            }
            else if (this.state.currentStepId.includes('identifier')) {
                this.ifElseBranchUpdateFunction(3, () => {
                    {
                        this.observeComponentCreation2((b4, c4) => {
                            if (c4) {
                                let d4 = new KYCIdentifierStep(this, { state: this.state }, undefined, b4, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 336, col: 7 });
                                ViewPU.create(d4);
                                let e4 = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                d4.paramsGenerator_ = e4;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(b4, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCIdentifierStep" });
                    }
                });
            }
            else if (this.state.currentStepId.includes('address')) {
                this.ifElseBranchUpdateFunction(4, () => {
                    {
                        this.observeComponentCreation2((x3, y3) => {
                            if (y3) {
                                let z3 = new KYCAddressStep(this, { state: this.state }, undefined, x3, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 338, col: 7 });
                                ViewPU.create(z3);
                                let a4 = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                z3.paramsGenerator_ = a4;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(x3, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCAddressStep" });
                    }
                });
            }
            else if (this.state.currentStepId.includes('document')) {
                this.ifElseBranchUpdateFunction(5, () => {
                    {
                        this.observeComponentCreation2((t3, u3) => {
                            if (u3) {
                                let v3 = new KYCDocumentStep(this, { state: this.state }, undefined, t3, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 340, col: 7 });
                                ViewPU.create(v3);
                                let w3 = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                v3.paramsGenerator_ = w3;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(t3, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCDocumentStep" });
                    }
                });
            }
            else if (this.state.currentStepId.includes('liveness')) {
                this.ifElseBranchUpdateFunction(6, () => {
                    {
                        this.observeComponentCreation2((p3, q3) => {
                            if (q3) {
                                let r3 = new KYCLivenessStep(this, { state: this.state }, undefined, p3, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 342, col: 7 });
                                ViewPU.create(r3);
                                let s3 = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                r3.paramsGenerator_ = s3;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(p3, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCLivenessStep" });
                    }
                });
            }
            else if (this.state.currentStepId.includes('wealth')) {
                this.ifElseBranchUpdateFunction(7, () => {
                    {
                        this.observeComponentCreation2((l3, m3) => {
                            if (m3) {
                                let n3 = new KYCWealthStep(this, { state: this.state }, undefined, l3, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 344, col: 7 });
                                ViewPU.create(n3);
                                let o3 = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                n3.paramsGenerator_ = o3;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(l3, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCWealthStep" });
                    }
                });
            }
            else if (this.state.currentStepId.includes('openbanking')) {
                this.ifElseBranchUpdateFunction(8, () => {
                    {
                        this.observeComponentCreation2((h3, i3) => {
                            if (i3) {
                                let j3 = new KYCOpenBankingStep(this, { state: this.state }, undefined, h3, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 346, col: 7 });
                                ViewPU.create(j3);
                                let k3 = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                j3.paramsGenerator_ = k3;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(h3, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCOpenBankingStep" });
                    }
                });
            }
            else if (this.state.currentStepId.includes('declaration')) {
                this.ifElseBranchUpdateFunction(9, () => {
                    {
                        this.observeComponentCreation2((d3, e3) => {
                            if (e3) {
                                let f3 = new KYCDeclarationStep(this, { state: this.state }, undefined, d3, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 348, col: 7 });
                                ViewPU.create(f3);
                                let g3 = () => {
                                    return {
                                        state: this.state
                                    };
                                };
                                f3.paramsGenerator_ = g3;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(d3, {
                                    state: this.state
                                });
                            }
                        }, { name: "KYCDeclarationStep" });
                    }
                });
            }
            else {
                this.ifElseBranchUpdateFunction(10, () => {
                    this.observeComponentCreation2((b3, c3) => {
                        Text.create(`Unknown step: ${this.state.currentStepId}`);
                        Text.fontSize(13);
                        Text.fontColor(Hive.Color.n400);
                    }, Text);
                    Text.pop();
                });
            }
        }, If);
        If.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class KYCCompletionView extends ViewPU {
    constructor(t2, u2, v2, w2 = -1, x2 = undefined, y2) {
        super(t2, v2, w2, y2);
        if (typeof x2 === "function") {
            this.paramsGenerator_ = x2;
        }
        this.setInitiallyProvidedValue(u2);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(s2: KYCCompletionView_Params) {
    }
    updateStateVars(r2: KYCCompletionView_Params) {
    }
    purgeVariableDependenciesOnElmtId(q2) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    initialRender() {
        this.observeComponentCreation2((o2, p2) => {
            Column.create({ space: Hive.Spacing.s6 });
            Column.width('100%');
            Column.height('100%');
            Column.padding(Hive.Spacing.s6);
            Column.backgroundColor(Hive.Color.n50);
            Column.alignItems(HorizontalAlign.Center);
            Column.justifyContent(FlexAlign.Center);
        }, Column);
        {
            this.observeComponentCreation2((k2, l2) => {
                if (l2) {
                    let m2 = new HSBCLogoView(this, {}, undefined, k2, () => { }, { page: "entry/src/main/ets/kyc/KYCShellViews.ets", line: 362, col: 7 });
                    ViewPU.create(m2);
                    let n2 = () => {
                        return {};
                    };
                    m2.paramsGenerator_ = n2;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(k2, {});
                }
            }, { name: "HSBCLogoView" });
        }
        this.observeComponentCreation2((i2, j2) => {
            Text.create('✅');
            Text.fontSize(72);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((g2, h2) => {
            Text.create('Application Submitted');
            Text.fontSize(Hive.Typography.headingXL);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Hive.Color.success);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((e2, f2) => {
            Column.create({ space: Hive.Spacing.s3 });
            Column.width('100%');
            Column.padding(Hive.Spacing.s5);
            Column.borderRadius(Hive.Radius.md);
            Column.backgroundColor(Hive.Color.n50);
            Column.border({ width: 1, color: Hive.Color.n200, radius: Hive.Radius.md });
        }, Column);
        this.observeComponentCreation2((t1, u1) => {
            ForEach.create();
            const v1 = w1 => {
                const x1 = w1;
                this.observeComponentCreation2((c2, d2) => {
                    Row.create({ space: Hive.Spacing.s3 });
                    Row.width('100%');
                }, Row);
                this.observeComponentCreation2((a2, b2) => {
                    Text.create(x1.icon);
                    Text.fontSize(16);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((y1, z1) => {
                    Text.create(x1.text);
                    Text.fontSize(14);
                    Text.fontColor(Hive.Color.n700);
                }, Text);
                Text.pop();
                Row.pop();
            };
            this.forEachUpdateFunction(t1, [
                { icon: '📧', text: 'Confirmation email sent' } as CompletionItem,
                { icon: '📱', text: 'SMS notification will follow' } as CompletionItem,
                { icon: '⏱', text: 'Decision within 3 working days' } as CompletionItem,
                { icon: '🔒', text: 'Data encrypted per PDPO Cap. 486' } as CompletionItem
            ], v1);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        this.observeComponentCreation2((r1, s1) => {
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
    constructor(l1, m1, n1, o1 = -1, p1 = undefined, q1) {
        super(l1, n1, o1, q1);
        if (typeof p1 === "function") {
            this.paramsGenerator_ = p1;
        }
        this.setInitiallyProvidedValue(m1);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(k1: HSBCLogoView_Params) {
    }
    updateStateVars(j1: HSBCLogoView_Params) {
    }
    purgeVariableDependenciesOnElmtId(i1) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    initialRender() {
        this.observeComponentCreation2((g1, h1) => {
            Row.create({ space: Hive.Spacing.s2 });
            Row.alignItems(VerticalAlign.Center);
        }, Row);
        this.observeComponentCreation2((e1, f1) => {
            Grid.create();
            Grid.columnsTemplate('1fr 1fr');
            Grid.rowsTemplate('1fr 1fr');
            Grid.width(28);
            Grid.height(28);
            Grid.border({ width: 0.5, color: Hive.Color.n200 });
        }, Grid);
        {
            const y = (c1, d1) => {
                GridItem.create(() => { }, false);
            };
            const z = () => {
                this.observeComponentCreation2(y, GridItem);
                this.observeComponentCreation2((a1, b1) => {
                    Row.create();
                    Row.width(14);
                    Row.height(14);
                    Row.backgroundColor(Hive.Color.brandPrimary);
                }, Row);
                Row.pop();
                GridItem.pop();
            };
            z();
        }
        {
            const s = (w, x) => {
                GridItem.create(() => { }, false);
            };
            const t = () => {
                this.observeComponentCreation2(s, GridItem);
                this.observeComponentCreation2((u, v) => {
                    Row.create();
                    Row.width(14);
                    Row.height(14);
                    Row.backgroundColor(Hive.Color.brandWhite);
                }, Row);
                Row.pop();
                GridItem.pop();
            };
            t();
        }
        {
            const m = (q, r) => {
                GridItem.create(() => { }, false);
            };
            const n = () => {
                this.observeComponentCreation2(m, GridItem);
                this.observeComponentCreation2((o, p) => {
                    Row.create();
                    Row.width(14);
                    Row.height(14);
                    Row.backgroundColor(Hive.Color.brandWhite);
                }, Row);
                Row.pop();
                GridItem.pop();
            };
            n();
        }
        {
            const g = (k, l) => {
                GridItem.create(() => { }, false);
            };
            const h = () => {
                this.observeComponentCreation2(g, GridItem);
                this.observeComponentCreation2((i, j) => {
                    Row.create();
                    Row.width(14);
                    Row.height(14);
                    Row.backgroundColor(Hive.Color.brandPrimary);
                }, Row);
                Row.pop();
                GridItem.pop();
            };
            h();
        }
        Grid.pop();
        this.observeComponentCreation2((e, f) => {
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
