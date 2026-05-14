// AnnouncementPage.ets
// HarmonyNext ArkTS — native SDUI announcement overlay pages.

import { Hive } from '../common/HiveTokens'
import { SensorDataClient } from '../network/SensorDataClient'
import { fetchAnnouncementScreen, WealthSlice } from '../network/KYCNetworkService'

const LOAD_LOADING = 1
const LOAD_DONE = 2
const LOAD_ERROR = 3

export const ANNOUNCEMENT_SPECIAL = 0
export const ANNOUNCEMENT_FORCE_UPDATE = 1

interface AnnouncementAction {
  id: string
  label: string
  style: string
}

@Component
export struct AnnouncementPage {
  kind: number = ANNOUNCEMENT_SPECIAL
  onBack: () => void = () => {}
  @State loadState: number = LOAD_LOADING
  @State slice: WealthSlice = { instanceId: '', type: '', props: {}, visible: true }
  @State dontShowAgain: boolean = false

  aboutToAppear() {
    SensorDataClient.track('announcement_viewed', 'Announcement', 'page_viewed', '',
      this.screenName(), 'announcement')
    this.loadFromBFF()
  }

  private screenId(): string {
    return this.kind === ANNOUNCEMENT_FORCE_UPDATE
      ? 'announcement-force-update-hk'
      : 'announcement-overlay-hk'
  }

  private screenName(): string {
    return this.kind === ANNOUNCEMENT_FORCE_UPDATE
      ? 'announcement_force_update_hk'
      : 'announcement_overlay_hk'
  }

  private fallbackTitle(): string {
    return this.kind === ANNOUNCEMENT_FORCE_UPDATE ? 'Get ready for eLaisee' : 'Special announcement'
  }

  private fallbackStyle(): string {
    return this.kind === ANNOUNCEMENT_FORCE_UPDATE ? 'INLINE_FORCE_UPDATE' : 'ENVELOPE_CARD'
  }

  private async loadFromBFF(): Promise<void> {
    this.loadState = LOAD_LOADING
    try {
      const payload = await fetchAnnouncementScreen(this.screenId())
      const slices = payload.layout.children.filter((s: WealthSlice) => {
        return s.visible !== false && s.type === 'ANNOUNCEMENT_OVERLAY'
      })
      if (slices.length > 0) {
        this.slice = slices[0]
        this.loadState = LOAD_DONE
      } else {
        this.loadState = LOAD_ERROR
      }
    } catch (_e) {
      this.loadState = LOAD_ERROR
    }
  }

  private activeProps(): Record<string, ESObject> {
    if (this.loadState === LOAD_DONE) {
      return this.slice.props
    }
    const props: Record<string, ESObject> = {}
    props['styleVariant'] = this.fallbackStyle() as ESObject
    props['title'] = this.fallbackTitle() as ESObject
    const body: string[] = ['Announcement content is temporarily unavailable. Please try again later.']
    const closeAction: AnnouncementAction = { id: 'close', label: 'Close', style: 'primary' }
    const actions: AnnouncementAction[] = [closeAction]
    props['body'] = body as ESObject
    props['actions'] = actions as ESObject
    props['blockInteraction'] = false as ESObject
    return props
  }

  private bodyLines(props: Record<string, ESObject>): string[] {
    return props['body'] as string[] ?? []
  }

  private hotlines(props: Record<string, ESObject>): Array<Record<string, string>> {
    return props['hotlines'] as Array<Record<string, string>> ?? []
  }

  private actions(props: Record<string, ESObject>): Array<Record<string, string>> {
    return props['actions'] as Array<Record<string, string>> ?? []
  }

  build() {
    Stack({ alignContent: Alignment.Center }) {
      AnnouncementBackdrop()

      if (this.loadState === LOAD_LOADING) {
        LoadingProgress().width(36).height(36).color(Hive.Color.brandPrimary)
      } else {
        this.renderCard(this.activeProps())
      }
    }
    .width('100%').height('100%')
  }

  @Builder renderCard(props: Record<string, ESObject>) {
    Column({ space: 0 }) {
      Text((props['styleVariant'] as string ?? 'ENVELOPE_CARD') === 'INLINE_FORCE_UPDATE' ? '🧧' : '◆')
        .fontSize((props['styleVariant'] as string ?? '') === 'INLINE_FORCE_UPDATE' ? 54 : 66)
        .fontColor(Hive.Color.brandPrimary)

      Column({ space: 14 }) {
        Text(props['title'] as string ?? 'Special announcement')
          .fontSize(24).fontWeight(FontWeight.Bold).fontColor(Hive.Color.n900)
        ForEach(this.bodyLines(props), (line: string) => {
          Text(line).fontSize(14).fontColor(Hive.Color.n700)
            .width('100%')
        })
        ForEach(this.hotlines(props), (item: Record<string, string>) => {
          Column({ space: 3 }) {
            Text(item['label'] ?? '').fontSize(13).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n900)
            Text(item['phone'] ?? '').fontSize(13).fontColor(Hive.Color.n500)
          }.width('100%').alignItems(HorizontalAlign.Start)
        })
        if (this.dontShowEnabled(props)) {
          Row({ space: 10 }) {
            Text(this.dontShowAgain ? '☑' : '☐').fontSize(18).fontColor(Hive.Color.brandPrimary)
            Text(((props['dontShowAgain'] as Record<string, ESObject>)['label'] as string) ?? "Don't show this message again")
              .fontSize(13).fontColor(Hive.Color.n700)
          }
          .width('100%').alignItems(VerticalAlign.Center)
          .onClick(() => { this.dontShowAgain = !this.dontShowAgain })
        }
        Row({ space: 12 }) {
          ForEach(this.actions(props), (action: Record<string, string>) => {
            Button(action['label'] ?? 'Close')
              .height(42)
              .layoutWeight(1)
              .borderRadius(2)
              .backgroundColor((action['style'] ?? 'primary') === 'secondary' ? Hive.Color.brandWhite : Hive.Color.brandPrimary)
              .fontColor((action['style'] ?? 'primary') === 'secondary' ? Hive.Color.n900 : Hive.Color.brandWhite)
              .fontSize(14)
              .fontWeight(FontWeight.Medium)
              .border({
                width: 1,
                color: (action['style'] ?? 'primary') === 'secondary' ? Hive.Color.n200 : Hive.Color.brandPrimary
              })
              .onClick(() => { this.onBack() })
          })
        }.width('100%')
      }
      .width('100%')
      .alignItems(HorizontalAlign.Start)
      .padding(18)
      .backgroundColor(Hive.Color.brandWhite)
      .borderRadius(2)

      if ((props['legalEntityText'] as string ?? '').length > 0) {
        Text(props['legalEntityText'] as string)
          .fontSize(10).fontColor('#BFFFFFFF')
          .margin({ top: 18 })
      }
    }
    .width('88%')
    .alignItems(HorizontalAlign.Center)
  }

  private dontShowEnabled(props: Record<string, ESObject>): boolean {
    const raw = props['dontShowAgain'] as Record<string, ESObject>
    if (!raw) {
      return false
    }
    return raw['enabled'] as boolean ?? false
  }
}

@Component
struct AnnouncementBackdrop {
  build() {
    Stack() {
      Column({ space: 0 }) {
        Row({ space: 18 }) {
          Text('⌂').fontSize(20).fontColor(Hive.Color.brandWhite)
          Text('Pay').fontSize(14).fontWeight(FontWeight.Medium).fontColor(Hive.Color.brandWhite)
          Text('Cards').fontSize(14).fontWeight(FontWeight.Medium).fontColor(Hive.Color.brandWhite)
          Text('Wealth').fontSize(14).fontWeight(FontWeight.Medium).fontColor(Hive.Color.brandWhite)
          Blank()
          Text('☰').fontSize(20).fontColor(Hive.Color.brandWhite)
        }
        .width('100%')
        .padding({ left: 18, right: 18, top: 44, bottom: 18 })
        .backgroundColor('#111827')

        Column({ space: 14 }) {
          AnnouncementAccountRow({ title: 'HSBC Red Credit Card', value: '-2,321.53 HKD' })
          AnnouncementAccountRow({ title: 'Link a non-HSBC account', value: '+' })
          AnnouncementAccountRow({ title: 'Investments', value: '' })
        }
        .width('100%')
        .padding(18)
        .layoutWeight(1)
        .backgroundColor(Hive.Color.n50)
      }
      .width('100%').height('100%')

      Row()
        .width('100%').height('100%')
        .backgroundColor('#73000000')
    }
    .width('100%').height('100%')
  }
}

@Component
struct AnnouncementAccountRow {
  title: string = ''
  value: string = ''

  build() {
    Row() {
      Text(this.title).fontSize(13).fontWeight(FontWeight.Medium).fontColor(Hive.Color.n900)
      Blank()
      Text(this.value).fontSize(13).fontWeight(FontWeight.Bold).fontColor(Hive.Color.n900)
    }
    .width('100%')
    .padding(14)
    .backgroundColor(Hive.Color.brandWhite)
    .borderRadius(6)
  }
}
