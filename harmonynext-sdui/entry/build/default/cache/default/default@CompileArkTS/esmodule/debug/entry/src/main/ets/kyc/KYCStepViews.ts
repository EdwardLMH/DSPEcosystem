if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface KYCDeclarationStep_Params {
    state?: KYCState;
    pepStatus?: string;
    declTruthful?: boolean;
    declFatca?: boolean;
}
interface KYCOpenBankingStep_Params {
    state?: KYCState;
    selectedBank?: string;
    connected?: boolean;
    connecting?: boolean;
    showBankPicker?: boolean;
    banks?: StringPair[];
}
interface KYCLivenessStep_Params {
    state?: KYCState;
    phase?: string;
    progress?: number;
}
interface KYCSourceOfFundsStep_Params {
    state?: KYCState;
    showFundsPicker?: boolean;
    selectedFunds?: string;
    showPurposePicker?: boolean;
    selectedPurpose?: string;
}
interface KYCEmploymentIncomeStep_Params {
    state?: KYCState;
    showEmpPicker?: boolean;
    selectedEmp?: string;
    showIncPicker?: boolean;
    selectedInc?: string;
}
interface KYCAddressStep_Params {
    state?: KYCState;
    showDistrictPicker?: boolean;
    selectedDistrict?: string;
}
interface KYCContactStep_Params {
    state?: KYCState;
}
interface KYCDocumentStep_Params {
    state?: KYCState;
    frontDone?: boolean;
    backDone?: boolean;
}
interface KYCPassportStep_Params {
    state?: KYCState;
}
interface KYCMainlandIDStep_Params {
    state?: KYCState;
}
interface KYCHKIDStep_Params {
    state?: KYCState;
}
interface KYCNationalityStep_Params {
    state?: KYCState;
    showPicker?: boolean;
    selectedCode?: string;
}
interface KYCNameDobStep_Params {
    state?: KYCState;
}
import { Hive } from "@normalized:N&&&entry/src/main/ets/common/HiveTokens&";
import type { KYCState } from '../models/SDUIModels';
// ─── Shared interfaces ────────────────────────────────────────────────────────
interface StringPair {
    code: string;
    label: string;
}
interface StringTriple {
    code: string;
    label: string;
    placeholder: string;
}
interface LivenessInstruction {
    icon: string;
    title: string;
    desc: string;
}
interface PepOption {
    val: string;
    label: string;
}
interface DeclOption {
    id: string;
    text: string;
}
// ─── Shared reference data ────────────────────────────────────────────────────
const COUNTRIES: StringPair[] = [
    { code: 'HK', label: '🇭🇰 Hong Kong SAR' },
    { code: 'CN', label: '🇨🇳 Mainland China' },
    { code: 'SG', label: '🇸🇬 Singapore' },
    { code: 'GB', label: '🇬🇧 United Kingdom' },
    { code: 'US', label: '🇺🇸 United States' },
    { code: 'AU', label: '🇦🇺 Australia' },
    { code: 'IN', label: '🇮🇳 India' },
    { code: 'JP', label: '🇯🇵 Japan' },
    { code: 'OTHER', label: 'Other' },
];
const HK_DISTRICTS: StringPair[] = [
    { code: 'central_western', label: 'Central & Western (中西區)' },
    { code: 'eastern', label: 'Eastern (東區)' },
    { code: 'southern', label: 'Southern (南區)' },
    { code: 'wan_chai', label: 'Wan Chai (灣仔)' },
    { code: 'kowloon_city', label: 'Kowloon City (九龍城)' },
    { code: 'kwun_tong', label: 'Kwun Tong (觀塘)' },
    { code: 'sham_shui_po', label: 'Sham Shui Po (深水埗)' },
    { code: 'yau_tsim_mong', label: 'Yau Tsim Mong (油尖旺)' },
    { code: 'sha_tin', label: 'Sha Tin (沙田)' },
    { code: 'tai_po', label: 'Tai Po (大埔)' },
    { code: 'north', label: 'North (北區)' },
    { code: 'islands', label: 'Islands (離島)' },
];
const EMPLOYMENT_OPTIONS: StringPair[] = [
    { code: 'EMPLOYED', label: 'Employed (full-time or part-time)' },
    { code: 'SELF_EMPLOYED', label: 'Self-employed' },
    { code: 'BUSINESS_OWNER', label: 'Business owner' },
    { code: 'RETIRED', label: 'Retired' },
    { code: 'STUDENT', label: 'Student' },
    { code: 'HOMEMAKER', label: 'Homemaker' },
    { code: 'UNEMPLOYED', label: 'Unemployed' },
];
const INCOME_OPTIONS: StringPair[] = [
    { code: 'below_100k', label: 'Below HKD 100,000' },
    { code: '100k_300k', label: 'HKD 100,000 – 300,000' },
    { code: '300k_600k', label: 'HKD 300,000 – 600,000' },
    { code: '600k_1m', label: 'HKD 600,000 – 1,000,000' },
    { code: 'above_1m', label: 'Above HKD 1,000,000' },
    { code: 'prefer_not', label: 'Prefer not to say' },
];
const FUNDS_OPTIONS: StringPair[] = [
    { code: 'EMPLOYMENT', label: 'Employment / Salary' },
    { code: 'BUSINESS', label: 'Business Income' },
    { code: 'INVESTMENT', label: 'Investment Returns' },
    { code: 'INHERITANCE', label: 'Inheritance / Gift' },
    { code: 'PROPERTY', label: 'Property Sale' },
    { code: 'PENSION', label: 'Pension / Retirement Fund' },
    { code: 'SAVINGS', label: 'Accumulated Savings' },
    { code: 'OTHER', label: 'Other' },
];
const PURPOSE_OPTIONS: StringPair[] = [
    { code: 'EVERYDAY_BANKING', label: 'Everyday banking & payments' },
    { code: 'SAVINGS', label: 'Savings & deposits' },
    { code: 'INVESTMENT', label: 'Investment & wealth management' },
    { code: 'SALARY_RECEIPT', label: 'Salary / income receipt' },
    { code: 'INTERNATIONAL_TRANSFER', label: 'International money transfers' },
    { code: 'MORTGAGE', label: 'Mortgage repayments' },
];
// ─── Helper: safe answer read ─────────────────────────────────────────────────
function answerStr(state: KYCState, key: string): string {
    const v: any = state.answers[key];
    if (v === null || v === undefined)
        return '';
    return v as string;
}
export class KYCNameDobStep extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state = new SynchedPropertyNesedObjectPU(params.state, this, "state");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: KYCNameDobStep_Params) {
        this.__state.set(params.state);
    }
    updateStateVars(params: KYCNameDobStep_Params) {
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
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s4 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // First Name
            Column.create({ space: Hive.Spacing.s1 });
            // First Name
            Column.width('100%');
            // First Name
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: Hive.Spacing.s1 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('First Name / Given Name');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
            Text.fontSize(Hive.Typography.labelBase);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('As it appears on your official ID document');
            Text.fontSize(Hive.Typography.caption);
            Text.fontColor(Hive.Color.n500);
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: 'e.g. Tai Man', text: answerStr(this.state, 'q_first_name') });
            TextInput.width('100%');
            TextInput.height(Hive.Component.Input.height);
            TextInput.borderRadius(Hive.Radius.base);
            TextInput.borderWidth(1);
            TextInput.borderColor(Hive.Color.n300);
            TextInput.onChange((v: string) => { this.state.setAnswer('q_first_name', v as any); });
        }, TextInput);
        // First Name
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Last Name
            Column.create({ space: Hive.Spacing.s1 });
            // Last Name
            Column.width('100%');
            // Last Name
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: Hive.Spacing.s1 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Last Name / Surname');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
            Text.fontSize(Hive.Typography.labelBase);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: 'e.g. CHAN', text: answerStr(this.state, 'q_last_name') });
            TextInput.width('100%');
            TextInput.height(Hive.Component.Input.height);
            TextInput.borderRadius(Hive.Radius.base);
            TextInput.borderWidth(1);
            TextInput.borderColor(Hive.Color.n300);
            TextInput.onChange((v: string) => { this.state.setAnswer('q_last_name', v as any); });
        }, TextInput);
        // Last Name
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Date of Birth
            Column.create({ space: Hive.Spacing.s1 });
            // Date of Birth
            Column.width('100%');
            // Date of Birth
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: Hive.Spacing.s1 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Date of Birth');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
            Text.fontSize(Hive.Typography.labelBase);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('You must be at least 18 years old. Format: YYYY-MM-DD');
            Text.fontSize(Hive.Typography.caption);
            Text.fontColor(Hive.Color.n500);
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: 'YYYY-MM-DD', text: answerStr(this.state, 'q_date_of_birth') });
            TextInput.width('100%');
            TextInput.height(Hive.Component.Input.height);
            TextInput.borderRadius(Hive.Radius.base);
            TextInput.borderWidth(1);
            TextInput.borderColor(Hive.Color.n300);
            TextInput.type(InputType.Number);
            TextInput.onChange((v: string) => { this.state.setAnswer('q_date_of_birth', v as any); });
        }, TextInput);
        // Date of Birth
        Column.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
export class KYCNationalityStep extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state = new SynchedPropertyNesedObjectPU(params.state, this, "state");
        this.__showPicker = new ObservedPropertySimplePU(false, this, "showPicker");
        this.__selectedCode = new ObservedPropertySimplePU('' // ← reactive mirror of state.answers value
        , this, "selectedCode");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: KYCNationalityStep_Params) {
        this.__state.set(params.state);
        if (params.showPicker !== undefined) {
            this.showPicker = params.showPicker;
        }
        if (params.selectedCode !== undefined) {
            this.selectedCode = params.selectedCode;
        }
    }
    updateStateVars(params: KYCNationalityStep_Params) {
        this.__state.set(params.state);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__state.purgeDependencyOnElmtId(rmElmtId);
        this.__showPicker.purgeDependencyOnElmtId(rmElmtId);
        this.__selectedCode.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__state.aboutToBeDeleted();
        this.__showPicker.aboutToBeDeleted();
        this.__selectedCode.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __state: SynchedPropertyNesedObjectPU<KYCState>;
    get state() {
        return this.__state.get();
    }
    private __showPicker: ObservedPropertySimplePU<boolean>;
    get showPicker() {
        return this.__showPicker.get();
    }
    set showPicker(newValue: boolean) {
        this.__showPicker.set(newValue);
    }
    private __selectedCode: ObservedPropertySimplePU<string>; // ← reactive mirror of state.answers value
    get selectedCode() {
        return this.__selectedCode.get();
    }
    set selectedCode(newValue: string) {
        this.__selectedCode.set(newValue);
    }
    aboutToAppear() {
        // Restore any previously saved answer (e.g. navigating back)
        this.selectedCode = answerStr(this.state, 'q_nationality');
    }
    natLabel(): string {
        const c = COUNTRIES.find((e: StringPair) => e.code === this.selectedCode);
        return c ? c.label : 'Select nationality';
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s4 });
            Column.width('100%');
            Column.bindSheet({ value: this.showPicker, changeEvent: newValue => { this.showPicker = newValue; } }, { builder: () => {
                    this.pickerSheet.call(this);
                } }, { height: SheetSize.MEDIUM });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: Hive.Spacing.s1 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Nationality');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
            Text.fontSize(Hive.Typography.labelBase);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.height(Hive.Component.Input.height);
            Row.padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4 });
            Row.borderRadius(Hive.Radius.base);
            Row.borderWidth(1);
            Row.borderColor(Hive.Color.n300);
            Row.backgroundColor(Hive.Color.brandWhite);
            Row.onClick(() => { this.showPicker = true; });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.natLabel());
            Text.fontSize(Hive.Typography.bodyBase);
            Text.fontColor(this.selectedCode === '' ? Hive.Color.n400 : Hive.Color.n800);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('▼');
            Text.fontSize(12);
            Text.fontColor(Hive.Color.n400);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        Column.pop();
    }
    pickerSheet(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.height('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Select Nationality');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
            Text.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
        }, Divider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            List.create();
            List.width('100%');
            List.layoutWeight(1);
        }, List);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const e = _item;
                {
                    const itemCreation = (elmtId, isInitialRender) => {
                        ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                        ListItem.create(deepRenderFunction, true);
                        if (!isInitialRender) {
                            ListItem.pop();
                        }
                        ViewStackProcessor.StopGetAccessRecording();
                    };
                    const itemCreation2 = (elmtId, isInitialRender) => {
                        ListItem.create(deepRenderFunction, true);
                    };
                    const deepRenderFunction = (elmtId, isInitialRender) => {
                        itemCreation(elmtId, isInitialRender);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Row.create();
                            Row.width('100%');
                            Row.height(50);
                            Row.padding({ left: 16, right: 16 });
                            Row.onClick(() => {
                                this.selectedCode = e.code; // triggers re-render immediately
                                this.state.setAnswer('q_nationality', e.code as any);
                                this.showPicker = false;
                            });
                        }, Row);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(e.label);
                            Text.fontSize(15);
                            Text.fontColor(Hive.Color.n800);
                            Text.layoutWeight(1);
                        }, Text);
                        Text.pop();
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            If.create();
                            if (e.code === this.selectedCode) {
                                this.ifElseBranchUpdateFunction(0, () => {
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        Text.create('✓');
                                        Text.fontColor(Hive.Color.success);
                                        Text.fontWeight(FontWeight.Bold);
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
                        ListItem.pop();
                    };
                    this.observeComponentCreation2(itemCreation2, ListItem);
                    ListItem.pop();
                }
            };
            this.forEachUpdateFunction(elmtId, COUNTRIES, forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        List.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
export class KYCHKIDStep extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state = new SynchedPropertyNesedObjectPU(params.state, this, "state");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: KYCHKIDStep_Params) {
        this.__state.set(params.state);
    }
    updateStateVars(params: KYCHKIDStep_Params) {
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
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s4 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: Hive.Spacing.s1 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('HKID Number');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
            Text.fontSize(Hive.Typography.labelBase);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Include check digit in brackets, e.g. A123456(7)');
            Text.fontSize(Hive.Typography.caption);
            Text.fontColor(Hive.Color.n500);
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: 'A123456(7)', text: answerStr(this.state, 'q_hkid_number') });
            TextInput.width('100%');
            TextInput.height(Hive.Component.Input.height);
            TextInput.borderRadius(Hive.Radius.base);
            TextInput.borderWidth(1);
            TextInput.borderColor(Hive.Color.n300);
            TextInput.onChange((v: string) => { this.state.setAnswer('q_hkid_number', v as any); });
        }, TextInput);
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('HKID Expiry Date');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Enter DD/MM/YYYY or "N/A" for permanent residents');
            Text.fontSize(Hive.Typography.caption);
            Text.fontColor(Hive.Color.n500);
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: 'DD/MM/YYYY or N/A', text: answerStr(this.state, 'q_hkid_expiry') });
            TextInput.width('100%');
            TextInput.height(Hive.Component.Input.height);
            TextInput.borderRadius(Hive.Radius.base);
            TextInput.borderWidth(1);
            TextInput.borderColor(Hive.Color.n300);
            TextInput.onChange((v: string) => { this.state.setAnswer('q_hkid_expiry', v as any); });
        }, TextInput);
        Column.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
export class KYCMainlandIDStep extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state = new SynchedPropertyNesedObjectPU(params.state, this, "state");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: KYCMainlandIDStep_Params) {
        this.__state.set(params.state);
    }
    updateStateVars(params: KYCMainlandIDStep_Params) {
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
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s4 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: Hive.Spacing.s1 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Mainland China ID (居民身份証)');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
            Text.fontSize(Hive.Typography.labelBase);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('18-digit resident identity number');
            Text.fontSize(Hive.Typography.caption);
            Text.fontColor(Hive.Color.n500);
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '110101199001011234', text: answerStr(this.state, 'q_mainland_id') });
            TextInput.width('100%');
            TextInput.height(Hive.Component.Input.height);
            TextInput.borderRadius(Hive.Radius.base);
            TextInput.borderWidth(1);
            TextInput.borderColor(Hive.Color.n300);
            TextInput.onChange((v: string) => { this.state.setAnswer('q_mainland_id', v as any); });
        }, TextInput);
        Column.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
export class KYCPassportStep extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state = new SynchedPropertyNesedObjectPU(params.state, this, "state");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: KYCPassportStep_Params) {
        this.__state.set(params.state);
    }
    updateStateVars(params: KYCPassportStep_Params) {
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
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s4 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: Hive.Spacing.s1 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Passport Number');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
            Text.fontSize(Hive.Typography.labelBase);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: 'e.g. X12345678', text: answerStr(this.state, 'q_passport_number') });
            TextInput.width('100%');
            TextInput.height(Hive.Component.Input.height);
            TextInput.borderRadius(Hive.Radius.base);
            TextInput.borderWidth(1);
            TextInput.borderColor(Hive.Color.n300);
            TextInput.onChange((v: string) => { this.state.setAnswer('q_passport_number', v as any); });
        }, TextInput);
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: Hive.Spacing.s1 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Passport Expiry Date');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
            Text.fontSize(Hive.Typography.labelBase);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: 'DD/MM/YYYY', text: answerStr(this.state, 'q_passport_expiry') });
            TextInput.width('100%');
            TextInput.height(Hive.Component.Input.height);
            TextInput.borderRadius(Hive.Radius.base);
            TextInput.borderWidth(1);
            TextInput.borderColor(Hive.Color.n300);
            TextInput.onChange((v: string) => { this.state.setAnswer('q_passport_expiry', v as any); });
        }, TextInput);
        Column.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
export class KYCDocumentStep extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state = new SynchedPropertyNesedObjectPU(params.state, this, "state");
        this.__frontDone = new ObservedPropertySimplePU(false, this, "frontDone");
        this.__backDone = new ObservedPropertySimplePU(false, this, "backDone");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: KYCDocumentStep_Params) {
        this.__state.set(params.state);
        if (params.frontDone !== undefined) {
            this.frontDone = params.frontDone;
        }
        if (params.backDone !== undefined) {
            this.backDone = params.backDone;
        }
    }
    updateStateVars(params: KYCDocumentStep_Params) {
        this.__state.set(params.state);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__state.purgeDependencyOnElmtId(rmElmtId);
        this.__frontDone.purgeDependencyOnElmtId(rmElmtId);
        this.__backDone.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__state.aboutToBeDeleted();
        this.__frontDone.aboutToBeDeleted();
        this.__backDone.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __state: SynchedPropertyNesedObjectPU<KYCState>;
    get state() {
        return this.__state.get();
    }
    private __frontDone: ObservedPropertySimplePU<boolean>;
    get frontDone() {
        return this.__frontDone.get();
    }
    set frontDone(newValue: boolean) {
        this.__frontDone.set(newValue);
    }
    private __backDone: ObservedPropertySimplePU<boolean>;
    get backDone() {
        return this.__backDone.get();
    }
    set backDone(newValue: boolean) {
        this.__backDone.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s4 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Info banner
            Row.create({ space: Hive.Spacing.s2 });
            // Info banner
            Row.padding(Hive.Spacing.s3);
            // Info banner
            Row.width('100%');
            // Info banner
            Row.borderRadius(Hive.Radius.md);
            // Info banner
            Row.backgroundColor(Hive.Color.infoLt);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('📄');
            Text.fontSize(14);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Upload a clear photo or scan of your Hong Kong Identity Card');
            Text.fontSize(13);
            Text.fontColor(Hive.Color.n700);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        // Info banner
        Row.pop();
        this.uploadZone.bind(this)('Front / Photo Page', 'Hold flat, ensure all corners are visible', this.frontDone, () => {
            this.frontDone = true;
            this.state.setAnswer('q_hkid_front', 'captured' as any);
        });
        this.uploadZone.bind(this)('Back Side', 'Required for HKID', this.backDone, () => {
            this.backDone = true;
            this.state.setAnswer('q_hkid_back', 'captured' as any);
        });
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.frontDone) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: Hive.Spacing.s2 });
                        Column.padding(Hive.Spacing.s3);
                        Column.width('100%');
                        Column.borderRadius(Hive.Radius.base);
                        Column.backgroundColor(Hive.Color.successLt);
                        Column.border({ width: 1, color: Hive.Color.success, radius: Hive.Radius.base });
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('✓ Quality checklist');
                        Text.fontSize(13);
                        Text.fontWeight(FontWeight.Medium);
                        Text.fontColor(Hive.Color.success);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const check = _item;
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Row.create({ space: Hive.Spacing.s2 });
                                Row.width('100%');
                            }, Row);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create('✔');
                                Text.fontColor(Hive.Color.success);
                                Text.fontSize(12);
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create(check);
                                Text.fontSize(12);
                                Text.fontColor(Hive.Color.n700);
                            }, Text);
                            Text.pop();
                            Row.pop();
                        };
                        this.forEachUpdateFunction(elmtId, [
                            'All four corners are visible',
                            'Text is clear — no blurring',
                            'No glare or shadows',
                            'Document is not expired',
                        ], forEachItemGenFunction);
                    }, ForEach);
                    ForEach.pop();
                    Column.pop();
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
    uploadZone(label: string, hint: string, isDone: boolean, onCapture: () => void, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(label);
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(hint);
            Text.fontSize(Hive.Typography.caption);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create();
            Stack.onClick(onCapture);
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (isDone) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 4 });
                        Column.width('100%');
                        Column.height(140);
                        Column.justifyContent(FlexAlign.Center);
                        Column.alignItems(HorizontalAlign.Center);
                        Column.borderRadius(Hive.Radius.md);
                        Column.backgroundColor(Hive.Color.successLt);
                        Column.border({ width: 2, color: Hive.Color.success, radius: Hive.Radius.md });
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('✓');
                        Text.fontSize(32);
                        Text.fontColor(Hive.Color.success);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('Captured — tap to retake');
                        Text.fontSize(12);
                        Text.fontColor(Hive.Color.success);
                    }, Text);
                    Text.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 8 });
                        Column.width('100%');
                        Column.height(140);
                        Column.justifyContent(FlexAlign.Center);
                        Column.alignItems(HorizontalAlign.Center);
                        Column.borderRadius(Hive.Radius.md);
                        Column.backgroundColor(Hive.Color.n50);
                        Column.border({ width: 2, color: Hive.Color.n300, radius: Hive.Radius.md, style: BorderStyle.Dashed });
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('📷');
                        Text.fontSize(32);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('Take Photo or Upload');
                        Text.fontSize(14);
                        Text.fontWeight(FontWeight.Medium);
                        Text.fontColor(Hive.Color.n700);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('JPG, PNG or PDF · Max 10MB');
                        Text.fontSize(12);
                        Text.fontColor(Hive.Color.n400);
                    }, Text);
                    Text.pop();
                    Column.pop();
                });
            }
        }, If);
        If.pop();
        Stack.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
export class KYCContactStep extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state = new SynchedPropertyNesedObjectPU(params.state, this, "state");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: KYCContactStep_Params) {
        this.__state.set(params.state);
    }
    updateStateVars(params: KYCContactStep_Params) {
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
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s4 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: Hive.Spacing.s1 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Email Address');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
            Text.fontSize(Hive.Typography.labelBase);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("We'll send your application confirmation here");
            Text.fontSize(Hive.Typography.caption);
            Text.fontColor(Hive.Color.n500);
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: 'name@example.com', text: answerStr(this.state, 'q_email') });
            TextInput.width('100%');
            TextInput.height(Hive.Component.Input.height);
            TextInput.borderRadius(Hive.Radius.base);
            TextInput.borderWidth(1);
            TextInput.borderColor(Hive.Color.n300);
            TextInput.type(InputType.Email);
            TextInput.onChange((v: string) => { this.state.setAnswer('q_email', v as any); });
        }, TextInput);
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: Hive.Spacing.s1 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Mobile Phone Number');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
            Text.fontSize(Hive.Typography.labelBase);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Enter local HK number (8 digits)');
            Text.fontSize(Hive.Typography.caption);
            Text.fontColor(Hive.Color.n500);
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: Hive.Spacing.s2 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.height(Hive.Component.Input.height);
            Row.padding({ left: 12, right: 12 });
            Row.borderRadius(Hive.Radius.base);
            Row.borderWidth(1);
            Row.borderColor(Hive.Color.n300);
            Row.backgroundColor(Hive.Color.n50);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🇭🇰 +852');
            Text.fontSize(14);
            Text.fontColor(Hive.Color.n800);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '91234567', text: answerStr(this.state, 'q_phone') });
            TextInput.layoutWeight(1);
            TextInput.height(Hive.Component.Input.height);
            TextInput.borderRadius(Hive.Radius.base);
            TextInput.borderWidth(1);
            TextInput.borderColor(Hive.Color.n300);
            TextInput.type(InputType.PhoneNumber);
            TextInput.onChange((v: string) => { this.state.setAnswer('q_phone', `+852${v}` as any); });
        }, TextInput);
        Row.pop();
        Column.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
export class KYCAddressStep extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state = new SynchedPropertyNesedObjectPU(params.state, this, "state");
        this.__showDistrictPicker = new ObservedPropertySimplePU(false, this, "showDistrictPicker");
        this.__selectedDistrict = new ObservedPropertySimplePU('', this, "selectedDistrict");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: KYCAddressStep_Params) {
        this.__state.set(params.state);
        if (params.showDistrictPicker !== undefined) {
            this.showDistrictPicker = params.showDistrictPicker;
        }
        if (params.selectedDistrict !== undefined) {
            this.selectedDistrict = params.selectedDistrict;
        }
    }
    updateStateVars(params: KYCAddressStep_Params) {
        this.__state.set(params.state);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__state.purgeDependencyOnElmtId(rmElmtId);
        this.__showDistrictPicker.purgeDependencyOnElmtId(rmElmtId);
        this.__selectedDistrict.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__state.aboutToBeDeleted();
        this.__showDistrictPicker.aboutToBeDeleted();
        this.__selectedDistrict.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __state: SynchedPropertyNesedObjectPU<KYCState>;
    get state() {
        return this.__state.get();
    }
    sendAddress() {
        const line1 = answerStr(this.state, 'q_addr_line1');
        const line2 = answerStr(this.state, 'q_addr_line2');
        const dist = answerStr(this.state, 'q_addr_district');
        const parts: string[] = [];
        if (line1 !== '')
            parts.push(line1);
        if (line2 !== '')
            parts.push(line2);
        if (dist !== '')
            parts.push(dist);
        this.state.setAnswer('q_address', parts.join(', ') as any);
    }
    private __showDistrictPicker: ObservedPropertySimplePU<boolean>;
    get showDistrictPicker() {
        return this.__showDistrictPicker.get();
    }
    set showDistrictPicker(newValue: boolean) {
        this.__showDistrictPicker.set(newValue);
    }
    private __selectedDistrict: ObservedPropertySimplePU<string>;
    get selectedDistrict() {
        return this.__selectedDistrict.get();
    }
    set selectedDistrict(newValue: string) {
        this.__selectedDistrict.set(newValue);
    }
    aboutToAppear() { this.selectedDistrict = answerStr(this.state, 'q_addr_district'); }
    distLabel(): string {
        const d = HK_DISTRICTS.find((e: StringPair) => e.code === this.selectedDistrict);
        return d ? d.label : 'Select district';
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s3 });
            Column.width('100%');
            Column.bindSheet({ value: this.showDistrictPicker, changeEvent: newValue => { this.showDistrictPicker = newValue; } }, { builder: () => {
                    this.districtPickerSheet.call(this);
                } }, { height: SheetSize.MEDIUM });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: Hive.Spacing.s2 });
            Row.padding({ left: 12, right: 12, top: 4, bottom: 4 });
            Row.borderRadius(Hive.Radius.full);
            Row.backgroundColor('#FFEEEF');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('📍');
            Text.fontSize(12);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Hong Kong Address Format');
            Text.fontSize(12);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(Hive.Color.brandPrimary);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Address Line 1');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Flat / Floor / Block');
            Text.fontSize(Hive.Typography.caption);
            Text.fontColor(Hive.Color.n500);
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: 'e.g. Flat B, 12/F, Block 3', text: answerStr(this.state, 'q_addr_line1') });
            TextInput.width('100%');
            TextInput.height(Hive.Component.Input.height);
            TextInput.borderRadius(Hive.Radius.base);
            TextInput.borderWidth(1);
            TextInput.borderColor(Hive.Color.n300);
            TextInput.onChange((v: string) => { this.state.setAnswer('q_addr_line1', v as any); this.sendAddress(); });
        }, TextInput);
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Address Line 2');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Building name / Estate (optional)');
            Text.fontSize(Hive.Typography.caption);
            Text.fontColor(Hive.Color.n500);
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: 'Building / Estate name', text: answerStr(this.state, 'q_addr_line2') });
            TextInput.width('100%');
            TextInput.height(Hive.Component.Input.height);
            TextInput.borderRadius(Hive.Radius.base);
            TextInput.borderWidth(1);
            TextInput.borderColor(Hive.Color.n300);
            TextInput.onChange((v: string) => { this.state.setAnswer('q_addr_line2', v as any); this.sendAddress(); });
        }, TextInput);
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('District');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.height(Hive.Component.Input.height);
            Row.padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4 });
            Row.borderRadius(Hive.Radius.base);
            Row.borderWidth(1);
            Row.borderColor(Hive.Color.n300);
            Row.backgroundColor(Hive.Color.brandWhite);
            Row.onClick(() => { this.showDistrictPicker = true; });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.distLabel());
            Text.fontSize(Hive.Typography.bodyBase);
            Text.fontColor(this.selectedDistrict === '' ? Hive.Color.n400 : Hive.Color.n800);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('▼');
            Text.fontSize(12);
            Text.fontColor(Hive.Color.n400);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        Column.pop();
    }
    districtPickerSheet(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.height('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Select District');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
            Text.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
        }, Divider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            List.create();
            List.width('100%');
            List.layoutWeight(1);
        }, List);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const e = _item;
                {
                    const itemCreation = (elmtId, isInitialRender) => {
                        ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                        ListItem.create(deepRenderFunction, true);
                        if (!isInitialRender) {
                            ListItem.pop();
                        }
                        ViewStackProcessor.StopGetAccessRecording();
                    };
                    const itemCreation2 = (elmtId, isInitialRender) => {
                        ListItem.create(deepRenderFunction, true);
                    };
                    const deepRenderFunction = (elmtId, isInitialRender) => {
                        itemCreation(elmtId, isInitialRender);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Row.create();
                            Row.width('100%');
                            Row.height(50);
                            Row.padding({ left: 16, right: 16 });
                            Row.onClick(() => {
                                this.selectedDistrict = e.code;
                                this.state.setAnswer('q_addr_district', e.code as any);
                                this.showDistrictPicker = false;
                                this.sendAddress();
                            });
                        }, Row);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(e.label);
                            Text.fontSize(15);
                            Text.fontColor(Hive.Color.n800);
                            Text.layoutWeight(1);
                        }, Text);
                        Text.pop();
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            If.create();
                            if (e.code === this.selectedDistrict) {
                                this.ifElseBranchUpdateFunction(0, () => {
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        Text.create('✓');
                                        Text.fontColor(Hive.Color.success);
                                        Text.fontWeight(FontWeight.Bold);
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
                        ListItem.pop();
                    };
                    this.observeComponentCreation2(itemCreation2, ListItem);
                    ListItem.pop();
                }
            };
            this.forEachUpdateFunction(elmtId, HK_DISTRICTS, forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        List.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
export class KYCEmploymentIncomeStep extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state = new SynchedPropertyNesedObjectPU(params.state, this, "state");
        this.__showEmpPicker = new ObservedPropertySimplePU(false, this, "showEmpPicker");
        this.__selectedEmp = new ObservedPropertySimplePU('', this, "selectedEmp");
        this.__showIncPicker = new ObservedPropertySimplePU(false, this, "showIncPicker");
        this.__selectedInc = new ObservedPropertySimplePU('', this, "selectedInc");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: KYCEmploymentIncomeStep_Params) {
        this.__state.set(params.state);
        if (params.showEmpPicker !== undefined) {
            this.showEmpPicker = params.showEmpPicker;
        }
        if (params.selectedEmp !== undefined) {
            this.selectedEmp = params.selectedEmp;
        }
        if (params.showIncPicker !== undefined) {
            this.showIncPicker = params.showIncPicker;
        }
        if (params.selectedInc !== undefined) {
            this.selectedInc = params.selectedInc;
        }
    }
    updateStateVars(params: KYCEmploymentIncomeStep_Params) {
        this.__state.set(params.state);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__state.purgeDependencyOnElmtId(rmElmtId);
        this.__showEmpPicker.purgeDependencyOnElmtId(rmElmtId);
        this.__selectedEmp.purgeDependencyOnElmtId(rmElmtId);
        this.__showIncPicker.purgeDependencyOnElmtId(rmElmtId);
        this.__selectedInc.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__state.aboutToBeDeleted();
        this.__showEmpPicker.aboutToBeDeleted();
        this.__selectedEmp.aboutToBeDeleted();
        this.__showIncPicker.aboutToBeDeleted();
        this.__selectedInc.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __state: SynchedPropertyNesedObjectPU<KYCState>;
    get state() {
        return this.__state.get();
    }
    private __showEmpPicker: ObservedPropertySimplePU<boolean>;
    get showEmpPicker() {
        return this.__showEmpPicker.get();
    }
    set showEmpPicker(newValue: boolean) {
        this.__showEmpPicker.set(newValue);
    }
    private __selectedEmp: ObservedPropertySimplePU<string>;
    get selectedEmp() {
        return this.__selectedEmp.get();
    }
    set selectedEmp(newValue: string) {
        this.__selectedEmp.set(newValue);
    }
    private __showIncPicker: ObservedPropertySimplePU<boolean>;
    get showIncPicker() {
        return this.__showIncPicker.get();
    }
    set showIncPicker(newValue: boolean) {
        this.__showIncPicker.set(newValue);
    }
    private __selectedInc: ObservedPropertySimplePU<string>;
    get selectedInc() {
        return this.__selectedInc.get();
    }
    set selectedInc(newValue: string) {
        this.__selectedInc.set(newValue);
    }
    aboutToAppear() {
        this.selectedEmp = answerStr(this.state, 'q_employment_status');
        this.selectedInc = answerStr(this.state, 'q_annual_income');
    }
    empLabel(): string {
        const o = EMPLOYMENT_OPTIONS.find((e: StringPair) => e.code === this.selectedEmp);
        return o ? o.label : 'Select employment status';
    }
    incLabel(): string {
        const o = INCOME_OPTIONS.find((e: StringPair) => e.code === this.selectedInc);
        return o ? o.label : 'Select annual income range';
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s4 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Each picker trigger lives in its own Column so .bindSheet() has a dedicated node.
            // Attaching two .bindSheet() modifiers to the same node causes sheet flicker on HarmonyNext.
            Column.create({ space: Hive.Spacing.s1 });
            // Each picker trigger lives in its own Column so .bindSheet() has a dedicated node.
            // Attaching two .bindSheet() modifiers to the same node causes sheet flicker on HarmonyNext.
            Column.width('100%');
            // Each picker trigger lives in its own Column so .bindSheet() has a dedicated node.
            // Attaching two .bindSheet() modifiers to the same node causes sheet flicker on HarmonyNext.
            Column.alignItems(HorizontalAlign.Start);
            // Each picker trigger lives in its own Column so .bindSheet() has a dedicated node.
            // Attaching two .bindSheet() modifiers to the same node causes sheet flicker on HarmonyNext.
            Column.bindSheet({ value: this.showEmpPicker, changeEvent: newValue => { this.showEmpPicker = newValue; } }, { builder: () => {
                    this.empPickerSheet.call(this);
                } }, { height: SheetSize.MEDIUM });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Employment Status');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.height(Hive.Component.Input.height);
            Row.padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4 });
            Row.borderRadius(Hive.Radius.base);
            Row.borderWidth(1);
            Row.borderColor(Hive.Color.n300);
            Row.backgroundColor(Hive.Color.brandWhite);
            Row.onClick(() => { this.showEmpPicker = true; });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.empLabel());
            Text.fontSize(Hive.Typography.bodyBase);
            Text.fontColor(this.selectedEmp === '' ? Hive.Color.n400 : Hive.Color.n800);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('▼');
            Text.fontSize(12);
            Text.fontColor(Hive.Color.n400);
        }, Text);
        Text.pop();
        Row.pop();
        // Each picker trigger lives in its own Column so .bindSheet() has a dedicated node.
        // Attaching two .bindSheet() modifiers to the same node causes sheet flicker on HarmonyNext.
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
            Column.bindSheet({ value: this.showIncPicker, changeEvent: newValue => { this.showIncPicker = newValue; } }, { builder: () => {
                    this.incPickerSheet.call(this);
                } }, { height: SheetSize.MEDIUM });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Annual Income (HKD)');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.height(Hive.Component.Input.height);
            Row.padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4 });
            Row.borderRadius(Hive.Radius.base);
            Row.borderWidth(1);
            Row.borderColor(Hive.Color.n300);
            Row.backgroundColor(Hive.Color.brandWhite);
            Row.onClick(() => { this.showIncPicker = true; });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.incLabel());
            Text.fontSize(Hive.Typography.bodyBase);
            Text.fontColor(this.selectedInc === '' ? Hive.Color.n400 : Hive.Color.n800);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('▼');
            Text.fontSize(12);
            Text.fontColor(Hive.Color.n400);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        Column.pop();
    }
    empPickerSheet(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.height('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Employment Status');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
            Text.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
        }, Divider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            List.create();
            List.width('100%');
            List.layoutWeight(1);
        }, List);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const e = _item;
                {
                    const itemCreation = (elmtId, isInitialRender) => {
                        ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                        ListItem.create(deepRenderFunction, true);
                        if (!isInitialRender) {
                            ListItem.pop();
                        }
                        ViewStackProcessor.StopGetAccessRecording();
                    };
                    const itemCreation2 = (elmtId, isInitialRender) => {
                        ListItem.create(deepRenderFunction, true);
                    };
                    const deepRenderFunction = (elmtId, isInitialRender) => {
                        itemCreation(elmtId, isInitialRender);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Row.create();
                            Row.width('100%');
                            Row.height(50);
                            Row.padding({ left: 16, right: 16 });
                            Row.onClick(() => {
                                this.selectedEmp = e.code;
                                this.state.setAnswer('q_employment_status', e.code as any);
                                this.showEmpPicker = false;
                            });
                        }, Row);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(e.label);
                            Text.fontSize(15);
                            Text.fontColor(Hive.Color.n800);
                            Text.layoutWeight(1);
                        }, Text);
                        Text.pop();
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            If.create();
                            if (e.code === this.selectedEmp) {
                                this.ifElseBranchUpdateFunction(0, () => {
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        Text.create('✓');
                                        Text.fontColor(Hive.Color.success);
                                        Text.fontWeight(FontWeight.Bold);
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
                        ListItem.pop();
                    };
                    this.observeComponentCreation2(itemCreation2, ListItem);
                    ListItem.pop();
                }
            };
            this.forEachUpdateFunction(elmtId, EMPLOYMENT_OPTIONS, forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        List.pop();
        Column.pop();
    }
    incPickerSheet(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.height('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Annual Income (HKD)');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
            Text.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
        }, Divider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            List.create();
            List.width('100%');
            List.layoutWeight(1);
        }, List);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const e = _item;
                {
                    const itemCreation = (elmtId, isInitialRender) => {
                        ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                        ListItem.create(deepRenderFunction, true);
                        if (!isInitialRender) {
                            ListItem.pop();
                        }
                        ViewStackProcessor.StopGetAccessRecording();
                    };
                    const itemCreation2 = (elmtId, isInitialRender) => {
                        ListItem.create(deepRenderFunction, true);
                    };
                    const deepRenderFunction = (elmtId, isInitialRender) => {
                        itemCreation(elmtId, isInitialRender);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Row.create();
                            Row.width('100%');
                            Row.height(50);
                            Row.padding({ left: 16, right: 16 });
                            Row.onClick(() => {
                                this.selectedInc = e.code;
                                this.state.setAnswer('q_annual_income', e.code as any);
                                this.showIncPicker = false;
                            });
                        }, Row);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(e.label);
                            Text.fontSize(15);
                            Text.fontColor(Hive.Color.n800);
                            Text.layoutWeight(1);
                        }, Text);
                        Text.pop();
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            If.create();
                            if (e.code === this.selectedInc) {
                                this.ifElseBranchUpdateFunction(0, () => {
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        Text.create('✓');
                                        Text.fontColor(Hive.Color.success);
                                        Text.fontWeight(FontWeight.Bold);
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
                        ListItem.pop();
                    };
                    this.observeComponentCreation2(itemCreation2, ListItem);
                    ListItem.pop();
                }
            };
            this.forEachUpdateFunction(elmtId, INCOME_OPTIONS, forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        List.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
export class KYCSourceOfFundsStep extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state = new SynchedPropertyNesedObjectPU(params.state, this, "state");
        this.__showFundsPicker = new ObservedPropertySimplePU(false, this, "showFundsPicker");
        this.__selectedFunds = new ObservedPropertySimplePU('', this, "selectedFunds");
        this.__showPurposePicker = new ObservedPropertySimplePU(false, this, "showPurposePicker");
        this.__selectedPurpose = new ObservedPropertySimplePU('', this, "selectedPurpose");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: KYCSourceOfFundsStep_Params) {
        this.__state.set(params.state);
        if (params.showFundsPicker !== undefined) {
            this.showFundsPicker = params.showFundsPicker;
        }
        if (params.selectedFunds !== undefined) {
            this.selectedFunds = params.selectedFunds;
        }
        if (params.showPurposePicker !== undefined) {
            this.showPurposePicker = params.showPurposePicker;
        }
        if (params.selectedPurpose !== undefined) {
            this.selectedPurpose = params.selectedPurpose;
        }
    }
    updateStateVars(params: KYCSourceOfFundsStep_Params) {
        this.__state.set(params.state);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__state.purgeDependencyOnElmtId(rmElmtId);
        this.__showFundsPicker.purgeDependencyOnElmtId(rmElmtId);
        this.__selectedFunds.purgeDependencyOnElmtId(rmElmtId);
        this.__showPurposePicker.purgeDependencyOnElmtId(rmElmtId);
        this.__selectedPurpose.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__state.aboutToBeDeleted();
        this.__showFundsPicker.aboutToBeDeleted();
        this.__selectedFunds.aboutToBeDeleted();
        this.__showPurposePicker.aboutToBeDeleted();
        this.__selectedPurpose.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __state: SynchedPropertyNesedObjectPU<KYCState>;
    get state() {
        return this.__state.get();
    }
    private __showFundsPicker: ObservedPropertySimplePU<boolean>;
    get showFundsPicker() {
        return this.__showFundsPicker.get();
    }
    set showFundsPicker(newValue: boolean) {
        this.__showFundsPicker.set(newValue);
    }
    private __selectedFunds: ObservedPropertySimplePU<string>;
    get selectedFunds() {
        return this.__selectedFunds.get();
    }
    set selectedFunds(newValue: string) {
        this.__selectedFunds.set(newValue);
    }
    private __showPurposePicker: ObservedPropertySimplePU<boolean>;
    get showPurposePicker() {
        return this.__showPurposePicker.get();
    }
    set showPurposePicker(newValue: boolean) {
        this.__showPurposePicker.set(newValue);
    }
    private __selectedPurpose: ObservedPropertySimplePU<string>;
    get selectedPurpose() {
        return this.__selectedPurpose.get();
    }
    set selectedPurpose(newValue: string) {
        this.__selectedPurpose.set(newValue);
    }
    aboutToAppear() {
        this.selectedFunds = answerStr(this.state, 'q_source_of_funds');
        this.selectedPurpose = answerStr(this.state, 'q_account_purpose');
    }
    fundsLabel(): string {
        const o = FUNDS_OPTIONS.find((e: StringPair) => e.code === this.selectedFunds);
        return o ? o.label : 'Select primary source of funds';
    }
    purposeLabel(): string {
        const o = PURPOSE_OPTIONS.find((e: StringPair) => e.code === this.selectedPurpose);
        return o ? o.label : 'Select purpose of account';
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s4 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Each picker trigger lives in its own Column so .bindSheet() has a dedicated node.
            Column.create({ space: Hive.Spacing.s1 });
            // Each picker trigger lives in its own Column so .bindSheet() has a dedicated node.
            Column.width('100%');
            // Each picker trigger lives in its own Column so .bindSheet() has a dedicated node.
            Column.alignItems(HorizontalAlign.Start);
            // Each picker trigger lives in its own Column so .bindSheet() has a dedicated node.
            Column.bindSheet({ value: this.showFundsPicker, changeEvent: newValue => { this.showFundsPicker = newValue; } }, { builder: () => {
                    this.fundsPickerSheet.call(this);
                } }, { height: SheetSize.MEDIUM });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Primary Source of Funds');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.height(Hive.Component.Input.height);
            Row.padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4 });
            Row.borderRadius(Hive.Radius.base);
            Row.borderWidth(1);
            Row.borderColor(Hive.Color.n300);
            Row.backgroundColor(Hive.Color.brandWhite);
            Row.onClick(() => { this.showFundsPicker = true; });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.fundsLabel());
            Text.fontSize(Hive.Typography.bodyBase);
            Text.fontColor(this.selectedFunds === '' ? Hive.Color.n400 : Hive.Color.n800);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('▼');
            Text.fontSize(12);
            Text.fontColor(Hive.Color.n400);
        }, Text);
        Text.pop();
        Row.pop();
        // Each picker trigger lives in its own Column so .bindSheet() has a dedicated node.
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
            Column.bindSheet({ value: this.showPurposePicker, changeEvent: newValue => { this.showPurposePicker = newValue; } }, { builder: () => {
                    this.purposePickerSheet.call(this);
                } }, { height: SheetSize.MEDIUM });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Purpose of Account');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.height(Hive.Component.Input.height);
            Row.padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4 });
            Row.borderRadius(Hive.Radius.base);
            Row.borderWidth(1);
            Row.borderColor(Hive.Color.n300);
            Row.backgroundColor(Hive.Color.brandWhite);
            Row.onClick(() => { this.showPurposePicker = true; });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.purposeLabel());
            Text.fontSize(Hive.Typography.bodyBase);
            Text.fontColor(this.selectedPurpose === '' ? Hive.Color.n400 : Hive.Color.n800);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('▼');
            Text.fontSize(12);
            Text.fontColor(Hive.Color.n400);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        Column.pop();
    }
    fundsPickerSheet(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.height('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Primary Source of Funds');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
            Text.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
        }, Divider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            List.create();
            List.width('100%');
            List.layoutWeight(1);
        }, List);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const e = _item;
                {
                    const itemCreation = (elmtId, isInitialRender) => {
                        ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                        ListItem.create(deepRenderFunction, true);
                        if (!isInitialRender) {
                            ListItem.pop();
                        }
                        ViewStackProcessor.StopGetAccessRecording();
                    };
                    const itemCreation2 = (elmtId, isInitialRender) => {
                        ListItem.create(deepRenderFunction, true);
                    };
                    const deepRenderFunction = (elmtId, isInitialRender) => {
                        itemCreation(elmtId, isInitialRender);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Row.create();
                            Row.width('100%');
                            Row.height(50);
                            Row.padding({ left: 16, right: 16 });
                            Row.onClick(() => {
                                this.selectedFunds = e.code;
                                this.state.setAnswer('q_source_of_funds', e.code as any);
                                this.showFundsPicker = false;
                            });
                        }, Row);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(e.label);
                            Text.fontSize(15);
                            Text.fontColor(Hive.Color.n800);
                            Text.layoutWeight(1);
                        }, Text);
                        Text.pop();
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            If.create();
                            if (e.code === this.selectedFunds) {
                                this.ifElseBranchUpdateFunction(0, () => {
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        Text.create('✓');
                                        Text.fontColor(Hive.Color.success);
                                        Text.fontWeight(FontWeight.Bold);
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
                        ListItem.pop();
                    };
                    this.observeComponentCreation2(itemCreation2, ListItem);
                    ListItem.pop();
                }
            };
            this.forEachUpdateFunction(elmtId, FUNDS_OPTIONS, forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        List.pop();
        Column.pop();
    }
    purposePickerSheet(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.height('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Purpose of Account');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
            Text.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
        }, Divider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            List.create();
            List.width('100%');
            List.layoutWeight(1);
        }, List);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const e = _item;
                {
                    const itemCreation = (elmtId, isInitialRender) => {
                        ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                        ListItem.create(deepRenderFunction, true);
                        if (!isInitialRender) {
                            ListItem.pop();
                        }
                        ViewStackProcessor.StopGetAccessRecording();
                    };
                    const itemCreation2 = (elmtId, isInitialRender) => {
                        ListItem.create(deepRenderFunction, true);
                    };
                    const deepRenderFunction = (elmtId, isInitialRender) => {
                        itemCreation(elmtId, isInitialRender);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Row.create();
                            Row.width('100%');
                            Row.height(50);
                            Row.padding({ left: 16, right: 16 });
                            Row.onClick(() => {
                                this.selectedPurpose = e.code;
                                this.state.setAnswer('q_account_purpose', e.code as any);
                                this.showPurposePicker = false;
                            });
                        }, Row);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(e.label);
                            Text.fontSize(15);
                            Text.fontColor(Hive.Color.n800);
                            Text.layoutWeight(1);
                        }, Text);
                        Text.pop();
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            If.create();
                            if (e.code === this.selectedPurpose) {
                                this.ifElseBranchUpdateFunction(0, () => {
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        Text.create('✓');
                                        Text.fontColor(Hive.Color.success);
                                        Text.fontWeight(FontWeight.Bold);
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
                        ListItem.pop();
                    };
                    this.observeComponentCreation2(itemCreation2, ListItem);
                    ListItem.pop();
                }
            };
            this.forEachUpdateFunction(elmtId, PURPOSE_OPTIONS, forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        List.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
export class KYCLivenessStep extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state = new SynchedPropertyNesedObjectPU(params.state, this, "state");
        this.__phase = new ObservedPropertySimplePU('instructions', this, "phase");
        this.__progress = new ObservedPropertySimplePU(0, this, "progress");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: KYCLivenessStep_Params) {
        this.__state.set(params.state);
        if (params.phase !== undefined) {
            this.phase = params.phase;
        }
        if (params.progress !== undefined) {
            this.progress = params.progress;
        }
    }
    updateStateVars(params: KYCLivenessStep_Params) {
        this.__state.set(params.state);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__state.purgeDependencyOnElmtId(rmElmtId);
        this.__phase.purgeDependencyOnElmtId(rmElmtId);
        this.__progress.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__state.aboutToBeDeleted();
        this.__phase.aboutToBeDeleted();
        this.__progress.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __state: SynchedPropertyNesedObjectPU<KYCState>;
    get state() {
        return this.__state.get();
    }
    private __phase: ObservedPropertySimplePU<string>;
    get phase() {
        return this.__phase.get();
    }
    set phase(newValue: string) {
        this.__phase.set(newValue);
    }
    private __progress: ObservedPropertySimplePU<number>;
    get progress() {
        return this.__progress.get();
    }
    set progress(newValue: number) {
        this.__progress.set(newValue);
    }
    simulateProcessing() {
        this.phase = 'processing';
        const timer = setInterval(() => {
            this.progress = Math.min(this.progress + 2, 100);
            if (this.progress >= 100) {
                clearInterval(timer);
                setTimeout(() => {
                    this.phase = 'done';
                    this.state.setAnswer('q_liveness', 'PASSED' as any);
                }, 300);
            }
        }, 50);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s4 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.phase === 'instructions') {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: Hive.Spacing.s3 });
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: Hive.Spacing.s2 });
                        Column.padding(Hive.Spacing.s4);
                        Column.width('100%');
                        Column.borderRadius(Hive.Radius.md);
                        Column.backgroundColor(Hive.Color.infoLt);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('🔒 Liveness Detection — Identity Verification');
                        Text.fontSize(14);
                        Text.fontWeight(FontWeight.Medium);
                        Text.fontColor(Hive.Color.n800);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('We verify you are a real person matching your ID. This takes ~30 seconds.');
                        Text.fontSize(13);
                        Text.fontColor(Hive.Color.n700);
                    }, Text);
                    Text.pop();
                    Column.pop();
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
                                Text.fontColor(Hive.Color.n600);
                            }, Text);
                            Text.pop();
                            Column.pop();
                            Row.pop();
                        };
                        this.forEachUpdateFunction(elmtId, [
                            { icon: '😊', title: 'Face the camera', desc: 'Position in oval with good lighting.' } as LivenessInstruction,
                            { icon: '👁️', title: 'Follow prompts', desc: 'You may be asked to blink or turn.' } as LivenessInstruction,
                            { icon: '📸', title: 'Stay still', desc: 'Hold steady while we capture.' } as LivenessInstruction,
                        ], forEachItemGenFunction);
                    }, ForEach);
                    ForEach.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('Begin Liveness Check');
                        Button.width('100%');
                        Button.height(Hive.Component.Button.height);
                        Button.borderRadius(Hive.Radius.base);
                        Button.backgroundColor(Hive.Color.brandPrimary);
                        Button.fontColor(Hive.Color.brandWhite);
                        Button.fontWeight(FontWeight.Medium);
                        Button.onClick(() => { this.simulateProcessing(); });
                    }, Button);
                    Button.pop();
                    Column.pop();
                });
            }
            else if (this.phase === 'processing') {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: Hive.Spacing.s4 });
                        Column.width('100%');
                        Column.alignItems(HorizontalAlign.Center);
                        Column.padding(Hive.Spacing.s6);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        LoadingProgress.create();
                        LoadingProgress.color(Hive.Color.brandPrimary);
                        LoadingProgress.width(56);
                        LoadingProgress.height(56);
                    }, LoadingProgress);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('Verifying your identity…');
                        Text.fontSize(16);
                        Text.fontWeight(FontWeight.Medium);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Progress.create({ value: this.progress, total: 100, type: ProgressType.Linear });
                        Progress.width('100%');
                        Progress.color(Hive.Color.brandPrimary);
                    }, Progress);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('Matching against your ID using facial recognition…');
                        Text.fontSize(12);
                        Text.fontColor(Hive.Color.n500);
                        Text.textAlign(TextAlign.Center);
                    }, Text);
                    Text.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(2, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: Hive.Spacing.s4 });
                        Column.width('100%');
                        Column.padding(Hive.Spacing.s6);
                        Column.alignItems(HorizontalAlign.Center);
                        Column.borderRadius(Hive.Radius.md);
                        Column.backgroundColor(Hive.Color.successLt);
                        Column.border({ width: 1, color: Hive.Color.success, radius: Hive.Radius.md });
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('✅');
                        Text.fontSize(56);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('Liveness Check Passed');
                        Text.fontSize(20);
                        Text.fontWeight(FontWeight.Bold);
                        Text.fontColor(Hive.Color.success);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('Facial match confidence: 98.4%\nYour identity has been verified.');
                        Text.fontSize(13);
                        Text.fontColor(Hive.Color.n700);
                        Text.textAlign(TextAlign.Center);
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
export class KYCOpenBankingStep extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state = new SynchedPropertyNesedObjectPU(params.state, this, "state");
        this.__selectedBank = new ObservedPropertySimplePU('', this, "selectedBank");
        this.__connected = new ObservedPropertySimplePU(false, this, "connected");
        this.__connecting = new ObservedPropertySimplePU(false, this, "connecting");
        this.__showBankPicker = new ObservedPropertySimplePU(false, this, "showBankPicker");
        this.banks = [
            { code: 'HSBC_HK', label: 'HSBC Hong Kong' },
            { code: 'BOC_HK', label: 'Bank of China (Hong Kong)' },
            { code: 'HANG_SENG', label: 'Hang Seng Bank' },
            { code: 'SCB_HK', label: 'Standard Chartered Hong Kong' },
            { code: 'CITI_HK', label: 'Citibank Hong Kong' },
            { code: 'DBS_HK', label: 'DBS Bank Hong Kong' },
            { code: 'BEA', label: 'Bank of East Asia' },
        ];
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: KYCOpenBankingStep_Params) {
        this.__state.set(params.state);
        if (params.selectedBank !== undefined) {
            this.selectedBank = params.selectedBank;
        }
        if (params.connected !== undefined) {
            this.connected = params.connected;
        }
        if (params.connecting !== undefined) {
            this.connecting = params.connecting;
        }
        if (params.showBankPicker !== undefined) {
            this.showBankPicker = params.showBankPicker;
        }
        if (params.banks !== undefined) {
            this.banks = params.banks;
        }
    }
    updateStateVars(params: KYCOpenBankingStep_Params) {
        this.__state.set(params.state);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__state.purgeDependencyOnElmtId(rmElmtId);
        this.__selectedBank.purgeDependencyOnElmtId(rmElmtId);
        this.__connected.purgeDependencyOnElmtId(rmElmtId);
        this.__connecting.purgeDependencyOnElmtId(rmElmtId);
        this.__showBankPicker.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__state.aboutToBeDeleted();
        this.__selectedBank.aboutToBeDeleted();
        this.__connected.aboutToBeDeleted();
        this.__connecting.aboutToBeDeleted();
        this.__showBankPicker.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __state: SynchedPropertyNesedObjectPU<KYCState>;
    get state() {
        return this.__state.get();
    }
    private __selectedBank: ObservedPropertySimplePU<string>;
    get selectedBank() {
        return this.__selectedBank.get();
    }
    set selectedBank(newValue: string) {
        this.__selectedBank.set(newValue);
    }
    private __connected: ObservedPropertySimplePU<boolean>;
    get connected() {
        return this.__connected.get();
    }
    set connected(newValue: boolean) {
        this.__connected.set(newValue);
    }
    private __connecting: ObservedPropertySimplePU<boolean>;
    get connecting() {
        return this.__connecting.get();
    }
    set connecting(newValue: boolean) {
        this.__connecting.set(newValue);
    }
    private __showBankPicker: ObservedPropertySimplePU<boolean>;
    get showBankPicker() {
        return this.__showBankPicker.get();
    }
    set showBankPicker(newValue: boolean) {
        this.__showBankPicker.set(newValue);
    }
    private banks: StringPair[];
    bankLabel(): string {
        const b = this.banks.find((e: StringPair) => e.code === this.selectedBank);
        return b ? b.label : 'Select your bank';
    }
    // FIX: const declarations are forbidden inside build() — even in else branches.
    // Pre-compute the button label in a method so build() stays pure UI syntax.
    connectBtnLabel(): string {
        const name: string = this.bankLabel() === 'Select your bank' ? 'your bank' : this.bankLabel();
        return this.connecting ? 'Connecting…' : 'Connect to ' + name + ' securely';
    }
    connectBank() {
        this.connecting = true;
        setTimeout(() => {
            this.connecting = false;
            this.connected = true;
            this.state.setAnswer('q_ob_consent', `tok_${Math.floor(Math.random() * 900000 + 100000)}` as any);
        }, 1500);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s3 });
            Column.width('100%');
            Column.bindSheet({ value: this.showBankPicker, changeEvent: newValue => { this.showBankPicker = newValue; } }, { builder: () => {
                    this.bankPickerSheet.call(this);
                } }, { height: SheetSize.MEDIUM });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s2 });
            Column.padding(Hive.Spacing.s4);
            Column.width('100%');
            Column.borderRadius(Hive.Radius.md);
            Column.backgroundColor(Hive.Color.infoLt);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🔒 Open Banking — Secure Account Connection');
            Text.fontSize(14);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(Hive.Color.n800);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('We use Open Banking (HKMA regulated) to verify your identity. Your bank credentials are never shared with HSBC.');
            Text.fontSize(13);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Your current bank');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.height(Hive.Component.Input.height);
            Row.padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4 });
            Row.borderRadius(Hive.Radius.base);
            Row.borderWidth(1);
            Row.borderColor(Hive.Color.n300);
            Row.backgroundColor(Hive.Color.brandWhite);
            Row.onClick(() => { this.showBankPicker = true; });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.bankLabel());
            Text.fontSize(Hive.Typography.bodyBase);
            Text.fontColor(this.selectedBank === '' ? Hive.Color.n400 : Hive.Color.n800);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('▼');
            Text.fontSize(12);
            Text.fontColor(Hive.Color.n400);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.connected) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: Hive.Spacing.s3 });
                        Row.width('100%');
                        Row.padding(Hive.Spacing.s4);
                        Row.borderRadius(Hive.Radius.md);
                        Row.backgroundColor(Hive.Color.successLt);
                        Row.border({ width: 1, color: Hive.Color.success, radius: Hive.Radius.md });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('🏦');
                        Text.fontSize(28);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 2 });
                        Column.layoutWeight(1);
                        Column.alignItems(HorizontalAlign.Start);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('Bank Connected Successfully');
                        Text.fontSize(14);
                        Text.fontWeight(FontWeight.Medium);
                        Text.fontColor(Hive.Color.success);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('Account ownership verified · 90-day access');
                        Text.fontSize(12);
                        Text.fontColor(Hive.Color.n600);
                    }, Text);
                    Text.pop();
                    Column.pop();
                    Row.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel(this.connectBtnLabel());
                        Button.width('100%');
                        Button.height(Hive.Component.Button.height);
                        Button.borderRadius(Hive.Radius.base);
                        Button.backgroundColor(this.selectedBank === '' || this.connecting ? Hive.Color.n300 : Hive.Color.brandPrimary);
                        Button.fontColor(Hive.Color.brandWhite);
                        Button.fontWeight(FontWeight.Medium);
                        Button.enabled(this.selectedBank !== '' && !this.connecting);
                        Button.onClick(() => { this.connectBank(); });
                    }, Button);
                    Button.pop();
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Powered by Open Banking · Regulated by the HKMA');
            Text.fontSize(11);
            Text.fontColor(Hive.Color.n400);
            Text.textAlign(TextAlign.Center);
            Text.width('100%');
        }, Text);
        Text.pop();
        Column.pop();
    }
    bankPickerSheet(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Select Bank');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
            Text.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
        }, Divider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            List.create();
            List.width('100%');
            List.layoutWeight(1);
        }, List);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const e = _item;
                {
                    const itemCreation = (elmtId, isInitialRender) => {
                        ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                        ListItem.create(deepRenderFunction, true);
                        if (!isInitialRender) {
                            ListItem.pop();
                        }
                        ViewStackProcessor.StopGetAccessRecording();
                    };
                    const itemCreation2 = (elmtId, isInitialRender) => {
                        ListItem.create(deepRenderFunction, true);
                    };
                    const deepRenderFunction = (elmtId, isInitialRender) => {
                        itemCreation(elmtId, isInitialRender);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Row.create();
                            Row.width('100%');
                            Row.height(50);
                            Row.padding({ left: 16, right: 16 });
                            Row.onClick(() => { this.selectedBank = e.code; this.showBankPicker = false; });
                        }, Row);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(e.label);
                            Text.fontSize(15);
                            Text.fontColor(Hive.Color.n800);
                            Text.layoutWeight(1);
                        }, Text);
                        Text.pop();
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            If.create();
                            if (e.code === this.selectedBank) {
                                this.ifElseBranchUpdateFunction(0, () => {
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        Text.create('✓');
                                        Text.fontColor(Hive.Color.success);
                                        Text.fontWeight(FontWeight.Bold);
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
                        ListItem.pop();
                    };
                    this.observeComponentCreation2(itemCreation2, ListItem);
                    ListItem.pop();
                }
            };
            this.forEachUpdateFunction(elmtId, this.banks, forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        List.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.height(40);
        }, Blank);
        Blank.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
export class KYCDeclarationStep extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state = new SynchedPropertyNesedObjectPU(params.state, this, "state");
        this.__pepStatus = new ObservedPropertySimplePU(''
        // @State mirrors drive re-render — mutating state.answers in-place doesn't trigger @ObjectLink diff
        , this, "pepStatus");
        this.__declTruthful = new ObservedPropertySimplePU(false, this, "declTruthful");
        this.__declFatca = new ObservedPropertySimplePU(false, this, "declFatca");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: KYCDeclarationStep_Params) {
        this.__state.set(params.state);
        if (params.pepStatus !== undefined) {
            this.pepStatus = params.pepStatus;
        }
        if (params.declTruthful !== undefined) {
            this.declTruthful = params.declTruthful;
        }
        if (params.declFatca !== undefined) {
            this.declFatca = params.declFatca;
        }
    }
    updateStateVars(params: KYCDeclarationStep_Params) {
        this.__state.set(params.state);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__state.purgeDependencyOnElmtId(rmElmtId);
        this.__pepStatus.purgeDependencyOnElmtId(rmElmtId);
        this.__declTruthful.purgeDependencyOnElmtId(rmElmtId);
        this.__declFatca.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__state.aboutToBeDeleted();
        this.__pepStatus.aboutToBeDeleted();
        this.__declTruthful.aboutToBeDeleted();
        this.__declFatca.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __state: SynchedPropertyNesedObjectPU<KYCState>;
    get state() {
        return this.__state.get();
    }
    private __pepStatus: ObservedPropertySimplePU<string>;
    get pepStatus() {
        return this.__pepStatus.get();
    }
    set pepStatus(newValue: string) {
        this.__pepStatus.set(newValue);
    }
    // @State mirrors drive re-render — mutating state.answers in-place doesn't trigger @ObjectLink diff
    private __declTruthful: ObservedPropertySimplePU<boolean>;
    get declTruthful() {
        return this.__declTruthful.get();
    }
    set declTruthful(newValue: boolean) {
        this.__declTruthful.set(newValue);
    }
    private __declFatca: ObservedPropertySimplePU<boolean>;
    get declFatca() {
        return this.__declFatca.get();
    }
    set declFatca(newValue: boolean) {
        this.__declFatca.set(newValue);
    }
    aboutToAppear() {
        this.declTruthful = this.state.answers['decl_truthful'] === true;
        this.declFatca = this.state.answers['decl_fatca'] === true;
    }
    isChecked(id: string): boolean {
        return id === 'decl_truthful' ? this.declTruthful : this.declFatca;
    }
    declRow(decl: DeclOption, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: Hive.Spacing.s3 });
            Row.width('100%');
            Row.padding(Hive.Spacing.s4);
            Row.borderRadius(Hive.Radius.md);
            Row.backgroundColor(this.isChecked(decl.id) ? Hive.Color.successLt : Hive.Color.n50);
            Row.border({
                width: 1,
                color: this.isChecked(decl.id) ? Hive.Color.success : Hive.Color.n200,
                radius: Hive.Radius.md
            });
            Row.onClick(() => {
                if (decl.id === 'decl_truthful') {
                    this.declTruthful = !this.declTruthful;
                    this.state.setAnswer(decl.id, this.declTruthful as any);
                }
                else {
                    this.declFatca = !this.declFatca;
                    this.state.setAnswer(decl.id, this.declFatca as any);
                }
            });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create();
            Stack.width(22);
            Stack.height(22);
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Rect.create({ width: 22, height: 22 });
            Rect.radius(4);
            Rect.stroke(this.isChecked(decl.id) ? Hive.Color.success : Hive.Color.n300);
            Rect.strokeWidth(2);
            Rect.fill(this.isChecked(decl.id) ? Hive.Color.success : 'transparent');
        }, Rect);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isChecked(decl.id)) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('✓');
                        Text.fontSize(13);
                        Text.fontColor(Hive.Color.brandWhite);
                        Text.fontWeight(FontWeight.Bold);
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
            Text.create(decl.text);
            Text.fontSize(13);
            Text.fontColor(Hive.Color.n700);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        Row.pop();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s4 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: Hive.Spacing.s3 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Politically Exposed Person (PEP) Status');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('A PEP holds or has held a prominent public position in the last 12 months');
            Text.fontSize(Hive.Typography.caption);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const item = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create({ space: Hive.Spacing.s3 });
                    Row.width('100%');
                    Row.padding(Hive.Spacing.s4);
                    Row.borderRadius(Hive.Radius.md);
                    Row.backgroundColor(this.pepStatus === item.val ? '#FFEEEF' : Hive.Color.n50);
                    Row.border({
                        width: 1,
                        color: this.pepStatus === item.val ? Hive.Color.brandPrimary : Hive.Color.n200,
                        radius: Hive.Radius.md
                    });
                    Row.onClick(() => {
                        this.pepStatus = item.val;
                        this.state.setAnswer('q_pep_status', item.val as any);
                    });
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Stack.create();
                    Stack.width(20);
                    Stack.height(20);
                }, Stack);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Circle.create({ width: 20, height: 20 });
                    Circle.stroke(this.pepStatus === item.val ? Hive.Color.brandPrimary : Hive.Color.n300);
                    Circle.strokeWidth(2);
                    Circle.fill('transparent');
                }, Circle);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    If.create();
                    if (this.pepStatus === item.val) {
                        this.ifElseBranchUpdateFunction(0, () => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Circle.create({ width: 10, height: 10 });
                                Circle.fill(Hive.Color.brandPrimary);
                            }, Circle);
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
                    Text.create(item.label);
                    Text.fontSize(14);
                    Text.fontColor(Hive.Color.n700);
                    Text.layoutWeight(1);
                }, Text);
                Text.pop();
                Row.pop();
            };
            this.forEachUpdateFunction(elmtId, [
                { val: 'NO', label: 'I am not a PEP and not related to a PEP' } as PepOption,
                { val: 'YES', label: 'I am a PEP or closely related to a PEP' } as PepOption,
                { val: 'FORMER', label: 'I was a PEP more than 12 months ago' } as PepOption,
            ], forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const decl = _item;
                this.declRow.bind(this)(decl);
            };
            this.forEachUpdateFunction(elmtId, [
                { id: 'decl_truthful', text: 'All information provided is true, accurate and complete to the best of my knowledge.' } as DeclOption,
                { id: 'decl_fatca', text: 'I confirm I am NOT a US person for FATCA purposes (no US citizenship, Green Card, or tax residency).' } as DeclOption,
            ], forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("By submitting, you consent to HSBC processing your personal data under the Personal Data (Privacy) Ordinance (Cap. 486) and HSBC's Privacy Notice.");
            Text.fontSize(11);
            Text.fontColor(Hive.Color.n400);
            Text.padding(Hive.Spacing.s3);
            Text.width('100%');
            Text.borderRadius(Hive.Radius.md);
            Text.backgroundColor(Hive.Color.n100);
        }, Text);
        Text.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
