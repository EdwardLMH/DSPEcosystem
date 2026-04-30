import UIAbility from "@ohos:app.ability.UIAbility";
import type AbilityConstant from "@ohos:app.ability.AbilityConstant";
import type Want from "@ohos:app.ability.Want";
import type window from "@ohos:window";
import hilog from "@ohos:hilog";
const TAG = 'EntryAbility';
const DOMAIN = 0x0001;
export default class EntryAbility extends UIAbility {
    onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
        hilog.info(DOMAIN, TAG, 'onCreate');
    }
    onDestroy(): void {
        hilog.info(DOMAIN, TAG, 'onDestroy');
    }
    onWindowStageCreate(windowStage: window.WindowStage): void {
        hilog.info(DOMAIN, TAG, 'onWindowStageCreate');
        // FIX: was (err) => — unannotated callback parameter, which ArkTS forbids
        // (every parameter must have an explicit type annotation — arkts-no-implicit-any).
        // The correct type for the loadContent callback error is BusinessError from @ohos.base.
        windowStage.loadContent('pages/Index', (err: BusinessError) => {
            if (err.code) {
                hilog.error(DOMAIN, TAG, 'loadContent failed: %{public}s', JSON.stringify(err));
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
