import { DomPipe } from '@src/core/DOMPipe';
import { PointLockEventEnum } from '@src/gameplay/abstract/EventsEnum';

/**
 * 广播所有Dom元素操作事件
 */
export const DomEventPipe = new DomPipe();

/**
 * 监听PointLock事件, 发出PointLock状态
 * 同时在PointLock时进行对操纵器移动的监听
 */
export const PointLockEvent = new CustomEvent<{
    enum: PointLockEventEnum,
    movementX: number,
    movementY: number,
}>('pointlock', {
    detail: { enum: 0, movementX: 0, movementY: 0 }
});