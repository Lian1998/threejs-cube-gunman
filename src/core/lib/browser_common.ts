/**
 * 获取当前三维视图容器的 { 宽, 高, 物理像素/CSS像素比 }
 * @param container 三维视图容器
 * @returns { 宽, 高, 物理像素/CSS像素比 }
 */
export const getContainerStatus = (container: HTMLElement): ViewportStatus => {
    const { width, height } = container.getBoundingClientRect();
    return {
        width: width,
        height: height,
        pixcelRatio: window.devicePixelRatio,
    }
}