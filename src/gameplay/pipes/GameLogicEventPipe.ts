import { WeaponInterface } from '../weapon/abstract/WeaponInterface';

import { DomPipe } from '@src/core/DOMPipe';
export const GameLogicEventPipe = new DomPipe();

/**
 * 武器系统开火事件
 */
export const WeaponFireEvent = new CustomEvent<{
    bPointRecoiledScreenCoord: THREE.Vector2, // 子弹经过后坐力计算后在屏幕上实际出弹点
    weaponInstance: WeaponInterface, // 武器ID
}>('weapon fired', {
    detail: {
        bPointRecoiledScreenCoord: undefined,
        weaponInstance: undefined,
    }
});

/**
 * 武器系统切换时间
 */
export const WeaponEquipEvent = new CustomEvent<{
    weaponInstance: WeaponInterface, // 武器
}>(
    'waepon equiped', {
    detail: { weaponInstance: undefined, }
});