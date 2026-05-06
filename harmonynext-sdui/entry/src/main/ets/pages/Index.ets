// Index.ets
// HarmonyNext SDUI — Entry page (replaces the default generated Index.ets)
// Renders Home Hub, FX Viewpoint, Deposit Campaign, and OBKYC journey with tab navigation.

import { KYCRootView } from '../kyc/KYCShellViews'
import { WealthPageView } from '../wealth/WealthPage'
import { FXViewpointView } from '../fxviewpoint/FXViewpointPage'
import { DepositCampaignView } from '../deposit/DepositCampaignPage'
import { Hive } from '../common/HiveTokens'

@Entry
@Component
struct Index {
  @State selectedTab: number = 0
  private controller: TabsController = new TabsController()

  build() {
    Tabs({ barPosition: BarPosition.End, controller: this.controller }) {
      TabContent() {
        WealthPageView()
      }.tabBar(this.tabBarItem('🏦', 'Home Hub', 0))

      TabContent() {
        FXViewpointView({ onBack: () => { this.controller.changeIndex(0) } })
      }.tabBar(this.tabBarItem('📊', 'FX Viewpoint', 1))

      TabContent() {
        DepositCampaignView({ onBack: () => { this.controller.changeIndex(0) } })
      }.tabBar(this.tabBarItem('🏦', 'Deposit', 2))

      TabContent() {
        KYCRootView()
      }.tabBar(this.tabBarItem('🪪', 'OBKYC', 3))
    }
    .width('100%').height('100%')
    .barBackgroundColor(Hive.Color.brandWhite)
    .onChange((index: number) => { this.selectedTab = index })
  }

  @Builder tabBarItem(icon: string, label: string, idx: number) {
    Column({ space: 4 }) {
      Text(icon).fontSize(22)
      Text(label)
        .fontSize(10)
        .fontColor(this.selectedTab === idx ? Hive.Color.brandPrimary : Hive.Color.n400)
        .fontWeight(this.selectedTab === idx ? FontWeight.Medium : FontWeight.Normal)
    }.padding({ top: 8, bottom: 8 })
  }
}
