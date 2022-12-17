

import { GameContext } from '@src/core/GameContext'

import chamberSmokeVert from '@assets/shaders/chamber/smoke.vert?raw'
import chamberSmokeFrag from '@assets/shaders/chamber/smoke.frag?raw'


import smokeTexture from '@assets/textures/smoke.png';
import { CycleInterface } from '@src/core/inferface/CycleInterface';
import { LoopInterface } from '@src/core/inferface/LoopInterface';
import { WeaponComponentsPositionUtil } from '@src/core/lib/WeaponComponentsPositionUtil';
import { GameLogicEventPipe, WeaponEquipEvent } from '@src/gameplay/pipes/GameLogicEventPipe';
import { LayerEventPipe, ShotOutWeaponFireEvent } from '@src/gameplay/pipes/LayerEventPipe';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Camera, Points, Scene, ShaderMaterial, Texture } from 'three';

const image = new Image();
const texture = new Texture(image);
image.src = smokeTexture;
image.onload = () => { texture.needsUpdate = true; }

// 工具变量

const array3Util: Array<number> = new Array<number>(3);
const array1Util: Array<number> = new Array<number>(1);
/**
 * 武器开火烟雾效果
 */
export class ChamberSmokeLayer implements CycleInterface, LoopInterface {

    ifRender: boolean = false;

    scene: Scene;
    camera: Camera;
    handModelCamera: Camera;

    maximun: number = 20 * 2; // 最大产生弹壳贴图的数量

    weaponComponentsPositionUtil: WeaponComponentsPositionUtil;

    chamberSmokeOpacityFactor: number = .1; // 透明度
    chamberSmokeDisapperTime: number = 1.; // 消散时间
    chamberSmokeFadeTime: number = 1.5; // 消散渐变时间
    chamberSmokeScale: number = 1.5; // 弹孔大小
    chamberSmokeSpeed: number = .2; // 烟雾运动速度
    chamberSmokeDisappearTime: number = .4; // 弹孔存在时间(多少秒后开始渐变消失) Math.sqrt(1.8/9.8) 约等于0.4 

    chamberSmokeGeometry: BufferGeometry = new BufferGeometry();
    chamberSmokeSM: ShaderMaterial = new ShaderMaterial({
        transparent: true,
        blending: AdditiveBlending,
        uniforms: {
            uTime: { value: 0. },
            uSmokeT: { value: texture },
            uOpacityFactor: { value: this.chamberSmokeOpacityFactor },
            uDisappearTime: { value: this.chamberSmokeDisapperTime },
            uSpeed: { value: this.chamberSmokeSpeed },
            uFadeTime: { value: this.chamberSmokeFadeTime },
            uScale: { value: this.chamberSmokeScale },
            uDisapperTime: { value: this.chamberSmokeDisappearTime },
        },
        // depthTest: NeverDepth,
        depthWrite: false, // 目的是在进行深度检测时自己不会影响自己
        vertexShader: chamberSmokeVert,
        fragmentShader: chamberSmokeFrag,
    });

    positionFoat32Array: Float32Array; // 击中三角面的点位置
    directionFloat32Array: Float32Array; // 烟雾运动方向
    generTimeFLoat32Array: Float32Array; // 生成该弹壳的时间
    randFoat32Array: Float32Array; // 随机种子

    positionBufferAttribute: BufferAttribute;
    directionBufferAttribute: BufferAttribute;
    generTimeBufferAttribute: BufferAttribute;
    randBufferAttribute: BufferAttribute;

    chamberSmokeIndex: number = 0;

    init(): void {

        this.scene = GameContext.Scenes.Sprites;
        this.camera = GameContext.Cameras.PlayerCamera
        this.handModelCamera = GameContext.Cameras.HandModelCamera;

        // 添加弹点精灵

        const chamberSmokes = new Points(this.chamberSmokeGeometry, this.chamberSmokeSM);
        chamberSmokes.frustumCulled = false; // 不管如何都会渲染
        this.scene.add(chamberSmokes);

        // 初始化buffers

        this.initBuffers();

        // 当前装备武器的弹舱位置

        this.listenChamberPosition();

        // 监听开火事件
        LayerEventPipe.addEventListener(ShotOutWeaponFireEvent.type, (e: CustomEvent) => {
            if (this.ifRender) this.render();
        });

    }

    initBuffers() {

        this.positionFoat32Array = new Float32Array(new ArrayBuffer(4 * 3 * this.maximun));
        this.directionFloat32Array = new Float32Array(new ArrayBuffer(4 * 3 * this.maximun));
        this.generTimeFLoat32Array = new Float32Array(new ArrayBuffer(4 * this.maximun));
        this.randFoat32Array = new Float32Array(new ArrayBuffer(4 * this.maximun));

        for (let i = 0; i < this.maximun; i++) { // 默认初始化时所有弹点都不显示, 给他们赋予生成时间为-10s
            array1Util[0] = -10;
            this.generTimeFLoat32Array.set(array1Util, i);
        }

        // 生成 BufferAttribute

        this.positionBufferAttribute = new BufferAttribute(this.positionFoat32Array, 3);
        this.directionBufferAttribute = new BufferAttribute(this.directionFloat32Array, 3);
        this.generTimeBufferAttribute = new BufferAttribute(this.generTimeFLoat32Array, 1);
        this.randBufferAttribute = new BufferAttribute(this.randFoat32Array, 1);

        // 指定 BufferAttribute

        this.chamberSmokeGeometry.setAttribute('position', this.positionBufferAttribute);
        this.chamberSmokeGeometry.setAttribute('direction', this.directionBufferAttribute);
        this.chamberSmokeGeometry.setAttribute('generTime', this.generTimeBufferAttribute);
        this.chamberSmokeGeometry.setAttribute('rand', this.randBufferAttribute);

    }

    /**
   * 更新当前装备武器的弹舱位置: 只有定义了弹舱位置的武器才会渲染该层效果
   */
    listenChamberPosition() {
        this.weaponComponentsPositionUtil = WeaponComponentsPositionUtil.getInstance();
        GameLogicEventPipe.addEventListener(WeaponEquipEvent.type, (e: CustomEvent) => {
            const _weaponInstance = WeaponEquipEvent.detail.weaponInstance;
            if (_weaponInstance && _weaponInstance.chamberPosition) this.ifRender = true;
            else this.ifRender = false;
        });
    }

    render() {

        // positions

        this.positionFoat32Array.set(
            this.weaponComponentsPositionUtil.calculateChamberPosition().toArray(array3Util, 0),
            this.chamberSmokeIndex * 3
        );
        this.positionBufferAttribute.needsUpdate = true;

        // directions

        const rightDirection = this.weaponComponentsPositionUtil.rightDirection; // 烟雾大致向右运动
        this.directionFloat32Array.set(
            rightDirection.toArray(array3Util, 0),
            this.chamberSmokeIndex * 3
        );
        this.directionBufferAttribute.needsUpdate = true;

        // genderTimes

        array1Util[0] = GameContext.GameLoop.Clock.getElapsedTime();
        this.generTimeFLoat32Array.set(array1Util, this.chamberSmokeIndex * 1);
        this.generTimeBufferAttribute.needsUpdate = true;

        // rands

        array1Util[0] = Math.random();
        this.randFoat32Array.set(array1Util, this.chamberSmokeIndex * 1);
        this.randBufferAttribute.needsUpdate = true;

        if (this.chamberSmokeIndex + 1 >= this.maximun) this.chamberSmokeIndex = 0; // 如果index+1超过了设置最大显示弹点的上限,那么就从0开始重新循环
        else this.chamberSmokeIndex += 1;

    }

    callEveryFrame(deltaTime?: number, elapsedTime?: number): void {

        this.chamberSmokeSM.uniforms.uTime.value = elapsedTime;

    }

}