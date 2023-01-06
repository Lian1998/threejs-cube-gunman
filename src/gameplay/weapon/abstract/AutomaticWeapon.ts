import { WeaponInterface } from './WeaponInterface';
import { WeaponSystem } from '../WeaponSystem';
import { WeaponClassificationEnum } from '@src/gameplay/abstract/WeaponClassificationEnum';
import { GameContext } from '@src/core/GameContext';
import { CycleInterface } from '@src/core/inferface/CycleInterface';
import { LoopInterface } from '@src/core/inferface/LoopInterface';
import { UserInputEvent, UserInputEventPipe } from '@gameplay/pipes/UserinputEventPipe';
import { UserInputEventEnum, WeaponAnimationEventEnum } from '@gameplay/abstract/EventsEnum';
import { AnimationEventPipe, WeaponAnimationEvent } from '@gameplay/pipes/AnimationEventPipe';
import { GameLogicEventPipe, WeaponFireEvent } from '@gameplay/pipes/GameLogicEventPipe';
import { LinearInterpolant, LoopOnce, LoopRepeat, MathUtils, Vector2 } from 'three';


// 工具计算变量
let startRecover = true; // 下一帧是否是刚进入恢复状态
let startRecoverLine = 0; // 此次进入恢复状态初始的膛线值
let cameraRotateTotalX = 0; // 记录相机受弹道图影响的总值
let cameraRotateTotalY = 0;
let cameraRotationBasicTotal = 0; // 基础上下晃动
let recovercameraRotateTotalX = 0; // 此次恢复需要恢复的总值
let recovercameraRotateTotalY = 0;
const bPointRecoiledScreenCoord: THREE.Vector2 = new Vector2(); // 开火后后坐力影响后的弹点

/** 
 * 自动武器实体抽象类 
 */
export abstract class AutomaticWeapon implements CycleInterface, LoopInterface, WeaponInterface {
    private weaponSystem: WeaponSystem = WeaponSystem.getInstance(); // 武器系统
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

    // 自动武器属性
    recoverLine: number = 0; // 膛线
    bulletPosition: Array<number>; // 弹道弹点采样图2D转化为屏幕坐标采样点2D
    bulletPositionDelta: Array<number>; // 每发子弹偏移量
    bulletPositionInterpolant: THREE.LinearInterpolant; // 弹道图位点生成插值空间
    bulletPositionDeltaInterpolant: THREE.LinearInterpolant; // 弹道图变化量生成插值空间


    // 武器动画
    private equipAnim: THREE.AnimationAction;
    private reloadAnim: THREE.AnimationAction;
    private fireAnim: THREE.AnimationAction;
    private holdAnim: THREE.AnimationAction;
    private viewAnim: THREE.AnimationAction;

    /**
     * 构造方法
     * @param bulletPosition 自动步枪弹道位点图
     * @param bulletPositionDelta 每发子弹偏移量位点图
     */
    constructor(bulletPosition: Array<number>, bulletPositionDelta: Array<number>) {
        this.bulletPosition = bulletPosition;
        this.bulletPositionDelta = bulletPositionDelta;
    }

    init() {
        const positions = []; // 采样点
        for (let i = 0; i < this.magazineSize; i++) positions[i] = i * this.fireRate; // 29: 2.9000000000000004

        this.bulletPositionInterpolant = new LinearInterpolant(
            new Float32Array(positions), // parameterPositions
            new Float32Array(this.bulletPosition), // sampleValues
            2, // sampleSize
            new Float32Array(2) // resultBuffer
        );

        this.bulletPositionDeltaInterpolant = new LinearInterpolant(
            new Float32Array(positions), // parameterPositions
            new Float32Array(this.bulletPositionDelta), // sampleValues
            2, // sampleSize
            new Float32Array(2) // resultBuffer
        );

        // 监听键盘获取的武器事件
        UserInputEventPipe.addEventListener(UserInputEvent.type, (e: typeof UserInputEvent) => {
            if (!this.active) return;
            switch (e.detail.enum) {
                case UserInputEventEnum.BUTTON_RELOAD: // 换弹按键
                    if (this.magazineSize <= this.bulletLeftMagzine) return; // 2. 当前弹夹子弹是满的不能换弹
                    this.active = false;
                    WeaponAnimationEvent.detail.enum = WeaponAnimationEventEnum.RELOAD;
                    WeaponAnimationEvent.detail.weaponInstance = this;
                    AnimationEventPipe.dispatchEvent(WeaponAnimationEvent); // 触发武器换弹动画
                    break;
                case UserInputEventEnum.BUTTON_TRIGGLE_UP: // 扳机被抬起
                    if (this.bulletLeftMagzine > 0) return; // 如果扳机抬起时当前的子弹为0,那么会自动换弹
                    this.active = false;
                    WeaponAnimationEvent.detail.enum = WeaponAnimationEventEnum.RELOAD;
                    WeaponAnimationEvent.detail.weaponInstance = this;
                    AnimationEventPipe.dispatchEvent(WeaponAnimationEvent); // 触发武器换弹动画
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

        // 获取武器对应动画
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
                case WeaponAnimationEventEnum.RELIEVE_EQUIP: // 解除装备
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
                case WeaponAnimationEventEnum.FIRE: // 开火
                    this.fireAnim.weight = 49;
                    this.fireAnim.reset(); // 开火动画
                    this.fireAnim.play();
                    break;
                case WeaponAnimationEventEnum.RELOAD: // 换弹
                    this.reloadAnim.weight = 49;
                    this.reloadAnim.reset();
                    this.reloadAnim.play();
                    this.active = false; // 换弹时属于未激活状态
                    break;
            }
        })
    }

    /** 开火 */
    fire() {
        // 如果进入过恢复状态
        if (!startRecover) {
            // 那么这次相机进入恢复状态的总改变量 初始化为上次恢复后的总改变量
            cameraRotateTotalX = recovercameraRotateTotalX;
            cameraRotateTotalY = recovercameraRotateTotalY;
        }

        // 提供基础弹点位置,基础弹点的位置出来的是屏幕坐标
        const floatTypedArray0 = this.bulletPositionInterpolant.evaluate(this.recoverLine); // 通过插值函数获取当前膛线点对应的基础位置
        bPointRecoiledScreenCoord.set(floatTypedArray0[0], floatTypedArray0[1]); // 提供武器精准度影响后的位置(武器精准度)
        const deltaRecoiledX = (1 / this.accurateRange) * (Math.random() - 0.5); // 修正公式: delta = 精准度倒数 * 随机±0.5
        const deltaRecoiledY = (1 / this.accurateRange) * Math.random(); // Y轴方向只会往上偏移因此一定是正的
        bPointRecoiledScreenCoord.x += deltaRecoiledX;
        bPointRecoiledScreenCoord.y += deltaRecoiledY;

        // 相机摆动基础(Y轴, 相机Pitch方向)
        const basicPitch = 0.02 * Math.PI * (1 / this.recoilControl);
        this.camera.rotation.x += basicPitch;
        cameraRotationBasicTotal += basicPitch; // 把相机收到变化的值记录起来

        // 相机摆动(弹道图)
        const floatTypedArray1 = this.bulletPositionDeltaInterpolant.evaluate(this.recoverLine);
        const deltaYaw = - floatTypedArray1[0] * Math.PI * (1 / this.recoilControl); // 弹道图向右为正方向,相机Yaw向右为负方向
        const deltaPitch = floatTypedArray1[1] * Math.PI * (1 / this.recoilControl);
        this.camera.rotation.x += deltaPitch;
        this.camera.rotation.y += deltaYaw; // 屏幕的x坐标对应的是相机的yaw
        cameraRotateTotalX += deltaPitch; // 把相机收到弹道图变化的值记录起来
        cameraRotateTotalY += deltaYaw;

        // 开火之后
        this.recoverLine += this.fireRate; // 1. 增加膛线插值
        this.bulletLeftMagzine -= 1; // 2. 减少子弹剩余量
        startRecover = true; // 开过枪之后下一帧可以是恢复准星的第一帧

        // 发出开火事件
        WeaponAnimationEvent.detail.enum = WeaponAnimationEventEnum.FIRE;
        WeaponAnimationEvent.detail.weaponInstance = this;
        AnimationEventPipe.dispatchEvent(WeaponAnimationEvent); // 动画事件

        WeaponFireEvent.detail.bPointRecoiledScreenCoord = bPointRecoiledScreenCoord; // 设置后坐力计算后的弹点
        WeaponFireEvent.detail.weaponInstance = this;
        GameLogicEventPipe.dispatchEvent(WeaponFireEvent); // 逻辑判断事件

        // 由于还没有做UI 这里打印一下子弹剩余量
        console.log(`fire: ${this.bulletLeftMagzine} / ${this.magazineSize}`);
    }

    /** 相机/准星恢复 */
    recover(deltaTime?: number, elapsedTime?: number): void {
        if (cameraRotationBasicTotal > 0) {
            if (cameraRotationBasicTotal - 0.001 > 0) {
                this.camera.rotation.x -= 0.001;
                cameraRotationBasicTotal -= 0.001;
            } else {
                this.camera.rotation.x -= cameraRotationBasicTotal;
                cameraRotationBasicTotal = 0;
            }
        }
        const triggleDown = this.weaponSystem.triggleDown;
        let deltaRecoverScale = deltaTime / this.recoverTime; // 每段deltaTime的recover量
        if (!triggleDown || this.bulletLeftMagzine <= 0 || !this.active) {// 如果鼠标没有按下或者这一帧刚好没子弹了
            if (startRecover) { // 如果这一帧是这次进入恢复状态的第一帧
                recovercameraRotateTotalX = cameraRotateTotalX; // 记录recovercameraRotateTotalX此次恢复需要恢复的总值
                recovercameraRotateTotalY = cameraRotateTotalY;
                startRecoverLine = this.recoverLine;
            }
            // 判断是否需要恢复准星
            if (this.recoverLine != 0) { // 需要恢复准星
                const recoverLineBeforeMinus = this.recoverLine;
                if (this.recoverLine - (deltaRecoverScale * startRecoverLine) > 0) this.recoverLine -= (deltaRecoverScale * startRecoverLine);
                else { // 如果下一帧就减到<0了
                    deltaRecoverScale = this.recoverLine / startRecoverLine;
                    this.recoverLine = 0; // 膛线插值恢复
                    cameraRotateTotalX = 0;
                    cameraRotateTotalY = 0;
                    recovercameraRotateTotalX = 0;
                    recovercameraRotateTotalY = 0;
                }
                const minusScale = recoverLineBeforeMinus - this.recoverLine;
                const recoverLineScale = minusScale / startRecoverLine;
                const deltaYaw = cameraRotateTotalY * recoverLineScale;
                const deltaPitch = cameraRotateTotalX * recoverLineScale;
                this.camera.rotation.x -= deltaPitch;
                this.camera.rotation.y -= deltaYaw; // 屏幕的x坐标对应的是相机的yaw
                recovercameraRotateTotalX -= deltaPitch;
                recovercameraRotateTotalY -= deltaYaw;
                startRecover = false; // 下一帧不是进入恢复状态的第一帧
            }
        }

    }

    callEveryFrame(deltaTime?: number, elapsedTime?: number): void {
        if (!GameContext.PointLock.isLocked) return; // 当前处于PointLock锁定状态
        if (!this.active) return; // 武器未被激活
        if (this.bulletLeftMagzine <= 0) return; // 剩余子弹不足
        if (!this.weaponSystem.triggleDown) return; // 当前扳机没有被扣下
        if (performance.now() - this.lastFireTime >= this.fireRate * 1000) { // 大于武器开火间隔
            this.lastFireTime = performance.now();
            this.fire();
        }
    }
}