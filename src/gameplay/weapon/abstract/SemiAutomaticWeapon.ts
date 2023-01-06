import { GameContext } from "@src/core/GameContext";
import { WeaponClassificationEnum } from '@src/gameplay/abstract/WeaponClassificationEnum';
import { UserInputEvent, UserInputEventPipe } from '@src/gameplay/pipes/UserinputEventPipe';
import { UserInputEventEnum, WeaponAnimationEventEnum } from '@src/gameplay/abstract/EventsEnum';
import { AnimationEventPipe, WeaponAnimationEvent } from '@src/gameplay/pipes/AnimationEventPipe';
import { GameLogicEventPipe, WeaponFireEvent } from '@src/gameplay/pipes/GameLogicEventPipe';
import { WeaponInterface } from './WeaponInterface';
import { LoopOnce, LoopRepeat, MathUtils, Vector2 } from 'three';

const bPointRecoiledScreenCoord: THREE.Vector2 = new Vector2(); // 开火后后坐力影响后的弹点

let startRecover: boolean = true;
let startRecoverLine: number = 0;
let cameraRotationBasicTotal = 0; // 半自动武器只收到pitch的影响
let recovercameraRotateTotalX = 0; // 半自动武器只收到pitch的影响

/**
 * 半自动武器抽象类
 */
export abstract class SemiAutomaticWeapon implements WeaponInterface {

    private animationMixer: THREE.AnimationMixer; // 动画/网格混合器
    private weaponSkinnedMesh: THREE.SkinnedMesh; // 武器网格
    private camera: THREE.Camera = GameContext.Cameras.PlayerCamera;
    private scene: THREE.Scene = GameContext.Scenes.Handmodel;

    // 武器实例状态量
    lastFireTime: number = 0; // 上一次开火时间(ms)
    bulletLeftMagzine: number; // 当前弹夹子弹剩余
    bulletLeftTotal: number; // 总子弹剩余
    active: boolean = false; // 武器当前是否处于激活状态(当equip动画结束时武器进入active状态)

    // 武器属性
    weaponUUID = MathUtils.generateUUID(); // 该武器对象的唯一标识
    weaponClassificationEnum: WeaponClassificationEnum; // 武器类型
    weaponName: string; // 武器名字
    weaponNameSuffix: string; // 武器后缀名
    magazineSize: number; // 弹夹容量
    recoverTime: number; // 弹道恢复时间
    reloadTime: number;
    speed: number; // 手持移动速度
    killaward: number; // 击杀奖励
    damage: number; // 伤害
    fireRate: number; // 射速
    recoilControl: number; // 弹道控制
    accurateRange: number; // 在accurate range距离内第一发子弹必定会落到30cm内的标靶上
    armorPenetration: number; // 穿透能力

    // 半自动武器
    recoverLine: number = 0;

    // 武器动画
    private equipAnim: THREE.AnimationAction;
    private reloadAnim: THREE.AnimationAction;
    private fireAnim: THREE.AnimationAction;
    private holdAnim: THREE.AnimationAction;
    private viewAnim: THREE.AnimationAction;

    init() {
        // 监听键盘获取的武器事件
        UserInputEventPipe.addEventListener(UserInputEvent.type, (e: CustomEvent) => {
            if (!this.active) return; // 判断武器是否激活
            switch (e.detail.enum) {
                case UserInputEventEnum.BUTTON_RELOAD: // 换弹按键
                    if (!this.active) return; // 1. 未激活状态下(如处于切枪过程中)不能进行换弹
                    if (this.magazineSize <= this.bulletLeftMagzine) return; // 2. 当前弹夹子弹是满的不能换弹
                    this.active = false;
                    WeaponAnimationEvent.detail.enum = WeaponAnimationEventEnum.RELOAD;
                    WeaponAnimationEvent.detail.weaponInstance = this;
                    AnimationEventPipe.dispatchEvent(WeaponAnimationEvent); // 触发武器换弹事件
                    break;
                case UserInputEventEnum.BUTTON_TRIGGLE_DOWN: // 扣扳机
                    if (!GameContext.PointLock.isLocked) return;
                    if (!this.active) return; // 非激活状态取消开枪事件接收
                    if (this.bulletLeftMagzine <= 0) { // 如果子弹不够
                        this.active = false;
                        WeaponAnimationEvent.detail.enum = WeaponAnimationEventEnum.RELOAD;
                        WeaponAnimationEvent.detail.weaponInstance = this;
                        AnimationEventPipe.dispatchEvent(WeaponAnimationEvent); // 触发武器换弹事件
                        return;
                    }
                    if (performance.now() - this.lastFireTime >= this.fireRate * 1000) {
                        this.lastFireTime = performance.now();
                        this.fire();
                    }
                    break;
            }

        })

    }

    /** 初始化动画 */
    initAnimation() {

        const equipAnimName = `${this.weaponName}_equip`; // 装备
        const reloadAnimName = `${this.weaponName}_reload`; // 换弹
        const fireAnimName = `${this.weaponName}_fire`; // 开火
        const holdAnimName = `${this.weaponName}_hold`; // 握持
        const viewAnimName = `${this.weaponName}_view`; // 检视

        this.weaponSkinnedMesh = GameContext.GameResources.resourceMap.get(`${this.weaponName}_1`) as THREE.SkinnedMesh; // 武器网格体
        this.animationMixer = GameContext.GameResources.resourceMap.get('AnimationMixer') as THREE.AnimationMixer; // 动画混合器

        // 将网格体添加到系统中
        this.scene.add(this.weaponSkinnedMesh);


        this.equipAnim = GameContext.GameResources.resourceMap.get(equipAnimName) as THREE.AnimationAction;
        if (this.equipAnim) this.equipAnim.loop = LoopOnce;
        this.reloadAnim = GameContext.GameResources.resourceMap.get(reloadAnimName) as THREE.AnimationAction;
        if (this.reloadAnim) this.reloadAnim.loop = LoopOnce;
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
                    case reloadAnimName: // 当换弹动画结束
                        this.bulletLeftMagzine = this.magazineSize; // 子弹填满
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
                    if (this.reloadAnim) this.reloadAnim.reset();
                    if (this.equipAnim) this.equipAnim.reset();
                    if (this.fireAnim) this.fireAnim.reset();
                    if (this.viewAnim) this.viewAnim.reset();
                    break;
                case WeaponAnimationEventEnum.EQUIP: // 装备
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
                case WeaponAnimationEventEnum.RELOAD:
                    this.reloadAnim.weight = 49;
                    this.reloadAnim.reset();
                    this.reloadAnim.play();
                    this.active = false; // 换弹时属于未激活状态
                    break;
            }
        })
    }

    /** 开火 */
    fire(): void {

        if (!startRecover) { // 如果进入过恢复状态
            cameraRotationBasicTotal = recovercameraRotateTotalX; // 那么相机总改变量要等于恢复后的量
        }

        const bpX = (1 / this.accurateRange) * (Math.random() - 0.5);
        const bpY = (1 / this.accurateRange) * Math.random(); // Y轴方向只会往上偏移

        // 相机位置改变
        const deltaPitch = 0.05 * Math.PI * (1 / this.recoilControl);
        this.camera.rotation.x += deltaPitch;
        cameraRotationBasicTotal += deltaPitch; // 把相机收到弹道图变化的值记录起来

        // 添加膛线, 越是连发就越不准
        this.recoverLine += this.fireRate;
        const k = ((this.recoverLine / this.fireRate) - 1.0) * 60 / this.recoilControl;

        const deltaRecoiledX = bpX * k;
        const deltaRecoiledY = bpY * k;
        bPointRecoiledScreenCoord.set(deltaRecoiledX, deltaRecoiledY);

        // 发出动画事件
        WeaponAnimationEvent.detail.enum = WeaponAnimationEventEnum.FIRE;
        WeaponAnimationEvent.detail.weaponInstance = this;
        AnimationEventPipe.dispatchEvent(WeaponAnimationEvent);
        // 发出开火逻辑事件
        WeaponFireEvent.detail.bPointRecoiledScreenCoord = bPointRecoiledScreenCoord;
        WeaponFireEvent.detail.weaponInstance = this;
        GameLogicEventPipe.dispatchEvent(WeaponFireEvent);

        this.bulletLeftMagzine -= 1;
        startRecover = true;

    };

    recover(deltaTime?: number, elapsedTime?: number): void {
        if (this.recoverLine != 0) { // 需要恢复准星

            // 如果是开始恢复的第一帧
            if (startRecover) {
                recovercameraRotateTotalX = cameraRotationBasicTotal; // 记录recovercameraRotateTotalX此次恢复需要恢复的总值
                startRecoverLine = this.recoverLine;
            }

            let deltaRecoverScale = deltaTime / this.recoverTime; // 每段deltaTime的recover量
            const recoverLineBeforeMinus = this.recoverLine;
            if (this.recoverLine - (deltaRecoverScale * startRecoverLine) > 0) this.recoverLine -= (deltaRecoverScale * startRecoverLine);
            else { // 如果下一帧就减到<0了
                deltaRecoverScale = this.recoverLine / startRecoverLine;
                this.recoverLine = 0; // 膛线插值恢复
                cameraRotationBasicTotal = 0;
                recovercameraRotateTotalX = 0;
            }
            const minusScale = recoverLineBeforeMinus - this.recoverLine;
            const recoverLineScale = minusScale / startRecoverLine;
            const deltaPitch = cameraRotationBasicTotal * recoverLineScale;
            this.camera.rotation.x -= deltaPitch;
            recovercameraRotateTotalX -= deltaPitch;
            startRecover = false; // 下一帧不是进入恢复状态的第一帧
            //
        }
    }
}