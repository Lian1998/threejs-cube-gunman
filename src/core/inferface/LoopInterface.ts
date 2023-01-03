/**
 * 随着游戏帧渲染 会不断调用的接口
 */
export type LoopInterface = {

    /**
     * 游戏每帧渲染时会调用
     * @param deltaTime 距离上一帧的间隔时间
     * @param elapsedTime 距离第一帧循环的时间
     */
    callEveryFrame(deltaTime?: number, elapsedTime?: number): void;
    
}