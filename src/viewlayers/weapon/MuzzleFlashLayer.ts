import { AdditiveBlending, BufferAttribute, BufferGeometry, Camera, Points, Scene, ShaderMaterial, Texture, Vector3 } from 'three';
import muzzlesflashVert from '@assets/shaders/muzzle/flash.vert?raw'
import muzzlesflashFrag from '@assets/shaders/muzzle/flash.frag?raw'

import { GameContext } from '@src/core/GameContext'

import flashTexture from '@assets/textures/muzzle.flash.png';
import { CycleInterface } from '@src/core/inferface/CycleInterface';
import { LoopInterface } from '@src/core/inferface/LoopInterface';
import { GameLogicEventPipe, WeaponEquipEvent } from '@src/gameplay/pipes/GameLogicEventPipe';
import { LayerEventPipe, ShotOutWeaponFireEvent } from '../../gameplay/pipes/LayerEventPipe';

const image = new Image();
const texture = new Texture(image);
image.src = flashTexture;
image.onload = () => { texture.needsUpdate = true; }

const muzzlePositionUtil = new Vector3(); // 枪口位置
const array3Util: Array<number> = new Array<number>(3);
const array1Util: Array<number> = new Array<number>(1);

/**
 * 枪口火光
 */
export class MuzzleFlashLayer implements CycleInterface, LoopInterface {

    ifRender: boolean = false;

    scene: Scene;
    camera: Camera;

    muzzleFlashSize: number = 1.5;
    muzzleFlashTime: number = .01;

    muzzleFlashGeometry: BufferGeometry = new BufferGeometry();
    muzzleFlashSM: ShaderMaterial = new ShaderMaterial({
        uniforms: {
            uScale: { value: this.muzzleFlashSize },
            uTime: { value: -1. },
            uFireTime: { value: -1. },
            uOpenFireT: { value: texture },
            uFlashTime: { value: this.muzzleFlashTime },
        },
        vertexShader: muzzlesflashVert,
        fragmentShader: muzzlesflashFrag,
        blending: AdditiveBlending,
    });

    positionFoat32Array: Float32Array;
    positionBufferAttribute: BufferAttribute;
    randFloat32Array: Float32Array;
    randBufferAttribute: BufferAttribute;

    init(): void {

        // 类指针
        this.scene = GameContext.Scenes.Handmodel;
        this.camera = GameContext.Cameras.PlayerCamera;

        // 添加物体至场景
        const muzzleFlash = new Points(this.muzzleFlashGeometry, this.muzzleFlashSM);
        muzzleFlash.frustumCulled = false;
        this.scene.add(muzzleFlash);

        // 初始化buffers
        this.initBuffers();

        // 监听当前武器的枪口位置
        GameLogicEventPipe.addEventListener(WeaponEquipEvent.type, (e: CustomEvent) => {
            const _weaponInstance = WeaponEquipEvent.detail.weaponInstance;
            if (WeaponEquipEvent.detail.weaponInstance && WeaponEquipEvent.detail.weaponInstance.muzzlePosition) {
                muzzlePositionUtil.copy(_weaponInstance.muzzlePosition); // 判断是否有枪口位置, 有枪口位置就渲染火光
                this.ifRender = true;
            }
            else this.ifRender = false;
        })

        // 监听渲染事件
        LayerEventPipe.addEventListener(ShotOutWeaponFireEvent.type, (e: CustomEvent) => {
            if (this.ifRender) this.render();
        });
    }

    initBuffers(): void {

        this.positionFoat32Array = new Float32Array(new ArrayBuffer(4 * 3));
        this.randFloat32Array = new Float32Array(new ArrayBuffer(4 * 1));
        this.positionBufferAttribute = new BufferAttribute(this.positionFoat32Array, 3);
        this.randBufferAttribute = new BufferAttribute(this.randFloat32Array, 1);

        // 创建几何

        this.muzzleFlashGeometry.setAttribute('position', this.positionBufferAttribute);
        this.muzzleFlashGeometry.setAttribute('rand', this.randBufferAttribute);
    }
    render() {
        // 枪口位置
        this.positionFoat32Array.set(muzzlePositionUtil.toArray(array3Util, 0), 0);
        this.positionBufferAttribute.needsUpdate = true;

        // 开火时间
        this.muzzleFlashSM.uniforms.uFireTime.value = GameContext.GameLoop.Clock.getElapsedTime();

        // 闪光随机种子
        const rand = Math.random();
        array1Util[0] = rand;
        this.randFloat32Array.set(array1Util, 0);
        this.randBufferAttribute.needsUpdate = true;
    }

    callEveryFrame(deltaTime?: number, elapsedTime?: number): void {
        this.muzzleFlashSM.uniforms.uTime.value = elapsedTime; // 每帧向显卡传入当前渲染时间
    }

}