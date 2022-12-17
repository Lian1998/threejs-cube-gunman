import { GameContext } from '@src/core/GameContext';
import { CycleInterface } from '@src/core/inferface/CycleInterface';
import { LoopInterface } from '@src/core/inferface/LoopInterface';
import { PointLockEventEnum } from '@src/gameplay/abstract/EventsEnum';
import { DomEventPipe, PointLockEvent } from '@src/gameplay/pipes/DomEventPipe';
import { LocalPlayer } from '@src/gameplay/player/LocalPlayer';
import { MathUtils, Vector3 } from 'three';

let deltaZUtil = 0;
let deltaYUtil = 0;

let screenMoveX = 0; // 不断记录鼠标移动的距离, 横拉
let screenMoveY = 0; // 不断记录鼠标移动的距离, 纵拉
let mouseFloatX = 0.08; // 鼠标横拉导致的相机z轴坐标变化最大值
let mouseFloatY = 0.12; // 鼠标纵拉导致的相机y轴坐标变化最大值

let breathFloatScale = 0.01; // 呼吸导致的相机y轴变化最大值
let cameraDefaultPosition = new Vector3();

// breath   -1, 1   - breathFloatScale, breathFloatScale
// screenMoveX   -256, 256   -mouseFloatX, mouseFloatX
// screenMoveY   -256, 256   -mouseFloatY, mouseFloatY

/**
 * 手部模型动画
 */
export class HandModelLayer implements CycleInterface, LoopInterface {

    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    localPlayer: LocalPlayer = LocalPlayer.getInstance();
    animationMixer: THREE.AnimationMixer;

    init(): void {
        this.scene = GameContext.Scenes.Handmodel;
        DomEventPipe.addEventListener(PointLockEvent.type, function (e: CustomEvent) { // 监听自定义的 pointlock.mousemove 事件
            if (e.detail.enum === PointLockEventEnum.MOUSEMOVE) {
                screenMoveX = MathUtils.clamp(screenMoveX + e.detail.movementX, -256, 256);
                screenMoveY = MathUtils.clamp(screenMoveY + e.detail.movementY, -256, 256);
            }
        })
        this.initCameraStatus(); // 初始化相机位置
        this.addHandMesh(); // 加载手模型
    }

    callEveryFrame(deltaTime?: number, elapsedTime?: number): void {
        if (this.animationMixer) this.animationMixer.update(deltaTime);
        if (!GameContext.PointLock.isLocked) return;

        // 工具变量
        deltaZUtil = 0;
        deltaYUtil = 0;

        // 1. 拉动瞄准位置带来的惯性 (浏览器大概每秒输出70次鼠标变化的事件)
        const cameraDeltaZ = MathUtils.mapLinear(screenMoveX, -256, 256, -mouseFloatX, mouseFloatX);
        deltaZUtil += cameraDeltaZ;

        const cameraDeltaY = MathUtils.mapLinear(screenMoveY, -256, 256, -mouseFloatY, mouseFloatY);
        deltaYUtil += cameraDeltaY;

        // 2. 呼吸带来的模型上下浮动, 由于只渲染模型和枪支, 因此移动模型就是相对于移动相机
        const sinDeltaTime = (Math.sin(elapsedTime) + 1) / 2;
        const breathDelta = MathUtils.lerp(-breathFloatScale, breathFloatScale, sinDeltaTime);
        deltaYUtil += breathDelta;

        // 3. 改变增量值
        this.camera.position.z = cameraDefaultPosition.z + deltaZUtil;
        this.camera.position.y = cameraDefaultPosition.y - deltaYUtil;

        // 实时递减变量 screenMoveX, screenMoveY
        const base = deltaTime;
        if (screenMoveX > 0) screenMoveX = Math.min(0, screenMoveX - base);
        else if (screenMoveX < 0) screenMoveX = Math.max(0, screenMoveX + base);
        if (screenMoveY > 0) screenMoveY = Math.min(0, screenMoveY - base);
        else if (screenMoveY < 0) screenMoveY = Math.max(0, screenMoveY + base);
    }


    /** 初始化手模型的相机位置(和blender一致) */
    initCameraStatus() {
        this.camera = GameContext.Cameras.HandModelCamera;
        this.camera.clearViewOffset();
        this.camera.near = 0.001;
        this.camera.far = 999;
        this.camera.fov = 70; // 60 ~ 80
        this.camera.scale.z = 1.5; // 1 ~ 1.6
        this.camera.position.set(-1.6, 1.4, 0);
        cameraDefaultPosition.copy(this.camera.position);
        this.camera.rotation.y = - Math.PI / 2;
    }


    /** 添加手模型 */
    addHandMesh() {
        const armature = GameContext.GameResources.resourceMap.get('Armature') as THREE.Object3D;
        const arms = GameContext.GameResources.resourceMap.get('Arms') as THREE.SkinnedMesh;
        arms.material = this.localPlayer.roleMaterial;
        arms.frustumCulled = false;
        this.animationMixer = GameContext.GameResources.resourceMap.get('AnimationMixer') as THREE.AnimationMixer;
        arms.visible = true;
        this.scene.add(armature);
        this.scene.add(arms);
    }

}