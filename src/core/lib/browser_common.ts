// 此文件定义涉及与浏览器相关通用函数

import { GameContext } from '../GameContext';

/**
 * 获取当前三维视图容器的 { 宽, 高, 物理像素/CSS像素比 }
 * @param container 三维视图容器
 * @returns { 宽, 高, 物理像素/CSS像素比 }
 */
export const getContainerStatus = (container?: HTMLElement): ViewportStatus => {
    if (!container) container = GameContext.GameView.Container;

    // https://developer.mozilla.org/zh-CN/docs/Web/API/Element/getBoundingClientRect
    const { width, height } = container.getBoundingClientRect();
    
    return {
        width: width,
        height: height,
        pixcelRatio: window.devicePixelRatio,
    }
}