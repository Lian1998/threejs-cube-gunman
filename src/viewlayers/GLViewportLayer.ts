

import { Vector2 } from 'three';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { GameContext } from '../core/GameContext';
import { CycleInterface } from '../core/inferface/CycleInterface';
import { LoopInterface } from '../core/inferface/LoopInterface';

/**
 * 所有WebGl输出画面的集合, 使用 ThreeJs effectCompser 合成画面的多个渲染
 */
export class GLViewportLayer implements CycleInterface, LoopInterface {

    fxaaPass: ShaderPass = new ShaderPass(FXAAShader);
    rendererSize: Vector2 = new Vector2();

    init(): void {
        let renderPass: RenderPass;

        GameContext.GameView.Renderer.autoClear = false;
        GameContext.GameView.Renderer.autoClearDepth = false;
        GameContext.GameView.Renderer.autoClearStencil = false;

        // 天空盒
        renderPass = new RenderPass(GameContext.Scenes.Skybox, GameContext.Cameras.PlayerCamera);
        GameContext.GameView.EffectComposer.addPass(renderPass);
        renderPass.clear = true;
        renderPass.clearDepth = true;

        // 渲染场景
        renderPass = new RenderPass(GameContext.Scenes.Level, GameContext.Cameras.PlayerCamera);
        GameContext.GameView.EffectComposer.addPass(renderPass);
        renderPass.clear = false;
        renderPass.clearDepth = false;

        // 渲染特效层
        renderPass = new RenderPass(GameContext.Scenes.Sprites, GameContext.Cameras.PlayerCamera);
        GameContext.GameView.EffectComposer.addPass(renderPass);
        renderPass.clear = false;
        renderPass.clearDepth = false;

        // 手部模型
        renderPass = new RenderPass(GameContext.Scenes.Handmodel, GameContext.Cameras.HandModelCamera);
        GameContext.GameView.EffectComposer.addPass(renderPass);
        renderPass.clear = false;
        renderPass.clearDepth = true;

        // UI
        renderPass = new RenderPass(GameContext.Scenes.UI, GameContext.Cameras.UICamera);
        GameContext.GameView.EffectComposer.addPass(renderPass);
        renderPass.clear = false;
        renderPass.clearDepth = true;

        // FXAA(快速近似抗锯齿)
        this.fxaaPass = new ShaderPass(FXAAShader);
        GameContext.GameView.EffectComposer.addPass(this.fxaaPass);
        this.updateFXAAUnifroms();
        window.addEventListener('resize', () => { this.updateFXAAUnifroms() }); // resize时需要更新FXAA参数
    }

    updateFXAAUnifroms() {
        GameContext.GameView.Renderer.getSize(this.rendererSize);
        (this.fxaaPass.material.uniforms['resolution'].value as Vector2).set(1 / this.rendererSize.x, 1 / this.rendererSize.y);
    }

    callEveryFrame(deltaTime?: number, elapsedTime?: number): void {
        GameContext.GameView.EffectComposer.render();
    }

}