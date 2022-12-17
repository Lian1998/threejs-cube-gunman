import { GameContext } from '@src/core/GameContext';
import { GameObjectMaterialEnum } from '../abstract/GameObjectMaterialEnum';
import { WeaponClassificationEnum } from '../abstract/WeaponClassificationEnum';
import { BulletFallenPointEvent, LayerEventPipe, ShotOutWeaponFireEvent } from '../pipes/LayerEventPipe';
import { UserInputEvent, UserInputEventPipe } from '../pipes/UserinputEventPipe';
import { UserInputEventEnum } from '@src/gameplay/abstract/EventsEnum';
import { GameLogicEventPipe, WeaponFireEvent } from '../pipes/GameLogicEventPipe';
import { Raycaster } from 'three';

/** 
 * 武器系统, 处理武器系统对外事件:
 * 1. 通过事件获取开枪计算过后坐力后的子弹屏幕坐标位置; 获取相机位置, 通过相机设置激光; 计算弹点激光最终落点
 * 2. 判断击中物体的游戏逻辑材质, 对不同的物体采用不同的逻辑材质使用不同的逻辑事件
 * 3. 分发特效渲染事件
 * 4. 记录鼠标按键状态
 */
export class WeaponSystem {

    camera: THREE.Camera = GameContext.Cameras.PlayerCamera; // 武器系统交互使用的相机
    scene: THREE.Scene = GameContext.Scenes.Level; // 武器系统交互的场景
    triggleDown: boolean = false;  // 当前扳机状态
    raycaster = new Raycaster(); // 用于激光检测
    _objectsIntersectedArray: THREE.Intersection<THREE.Object3D<THREE.Event>>[] = [];  // 用于存储激光检测的结果

    // 单例模式
    private static weaponSystemInstance: WeaponSystem;
    private constructor() {
        UserInputEventPipe.addEventListener(UserInputEvent.type, (e: CustomEvent) => { // 玩家按键事件影响
            switch (e.detail.enum) {
                case UserInputEventEnum.BUTTON_TRIGGLE_DOWN: // 扳机事件
                    this.triggleDown = true;
                    break;
                case UserInputEventEnum.BUTTON_TRIGGLE_UP:
                    this.triggleDown = false;
                    break;
            }
        })
        this.dealWithWeaponOpenFire();
    }
    public static getInstance() {
        if (!this.weaponSystemInstance) this.weaponSystemInstance = new WeaponSystem();
        return this.weaponSystemInstance;
    }

    /** 
     * 处理武器开火事件
     */
    dealWithWeaponOpenFire() {
        GameLogicEventPipe.addEventListener(WeaponFireEvent.type, (e: CustomEvent) => {
            // 1. 向渲染层发出开火效果渲染事件
            if (e.detail.weaponInstance &&
                e.detail.weaponInstance.weaponClassificationEnum !== WeaponClassificationEnum.Malee)
                LayerEventPipe.dispatchEvent(ShotOutWeaponFireEvent); // 给渲染层传递渲染事件(开火特效)

            // 2. 进行激光碰撞检测
            this._objectsIntersectedArray.length = 0; // 清空数组缓存
            let ifGenerated = false; // 标记是否已经生成过弹点
            const bpPointScreenCoord = e.detail.bPointRecoiledScreenCoord; // 子弹收到后坐力影响后在屏幕坐标的落点
            this.raycaster.setFromCamera(bpPointScreenCoord, this.camera); // 通过相机设置激光
            this.raycaster.params.Mesh.threshold = 1; // threshold是相交对象时光线投射器的精度，以世界单位表示
            this.raycaster.intersectObjects(this.scene.children, true, this._objectsIntersectedArray); // 检测

            // 3. 渲染弹孔
            if (this._objectsIntersectedArray.length > 0) { // 如果击中了三角面
                for (let i = 0; i < this._objectsIntersectedArray.length; i++) { // 遍历所有的击中信息
                    if (ifGenerated) return; // 如果已经产生弹孔 就直接弹出方法不再产生弹孔
                    const point = this._objectsIntersectedArray[i].point; // 弹点
                    const gameObjectMaterial = this._objectsIntersectedArray[i].object.userData['GameObjectMaterialEnum'] // 用于判断碰撞面属于哪个(游戏逻辑)网格材质
                    if (gameObjectMaterial === undefined) return; // 如果不是游戏逻辑内的材质不会生成弹点
                    switch (gameObjectMaterial) {
                        case GameObjectMaterialEnum.PlayerHead | GameObjectMaterialEnum.PlayerBelly | GameObjectMaterialEnum.PlayerChest | GameObjectMaterialEnum.PlayerUpperLimb | GameObjectMaterialEnum.PlayerLowerLimb: // 如果是玩家身体的一部分
                            ifGenerated = true; // 不生成弹孔,且后续穿透也不会生成弹孔
                            // ... 这里应当发出玩家xxx被击中的事件
                            break;
                        case GameObjectMaterialEnum.GrassGround: // 如果是场景物体的一部分
                            if (e.detail.weaponInstance &&
                                e.detail.weaponInstance.weaponClassificationEnum === WeaponClassificationEnum.Malee) break; // 如果当前持有武器类型是匕首那么不产生弹点

                            // 使用 addPoint 通用函数向场景中添加弹点
                            const normal = this._objectsIntersectedArray[i].face.normal;

                            // 渲染的子弹击中场景: 击中烟尘, 击中火光
                            BulletFallenPointEvent.detail.fallenPoint.copy(point);
                            BulletFallenPointEvent.detail.fallenNormal.copy(normal);
                            BulletFallenPointEvent.detail.cameraPosition.copy(this.camera.position);
                            BulletFallenPointEvent.detail.recoiledScreenCoord.copy(bpPointScreenCoord);
                            LayerEventPipe.dispatchEvent(BulletFallenPointEvent);

                            ifGenerated = true; // 后续穿透不再生成弹孔
                            break;
                    }
                }
            }
        })

    }

}