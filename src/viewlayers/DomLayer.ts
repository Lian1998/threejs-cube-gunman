import { GameContext } from '@src/core/GameContext';

import Stats from 'three/examples/jsm/libs/stats.module';
import { DomEventPipe, PointLockEvent } from '../gameplay/pipes/DomEventPipe';
import { CycleInterface } from '../core/inferface/CycleInterface';
import { LoopInterface } from '../core/inferface/LoopInterface';
import { PointLockEventEnum } from '../gameplay/abstract/EventsEnum';


/**
 * Dom元素的交互层, 控制是否在网页中显示webgl输出, 以及UI事件接口
 */
export class DOMLayer extends EventTarget implements CycleInterface, LoopInterface {
    stats: Stats = Stats();

    init(): void {

        // 游戏提示和指导
        const blocker = document.createElement('div');
        blocker.id = 'blocker';
        const instructions = document.createElement('div');
        instructions.id = 'instructions'
        const tip1 = document.createElement('p');
        tip1.innerHTML = 'CLICK TO PLAY';
        instructions.appendChild(tip1);
        blocker.appendChild(instructions);
        GameContext.GameView.Container.appendChild(blocker);

        // 将渲染器出图挂载到页面容器上
        GameContext.GameView.Container.appendChild(GameContext.GameView.Renderer.domElement);

        // PointLock事件
        GameContext.PointLock.pointLockListen();
        instructions.addEventListener('click', () => { if (!GameContext.PointLock.isLocked) GameContext.PointLock.lock(); });
        DomEventPipe.addEventListener(PointLockEvent.type, (e: CustomEvent) => { // 通过事件通道接收事件
            switch (e.detail.enum) {
                case PointLockEventEnum.LOCK: // 锁定事件
                    instructions.style.display = 'none';
                    blocker.style.display = 'none';
                    break;
                case PointLockEventEnum.UNLOCK: // 解锁事件
                    blocker.style.display = 'block';
                    instructions.style.display = '';
                    break;
            }
        });
        GameContext.GameView.Container.appendChild(this.stats.dom);
    }

    callEveryFrame(deltaTime?: number, elapsedTime?: number): void {
        this.stats.update();
    }

}