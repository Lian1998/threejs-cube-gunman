import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { WebGL1Renderer, ACESFilmicToneMapping, sRGBEncoding, Color, WebGLRenderTarget, Clock, PerspectiveCamera, Scene, OrthographicCamera } from 'three';
import { getContainerStatus } from '@src/core/lib/browser_common';
import { LoopInterface } from './inferface/LoopInterface';
import { PointLock } from './PointLock';
import { Octree } from 'three/examples/jsm/math/Octree';
import { GameResources } from './GameResources';

// 初始化上下文环境设置

const container = document.querySelector('#game-view') as HTMLElement; // 绑定dom视图容器
const initialContainerStatus = getContainerStatus(container); // 初始化时视图容器状态

// 初始化threejs渲染器

const renderer = new WebGL1Renderer({ antialias: true, alpha: false, precision: 'highp', powerPreference: 'high-performance' });
renderer.toneMapping = ACESFilmicToneMapping;
renderer.outputEncoding = sRGBEncoding;
renderer.setSize(initialContainerStatus.width, initialContainerStatus.height);
renderer.setPixelRatio(initialContainerStatus.pixcelRatio);
renderer.setClearColor(new Color(0xffffff));
renderer.domElement.className = 'webgl';

// 初始化threejs效果合成器, r136改动了材质, 导致必须手动指定两个renderTarget的贴图的encoding

const effectCompser = new EffectComposer(renderer, new WebGLRenderTarget(initialContainerStatus.width, initialContainerStatus.height, { stencilBuffer: true }));
effectCompser.renderTarget1.texture.encoding = sRGBEncoding;
effectCompser.renderTarget2.texture.encoding = sRGBEncoding;

/** 上下文环境 */
export const GameContext = {

    /** 视图 */
    GameView: {

        /** DOM容器 */
        Container: <HTMLElement>container,

        /** 渲染器 */
        Renderer: renderer,

        /** 效果合成器 */
        EffectComposer: effectCompser,
    },

    /** 游戏循环 */
    GameLoop: {

        /** 时钟帮助对象 */
        Clock: new Clock(),

        /** 渲染循环id */
        LoopID: <number><any>undefined,

        /** 暂停状态 */
        Pause: <boolean><any>true,

        /** 注册的循环对象 */
        LoopInstance: <LoopInterface[]><any>[],
    },

    /** 相机 */
    Cameras: {

        /** 玩家观察场景的相机 */
        PlayerCamera: new PerspectiveCamera(65, initialContainerStatus.width / initialContainerStatus.height, 0.1, 1000),

        /** 玩家观察手部模型的相机 */
        HandModelCamera: new PerspectiveCamera(75, initialContainerStatus.width / initialContainerStatus.height, 0.001, 5),

        /** UI正交相机 */
        UICamera: new OrthographicCamera(-50, 50, 50, -50, 0.001, 1001), // 正交相机: 准星 UI 等
    },

    /** 场景 */
    Scenes: {

        /** 天空盒 */
        Skybox: new Scene(),

        /** 交互场景 */
        Level: new Scene(),

        /** 碰撞场景 */
        Collision: new Scene(),

        /** 手部模型 */
        Handmodel: new Scene(),

        /** UI贴脸场景 */
        UI: new Scene(),

        /** 精灵场景 */
        Sprites: new Scene(),
    },

    /** 物理部分 */
    Physical: {
        WorldOCTree: <Octree>undefined,
    },

    /** 屏幕锁 */
    PointLock,

    GameResources,

    /** 生命周期接口对象 */
    CycleObjects: [],

    /** 渲染循环周期接口对象 */
    LoopObjects: [],

}

/** 监听窗口变化 */
export const onWindowResize = () => {

    // 获取容器宽高
    const { width, height, pixcelRatio } = getContainerStatus(GameContext.GameView.Container);

    // 渲染器设置宽高
    GameContext.GameView.Renderer.setSize(width, height);
    GameContext.GameView.Renderer.setPixelRatio(pixcelRatio);

    // 透视相机
    Array.isArray(Object.keys(GameContext.Cameras)) && Object.keys(GameContext.Cameras).forEach(key => {
        const camera = GameContext.Cameras[key];
        if (camera.aspect) camera.aspect = width / height;
        if (camera.updateProjectionMatrix) camera.updateProjectionMatrix();
    });

    // 效果合成器下的输入, 输出纹素画布大小
    GameContext.GameView.EffectComposer.renderTarget1.setSize(width * pixcelRatio, height * pixcelRatio);
    GameContext.GameView.EffectComposer.renderTarget2.setSize(width * pixcelRatio, height * pixcelRatio);
}
onWindowResize();
window.addEventListener('resize', onWindowResize); // 窗口变动注册事件