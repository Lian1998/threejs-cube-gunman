import bulletHoleAshVertex from '@assets/shaders/bullet/hole/ash.vert?raw';
import bulletHoleAshFrag from '@assets/shaders/bullet/hole/ash.frag?raw';

import ashTexture from '@assets/textures/bullet.hole.ash.png';
import { CycleInterface } from '@src/core/inferface/CycleInterface';
import { LoopInterface } from '@src/core/inferface/LoopInterface';
import { GameContext } from '@src/core/GameContext';
import { BulletFallenPointEvent, LayerEventPipe } from '@src/gameplay/pipes/LayerEventPipe';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, ShaderMaterial, Texture } from 'three';

const image = new Image();
const texture = new Texture(image);
image.src = ashTexture;
image.onload = () => { texture.needsUpdate = true; }

const array3Util: Array<number> = new Array<number>(3);
const array1Util: Array<number> = new Array<number>(1);

/**
 * 子弹击中场景物体导致的尘土特效
 */
export class BulletHoleAshLayer implements CycleInterface, LoopInterface {

    scene: THREE.Scene;

    maximun: number = 10; // 最大产生弹点数量

    bulletHoleOpacity: number = .4; // 弹孔透明度
    bulletHoleScale: number = 15.; // 弹孔大小
    exitTime: number = .1; // 弹孔存在时间(多少秒后开始渐变消失)
    fadeTime: number = .1; // 弹孔消失渐变时间

    bulletHoleGeometry: THREE.BufferGeometry = new BufferGeometry();
    bulletHoleMaterial: THREE.ShaderMaterial = new ShaderMaterial({
        uniforms: {
            uTime: { value: 0. },
            uOpacity: { value: this.bulletHoleOpacity },
            uScale: { value: this.bulletHoleScale },
            uExitTime: { value: this.exitTime },
            uFadeTime: { value: this.fadeTime },
            uAshT: { value: texture },
        },
        blending: AdditiveBlending,
        transparent: true,
        vertexShader: bulletHoleAshVertex,
        fragmentShader: bulletHoleAshFrag,
    });

    // geometry.attributes 指针用于记录集合体可以复用的buffer
    positionFoat32Array: Float32Array; // 击中三角面的点位置
    normalFoat32Array: Float32Array; // 击中三角面的法线
    generTimeFLoat32Array: Float32Array; // 生成该弹点的时间
    randFoat32Array: Float32Array; // 该弹点的随机大小

    positionBufferAttribute: THREE.BufferAttribute;
    normalBufferAttribute: THREE.BufferAttribute;
    generTimeBufferAttribute: THREE.BufferAttribute;
    randBufferAttribute: THREE.BufferAttribute;

    // 下一发弹点的位置指针

    bulletHoleIndex: number = 0;

    init(): void {

        // 绑定指针/初始化
        this.scene = GameContext.Scenes.Sprites;
        this.bulletHoleMaterial.depthWrite = false; // 目的是在进行深度检测时自己不会影响自己

        // 生成 array buffer
        this.positionFoat32Array = new Float32Array(new ArrayBuffer(4 * 3 * this.maximun));
        this.normalFoat32Array = new Float32Array(new ArrayBuffer(4 * 3 * this.maximun));
        this.generTimeFLoat32Array = new Float32Array(new ArrayBuffer(4 * this.maximun));
        this.randFoat32Array = new Float32Array(new ArrayBuffer(4 * this.maximun));
        for (let i = 0; i < this.maximun; i++) { // 默认初始化时所有弹点都不显示, 给他们赋予生成时间为-10s
            array1Util[0] = -10;
            this.generTimeFLoat32Array.set(array1Util, i);
        }

        // 添加弹点精灵
        const bulletHoles = new Points(this.bulletHoleGeometry, this.bulletHoleMaterial);
        bulletHoles.frustumCulled = false; // 不管如何都会渲染
        this.scene.add(bulletHoles);

        // 生成 BufferAttribute
        this.positionBufferAttribute = new BufferAttribute(this.positionFoat32Array, 3);
        this.normalBufferAttribute = new BufferAttribute(this.normalFoat32Array, 3);
        this.generTimeBufferAttribute = new BufferAttribute(this.generTimeFLoat32Array, 1);
        this.randBufferAttribute = new BufferAttribute(this.randFoat32Array, 1);

        // 指定 BufferAttribute
        this.bulletHoleGeometry.setAttribute('position', this.positionBufferAttribute);
        this.bulletHoleGeometry.setAttribute('normal', this.normalBufferAttribute);
        this.bulletHoleGeometry.setAttribute('generTime', this.generTimeBufferAttribute);
        this.bulletHoleGeometry.setAttribute('rand', this.randBufferAttribute);

        // 监听事件管线, 触发三维特效
        LayerEventPipe.addEventListener(BulletFallenPointEvent.type, (e: CustomEvent) => { this.addPoint(e.detail.fallenPoint, e.detail.fallenNormal); })

    }

    /** 添加弹点的通用方法 */
    addPoint(point: THREE.Vector3, normal: THREE.Vector3) {

        const random = 0.5 + Math.random() * .5; // 0.5 ~ 1

        // 弹点位置

        this.positionFoat32Array.set(point.toArray(array3Util, 0), this.bulletHoleIndex * 3);

        // 弹点法线

        this.normalFoat32Array.set(normal.toArray(array3Util, 0), this.bulletHoleIndex * 3);

        // 弹点生成时间

        array1Util[0] = GameContext.GameLoop.Clock.getElapsedTime();
        this.generTimeFLoat32Array.set(array1Util, this.bulletHoleIndex);

        // 弹点随机大小影响值

        array1Util[0] = random;
        this.randFoat32Array.set(array1Util, this.bulletHoleIndex);

        if (this.bulletHoleIndex + 1 >= this.maximun) this.bulletHoleIndex = 0; // 如果index+1超过了设置最大显示弹点的上限,那么就从0开始重新循环
        else this.bulletHoleIndex += 1;

        // 更新 BufferAttribute

        this.positionBufferAttribute.needsUpdate = true;
        this.normalBufferAttribute.needsUpdate = true;
        this.generTimeBufferAttribute.needsUpdate = true;
        this.randBufferAttribute.needsUpdate = true;

    }

    callEveryFrame(deltaTime?: number, elapsedTime?: number): void {

        this.bulletHoleMaterial.uniforms.uTime.value = elapsedTime;

    }

}