

import { WeaponInterface } from '@src/gameplay/weapon/abstract/WeaponInterface'

import { DomPipe } from '@src/core/DOMPipe';
import { WeaponAnimationEventEnum } from '../abstract/EventsEnum';

/**
 * 广播所有动画相关事件
 */
export const AnimationEventPipe = new DomPipe();

/**
 * 记录武器的ID 以及 播放武器动画事件 [HOLD EQUIP RELIEVE_EQUIP FIRE RELOAD PICKUP]
 */
export const WeaponAnimationEvent = new CustomEvent<{
    enum: WeaponAnimationEventEnum,
    weaponInstance: WeaponInterface
}>('weapon animation', {
    detail: {
        enum: undefined,
        weaponInstance: undefined,
    }
});