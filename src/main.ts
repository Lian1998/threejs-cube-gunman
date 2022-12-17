import 'normalize.css'
import '@assets/css/style.scss'
import { GameContext } from '@src/core/GameContext';
import { CycleInterface } from './core/inferface/CycleInterface';
import { LoopInterface } from './core/inferface/LoopInterface';
import { initResource } from './core/GameResources';

// 加载模型资源
initResource().then(() => {

    // 请求模块开始生成loop和cycle对象
    import('./core/GameObjectMap').then(({ GameObjectsMap }) => {

        GameObjectsMap.forEach((value, key, map) => {
            if ((<CycleInterface><any>value).init) GameContext.CycleObjects.push(value);
            if ((<LoopInterface><any>value).callEveryFrame) GameContext.LoopObjects.push(value);
        })

        console.warn('Resources Loaded', GameContext);

        for (let i = 0; i < GameContext.CycleObjects.length; i++) {
            <CycleInterface>GameContext.CycleObjects[i].init();
        }

        loop();
    })

});

const loop = () => {
    const deltaTime = GameContext.GameLoop.Clock.getDelta();
    const elapsedTime = GameContext.GameLoop.Clock.getElapsedTime();

    // LoopID
    GameContext.GameLoop.LoopID = window.requestAnimationFrame(() => { loop(); });

    // LoopObjects
    for (let i = 0; i < GameContext.LoopObjects.length; i++) {
        GameContext.LoopObjects[i].callEveryFrame(deltaTime, elapsedTime);
    }

    // pause status
    GameContext.GameLoop.Pause = false;
}

const pause = () => {
    if (!GameContext.GameLoop.Pause) {
        window.cancelAnimationFrame(GameContext.GameLoop.LoopID);
        GameContext.GameLoop.Pause = true;
    }
    else loop();
}

window.addEventListener('keyup', function (e: KeyboardEvent) {
    if (e.code === 'KeyP') pause();
});

