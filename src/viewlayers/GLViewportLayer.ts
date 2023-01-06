

import { Vector2 } from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { GameContext } from '../core/GameContext';
import { CycleInterface } from '../core/inferface/CycleInterface';
import { LoopInterface } from '../core/inferface/LoopInterface';

/**
 * WebGl输出画面
 */
export class GLViewportLayer implements CycleInterface, LoopInterface {

    fxaaPass: ShaderPass = new ShaderPass(FXAAShader);
    rendererSize: Vector2 = new Vector2();

    init(): void {

        GameContext.GameView.Renderer.autoClear = false;
        GameContext.GameView.Renderer.autoClearDepth = false;
        GameContext.GameView.Renderer.autoClearStencil = false;

        // // FXAA(快速近似抗锯齿) 目前版本的threejs的FXAA-shaderpass出了点问题
        // this.fxaaPass = new ShaderPass(FXAAShader);
        // GameContext.GameView.EffectComposer.addPass(this.fxaaPass);
        // this.updateFXAAUnifroms();
        // window.addEventListener('resize', () => { this.updateFXAAUnifroms() }); // resize时需要更新FXAA参数
    }

    updateFXAAUnifroms() {
        GameContext.GameView.Renderer.getSize(this.rendererSize);
        (this.fxaaPass.material.uniforms['resolution'].value as Vector2).set(1 / this.rendererSize.x, 1 / this.rendererSize.y);
    }

    callEveryFrame(deltaTime?: number, elapsedTime?: number): void {

        // 天空盒
        GameContext.GameView.Renderer.render(GameContext.Scenes.Skybox, GameContext.Cameras.PlayerCamera);
        GameContext.GameView.Renderer.clearDepth();

        // 渲染场景
        GameContext.GameView.Renderer.render(GameContext.Scenes.Level, GameContext.Cameras.PlayerCamera);

        // 渲染特效层
        GameContext.GameView.Renderer.render(GameContext.Scenes.Sprites, GameContext.Cameras.PlayerCamera);
        GameContext.GameView.Renderer.clearDepth();

        // 手部模型
        GameContext.GameView.Renderer.render(GameContext.Scenes.Handmodel, GameContext.Cameras.HandModelCamera);
        GameContext.GameView.Renderer.clearDepth();

        // UI
        GameContext.GameView.Renderer.render(GameContext.Scenes.UI, GameContext.Cameras.UICamera);

        // GameContext.GameView.EffectComposer.render();
    }

}