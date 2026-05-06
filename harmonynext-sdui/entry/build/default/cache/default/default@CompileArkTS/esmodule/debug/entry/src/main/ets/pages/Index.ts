if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Index_Params {
    selectedTab?: number;
    controller?: TabsController;
}
import { KYCRootView } from "@normalized:N&&&entry/src/main/ets/kyc/KYCShellViews&";
import { WealthPageView } from "@normalized:N&&&entry/src/main/ets/wealth/WealthPage&";
import { FXViewpointView } from "@normalized:N&&&entry/src/main/ets/fxviewpoint/FXViewpointPage&";
import { DepositCampaignView } from "@normalized:N&&&entry/src/main/ets/deposit/DepositCampaignPage&";
import { Hive } from "@normalized:N&&&entry/src/main/ets/common/HiveTokens&";
class Index extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__selectedTab = new ObservedPropertySimplePU(0, this, "selectedTab");
        this.controller = new TabsController();
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: Index_Params) {
        if (params.selectedTab !== undefined) {
            this.selectedTab = params.selectedTab;
        }
        if (params.controller !== undefined) {
            this.controller = params.controller;
        }
    }
    updateStateVars(params: Index_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__selectedTab.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__selectedTab.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __selectedTab: ObservedPropertySimplePU<number>;
    get selectedTab() {
        return this.__selectedTab.get();
    }
    set selectedTab(newValue: number) {
        this.__selectedTab.set(newValue);
    }
    private controller: TabsController;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Tabs.create({ barPosition: BarPosition.End, controller: this.controller });
            Tabs.width('100%');
            Tabs.height('100%');
            Tabs.barBackgroundColor(Hive.Color.brandWhite);
            Tabs.onChange((index: number) => { this.selectedTab = index; });
        }, Tabs);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TabContent.create(() => {
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new WealthPageView(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 20, col: 9 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {};
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {});
                        }
                    }, { name: "WealthPageView" });
                }
            });
            TabContent.tabBar({ builder: () => {
                    this.tabBarItem.call(this, '🏦', 'Home Hub', 0);
                } });
        }, TabContent);
        TabContent.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TabContent.create(() => {
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new FXViewpointView(this, { onBack: () => { this.controller.changeIndex(0); } }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 24, col: 9 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    onBack: () => { this.controller.changeIndex(0); }
                                };
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {});
                        }
                    }, { name: "FXViewpointView" });
                }
            });
            TabContent.tabBar({ builder: () => {
                    this.tabBarItem.call(this, '📊', 'FX Viewpoint', 1);
                } });
        }, TabContent);
        TabContent.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TabContent.create(() => {
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new DepositCampaignView(this, { onBack: () => { this.controller.changeIndex(0); } }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 28, col: 9 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    onBack: () => { this.controller.changeIndex(0); }
                                };
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {});
                        }
                    }, { name: "DepositCampaignView" });
                }
            });
            TabContent.tabBar({ builder: () => {
                    this.tabBarItem.call(this, '🏦', 'Deposit', 2);
                } });
        }, TabContent);
        TabContent.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TabContent.create(() => {
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new KYCRootView(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 32, col: 9 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {};
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {});
                        }
                    }, { name: "KYCRootView" });
                }
            });
            TabContent.tabBar({ builder: () => {
                    this.tabBarItem.call(this, '🪪', 'OBKYC', 3);
                } });
        }, TabContent);
        TabContent.pop();
        Tabs.pop();
    }
    tabBarItem(icon: string, label: string, idx: number, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.padding({ top: 8, bottom: 8 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(icon);
            Text.fontSize(22);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(label);
            Text.fontSize(10);
            Text.fontColor(this.selectedTab === idx ? Hive.Color.brandPrimary : Hive.Color.n400);
            Text.fontWeight(this.selectedTab === idx ? FontWeight.Medium : FontWeight.Normal);
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
