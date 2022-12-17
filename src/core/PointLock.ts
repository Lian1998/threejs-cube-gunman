import { GameContext } from '../core/GameContext';
import { PointLockEventEnum } from '../gameplay/abstract/EventsEnum';
import { DomEventPipe, PointLockEvent } from '../gameplay/pipes/DomEventPipe';

export class PointLock extends EventTarget {
    static isLocked: boolean = false; // 是否锁定

    /** 监听 pointlock 事件: onMouseChange, onPointerlockChange, onPointerlockError */
    static pointLockListen() {
        GameContext.GameView.Container.ownerDocument.addEventListener('mousemove', this.onMouseChange);
        GameContext.GameView.Container.ownerDocument.addEventListener('pointerlockchange', this.onPointerlockChange);
        GameContext.GameView.Container.ownerDocument.addEventListener('pointerlockerror', this.onPointerlockError);
    }

    /** 注销 pointlock 事件: onMouseChange, onPointerlockChange, onPointerlockError */
    static pointLockDispose = function () {
        GameContext.GameView.Container.ownerDocument.removeEventListener('mousemove', this.onMouseChange);
        GameContext.GameView.Container.ownerDocument.removeEventListener('pointerlockchange', this.onPointerlockChange);
        GameContext.GameView.Container.ownerDocument.removeEventListener('pointerlockerror', this.onPointerlockError);
    };

    static onMouseChange = (e: MouseEvent): void => {
        if (!PointLock.isLocked) return;
        PointLockEvent.detail.enum = PointLockEventEnum.MOUSEMOVE;
        PointLockEvent.detail.movementX = e.movementX;
        PointLockEvent.detail.movementY = e.movementY;
        DomEventPipe.dispatchEvent(PointLockEvent);
    };

    static onPointerlockChange = function () {
        if (GameContext.GameView.Container.ownerDocument.pointerLockElement === GameContext.GameView.Container) {
            PointLockEvent.detail.enum = PointLockEventEnum.LOCK;
            DomEventPipe.dispatchEvent(PointLockEvent);
            PointLock.isLocked = true;
        } else {
            PointLockEvent.detail.enum = PointLockEventEnum.UNLOCK;
            DomEventPipe.dispatchEvent(PointLockEvent);
            PointLock.isLocked = false;
        }
    }

    static onPointerlockError = function () {
        console.error('THREE.PointerLockControls: Unable to use Pointer Lock API');
    }

    static unlock = function () { GameContext.GameView.Container.ownerDocument.exitPointerLock(); };
    static lock = function () { GameContext.GameView.Container.requestPointerLock(); };

}