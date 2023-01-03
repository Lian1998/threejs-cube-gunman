
/**
 * 随着游戏框架的初始化 运行等过程会调用的一系列接口
 */
export type CycleInterface = {

    /** 当游戏框架初始化时会被调用 */
    init(): void;

}