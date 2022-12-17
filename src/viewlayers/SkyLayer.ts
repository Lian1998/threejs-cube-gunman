import { Sky } from 'three/examples/jsm/objects/Sky'
import { GameContext } from "@src/core/GameContext"
import { CycleInterface } from '../core/inferface/CycleInterface';
import { MathUtils, Vector3 } from 'three';

// 天空盒
const skyEffectConfig = {
    turbidity: 4,
    rayleigh: 1,
    mieCoefficient: 0.003,
    mieDirectionalG: 0.7,
    elevation: 20,
    azimuth: -10,
    exposure: GameContext.GameView.Renderer.toneMappingExposure,
}

/**
 * 利用ThreeJs SkyShader生成材质, 赋予盒子网格作为天空盒
 */
export class SkyLayer implements CycleInterface {

    scene: THREE.Scene;
    sky: Sky = new Sky();
    sun: THREE.Vector3 = new Vector3();

    /** 当前情况不需要每帧都更新信息 */
    init(): void {
        this.scene = GameContext.Scenes.Skybox;
        this.sky.scale.setScalar(1000);  // THREE.Sky 本质上是通过shader构造材质, 添加给一个盒体; 这里设置盒体的大小

        const uniforms = this.sky.material.uniforms;
        uniforms['turbidity'].value = skyEffectConfig.turbidity;
        uniforms['rayleigh'].value = skyEffectConfig.rayleigh;
        uniforms['mieCoefficient'].value = skyEffectConfig.mieCoefficient;
        uniforms['mieDirectionalG'].value = skyEffectConfig.mieDirectionalG;

        const phi = MathUtils.degToRad(90 - skyEffectConfig.elevation);
        const theta = MathUtils.degToRad(skyEffectConfig.azimuth);
        this.sun.setFromSphericalCoords(1, phi, theta);

        uniforms['sunPosition'].value.copy(this.sun);
        GameContext.GameView.Renderer.toneMappingExposure = skyEffectConfig.exposure;
        this.scene.add(this.sky);
    }

}