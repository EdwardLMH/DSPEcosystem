import UIAbility from "@ohos:app.ability.UIAbility";
import type AbilityConstant from "@ohos:app.ability.AbilityConstant";
import type Want from "@ohos:app.ability.Want";
import type window from "@ohos:window";
import hilog from "@ohos:hilog";
const TAG = 'EntryAbility';
const DOMAIN = 0x0001;
export default class EntryAbility extends UIAbility {
    onCreate(c: Want, d: AbilityConstant.LaunchParam): void {
        hilog.info(DOMAIN, TAG, 'onCreate');
    }
    onDestroy(): void {
        hilog.info(DOMAIN, TAG, 'onDestroy');
    }
    onWindowStageCreate(a: window.WindowStage): void {
        hilog.info(DOMAIN, TAG, 'onWindowStageCreate');
        a.loadContent('pages/Index', (b: BusinessError) => {
            if (b.code) {
                hilog.error(DOMAIN, TAG, 'loadContent failed: %{public}s', JSON.stringify(b));
                return;
            }
            hilog.info(DOMAIN, TAG, 'loadContent succeeded');
        });
    }
    onWindowStageDestroy(): void {
        hilog.info(DOMAIN, TAG, 'onWindowStageDestroy');
    }
    onForeground(): void {
        hilog.info(DOMAIN, TAG, 'onForeground');
    }
    onBackground(): void {
        hilog.info(DOMAIN, TAG, 'onBackground');
    }
}
