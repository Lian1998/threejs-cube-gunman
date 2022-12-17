
import upVert from '@assets/shaders/crosshair/up.vert?raw' // 上
import downVert from '@assets/shaders/crosshair/down.vert?raw' // 下
import leftVert from '@assets/shaders/crosshair/left.vert?raw' // 左
import rightVert from '@assets/shaders/crosshair/right.vert?raw' // 右
import crossFrag from '@assets/shaders/crosshair/cross.frag?raw'

import { GameContext } from '@src/core/GameContext'
import { CycleInterface } from '@src/core/inferface/CycleInterface'
import { BufferAttribute, BufferGeometry, Color, CustomBlending, DoubleSide, Mesh, ShaderMaterial } from 'three'

const indexes = new Uint16Array([0, 2, 1, 2, 3, 1]);
const normals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
const positions = new Float32Array([-.5, .5, 0, .5, .5, 0, -.5, -.5, 0, .5, -.5, 0]);
const geom = new BufferGeometry();


/**
 * 准星显示:
 * 1. 定义参数: 颜色,长短,粗细,alpha,中心点,分离度,准星状态
 * 2. 在场景中塞4个PlaneMesh, 并用正交相机渲染4个planeMesh
 * 3. 定义PlaneMesh的shader, 用GPU计算准星位置并显示
 */
export class CrosshairLayer implements CycleInterface {

    scene: THREE.Scene;
    camera: THREE.Camera;

    crossMaterials: THREE.ShaderMaterial[] = [];

    crosshaircolor = new Color(0, 1, 0); // 颜色
    crosshairsize = .02; // 长短
    crosshairthinkness = .004; // 粗细
    crosshairalpha = .8; // alpha
    crosshairdot = false; // 中心点
    crosshairgap = .01; // 分离度
    crosshairstyle = 4; // 0默认 1默认静态 2经典 3经典动态 4经典静态

    uniforms: {};

    init(): void {
        this.scene = GameContext.Scenes.UI;
        this.uniforms = {
            uColor: { value: this.crosshaircolor },
            uSize: { value: this.crosshairsize },
            uThinkness: { value: this.crosshairthinkness },
            uGap: { value: this.crosshairgap },
            uAlpha: { value: this.crosshairalpha },
            uAspect: { value: GameContext.Cameras.PlayerCamera.aspect }
        }

        const crossMaterial1 = new ShaderMaterial({ uniforms: this.uniforms, vertexShader: upVert, fragmentShader: crossFrag }); // 上
        const crossMaterial2 = new ShaderMaterial({ uniforms: this.uniforms, vertexShader: downVert, fragmentShader: crossFrag }); // 下
        const crossMaterial3 = new ShaderMaterial({ uniforms: this.uniforms, vertexShader: leftVert, fragmentShader: crossFrag }); // 左
        const crossMaterial4 = new ShaderMaterial({ uniforms: this.uniforms, vertexShader: rightVert, fragmentShader: crossFrag }); // 右

        window.addEventListener('resize', () => { // 找到当前渲染的aspect
            crossMaterial1.uniforms.uAspect.value = GameContext.Cameras.PlayerCamera.aspect;
            crossMaterial2.uniforms.uAspect.value = GameContext.Cameras.PlayerCamera.aspect;
            crossMaterial3.uniforms.uAspect.value = GameContext.Cameras.PlayerCamera.aspect;
            crossMaterial4.uniforms.uAspect.value = GameContext.Cameras.PlayerCamera.aspect;
        });

        // 定义4个顶点两个三角面

        geom.setIndex(new BufferAttribute(indexes, 1));
        geom.setAttribute('position', new BufferAttribute(positions, 3));
        geom.setAttribute('normal', new BufferAttribute(normals, 3));

        const cross1 = new Mesh(geom, crossMaterial1);
        const cross2 = new Mesh(geom, crossMaterial2);
        const cross3 = new Mesh(geom, crossMaterial3);
        const cross4 = new Mesh(geom, crossMaterial4);

        this.scene.add(cross1);
        this.scene.add(cross2);
        this.scene.add(cross3);
        this.scene.add(cross4);

        this.crossMaterials.push(crossMaterial1);
        this.crossMaterials.push(crossMaterial2);
        this.crossMaterials.push(crossMaterial3);
        this.crossMaterials.push(crossMaterial4);

        this.crossMaterials.forEach(item => {
            item.blending = CustomBlending;
            // item.depthTest = THREE.NeverDepth;
            item.side = DoubleSide;
            item.dithering = true;
            item.transparent = true;
        })

    }


    setGap(gapSize: number) {
        if (this.uniforms['uGap']) this.uniforms['uGap'].value = gapSize;
    }

}