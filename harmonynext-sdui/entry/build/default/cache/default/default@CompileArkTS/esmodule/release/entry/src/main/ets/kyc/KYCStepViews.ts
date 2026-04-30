if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface KYCDeclarationStep_Params {
    state?: KYCState;
    pepStatus?: string;
    decl1?: boolean;
    decl2?: boolean;
}
interface KYCOpenBankingStep_Params {
    state?: KYCState;
    selectedBank?: string;
    connected?: boolean;
    connecting?: boolean;
    showBankPicker?: boolean;
    banks?: StringPair[];
}
interface KYCWealthStep_Params {
    state?: KYCState;
    activeSheet?: string;
    occupations?: StringPair[];
    incomeBands?: StringPair[];
    fundsSources?: StringPair[];
}
interface KYCLivenessStep_Params {
    state?: KYCState;
    phase?: string;
    progress?: number;
}
interface KYCDocumentStep_Params {
    state?: KYCState;
    docType?: string;
    frontDone?: boolean;
    backDone?: boolean;
    showTypePicker?: boolean;
    docTypes?: StringPair[];
}
interface KYCAddressStep_Params {
    state?: KYCState;
    flat?: string;
    floor?: string;
    building?: string;
    street?: string;
    district?: string;
    showDistPicker?: boolean;
}
interface KYCIdentifierStep_Params {
    state?: KYCState;
    idType?: string;
    showIdTypePicker?: boolean;
    idTypes?: StringTriple[];
}
interface KYCContactStep_Params {
    state?: KYCState;
}
interface KYCDobNationalityStep_Params {
    state?: KYCState;
    showNatPicker?: boolean;
    natValue?: string;
}
interface KYCNameStep_Params {
    state?: KYCState;
}
import { Hive } from "@normalized:N&&&entry/src/main/ets/common/HiveTokens&";
import type { KYCState } from '../models/SDUIModels';
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
const COUNTRIES: StringPair[] = [
    { code: 'HK', label: '🇭🇰 Hong Kong SAR' },
    { code: 'CN', label: '🇨🇳 Mainland China' },
    { code: 'SG', label: '🇸🇬 Singapore' },
    { code: 'GB', label: '🇬🇧 United Kingdom' },
    { code: 'US', label: '🇺🇸 United States' },
    { code: 'AU', label: '🇦🇺 Australia' },
    { code: 'IN', label: '🇮🇳 India' },
    { code: 'JP', label: '🇯🇵 Japan' },
    { code: 'OTHER', label: 'Other' }
];
const HK_DISTRICTS: StringPair[] = [
    { code: 'central_western', label: 'Central & Western (中西區)' },
    { code: 'eastern', label: 'Eastern (東區)' },
    { code: 'wan_chai', label: 'Wan Chai (灣仔)' },
    { code: 'kowloon_city', label: 'Kowloon City (九龍城)' },
    { code: 'kwun_tong', label: 'Kwun Tong (觀塘)' },
    { code: 'yau_tsim_mong', label: 'Yau Tsim Mong (油尖旺)' },
    { code: 'sha_tin', label: 'Sha Tin (沙田)' },
    { code: 'tai_po', label: 'Tai Po (大埔)' },
    { code: 'islands', label: 'Islands (離島)' }
];
export class KYCNameStep extends ViewPU {
    constructor(x38, y38, z38, a39 = -1, b39 = undefined, c39) {
        super(x38, z38, a39, c39);
        if (typeof b39 === "function") {
            this.paramsGenerator_ = b39;
        }
        this.__state = new SynchedPropertyNesedObjectPU(y38.state, this, "state");
        this.setInitiallyProvidedValue(y38);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(w38: KYCNameStep_Params) {
        this.__state.set(w38.state);
    }
    updateStateVars(v38: KYCNameStep_Params) {
        this.__state.set(v38.state);
    }
    purgeVariableDependenciesOnElmtId(u38) {
        this.__state.purgeDependencyOnElmtId(u38);
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
        this.observeComponentCreation2((s38, t38) => {
            Column.create({ space: Hive.Spacing.s4 });
        }, Column);
        this.observeComponentCreation2((q38, r38) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((o38, p38) => {
            Row.create({ space: Hive.Spacing.s1 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((m38, n38) => {
            Text.create('First Name / Given Name');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((k38, l38) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
            Text.fontSize(Hive.Typography.labelBase);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((i38, j38) => {
            Text.create('As it appears on your official ID document');
            Text.fontSize(Hive.Typography.caption);
            Text.fontColor(Hive.Color.n500);
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((f38, g38) => {
            TextInput.create({ placeholder: 'e.g. Tai Man' });
            TextInput.width('100%');
            TextInput.height(Hive.Component.Input.height);
            TextInput.borderRadius(Hive.Radius.base);
            TextInput.borderWidth(1);
            TextInput.borderColor(Hive.Color.n300);
            TextInput.onChange((h38: string) => { this.state.answers['q_first_name'] = h38; });
        }, TextInput);
        Column.pop();
        this.observeComponentCreation2((d38, e38) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((b38, c38) => {
            Text.create('Middle Name');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((z37, a38) => {
            Text.create('If applicable');
            Text.fontSize(Hive.Typography.caption);
            Text.fontColor(Hive.Color.n500);
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((w37, x37) => {
            TextInput.create({ placeholder: '(optional)' });
            TextInput.width('100%');
            TextInput.height(Hive.Component.Input.height);
            TextInput.borderRadius(Hive.Radius.base);
            TextInput.borderWidth(1);
            TextInput.borderColor(Hive.Color.n300);
            TextInput.onChange((y37: string) => { this.state.answers['q_middle_name'] = y37; });
        }, TextInput);
        Column.pop();
        this.observeComponentCreation2((u37, v37) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((s37, t37) => {
            Row.create({ space: Hive.Spacing.s1 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((q37, r37) => {
            Text.create('Last Name / Surname');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((o37, p37) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
            Text.fontSize(Hive.Typography.labelBase);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((l37, m37) => {
            TextInput.create({ placeholder: 'e.g. CHAN' });
            TextInput.width('100%');
            TextInput.height(Hive.Component.Input.height);
            TextInput.borderRadius(Hive.Radius.base);
            TextInput.borderWidth(1);
            TextInput.borderColor(Hive.Color.n300);
            TextInput.onChange((n37: string) => { this.state.answers['q_last_name'] = n37; });
        }, TextInput);
        Column.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
export class KYCDobNationalityStep extends ViewPU {
    constructor(f37, g37, h37, i37 = -1, j37 = undefined, k37) {
        super(f37, h37, i37, k37);
        if (typeof j37 === "function") {
            this.paramsGenerator_ = j37;
        }
        this.__state = new SynchedPropertyNesedObjectPU(g37.state, this, "state");
        this.__showNatPicker = new ObservedPropertySimplePU(false, this, "showNatPicker");
        this.__natValue = new ObservedPropertySimplePU('', this, "natValue");
        this.setInitiallyProvidedValue(g37);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(e37: KYCDobNationalityStep_Params) {
        this.__state.set(e37.state);
        if (e37.showNatPicker !== undefined) {
            this.showNatPicker = e37.showNatPicker;
        }
        if (e37.natValue !== undefined) {
            this.natValue = e37.natValue;
        }
    }
    updateStateVars(d37: KYCDobNationalityStep_Params) {
        this.__state.set(d37.state);
    }
    purgeVariableDependenciesOnElmtId(c37) {
        this.__state.purgeDependencyOnElmtId(c37);
        this.__showNatPicker.purgeDependencyOnElmtId(c37);
        this.__natValue.purgeDependencyOnElmtId(c37);
    }
    aboutToBeDeleted() {
        this.__state.aboutToBeDeleted();
        this.__showNatPicker.aboutToBeDeleted();
        this.__natValue.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __state: SynchedPropertyNesedObjectPU<KYCState>;
    get state() {
        return this.__state.get();
    }
    private __showNatPicker: ObservedPropertySimplePU<boolean>;
    get showNatPicker() {
        return this.__showNatPicker.get();
    }
    set showNatPicker(b37: boolean) {
        this.__showNatPicker.set(b37);
    }
    private __natValue: ObservedPropertySimplePU<string>;
    get natValue() {
        return this.__natValue.get();
    }
    set natValue(a37: string) {
        this.__natValue.set(a37);
    }
    natLabel(): string {
        const y36 = COUNTRIES.find((z36: StringPair) => z36.code === this.natValue);
        return y36 ? y36.label : 'Select nationality';
    }
    initialRender() {
        this.observeComponentCreation2((v36, w36) => {
            Column.create({ space: Hive.Spacing.s4 });
            Column.width('100%');
            Column.bindSheet({ value: this.showNatPicker, changeEvent: x36 => { this.showNatPicker = x36; } }, { builder: () => {
                    this.nationalityPickerSheet.call(this);
                } }, { height: SheetSize.MEDIUM });
        }, Column);
        this.observeComponentCreation2((t36, u36) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((r36, s36) => {
            Row.create({ space: Hive.Spacing.s1 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((p36, q36) => {
            Text.create('Date of Birth');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((n36, o36) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
            Text.fontSize(Hive.Typography.labelBase);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((l36, m36) => {
            Text.create('You must be at least 18 years old');
            Text.fontSize(Hive.Typography.caption);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((i36, j36) => {
            TextInput.create({ placeholder: 'YYYY-MM-DD' });
            TextInput.width('100%');
            TextInput.height(Hive.Component.Input.height);
            TextInput.borderRadius(Hive.Radius.base);
            TextInput.borderWidth(1);
            TextInput.borderColor(Hive.Color.n300);
            TextInput.type(InputType.Number);
            TextInput.onChange((k36: string) => { this.state.answers['q_dob'] = k36; });
        }, TextInput);
        Column.pop();
        this.observeComponentCreation2((g36, h36) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((e36, f36) => {
            Row.create({ space: Hive.Spacing.s1 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((c36, d36) => {
            Text.create('Nationality');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((a36, b36) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
            Text.fontSize(Hive.Typography.labelBase);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((y35, z35) => {
            Row.create();
            Row.width('100%');
            Row.height(Hive.Component.Input.height);
            Row.padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4 });
            Row.borderRadius(Hive.Radius.base);
            Row.borderWidth(1);
            Row.borderColor(Hive.Color.n300);
            Row.backgroundColor(Hive.Color.brandWhite);
            Row.onClick(() => { this.showNatPicker = true; });
        }, Row);
        this.observeComponentCreation2((w35, x35) => {
            Text.create(this.natLabel());
            Text.fontSize(Hive.Typography.bodyBase);
            Text.fontColor(this.natValue === '' ? Hive.Color.n400 : Hive.Color.n800);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((u35, v35) => {
            Text.create('▼');
            Text.fontSize(12);
            Text.fontColor(Hive.Color.n400);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        Column.pop();
    }
    nationalityPickerSheet(p34 = null) {
        this.observeComponentCreation2((s35, t35) => {
            Column.create({ space: 0 });
            Column.height('100%');
        }, Column);
        this.observeComponentCreation2((q35, r35) => {
            Text.create('Select Nationality');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
            Text.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((o35, p35) => {
            Divider.create();
        }, Divider);
        this.observeComponentCreation2((m35, n35) => {
            List.create();
            List.width('100%');
            List.layoutWeight(1);
        }, List);
        this.observeComponentCreation2((q34, r34) => {
            ForEach.create();
            const s34 = t34 => {
                const u34 = t34;
                {
                    const v34 = (k35, l35) => {
                        ViewStackProcessor.StartGetAccessRecordingFor(k35);
                        ListItem.create(x34, true);
                        if (!l35) {
                            ListItem.pop();
                        }
                        ViewStackProcessor.StopGetAccessRecording();
                    };
                    const w34 = (i35, j35) => {
                        ListItem.create(x34, true);
                    };
                    const x34 = (y34, z34) => {
                        v34(y34, z34);
                        this.observeComponentCreation2((g35, h35) => {
                            Row.create();
                            Row.width('100%');
                            Row.height(50);
                            Row.padding({ left: 16, right: 16 });
                            Row.onClick(() => {
                                this.natValue = u34.code;
                                this.state.answers['q_nationality'] = u34.code;
                                this.showNatPicker = false;
                            });
                        }, Row);
                        this.observeComponentCreation2((e35, f35) => {
                            Text.create(u34.label);
                            Text.fontSize(15);
                            Text.fontColor(Hive.Color.n800);
                            Text.layoutWeight(1);
                        }, Text);
                        Text.pop();
                        this.observeComponentCreation2((a35, b35) => {
                            If.create();
                            if (u34.code === this.natValue) {
                                this.ifElseBranchUpdateFunction(0, () => {
                                    this.observeComponentCreation2((c35, d35) => {
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
                    this.observeComponentCreation2(w34, ListItem);
                    ListItem.pop();
                }
            };
            this.forEachUpdateFunction(q34, COUNTRIES, s34);
        }, ForEach);
        ForEach.pop();
        List.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
export class KYCContactStep extends ViewPU {
    constructor(j34, k34, l34, m34 = -1, n34 = undefined, o34) {
        super(j34, l34, m34, o34);
        if (typeof n34 === "function") {
            this.paramsGenerator_ = n34;
        }
        this.__state = new SynchedPropertyNesedObjectPU(k34.state, this, "state");
        this.setInitiallyProvidedValue(k34);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(i34: KYCContactStep_Params) {
        this.__state.set(i34.state);
    }
    updateStateVars(h34: KYCContactStep_Params) {
        this.__state.set(h34.state);
    }
    purgeVariableDependenciesOnElmtId(g34) {
        this.__state.purgeDependencyOnElmtId(g34);
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
        this.observeComponentCreation2((e34, f34) => {
            Column.create({ space: Hive.Spacing.s4 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((c34, d34) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((a34, b34) => {
            Row.create({ space: Hive.Spacing.s1 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((y33, z33) => {
            Text.create('Mobile Phone Number');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((w33, x33) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
            Text.fontSize(Hive.Typography.labelBase);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((u33, v33) => {
            Text.create('Enter local HK number (8 digits)');
            Text.fontSize(Hive.Typography.caption);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((s33, t33) => {
            Row.create({ space: Hive.Spacing.s2 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((q33, r33) => {
            Row.create();
            Row.height(Hive.Component.Input.height);
            Row.padding({ left: 12, right: 12 });
            Row.borderRadius(Hive.Radius.base);
            Row.borderWidth(1);
            Row.borderColor(Hive.Color.n300);
            Row.backgroundColor(Hive.Color.n50);
        }, Row);
        this.observeComponentCreation2((o33, p33) => {
            Text.create('🇭🇰 +852');
            Text.fontSize(14);
            Text.fontColor(Hive.Color.n800);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((l33, m33) => {
            TextInput.create({ placeholder: '91234567' });
            TextInput.layoutWeight(1);
            TextInput.height(Hive.Component.Input.height);
            TextInput.borderRadius(Hive.Radius.base);
            TextInput.borderWidth(1);
            TextInput.borderColor(Hive.Color.n300);
            TextInput.type(InputType.PhoneNumber);
            TextInput.onChange((n33: string) => { this.state.answers['q_phone'] = `+852${n33}`; });
        }, TextInput);
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((j33, k33) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((h33, i33) => {
            Row.create({ space: Hive.Spacing.s1 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((f33, g33) => {
            Text.create('Email Address');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((d33, e33) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
            Text.fontSize(Hive.Typography.labelBase);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((b33, c33) => {
            Text.create('We\'ll send your application confirmation here');
            Text.fontSize(Hive.Typography.caption);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((y32, z32) => {
            TextInput.create({ placeholder: 'name@example.com' });
            TextInput.width('100%');
            TextInput.height(Hive.Component.Input.height);
            TextInput.borderRadius(Hive.Radius.base);
            TextInput.borderWidth(1);
            TextInput.borderColor(Hive.Color.n300);
            TextInput.type(InputType.Email);
            TextInput.onChange((a33: string) => { this.state.answers['q_email'] = a33; });
        }, TextInput);
        Column.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
export class KYCIdentifierStep extends ViewPU {
    constructor(s32, t32, u32, v32 = -1, w32 = undefined, x32) {
        super(s32, u32, v32, x32);
        if (typeof w32 === "function") {
            this.paramsGenerator_ = w32;
        }
        this.__state = new SynchedPropertyNesedObjectPU(t32.state, this, "state");
        this.__idType = new ObservedPropertySimplePU('', this, "idType");
        this.__showIdTypePicker = new ObservedPropertySimplePU(false, this, "showIdTypePicker");
        this.idTypes = [
            { code: 'HKID', label: 'HKID (Hong Kong)', placeholder: 'A123456(7)' },
            { code: 'PASSPORT', label: 'Passport', placeholder: 'X12345678' },
            { code: 'MAINLAND', label: 'Mainland China ID (居民身份証)', placeholder: '110101199001011234' },
            { code: 'NRIC', label: 'NRIC (Singapore)', placeholder: 'S1234567D' },
            { code: 'OTHER', label: 'Other National ID', placeholder: '' }
        ];
        this.setInitiallyProvidedValue(t32);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(r32: KYCIdentifierStep_Params) {
        this.__state.set(r32.state);
        if (r32.idType !== undefined) {
            this.idType = r32.idType;
        }
        if (r32.showIdTypePicker !== undefined) {
            this.showIdTypePicker = r32.showIdTypePicker;
        }
        if (r32.idTypes !== undefined) {
            this.idTypes = r32.idTypes;
        }
    }
    updateStateVars(q32: KYCIdentifierStep_Params) {
        this.__state.set(q32.state);
    }
    purgeVariableDependenciesOnElmtId(p32) {
        this.__state.purgeDependencyOnElmtId(p32);
        this.__idType.purgeDependencyOnElmtId(p32);
        this.__showIdTypePicker.purgeDependencyOnElmtId(p32);
    }
    aboutToBeDeleted() {
        this.__state.aboutToBeDeleted();
        this.__idType.aboutToBeDeleted();
        this.__showIdTypePicker.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __state: SynchedPropertyNesedObjectPU<KYCState>;
    get state() {
        return this.__state.get();
    }
    private __idType: ObservedPropertySimplePU<string>;
    get idType() {
        return this.__idType.get();
    }
    set idType(o32: string) {
        this.__idType.set(o32);
    }
    private __showIdTypePicker: ObservedPropertySimplePU<boolean>;
    get showIdTypePicker() {
        return this.__showIdTypePicker.get();
    }
    set showIdTypePicker(n32: boolean) {
        this.__showIdTypePicker.set(n32);
    }
    private idTypes: StringTriple[];
    idTypeLabel(): string {
        const l32 = this.idTypes.find((m32: StringTriple) => m32.code === this.idType);
        return l32 ? l32.label : 'Select ID type';
    }
    idTypePlaceholder(): string {
        const j32 = this.idTypes.find((k32: StringTriple) => k32.code === this.idType);
        return j32 ? j32.placeholder : 'Enter ID number';
    }
    initialRender() {
        this.observeComponentCreation2((g32, h32) => {
            Column.create({ space: Hive.Spacing.s4 });
            Column.width('100%');
            Column.bindSheet({ value: this.showIdTypePicker, changeEvent: i32 => { this.showIdTypePicker = i32; } }, { builder: () => {
                    this.idTypePickerSheet.call(this);
                } }, { height: SheetSize.MEDIUM });
        }, Column);
        this.observeComponentCreation2((e32, f32) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((c32, d32) => {
            Row.create({ space: Hive.Spacing.s1 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((a32, b32) => {
            Text.create('ID Document Type');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((y31, z31) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
            Text.fontSize(Hive.Typography.labelBase);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((w31, x31) => {
            Row.create();
            Row.width('100%');
            Row.height(Hive.Component.Input.height);
            Row.padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4 });
            Row.borderRadius(Hive.Radius.base);
            Row.borderWidth(1);
            Row.borderColor(Hive.Color.n300);
            Row.backgroundColor(Hive.Color.brandWhite);
            Row.onClick(() => { this.showIdTypePicker = true; });
        }, Row);
        this.observeComponentCreation2((u31, v31) => {
            Text.create(this.idTypeLabel());
            Text.fontSize(Hive.Typography.bodyBase);
            Text.fontColor(this.idType === '' ? Hive.Color.n400 : Hive.Color.n800);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((s31, t31) => {
            Text.create('▼');
            Text.fontSize(12);
            Text.fontColor(Hive.Color.n400);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((d31, e31) => {
            If.create();
            if (this.idType !== '') {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((q31, r31) => {
                        Column.create({ space: Hive.Spacing.s1 });
                        Column.width('100%');
                        Column.alignItems(HorizontalAlign.Start);
                    }, Column);
                    this.observeComponentCreation2((o31, p31) => {
                        Row.create({ space: Hive.Spacing.s1 });
                        Row.width('100%');
                    }, Row);
                    this.observeComponentCreation2((m31, n31) => {
                        Text.create('ID Number');
                        Text.fontSize(Hive.Typography.labelBase);
                        Text.fontColor(Hive.Color.n700);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((k31, l31) => {
                        Text.create(' *');
                        Text.fontColor(Hive.Color.error);
                        Text.fontSize(Hive.Typography.labelBase);
                    }, Text);
                    Text.pop();
                    Row.pop();
                    this.observeComponentCreation2((i31, j31) => {
                        Text.create(`Format: ${this.idTypePlaceholder()}`);
                        Text.fontSize(Hive.Typography.caption);
                        Text.fontColor(Hive.Color.n500);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((f31, g31) => {
                        TextInput.create({ placeholder: this.idTypePlaceholder() });
                        TextInput.width('100%');
                        TextInput.height(Hive.Component.Input.height);
                        TextInput.borderRadius(Hive.Radius.base);
                        TextInput.borderWidth(1);
                        TextInput.borderColor(Hive.Color.n300);
                        TextInput.onChange((h31: string) => { this.state.answers['q_id_number'] = h31; });
                    }, TextInput);
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
    idTypePickerSheet(y29 = null) {
        this.observeComponentCreation2((b31, c31) => {
            Column.create();
            Column.height('100%');
        }, Column);
        this.observeComponentCreation2((z30, a31) => {
            Text.create('Select ID Type');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
            Text.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((x30, y30) => {
            Divider.create();
        }, Divider);
        this.observeComponentCreation2((v30, w30) => {
            List.create();
            List.width('100%');
            List.layoutWeight(1);
        }, List);
        this.observeComponentCreation2((z29, a30) => {
            ForEach.create();
            const b30 = c30 => {
                const d30 = c30;
                {
                    const e30 = (t30, u30) => {
                        ViewStackProcessor.StartGetAccessRecordingFor(t30);
                        ListItem.create(g30, true);
                        if (!u30) {
                            ListItem.pop();
                        }
                        ViewStackProcessor.StopGetAccessRecording();
                    };
                    const f30 = (r30, s30) => {
                        ListItem.create(g30, true);
                    };
                    const g30 = (h30, i30) => {
                        e30(h30, i30);
                        this.observeComponentCreation2((p30, q30) => {
                            Row.create();
                            Row.width('100%');
                            Row.height(50);
                            Row.padding({ left: 16, right: 16 });
                            Row.onClick(() => {
                                this.idType = d30.code;
                                this.state.answers['q_id_type'] = d30.code;
                                this.showIdTypePicker = false;
                            });
                        }, Row);
                        this.observeComponentCreation2((n30, o30) => {
                            Text.create(d30.label);
                            Text.fontSize(15);
                            Text.fontColor(Hive.Color.n800);
                            Text.layoutWeight(1);
                        }, Text);
                        Text.pop();
                        this.observeComponentCreation2((j30, k30) => {
                            If.create();
                            if (d30.code === this.idType) {
                                this.ifElseBranchUpdateFunction(0, () => {
                                    this.observeComponentCreation2((l30, m30) => {
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
                    this.observeComponentCreation2(f30, ListItem);
                    ListItem.pop();
                }
            };
            this.forEachUpdateFunction(z29, this.idTypes, b30);
        }, ForEach);
        ForEach.pop();
        List.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
export class KYCAddressStep extends ViewPU {
    constructor(s29, t29, u29, v29 = -1, w29 = undefined, x29) {
        super(s29, u29, v29, x29);
        if (typeof w29 === "function") {
            this.paramsGenerator_ = w29;
        }
        this.__state = new SynchedPropertyNesedObjectPU(t29.state, this, "state");
        this.__flat = new ObservedPropertySimplePU('', this, "flat");
        this.__floor = new ObservedPropertySimplePU('', this, "floor");
        this.__building = new ObservedPropertySimplePU('', this, "building");
        this.__street = new ObservedPropertySimplePU('', this, "street");
        this.__district = new ObservedPropertySimplePU('', this, "district");
        this.__showDistPicker = new ObservedPropertySimplePU(false, this, "showDistPicker");
        this.setInitiallyProvidedValue(t29);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(r29: KYCAddressStep_Params) {
        this.__state.set(r29.state);
        if (r29.flat !== undefined) {
            this.flat = r29.flat;
        }
        if (r29.floor !== undefined) {
            this.floor = r29.floor;
        }
        if (r29.building !== undefined) {
            this.building = r29.building;
        }
        if (r29.street !== undefined) {
            this.street = r29.street;
        }
        if (r29.district !== undefined) {
            this.district = r29.district;
        }
        if (r29.showDistPicker !== undefined) {
            this.showDistPicker = r29.showDistPicker;
        }
    }
    updateStateVars(q29: KYCAddressStep_Params) {
        this.__state.set(q29.state);
    }
    purgeVariableDependenciesOnElmtId(p29) {
        this.__state.purgeDependencyOnElmtId(p29);
        this.__flat.purgeDependencyOnElmtId(p29);
        this.__floor.purgeDependencyOnElmtId(p29);
        this.__building.purgeDependencyOnElmtId(p29);
        this.__street.purgeDependencyOnElmtId(p29);
        this.__district.purgeDependencyOnElmtId(p29);
        this.__showDistPicker.purgeDependencyOnElmtId(p29);
    }
    aboutToBeDeleted() {
        this.__state.aboutToBeDeleted();
        this.__flat.aboutToBeDeleted();
        this.__floor.aboutToBeDeleted();
        this.__building.aboutToBeDeleted();
        this.__street.aboutToBeDeleted();
        this.__district.aboutToBeDeleted();
        this.__showDistPicker.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __state: SynchedPropertyNesedObjectPU<KYCState>;
    get state() {
        return this.__state.get();
    }
    private __flat: ObservedPropertySimplePU<string>;
    get flat() {
        return this.__flat.get();
    }
    set flat(o29: string) {
        this.__flat.set(o29);
    }
    private __floor: ObservedPropertySimplePU<string>;
    get floor() {
        return this.__floor.get();
    }
    set floor(n29: string) {
        this.__floor.set(n29);
    }
    private __building: ObservedPropertySimplePU<string>;
    get building() {
        return this.__building.get();
    }
    set building(m29: string) {
        this.__building.set(m29);
    }
    private __street: ObservedPropertySimplePU<string>;
    get street() {
        return this.__street.get();
    }
    set street(l29: string) {
        this.__street.set(l29);
    }
    private __district: ObservedPropertySimplePU<string>;
    get district() {
        return this.__district.get();
    }
    set district(k29: string) {
        this.__district.set(k29);
    }
    private __showDistPicker: ObservedPropertySimplePU<boolean>;
    get showDistPicker() {
        return this.__showDistPicker.get();
    }
    set showDistPicker(j29: boolean) {
        this.__showDistPicker.set(j29);
    }
    districtLabel(): string {
        const h29 = HK_DISTRICTS.find((i29: StringPair) => i29.code === this.district);
        return h29 ? h29.label : 'Select district';
    }
    sendAddress() {
        const f29 = [this.flat, this.floor, this.building, this.street, this.district]
            .filter((g29: string) => g29 !== '');
        this.state.answers['q_address'] = f29.join(', ');
    }
    initialRender() {
        this.observeComponentCreation2((c29, d29) => {
            Column.create({ space: Hive.Spacing.s3 });
            Column.width('100%');
            Column.bindSheet({ value: this.showDistPicker, changeEvent: e29 => { this.showDistPicker = e29; } }, { builder: () => {
                    this.districtPickerSheet.call(this);
                } }, { height: SheetSize.MEDIUM });
        }, Column);
        this.observeComponentCreation2((a29, b29) => {
            Row.create({ space: Hive.Spacing.s2 });
            Row.padding({ left: 12, right: 12, top: 4, bottom: 4 });
            Row.borderRadius(Hive.Radius.full);
            Row.backgroundColor('#FFEEEF');
        }, Row);
        this.observeComponentCreation2((y28, z28) => {
            Text.create('📍');
            Text.fontSize(12);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((w28, x28) => {
            Text.create('Hong Kong Address Format');
            Text.fontSize(12);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(Hive.Color.brandPrimary);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((u28, v28) => {
            Row.create({ space: Hive.Spacing.s2 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((s28, t28) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.layoutWeight(1);
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((q28, r28) => {
            Text.create('Flat / Unit');
            Text.fontSize(Hive.Typography.caption);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((n28, o28) => {
            TextInput.create({ placeholder: 'e.g. Flat B' });
            TextInput.height(Hive.Component.Input.height);
            TextInput.borderRadius(Hive.Radius.base);
            TextInput.borderWidth(1);
            TextInput.borderColor(Hive.Color.n300);
            TextInput.onChange((p28: string) => { this.flat = p28; this.sendAddress(); });
        }, TextInput);
        Column.pop();
        this.observeComponentCreation2((l28, m28) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.layoutWeight(1);
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((j28, k28) => {
            Text.create('Floor');
            Text.fontSize(Hive.Typography.caption);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((g28, h28) => {
            TextInput.create({ placeholder: 'e.g. 12/F' });
            TextInput.height(Hive.Component.Input.height);
            TextInput.borderRadius(Hive.Radius.base);
            TextInput.borderWidth(1);
            TextInput.borderColor(Hive.Color.n300);
            TextInput.onChange((i28: string) => { this.floor = i28; this.sendAddress(); });
        }, TextInput);
        Column.pop();
        Row.pop();
        this.observeComponentCreation2((e28, f28) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((c28, d28) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((a28, b28) => {
            Text.create('Building Name');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((y27, z27) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((v27, w27) => {
            TextInput.create({ placeholder: 'Building / Estate name' });
            TextInput.width('100%');
            TextInput.height(Hive.Component.Input.height);
            TextInput.borderRadius(Hive.Radius.base);
            TextInput.borderWidth(1);
            TextInput.borderColor(Hive.Color.n300);
            TextInput.onChange((x27: string) => { this.building = x27; this.sendAddress(); });
        }, TextInput);
        Column.pop();
        this.observeComponentCreation2((t27, u27) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((r27, s27) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((p27, q27) => {
            Text.create('Street Address');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((n27, o27) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((k27, l27) => {
            TextInput.create({ placeholder: 'e.g. 28 Kings Road' });
            TextInput.width('100%');
            TextInput.height(Hive.Component.Input.height);
            TextInput.borderRadius(Hive.Radius.base);
            TextInput.borderWidth(1);
            TextInput.borderColor(Hive.Color.n300);
            TextInput.onChange((m27: string) => { this.street = m27; this.sendAddress(); });
        }, TextInput);
        Column.pop();
        this.observeComponentCreation2((i27, j27) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((g27, h27) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((e27, f27) => {
            Text.create('District');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((c27, d27) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((a27, b27) => {
            Row.create();
            Row.width('100%');
            Row.height(Hive.Component.Input.height);
            Row.padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4 });
            Row.borderRadius(Hive.Radius.base);
            Row.borderWidth(1);
            Row.borderColor(Hive.Color.n300);
            Row.backgroundColor(Hive.Color.brandWhite);
            Row.onClick(() => { this.showDistPicker = true; });
        }, Row);
        this.observeComponentCreation2((y26, z26) => {
            Text.create(this.districtLabel());
            Text.fontSize(Hive.Typography.bodyBase);
            Text.fontColor(this.district === '' ? Hive.Color.n400 : Hive.Color.n800);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((w26, x26) => {
            Text.create('▼');
            Text.fontSize(12);
            Text.fontColor(Hive.Color.n400);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        Column.pop();
    }
    districtPickerSheet(r25 = null) {
        this.observeComponentCreation2((u26, v26) => {
            Column.create();
            Column.height('100%');
        }, Column);
        this.observeComponentCreation2((s26, t26) => {
            Text.create('Select District');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
            Text.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((q26, r26) => {
            Divider.create();
        }, Divider);
        this.observeComponentCreation2((o26, p26) => {
            List.create();
            List.width('100%');
            List.layoutWeight(1);
        }, List);
        this.observeComponentCreation2((s25, t25) => {
            ForEach.create();
            const u25 = v25 => {
                const w25 = v25;
                {
                    const x25 = (m26, n26) => {
                        ViewStackProcessor.StartGetAccessRecordingFor(m26);
                        ListItem.create(z25, true);
                        if (!n26) {
                            ListItem.pop();
                        }
                        ViewStackProcessor.StopGetAccessRecording();
                    };
                    const y25 = (k26, l26) => {
                        ListItem.create(z25, true);
                    };
                    const z25 = (a26, b26) => {
                        x25(a26, b26);
                        this.observeComponentCreation2((i26, j26) => {
                            Row.create();
                            Row.width('100%');
                            Row.height(50);
                            Row.padding({ left: 16, right: 16 });
                            Row.onClick(() => {
                                this.district = w25.code;
                                this.state.answers['q_addr_district'] = w25.code;
                                this.sendAddress();
                                this.showDistPicker = false;
                            });
                        }, Row);
                        this.observeComponentCreation2((g26, h26) => {
                            Text.create(w25.label);
                            Text.fontSize(15);
                            Text.fontColor(Hive.Color.n800);
                            Text.layoutWeight(1);
                        }, Text);
                        Text.pop();
                        this.observeComponentCreation2((c26, d26) => {
                            If.create();
                            if (w25.code === this.district) {
                                this.ifElseBranchUpdateFunction(0, () => {
                                    this.observeComponentCreation2((e26, f26) => {
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
                    this.observeComponentCreation2(y25, ListItem);
                    ListItem.pop();
                }
            };
            this.forEachUpdateFunction(s25, HK_DISTRICTS, u25);
        }, ForEach);
        ForEach.pop();
        List.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
export class KYCDocumentStep extends ViewPU {
    constructor(l25, m25, n25, o25 = -1, p25 = undefined, q25) {
        super(l25, n25, o25, q25);
        if (typeof p25 === "function") {
            this.paramsGenerator_ = p25;
        }
        this.__state = new SynchedPropertyNesedObjectPU(m25.state, this, "state");
        this.__docType = new ObservedPropertySimplePU('', this, "docType");
        this.__frontDone = new ObservedPropertySimplePU(false, this, "frontDone");
        this.__backDone = new ObservedPropertySimplePU(false, this, "backDone");
        this.__showTypePicker = new ObservedPropertySimplePU(false, this, "showTypePicker");
        this.docTypes = [
            { code: 'HKID', label: 'Hong Kong Identity Card' },
            { code: 'PASSPORT', label: 'Passport' }
        ];
        this.setInitiallyProvidedValue(m25);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(k25: KYCDocumentStep_Params) {
        this.__state.set(k25.state);
        if (k25.docType !== undefined) {
            this.docType = k25.docType;
        }
        if (k25.frontDone !== undefined) {
            this.frontDone = k25.frontDone;
        }
        if (k25.backDone !== undefined) {
            this.backDone = k25.backDone;
        }
        if (k25.showTypePicker !== undefined) {
            this.showTypePicker = k25.showTypePicker;
        }
        if (k25.docTypes !== undefined) {
            this.docTypes = k25.docTypes;
        }
    }
    updateStateVars(j25: KYCDocumentStep_Params) {
        this.__state.set(j25.state);
    }
    purgeVariableDependenciesOnElmtId(i25) {
        this.__state.purgeDependencyOnElmtId(i25);
        this.__docType.purgeDependencyOnElmtId(i25);
        this.__frontDone.purgeDependencyOnElmtId(i25);
        this.__backDone.purgeDependencyOnElmtId(i25);
        this.__showTypePicker.purgeDependencyOnElmtId(i25);
    }
    aboutToBeDeleted() {
        this.__state.aboutToBeDeleted();
        this.__docType.aboutToBeDeleted();
        this.__frontDone.aboutToBeDeleted();
        this.__backDone.aboutToBeDeleted();
        this.__showTypePicker.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __state: SynchedPropertyNesedObjectPU<KYCState>;
    get state() {
        return this.__state.get();
    }
    private __docType: ObservedPropertySimplePU<string>;
    get docType() {
        return this.__docType.get();
    }
    set docType(h25: string) {
        this.__docType.set(h25);
    }
    private __frontDone: ObservedPropertySimplePU<boolean>;
    get frontDone() {
        return this.__frontDone.get();
    }
    set frontDone(g25: boolean) {
        this.__frontDone.set(g25);
    }
    private __backDone: ObservedPropertySimplePU<boolean>;
    get backDone() {
        return this.__backDone.get();
    }
    set backDone(f25: boolean) {
        this.__backDone.set(f25);
    }
    private __showTypePicker: ObservedPropertySimplePU<boolean>;
    get showTypePicker() {
        return this.__showTypePicker.get();
    }
    set showTypePicker(e25: boolean) {
        this.__showTypePicker.set(e25);
    }
    private docTypes: StringPair[];
    docTypeLabel(): string {
        const c25 = this.docTypes.find((d25: StringPair) => d25.code === this.docType);
        return c25 ? c25.label : 'Select document type';
    }
    initialRender() {
        this.observeComponentCreation2((z24, a25) => {
            Column.create({ space: Hive.Spacing.s4 });
            Column.width('100%');
            Column.bindSheet({ value: this.showTypePicker, changeEvent: b25 => { this.showTypePicker = b25; } }, { builder: () => {
                    this.typePickerSheet.call(this);
                } }, { height: SheetSize.FIT_CONTENT });
        }, Column);
        this.observeComponentCreation2((x24, y24) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((v24, w24) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((t24, u24) => {
            Text.create('Document Type');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((r24, s24) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((p24, q24) => {
            Row.create();
            Row.width('100%');
            Row.height(Hive.Component.Input.height);
            Row.padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4 });
            Row.borderRadius(Hive.Radius.base);
            Row.borderWidth(1);
            Row.borderColor(Hive.Color.n300);
            Row.backgroundColor(Hive.Color.brandWhite);
            Row.onClick(() => { this.showTypePicker = true; });
        }, Row);
        this.observeComponentCreation2((n24, o24) => {
            Text.create(this.docTypeLabel());
            Text.fontSize(Hive.Typography.bodyBase);
            Text.fontColor(this.docType === '' ? Hive.Color.n400 : Hive.Color.n800);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((l24, m24) => {
            Text.create('▼');
            Text.fontSize(12);
            Text.fontColor(Hive.Color.n400);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((q23, r23) => {
            If.create();
            if (this.docType !== '') {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.docUploadZone.bind(this)('Front / Photo Page', this.frontDone, () => {
                        this.frontDone = true;
                        this.state.answers['q_doc_front'] = 'captured';
                    });
                    this.observeComponentCreation2((j24, k24) => {
                        If.create();
                        if (this.docType === 'HKID') {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.docUploadZone.bind(this)('Back Side', this.backDone, () => {
                                    this.backDone = true;
                                    this.state.answers['q_doc_back'] = 'captured';
                                });
                            });
                        }
                        else {
                            this.ifElseBranchUpdateFunction(1, () => {
                            });
                        }
                    }, If);
                    If.pop();
                    this.observeComponentCreation2((s23, t23) => {
                        If.create();
                        if (this.frontDone) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((h24, i24) => {
                                    Column.create({ space: Hive.Spacing.s2 });
                                    Column.padding(Hive.Spacing.s3);
                                    Column.width('100%');
                                    Column.borderRadius(Hive.Radius.base);
                                    Column.backgroundColor(Hive.Color.successLt);
                                    Column.border({ width: 1, color: Hive.Color.success, radius: Hive.Radius.base });
                                }, Column);
                                this.observeComponentCreation2((f24, g24) => {
                                    Text.create('✓ Quality checklist');
                                    Text.fontSize(13);
                                    Text.fontWeight(FontWeight.Medium);
                                    Text.fontColor(Hive.Color.success);
                                }, Text);
                                Text.pop();
                                this.observeComponentCreation2((u23, v23) => {
                                    ForEach.create();
                                    const w23 = x23 => {
                                        const y23 = x23;
                                        this.observeComponentCreation2((d24, e24) => {
                                            Row.create({ space: Hive.Spacing.s2 });
                                            Row.width('100%');
                                        }, Row);
                                        this.observeComponentCreation2((b24, c24) => {
                                            Text.create('✔');
                                            Text.fontColor(Hive.Color.success);
                                            Text.fontSize(12);
                                        }, Text);
                                        Text.pop();
                                        this.observeComponentCreation2((z23, a24) => {
                                            Text.create(y23);
                                            Text.fontSize(12);
                                            Text.fontColor(Hive.Color.n700);
                                        }, Text);
                                        Text.pop();
                                        Row.pop();
                                    };
                                    this.forEachUpdateFunction(u23, ['All four corners are visible', 'Text clear — no blurring',
                                        'No glare or shadows', 'Document is not expired'], w23);
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
    docUploadZone(q22: string, r22: boolean, s22: () => void, t22 = null) {
        this.observeComponentCreation2((o23, p23) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((m23, n23) => {
            Text.create(q22);
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((k23, l23) => {
            Stack.create();
            Stack.onClick(s22);
        }, Stack);
        this.observeComponentCreation2((u22, v22) => {
            If.create();
            if (r22) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((i23, j23) => {
                        Column.create({ space: 4 });
                        Column.width('100%');
                        Column.height(140);
                        Column.justifyContent(FlexAlign.Center);
                        Column.alignItems(HorizontalAlign.Center);
                        Column.borderRadius(Hive.Radius.md);
                        Column.backgroundColor(Hive.Color.successLt);
                        Column.border({ width: 2, color: Hive.Color.success, radius: Hive.Radius.md });
                    }, Column);
                    this.observeComponentCreation2((g23, h23) => {
                        Text.create('✓');
                        Text.fontSize(32);
                        Text.fontColor(Hive.Color.success);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((e23, f23) => {
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
                    this.observeComponentCreation2((c23, d23) => {
                        Column.create({ space: 8 });
                        Column.width('100%');
                        Column.height(140);
                        Column.justifyContent(FlexAlign.Center);
                        Column.alignItems(HorizontalAlign.Center);
                        Column.borderRadius(Hive.Radius.md);
                        Column.backgroundColor(Hive.Color.n50);
                        Column.border({ width: 2, color: Hive.Color.n300, radius: Hive.Radius.md, style: BorderStyle.Dashed });
                    }, Column);
                    this.observeComponentCreation2((a23, b23) => {
                        Text.create('📷');
                        Text.fontSize(32);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((y22, z22) => {
                        Text.create('Take Photo or Upload');
                        Text.fontSize(14);
                        Text.fontWeight(FontWeight.Medium);
                        Text.fontColor(Hive.Color.n700);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((w22, x22) => {
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
    typePickerSheet(s21 = null) {
        this.observeComponentCreation2((o22, p22) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((m22, n22) => {
            Text.create('Select Document Type');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
            Text.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((k22, l22) => {
            Divider.create();
        }, Divider);
        this.observeComponentCreation2((v21, w21) => {
            ForEach.create();
            const x21 = y21 => {
                const z21 = y21;
                this.observeComponentCreation2((i22, j22) => {
                    Row.create();
                    Row.width('100%');
                    Row.height(50);
                    Row.padding({ left: 16, right: 16 });
                    Row.onClick(() => {
                        this.docType = z21.code;
                        this.state.answers['q_doc_type'] = z21.code;
                        this.showTypePicker = false;
                    });
                }, Row);
                this.observeComponentCreation2((g22, h22) => {
                    Text.create(z21.label);
                    Text.fontSize(15);
                    Text.fontColor(Hive.Color.n800);
                    Text.layoutWeight(1);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((c22, d22) => {
                    If.create();
                    if (z21.code === this.docType) {
                        this.ifElseBranchUpdateFunction(0, () => {
                            this.observeComponentCreation2((e22, f22) => {
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
                this.observeComponentCreation2((a22, b22) => {
                    Divider.create();
                }, Divider);
            };
            this.forEachUpdateFunction(v21, this.docTypes, x21);
        }, ForEach);
        ForEach.pop();
        this.observeComponentCreation2((t21, u21) => {
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
export class KYCLivenessStep extends ViewPU {
    constructor(m21, n21, o21, p21 = -1, q21 = undefined, r21) {
        super(m21, o21, p21, r21);
        if (typeof q21 === "function") {
            this.paramsGenerator_ = q21;
        }
        this.__state = new SynchedPropertyNesedObjectPU(n21.state, this, "state");
        this.__phase = new ObservedPropertySimplePU('instructions', this, "phase");
        this.__progress = new ObservedPropertySimplePU(0, this, "progress");
        this.setInitiallyProvidedValue(n21);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(l21: KYCLivenessStep_Params) {
        this.__state.set(l21.state);
        if (l21.phase !== undefined) {
            this.phase = l21.phase;
        }
        if (l21.progress !== undefined) {
            this.progress = l21.progress;
        }
    }
    updateStateVars(k21: KYCLivenessStep_Params) {
        this.__state.set(k21.state);
    }
    purgeVariableDependenciesOnElmtId(j21) {
        this.__state.purgeDependencyOnElmtId(j21);
        this.__phase.purgeDependencyOnElmtId(j21);
        this.__progress.purgeDependencyOnElmtId(j21);
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
    set phase(i21: string) {
        this.__phase.set(i21);
    }
    private __progress: ObservedPropertySimplePU<number>;
    get progress() {
        return this.__progress.get();
    }
    set progress(h21: number) {
        this.__progress.set(h21);
    }
    simulateProcessing() {
        this.phase = 'processing';
        const g21 = setInterval(() => {
            this.progress = Math.min(this.progress + 2, 100);
            if (this.progress >= 100) {
                clearInterval(g21);
                setTimeout(() => {
                    this.phase = 'done';
                    this.state.answers['q_liveness'] = 'PASSED';
                }, 300);
            }
        }, 50);
    }
    initialRender() {
        this.observeComponentCreation2((e21, f21) => {
            Column.create({ space: Hive.Spacing.s4 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((l19, m19) => {
            If.create();
            if (this.phase === 'instructions') {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((c21, d21) => {
                        Column.create({ space: Hive.Spacing.s3 });
                    }, Column);
                    this.observeComponentCreation2((a21, b21) => {
                        Column.create({ space: Hive.Spacing.s2 });
                        Column.padding(Hive.Spacing.s4);
                        Column.width('100%');
                        Column.borderRadius(Hive.Radius.md);
                        Column.backgroundColor(Hive.Color.infoLt);
                    }, Column);
                    this.observeComponentCreation2((y20, z20) => {
                        Text.create('🔒 Liveness Detection — Identity Verification');
                        Text.fontSize(14);
                        Text.fontWeight(FontWeight.Medium);
                        Text.fontColor(Hive.Color.n800);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((w20, x20) => {
                        Text.create('We verify you are a real person matching your ID. This takes ~30 seconds.');
                        Text.fontSize(13);
                        Text.fontColor(Hive.Color.n700);
                    }, Text);
                    Text.pop();
                    Column.pop();
                    this.observeComponentCreation2((h20, i20) => {
                        ForEach.create();
                        const j20 = k20 => {
                            const l20 = k20;
                            this.observeComponentCreation2((u20, v20) => {
                                Row.create({ space: Hive.Spacing.s3 });
                                Row.width('100%');
                                Row.padding(Hive.Spacing.s4);
                                Row.borderRadius(Hive.Radius.md);
                                Row.backgroundColor(Hive.Color.brandWhite);
                            }, Row);
                            this.observeComponentCreation2((s20, t20) => {
                                Text.create(l20.icon);
                                Text.fontSize(22);
                                Text.width(44);
                                Text.height(44);
                                Text.textAlign(TextAlign.Center);
                                Text.borderRadius(Hive.Radius.md);
                                Text.backgroundColor('#FFEEEF');
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((q20, r20) => {
                                Column.create({ space: 2 });
                                Column.layoutWeight(1);
                                Column.alignItems(HorizontalAlign.Start);
                            }, Column);
                            this.observeComponentCreation2((o20, p20) => {
                                Text.create(l20.title);
                                Text.fontSize(14);
                                Text.fontWeight(FontWeight.Medium);
                                Text.fontColor(Hive.Color.n800);
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((m20, n20) => {
                                Text.create(l20.desc);
                                Text.fontSize(12);
                                Text.fontColor(Hive.Color.n600);
                            }, Text);
                            Text.pop();
                            Column.pop();
                            Row.pop();
                        };
                        this.forEachUpdateFunction(h20, [
                            { icon: '😊', title: 'Face the camera', desc: 'Position in oval with good lighting.' } as LivenessInstruction,
                            { icon: '👁️', title: 'Follow prompts', desc: 'You may be asked to blink or turn.' } as LivenessInstruction,
                            { icon: '📸', title: 'Stay still', desc: 'Hold steady while we capture.' } as LivenessInstruction
                        ], j20);
                    }, ForEach);
                    ForEach.pop();
                    this.observeComponentCreation2((f20, g20) => {
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
                    this.observeComponentCreation2((d20, e20) => {
                        Column.create({ space: Hive.Spacing.s4 });
                        Column.width('100%');
                        Column.alignItems(HorizontalAlign.Center);
                        Column.padding(Hive.Spacing.s6);
                    }, Column);
                    this.observeComponentCreation2((b20, c20) => {
                        LoadingProgress.create();
                        LoadingProgress.color(Hive.Color.brandPrimary);
                        LoadingProgress.width(56);
                        LoadingProgress.height(56);
                    }, LoadingProgress);
                    this.observeComponentCreation2((z19, a20) => {
                        Text.create('Verifying your identity…');
                        Text.fontSize(16);
                        Text.fontWeight(FontWeight.Medium);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((x19, y19) => {
                        Progress.create({ value: this.progress, total: 100, type: ProgressType.Linear });
                        Progress.width('100%');
                        Progress.color(Hive.Color.brandPrimary);
                    }, Progress);
                    this.observeComponentCreation2((v19, w19) => {
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
                    this.observeComponentCreation2((t19, u19) => {
                        Column.create({ space: Hive.Spacing.s4 });
                        Column.width('100%');
                        Column.padding(Hive.Spacing.s6);
                        Column.alignItems(HorizontalAlign.Center);
                        Column.borderRadius(Hive.Radius.md);
                        Column.backgroundColor(Hive.Color.successLt);
                        Column.border({ width: 1, color: Hive.Color.success, radius: Hive.Radius.md });
                    }, Column);
                    this.observeComponentCreation2((r19, s19) => {
                        Text.create('✅');
                        Text.fontSize(56);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((p19, q19) => {
                        Text.create('Liveness Check Passed');
                        Text.fontSize(20);
                        Text.fontWeight(FontWeight.Bold);
                        Text.fontColor(Hive.Color.success);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((n19, o19) => {
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
export class KYCWealthStep extends ViewPU {
    constructor(f19, g19, h19, i19 = -1, j19 = undefined, k19) {
        super(f19, h19, i19, k19);
        if (typeof j19 === "function") {
            this.paramsGenerator_ = j19;
        }
        this.__state = new SynchedPropertyNesedObjectPU(g19.state, this, "state");
        this.__activeSheet = new ObservedPropertySimplePU('', this, "activeSheet");
        this.occupations = [
            { code: 'BANKING_FINANCE', label: 'Banking & Finance' },
            { code: 'ACCOUNTING', label: 'Accounting & Auditing' },
            { code: 'LEGAL', label: 'Legal & Compliance' },
            { code: 'MEDICAL', label: 'Medical & Healthcare' },
            { code: 'ENGINEERING', label: 'Engineering & Technology' },
            { code: 'SELF_EMPLOYED', label: 'Self-employed / Freelance' },
            { code: 'BUSINESS_OWNER', label: 'Business Owner' },
            { code: 'RETIRED', label: 'Retired' },
            { code: 'STUDENT', label: 'Student' },
            { code: 'OTHER', label: 'Other' }
        ];
        this.incomeBands = [
            { code: 'BELOW_150K', label: 'Below HKD 150,000' },
            { code: '150K_300K', label: 'HKD 150,000 – 300,000' },
            { code: '300K_600K', label: 'HKD 300,000 – 600,000' },
            { code: '600K_1M', label: 'HKD 600,000 – 1,000,000' },
            { code: '1M_3M', label: 'HKD 1,000,000 – 3,000,000' },
            { code: 'ABOVE_3M', label: 'Above HKD 3,000,000' }
        ];
        this.fundsSources = [
            { code: 'EMPLOYMENT', label: 'Employment / Salary' },
            { code: 'BUSINESS', label: 'Business Income' },
            { code: 'INVESTMENT', label: 'Investment Returns' },
            { code: 'INHERITANCE', label: 'Inheritance / Gift' },
            { code: 'PROPERTY', label: 'Property Sale' },
            { code: 'SAVINGS', label: 'Accumulated Savings' },
            { code: 'OTHER', label: 'Other' }
        ];
        this.setInitiallyProvidedValue(g19);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(e19: KYCWealthStep_Params) {
        this.__state.set(e19.state);
        if (e19.activeSheet !== undefined) {
            this.activeSheet = e19.activeSheet;
        }
        if (e19.occupations !== undefined) {
            this.occupations = e19.occupations;
        }
        if (e19.incomeBands !== undefined) {
            this.incomeBands = e19.incomeBands;
        }
        if (e19.fundsSources !== undefined) {
            this.fundsSources = e19.fundsSources;
        }
    }
    updateStateVars(d19: KYCWealthStep_Params) {
        this.__state.set(d19.state);
    }
    purgeVariableDependenciesOnElmtId(c19) {
        this.__state.purgeDependencyOnElmtId(c19);
        this.__activeSheet.purgeDependencyOnElmtId(c19);
    }
    aboutToBeDeleted() {
        this.__state.aboutToBeDeleted();
        this.__activeSheet.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __state: SynchedPropertyNesedObjectPU<KYCState>;
    get state() {
        return this.__state.get();
    }
    private __activeSheet: ObservedPropertySimplePU<string>;
    get activeSheet() {
        return this.__activeSheet.get();
    }
    set activeSheet(b19: string) {
        this.__activeSheet.set(b19);
    }
    private readonly occupations: StringPair[];
    private readonly incomeBands: StringPair[];
    private readonly fundsSources: StringPair[];
    getLabel(w18: StringPair[], x18: string): string {
        const y18 = this.state.answers[x18] as string ?? '';
        const z18 = w18.find((a19: StringPair) => a19.code === y18);
        return z18 ? z18.label : 'Select an option';
    }
    initialRender() {
        this.observeComponentCreation2((t18, u18) => {
            Column.create({ space: Hive.Spacing.s4 });
            Column.width('100%');
            Column.bindSheet({ value: this.activeSheet, changeEvent: v18 => { this.activeSheet = v18; } }, { builder: () => {
                    this.pickerSheet.call(this);
                } }, {
                height: SheetSize.MEDIUM,
                onDisappear: () => { this.activeSheet = ''; }
            });
        }, Column);
        this.pickerRow.bind(this)('Occupation / Industry', this.occupations, 'q_occupation', 'occ');
        this.pickerRow.bind(this)('Annual Income (HKD)', this.incomeBands, 'q_annual_income', 'inc');
        this.pickerRow.bind(this)('Primary Source of Funds', this.fundsSources, 'q_source_of_funds', 'funds');
        Column.pop();
    }
    pickerRow(a18: string, b18: StringPair[], c18: string, d18: string, e18 = null) {
        this.observeComponentCreation2((r18, s18) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((p18, q18) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((n18, o18) => {
            Text.create(a18);
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((l18, m18) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((j18, k18) => {
            Row.create();
            Row.width('100%');
            Row.height(Hive.Component.Input.height);
            Row.padding({ left: Hive.Spacing.s4, right: Hive.Spacing.s4 });
            Row.borderRadius(Hive.Radius.base);
            Row.borderWidth(1);
            Row.borderColor(Hive.Color.n300);
            Row.backgroundColor(Hive.Color.brandWhite);
            Row.onClick(() => { this.activeSheet = d18; });
        }, Row);
        this.observeComponentCreation2((h18, i18) => {
            Text.create(this.getLabel(b18, c18));
            Text.fontSize(Hive.Typography.bodyBase);
            Text.fontColor((this.state.answers[c18] as string ?? '') === '' ? Hive.Color.n400 : Hive.Color.n800);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((f18, g18) => {
            Text.create('▼');
            Text.fontSize(12);
            Text.fontColor(Hive.Color.n400);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
    }
    pickerSheet(y16 = null) {
        this.observeComponentCreation2((y17, z17) => {
            Column.create();
            Column.height('100%');
        }, Column);
        this.observeComponentCreation2((w17, x17) => {
            Text.create('Select an option');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
            Text.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((u17, v17) => {
            Divider.create();
        }, Divider);
        this.observeComponentCreation2((s17, t17) => {
            List.create();
            List.width('100%');
            List.layoutWeight(1);
        }, List);
        this.observeComponentCreation2((z16, a17) => {
            ForEach.create();
            const b17 = c17 => {
                const d17 = c17;
                {
                    const e17 = (q17, r17) => {
                        ViewStackProcessor.StartGetAccessRecordingFor(q17);
                        ListItem.create(g17, true);
                        if (!r17) {
                            ListItem.pop();
                        }
                        ViewStackProcessor.StopGetAccessRecording();
                    };
                    const f17 = (o17, p17) => {
                        ListItem.create(g17, true);
                    };
                    const g17 = (h17, i17) => {
                        e17(h17, i17);
                        this.observeComponentCreation2((l17, m17) => {
                            Row.create();
                            Row.width('100%');
                            Row.height(50);
                            Row.padding({ left: 16, right: 16 });
                            Row.onClick(() => {
                                const n17 = this.activeSheet === 'occ' ? 'q_occupation' :
                                    this.activeSheet === 'inc' ? 'q_annual_income' : 'q_source_of_funds';
                                this.state.answers[n17] = d17.code;
                                this.activeSheet = '';
                            });
                        }, Row);
                        this.observeComponentCreation2((j17, k17) => {
                            Text.create(d17.label);
                            Text.fontSize(15);
                            Text.fontColor(Hive.Color.n800);
                            Text.layoutWeight(1);
                        }, Text);
                        Text.pop();
                        Row.pop();
                        ListItem.pop();
                    };
                    this.observeComponentCreation2(f17, ListItem);
                    ListItem.pop();
                }
            };
            this.forEachUpdateFunction(z16, this.activeSheet === 'occ' ? this.occupations :
                this.activeSheet === 'inc' ? this.incomeBands : this.fundsSources, b17);
        }, ForEach);
        ForEach.pop();
        List.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
export class KYCOpenBankingStep extends ViewPU {
    constructor(s16, t16, u16, v16 = -1, w16 = undefined, x16) {
        super(s16, u16, v16, x16);
        if (typeof w16 === "function") {
            this.paramsGenerator_ = w16;
        }
        this.__state = new SynchedPropertyNesedObjectPU(t16.state, this, "state");
        this.__selectedBank = new ObservedPropertySimplePU('', this, "selectedBank");
        this.__connected = new ObservedPropertySimplePU(false, this, "connected");
        this.__connecting = new ObservedPropertySimplePU(false, this, "connecting");
        this.__showBankPicker = new ObservedPropertySimplePU(false, this, "showBankPicker");
        this.banks = [
            { code: 'HSBC_UK', label: 'HSBC UK' },
            { code: 'LLOYDS', label: 'Lloyds Bank' },
            { code: 'BARCLAYS', label: 'Barclays' },
            { code: 'NATWEST', label: 'NatWest' },
            { code: 'MONZO', label: 'Monzo' },
            { code: 'STARLING', label: 'Starling Bank' }
        ];
        this.setInitiallyProvidedValue(t16);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(r16: KYCOpenBankingStep_Params) {
        this.__state.set(r16.state);
        if (r16.selectedBank !== undefined) {
            this.selectedBank = r16.selectedBank;
        }
        if (r16.connected !== undefined) {
            this.connected = r16.connected;
        }
        if (r16.connecting !== undefined) {
            this.connecting = r16.connecting;
        }
        if (r16.showBankPicker !== undefined) {
            this.showBankPicker = r16.showBankPicker;
        }
        if (r16.banks !== undefined) {
            this.banks = r16.banks;
        }
    }
    updateStateVars(q16: KYCOpenBankingStep_Params) {
        this.__state.set(q16.state);
    }
    purgeVariableDependenciesOnElmtId(p16) {
        this.__state.purgeDependencyOnElmtId(p16);
        this.__selectedBank.purgeDependencyOnElmtId(p16);
        this.__connected.purgeDependencyOnElmtId(p16);
        this.__connecting.purgeDependencyOnElmtId(p16);
        this.__showBankPicker.purgeDependencyOnElmtId(p16);
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
    set selectedBank(o16: string) {
        this.__selectedBank.set(o16);
    }
    private __connected: ObservedPropertySimplePU<boolean>;
    get connected() {
        return this.__connected.get();
    }
    set connected(n16: boolean) {
        this.__connected.set(n16);
    }
    private __connecting: ObservedPropertySimplePU<boolean>;
    get connecting() {
        return this.__connecting.get();
    }
    set connecting(m16: boolean) {
        this.__connecting.set(m16);
    }
    private __showBankPicker: ObservedPropertySimplePU<boolean>;
    get showBankPicker() {
        return this.__showBankPicker.get();
    }
    set showBankPicker(l16: boolean) {
        this.__showBankPicker.set(l16);
    }
    private banks: StringPair[];
    bankLabel(): string {
        const j16 = this.banks.find((k16: StringPair) => k16.code === this.selectedBank);
        return j16 ? j16.label : 'Select your bank';
    }
    connectBank() {
        this.connecting = true;
        setTimeout(() => {
            this.connecting = false;
            this.connected = true;
            this.state.answers['q_ob_consent'] = `tok_${Math.floor(Math.random() * 900000 + 100000)}`;
        }, 1500);
    }
    initialRender() {
        this.observeComponentCreation2((g16, h16) => {
            Column.create({ space: Hive.Spacing.s3 });
            Column.width('100%');
            Column.bindSheet({ value: this.showBankPicker, changeEvent: i16 => { this.showBankPicker = i16; } }, { builder: () => {
                    this.bankPickerSheet.call(this);
                } }, { height: SheetSize.MEDIUM });
        }, Column);
        this.observeComponentCreation2((e16, f16) => {
            Column.create({ space: Hive.Spacing.s2 });
            Column.padding(Hive.Spacing.s4);
            Column.width('100%');
            Column.borderRadius(Hive.Radius.md);
            Column.backgroundColor(Hive.Color.infoLt);
        }, Column);
        this.observeComponentCreation2((c16, d16) => {
            Text.create('🔒 Open Banking — Secure Account Connection');
            Text.fontSize(14);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(Hive.Color.n800);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((a16, b16) => {
            Text.create('We use Open Banking (FCA/HKMA regulated) to verify your identity. Your bank credentials are never shared with HSBC.');
            Text.fontSize(13);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((y15, z15) => {
            Column.create({ space: Hive.Spacing.s1 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((w15, x15) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((u15, v15) => {
            Text.create('Your current bank');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((s15, t15) => {
            Text.create(' *');
            Text.fontColor(Hive.Color.error);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((q15, r15) => {
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
        this.observeComponentCreation2((o15, p15) => {
            Text.create(this.bankLabel());
            Text.fontSize(Hive.Typography.bodyBase);
            Text.fontColor(this.selectedBank === '' ? Hive.Color.n400 : Hive.Color.n800);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((m15, n15) => {
            Text.create('▼');
            Text.fontSize(12);
            Text.fontColor(Hive.Color.n400);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((y14, z14) => {
            If.create();
            if (this.connected) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((k15, l15) => {
                        Row.create({ space: Hive.Spacing.s3 });
                        Row.width('100%');
                        Row.padding(Hive.Spacing.s4);
                        Row.borderRadius(Hive.Radius.md);
                        Row.backgroundColor(Hive.Color.successLt);
                        Row.border({ width: 1, color: Hive.Color.success, radius: Hive.Radius.md });
                    }, Row);
                    this.observeComponentCreation2((i15, j15) => {
                        Text.create('🏦');
                        Text.fontSize(28);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((g15, h15) => {
                        Column.create({ space: 2 });
                        Column.layoutWeight(1);
                        Column.alignItems(HorizontalAlign.Start);
                    }, Column);
                    this.observeComponentCreation2((e15, f15) => {
                        Text.create('Bank Connected Successfully');
                        Text.fontSize(14);
                        Text.fontWeight(FontWeight.Medium);
                        Text.fontColor(Hive.Color.success);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((c15, d15) => {
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
                    this.observeComponentCreation2((a15, b15) => {
                        Button.createWithLabel(this.connecting ? 'Connecting…' :
                            `Connect to ${this.bankLabel() === 'Select your bank' ? 'your bank' : this.bankLabel()} securely`);
                        Button.width('100%');
                        Button.height(Hive.Component.Button.height);
                        Button.borderRadius(Hive.Radius.base);
                        Button.backgroundColor(this.selectedBank === '' || this.connecting ?
                            Hive.Color.n300 : Hive.Color.brandPrimary);
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
        this.observeComponentCreation2((w14, x14) => {
            Text.create('Powered by Open Banking · Regulated by FCA and HKMA');
            Text.fontSize(11);
            Text.fontColor(Hive.Color.n400);
            Text.textAlign(TextAlign.Center);
            Text.width('100%');
        }, Text);
        Text.pop();
        Column.pop();
    }
    bankPickerSheet(p13 = null) {
        this.observeComponentCreation2((u14, v14) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((s14, t14) => {
            Text.create('Select Bank');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
            Text.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((q14, r14) => {
            Divider.create();
        }, Divider);
        this.observeComponentCreation2((o14, p14) => {
            List.create();
            List.width('100%');
            List.layoutWeight(1);
        }, List);
        this.observeComponentCreation2((s13, t13) => {
            ForEach.create();
            const u13 = v13 => {
                const w13 = v13;
                {
                    const x13 = (m14, n14) => {
                        ViewStackProcessor.StartGetAccessRecordingFor(m14);
                        ListItem.create(z13, true);
                        if (!n14) {
                            ListItem.pop();
                        }
                        ViewStackProcessor.StopGetAccessRecording();
                    };
                    const y13 = (k14, l14) => {
                        ListItem.create(z13, true);
                    };
                    const z13 = (a14, b14) => {
                        x13(a14, b14);
                        this.observeComponentCreation2((i14, j14) => {
                            Row.create();
                            Row.width('100%');
                            Row.height(50);
                            Row.padding({ left: 16, right: 16 });
                            Row.onClick(() => { this.selectedBank = w13.code; this.showBankPicker = false; });
                        }, Row);
                        this.observeComponentCreation2((g14, h14) => {
                            Text.create(w13.label);
                            Text.fontSize(15);
                            Text.fontColor(Hive.Color.n800);
                            Text.layoutWeight(1);
                        }, Text);
                        Text.pop();
                        this.observeComponentCreation2((c14, d14) => {
                            If.create();
                            if (w13.code === this.selectedBank) {
                                this.ifElseBranchUpdateFunction(0, () => {
                                    this.observeComponentCreation2((e14, f14) => {
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
                    this.observeComponentCreation2(y13, ListItem);
                    ListItem.pop();
                }
            };
            this.forEachUpdateFunction(s13, this.banks, u13);
        }, ForEach);
        ForEach.pop();
        List.pop();
        this.observeComponentCreation2((q13, r13) => {
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
    constructor(j13, k13, l13, m13 = -1, n13 = undefined, o13) {
        super(j13, l13, m13, o13);
        if (typeof n13 === "function") {
            this.paramsGenerator_ = n13;
        }
        this.__state = new SynchedPropertyNesedObjectPU(k13.state, this, "state");
        this.__pepStatus = new ObservedPropertySimplePU('', this, "pepStatus");
        this.__decl1 = new ObservedPropertySimplePU(false, this, "decl1");
        this.__decl2 = new ObservedPropertySimplePU(false, this, "decl2");
        this.setInitiallyProvidedValue(k13);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(i13: KYCDeclarationStep_Params) {
        this.__state.set(i13.state);
        if (i13.pepStatus !== undefined) {
            this.pepStatus = i13.pepStatus;
        }
        if (i13.decl1 !== undefined) {
            this.decl1 = i13.decl1;
        }
        if (i13.decl2 !== undefined) {
            this.decl2 = i13.decl2;
        }
    }
    updateStateVars(h13: KYCDeclarationStep_Params) {
        this.__state.set(h13.state);
    }
    purgeVariableDependenciesOnElmtId(g13) {
        this.__state.purgeDependencyOnElmtId(g13);
        this.__pepStatus.purgeDependencyOnElmtId(g13);
        this.__decl1.purgeDependencyOnElmtId(g13);
        this.__decl2.purgeDependencyOnElmtId(g13);
    }
    aboutToBeDeleted() {
        this.__state.aboutToBeDeleted();
        this.__pepStatus.aboutToBeDeleted();
        this.__decl1.aboutToBeDeleted();
        this.__decl2.aboutToBeDeleted();
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
    set pepStatus(f13: string) {
        this.__pepStatus.set(f13);
    }
    private __decl1: ObservedPropertySimplePU<boolean>;
    get decl1() {
        return this.__decl1.get();
    }
    set decl1(e13: boolean) {
        this.__decl1.set(e13);
    }
    private __decl2: ObservedPropertySimplePU<boolean>;
    get decl2() {
        return this.__decl2.get();
    }
    set decl2(d13: boolean) {
        this.__decl2.set(d13);
    }
    initialRender() {
        this.observeComponentCreation2((b13, c13) => {
            Column.create({ space: Hive.Spacing.s4 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((z12, a13) => {
            Column.create({ space: Hive.Spacing.s3 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((x12, y12) => {
            Text.create('Politically Exposed Person (PEP) Status');
            Text.fontSize(Hive.Typography.labelBase);
            Text.fontColor(Hive.Color.n700);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((v12, w12) => {
            Text.create('A PEP holds or has held a prominent public position in the last 12 months');
            Text.fontSize(Hive.Typography.caption);
            Text.fontColor(Hive.Color.n500);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((e12, f12) => {
            ForEach.create();
            const g12 = h12 => {
                const i12 = h12;
                this.observeComponentCreation2((t12, u12) => {
                    Row.create({ space: Hive.Spacing.s3 });
                    Row.width('100%');
                    Row.padding(Hive.Spacing.s4);
                    Row.borderRadius(Hive.Radius.md);
                    Row.backgroundColor(this.pepStatus === i12.val ? '#FFEEEF' : Hive.Color.n50);
                    Row.border({
                        width: 1,
                        color: this.pepStatus === i12.val ? Hive.Color.brandPrimary : Hive.Color.n200,
                        radius: Hive.Radius.md
                    });
                    Row.onClick(() => {
                        this.pepStatus = i12.val;
                        this.state.answers['q_pep_status'] = i12.val;
                    });
                }, Row);
                this.observeComponentCreation2((r12, s12) => {
                    Stack.create();
                    Stack.width(20);
                    Stack.height(20);
                }, Stack);
                this.observeComponentCreation2((p12, q12) => {
                    Circle.create({ width: 20, height: 20 });
                    Circle.stroke(this.pepStatus === i12.val ? Hive.Color.brandPrimary : Hive.Color.n300);
                    Circle.strokeWidth(2);
                    Circle.fill('transparent');
                }, Circle);
                this.observeComponentCreation2((l12, m12) => {
                    If.create();
                    if (this.pepStatus === i12.val) {
                        this.ifElseBranchUpdateFunction(0, () => {
                            this.observeComponentCreation2((n12, o12) => {
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
                this.observeComponentCreation2((j12, k12) => {
                    Text.create(i12.label);
                    Text.fontSize(14);
                    Text.fontColor(Hive.Color.n700);
                    Text.layoutWeight(1);
                }, Text);
                Text.pop();
                Row.pop();
            };
            this.forEachUpdateFunction(e12, [
                { val: 'NO', label: 'I am not a PEP and not related to a PEP' } as PepOption,
                { val: 'YES', label: 'I am a PEP or closely related to a PEP' } as PepOption,
                { val: 'FORMER', label: 'I was a PEP more than 12 months ago' } as PepOption
            ], g12);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        this.observeComponentCreation2((z11, a12) => {
            ForEach.create();
            const b12 = c12 => {
                const d12 = c12;
                this.declRow.bind(this)(d12);
            };
            this.forEachUpdateFunction(z11, [
                { id: 'decl_truthful', text: 'All information provided is true, accurate and complete to the best of my knowledge.' } as DeclOption,
                { id: 'decl_fatca', text: 'I confirm I am NOT a US person for FATCA purposes (no US citizenship, Green Card, or tax residency).' } as DeclOption
            ], b12);
        }, ForEach);
        ForEach.pop();
        this.observeComponentCreation2((x11, y11) => {
            Text.create('By submitting, you consent to HSBC processing your personal data under the Personal Data (Privacy) Ordinance (Cap. 486) and HSBC\'s Privacy Notice.');
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
    declRow(i11: DeclOption, j11 = null) {
        this.observeComponentCreation2((u11, v11) => {
            Row.create({ space: Hive.Spacing.s3 });
            Row.width('100%');
            Row.padding(Hive.Spacing.s4);
            Row.borderRadius(Hive.Radius.md);
            Row.backgroundColor(this.state.answers[i11.id] === true ? Hive.Color.successLt : Hive.Color.n50);
            Row.border({
                width: 1,
                color: this.state.answers[i11.id] === true ? Hive.Color.success : Hive.Color.n200,
                radius: Hive.Radius.md
            });
            Row.onClick(() => {
                const w11 = !(this.state.answers[i11.id] === true);
                this.state.answers[i11.id] = w11;
                if (i11.id === 'decl_truthful')
                    this.decl1 = w11;
                else
                    this.decl2 = w11;
            });
        }, Row);
        this.observeComponentCreation2((s11, t11) => {
            Stack.create();
            Stack.width(22);
            Stack.height(22);
        }, Stack);
        this.observeComponentCreation2((q11, r11) => {
            Rect.create({ width: 22, height: 22 });
            Rect.radius(4);
            Rect.stroke(this.state.answers[i11.id] === true ? Hive.Color.success : Hive.Color.n300);
            Rect.strokeWidth(2);
            Rect.fill(this.state.answers[i11.id] === true ? Hive.Color.success : 'transparent');
        }, Rect);
        this.observeComponentCreation2((m11, n11) => {
            If.create();
            if (this.state.answers[i11.id] === true) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((o11, p11) => {
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
        this.observeComponentCreation2((k11, l11) => {
            Text.create(i11.text);
            Text.fontSize(13);
            Text.fontColor(Hive.Color.n700);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
