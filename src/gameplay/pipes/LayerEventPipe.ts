
import { DomPipe } from '@src/core/DOMPipe';
import { Vector2, Vector3 } from 'three';

/**
 * 广播所有画面渲染层级的事件
 */
export const LayerEventPipe = new DomPipe();

/**
 * 子弹落点需要渲染
 * fallenPoint 子弹落点
 * fallenNormal 子弹落点法线 
 * cameraPosition 发出子弹位置(相机位置)
 * recoiledScreenCoord 子弹射出时屏幕投影位置
 */
export const BulletFallenPointEvent = new CustomEvent<{
    fallenPoint: THREE.Vector3;
    fallenNormal: THREE.Vector3;
    cameraPosition: THREE.Vector3;
    recoiledScreenCoord: THREE.Vector2;
}>('bullet fallenpoint', {
    detail: {
        fallenPoint: new Vector3(),
        fallenNormal: new Vector3(),
        cameraPosition: new Vector3(),
        recoiledScreenCoord: new Vector2(),
    }
});

/** 射出类型武器开火 */
export const ShotOutWeaponFireEvent = new CustomEvent<{}>('shoutoutweapon fired', {})