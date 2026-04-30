if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Index_Params {
    selectedTab?: number;
    kycState?: KYCState;
}
import { KYCState } from "@normalized:N&&&entry/src/main/ets/models/SDUIModels&";
import { KYCRootView } from "@normalized:N&&&entry/src/main/ets/kyc/KYCShellViews&";
import { WealthPageView } from "@normalized:N&&&entry/src/main/ets/wealth/WealthPage&";
import { Hive } from "@normalized:N&&&entry/src/main/ets/common/HiveTokens&";
class Index extends ViewPU {
    constructor(t43, u43, v43, w43 = -1, x43 = undefined, y43) {
        super(t43, v43, w43, y43);
        if (typeof x43 === "function") {
            this.paramsGenerator_ = x43;
        }
        this.__selectedTab = new ObservedPropertySimplePU(0, this, "selectedTab");
        this.__kycState = new ObservedPropertyObjectPU(new KYCState(), this, "kycState");
        this.setInitiallyProvidedValue(u43);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(s43: Index_Params) {
        if (s43.selectedTab !== undefined) {
            this.selectedTab = s43.selectedTab;
        }
        if (s43.kycState !== undefined) {
            this.kycState = s43.kycState;
        }
    }
    updateStateVars(r43: Index_Params) {
    }
    purgeVariableDependenciesOnElmtId(q43) {
        this.__selectedTab.purgeDependencyOnElmtId(q43);
        this.__kycState.purgeDependencyOnElmtId(q43);
    }
    aboutToBeDeleted() {
        this.__selectedTab.aboutToBeDeleted();
        this.__kycState.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __selectedTab: ObservedPropertySimplePU<number>;
    get selectedTab() {
        return this.__selectedTab.get();
    }
    set selectedTab(p43: number) {
        this.__selectedTab.set(p43);
    }
    private __kycState: ObservedPropertyObjectPU<KYCState>;
    get kycState() {
        return this.__kycState.get();
    }
    set kycState(o43: KYCState) {
        this.__kycState.set(o43);
    }
    initialRender() {
        this.observeComponentCreation2((l43, m43) => {
            Tabs.create({ barPosition: BarPosition.End });
            Tabs.width('100%');
            Tabs.height('100%');
            Tabs.barBackgroundColor(Hive.Color.brandWhite);
            Tabs.onChange((n43: number) => { this.selectedTab = n43; });
        }, Tabs);
        this.observeComponentCreation2((f43, g43) => {
            TabContent.create(() => {
                {
                    this.observeComponentCreation2((h43, i43) => {
                        if (i43) {
                            let j43 = new KYCRootView(this, { state: this.kycState }, undefined, h43, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 19, col: 9 });
                            ViewPU.create(j43);
                            let k43 = () => {
                                return {
                                    state: this.kycState
                                };
                            };
                            j43.paramsGenerator_ = k43;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(h43, {
                                state: this.kycState
                            });
                        }
                    }, { name: "KYCRootView" });
                }
            });
            TabContent.tabBar({ builder: () => {
                    this.tabBarItem.call(this, '🪪', 'OBKYC', 0);
                } });
        }, TabContent);
        TabContent.pop();
        this.observeComponentCreation2((z42, a43) => {
            TabContent.create(() => {
                {
                    this.observeComponentCreation2((b43, c43) => {
                        if (c43) {
                            let d43 = new WealthPageView(this, {}, undefined, b43, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 23, col: 9 });
                            ViewPU.create(d43);
                            let e43 = () => {
                                return {};
                            };
                            d43.paramsGenerator_ = e43;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(b43, {});
                        }
                    }, { name: "WealthPageView" });
                }
            });
            TabContent.tabBar({ builder: () => {
                    this.tabBarItem.call(this, '📈', 'Wealth', 1);
                } });
        }, TabContent);
        TabContent.pop();
        Tabs.pop();
    }
    tabBarItem(p42: string, q42: string, r42: number, s42 = null) {
        this.observeComponentCreation2((x42, y42) => {
            Column.create({ space: 4 });
            Column.padding({ top: 8, bottom: 8 });
        }, Column);
        this.observeComponentCreation2((v42, w42) => {
            Text.create(p42);
            Text.fontSize(22);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((t42, u42) => {
            Text.create(q42);
            Text.fontSize(10);
            Text.fontColor(this.selectedTab === r42 ? Hive.Color.brandPrimary : Hive.Color.n400);
            Text.fontWeight(this.selectedTab === r42 ? FontWeight.Medium : FontWeight.Normal);
        }, Text);
        Text.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "Index";
    }
}
registerNamedRoute(() => new Index(undefined, {}), "", { bundleName: "com.hsbc.sdui", moduleName: "entry", pagePath: "pages/Index", pageFullPath: "entry/src/main/ets/pages/Index", integratedHsp: "false", moduleType: "followWithHap" });
