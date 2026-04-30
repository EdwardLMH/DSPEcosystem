// Index.ets
// HarmonyNext SDUI — Entry page (replaces the default generated Index.ets)
// Renders both the OBKYC journey and the Wealth page with tab navigation.

import { KYCState } from '../models/SDUIModels'
import { KYCRootView } from '../kyc/KYCShellViews'
import { WealthPageView } from '../wealth/WealthPage'
import { Hive } from '../common/HiveTokens'

@Entry
@Component
struct Index {
  @State selectedTab: number = 0
  @State kycState: KYCState = new KYCState()

  build() {
    Tabs({ barPosition: BarPosition.End }) {
      TabContent() {
        KYCRootView({ state: this.kycState })
      }.tabBar(this.tabBarItem('🪪', 'OBKYC', 0))

      TabContent() {
        WealthPageView()
      }.tabBar(this.tabBarItem('📈', 'Wealth', 1))
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
