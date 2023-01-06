import { GameContext } from '@src/core/GameContext';
import { UserInputEventEnum, WeaponAnimationEventEnum } from '@src/gameplay/abstract/EventsEnum';
import { WeaponClassificationEnum } from '@src/gameplay/abstract/WeaponClassificationEnum';
import { AnimationEventPipe, WeaponAnimationEvent } from '@src/gameplay/pipes/AnimationEventPipe';
import { GameLogicEventPipe, WeaponFireEvent } from '@src/gameplay/pipes/GameLogicEventPipe';
import { UserInputEvent, UserInputEventPipe } from '@src/gameplay/pipes/UserinputEventPipe';
import { LoopOnce, LoopRepeat, MathUtils, Vector2 } from 'three';

import { WeaponInterface } from "./WeaponInterface";

const bPointRecoiledScreenCoord: THREE.Vector2 = new Vector2(); // 开火后后坐力影响后的弹点 匕首永远是屏幕中央

export class DaggerWeapon implements WeaponInterface {

    private animationMixer: THREE.AnimationMixer; // 动画/网格混合器
    private weaponSkinnedMesh: THREE.SkinnedMesh; // 武器网格
    private scene: THREE.Scene = GameContext.Scenes.Handmodel;

    active: boolean;

    weaponClassificationEnum: WeaponClassificationEnum = WeaponClassificationEnum.Malee;
    weaponUUID: string = MathUtils.generateUUID();
    lastFireTime: number = 0; // 上一次开火时间
    bulletLeftMagzine: number;
    bulletLeftTotal: number;
    weaponName: string;
    weaponNameSuffix: string;
    magazineSize: number;
    recoverTime: number;
    reloadTime: number;
    speed: number;
    killaward: number;
    damage: number;
    fireRate: number = 0.5;
    recoilControl: number;
    accurateRange: number;
    armorPenetration: number;

    constructor() {
        // 监听键盘获取的武器事件
        UserInputEventPipe.addEventListener(UserInputEvent.type, (e: CustomEvent) => {
            if (!this.active) return; // 判断武器是否激活
            switch (e.detail.enum) {
                case UserInputEventEnum.BUTTON_TRIGGLE_DOWN: // 当扳机被扣下
                    const performanceNow = performance.now();
                    if (!GameContext.PointLock.isLocked) return;
                    if (!this.active) return;
                    if (performanceNow - this.lastFireTime < this.fireRate * 1000) return;
                    this.lastFireTime = performanceNow;
                    WeaponAnimationEvent.detail.enum = WeaponAnimationEventEnum.FIRE;
                    WeaponAnimationEvent.detail.weaponInstance = this;
                    AnimationEventPipe.dispatchEvent(WeaponAnimationEvent);
                    WeaponFireEvent.detail.bPointRecoiledScreenCoord = bPointRecoiledScreenCoord;
                    WeaponFireEvent.detail.weaponInstance = this;
                    GameLogicEventPipe.dispatchEvent(WeaponFireEvent);
                    break;
            }
        })
    }

    // 武器动画
    private equipAnim: THREE.AnimationAction;
    private fireAnim: THREE.AnimationAction;
    private holdAnim: THREE.AnimationAction;
    private viewAnim: THREE.AnimationAction;

    /** 初始化动画 */
    initAnimation() {

        const equipAnimName = `${this.weaponName}_equip`; // 装备
        const fireAnimName = `${this.weaponName}_fire`; // 开火
        const holdAnimName = `${this.weaponName}_hold`; // 握持
        const viewAnimName = `${this.weaponName}_view`; // 检视

        this.weaponSkinnedMesh = GameContext.GameResources.resourceMap.get(`${this.weaponName}_1`) as THREE.SkinnedMesh; // 武器网格体
        this.animationMixer = GameContext.GameResources.resourceMap.get('AnimationMixer') as THREE.AnimationMixer; // 动画混合器

        // 将网格体添加到系统中
        this.scene.add(this.weaponSkinnedMesh);
        this.equipAnim = GameContext.GameResources.resourceMap.get(equipAnimName) as THREE.AnimationAction;
        if (this.equipAnim) this.equipAnim.loop = LoopOnce;
        this.fireAnim = GameContext.GameResources.resourceMap.get(fireAnimName) as THREE.AnimationAction;
        if (this.fireAnim) this.fireAnim.loop = LoopOnce;
        this.holdAnim = GameContext.GameResources.resourceMap.get(holdAnimName) as THREE.AnimationAction;
        if (this.holdAnim) this.holdAnim.loop = LoopRepeat; // 握持动画需要一直显示
        this.viewAnim = GameContext.GameResources.resourceMap.get(viewAnimName) as THREE.AnimationAction;
        if (this.viewAnim) this.viewAnim.loop = LoopOnce;

        // 当部分动画结束 需要在回调中改变一些参数
        this.animationMixer.addEventListener('finished', (e: any) => {
            if (e.type === 'finished') {
                switch (e.action._clip.name) {
                    case equipAnimName: // 当装备动画结束
                        this.active = true; // 激活
                        break;
                }
            }
        })

        // 接受武器事件回调处理动画
        AnimationEventPipe.addEventListener(WeaponAnimationEvent.type, (e: CustomEvent) => {
            if (e.detail.weaponInstance !== this) return; // 只有当前武器的事件才给予响应
            switch (e.detail.enum) {
                case WeaponAnimationEventEnum.RELIEVE_EQUIP:  // 解除装备
                    this.weaponSkinnedMesh.visible = false; // 武器不可见
                    this.active = false; // 未激活
                    this.animationMixer.stopAllAction(); // 关闭所有正在播放的动画
                    if (this.holdAnim) this.holdAnim.reset();
                    if (this.equipAnim) this.equipAnim.reset();
                    if (this.fireAnim) this.fireAnim.reset();
                    if (this.viewAnim) this.viewAnim.reset();
                    break;
                case WeaponAnimationEventEnum.EQUIP:  // 装备
                    this.weaponSkinnedMesh.visible = true; // 武器可见性
                    this.holdAnim.play();
                    this.equipAnim.weight = 49;
                    this.equipAnim.reset(); // 当前武器的装备动画
                    this.equipAnim.play();
                    this.active = false; // 装备动画播放时属于未激活状态
                    break;
                case WeaponAnimationEventEnum.FIRE:
                    this.fireAnim.weight = 49;
                    this.fireAnim.reset(); // 开火动画
                    this.fireAnim.play();
                    break;
            }
        })
    }

}