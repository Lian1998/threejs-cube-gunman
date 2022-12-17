// https://www.3dmgame.com/gl/3626154_2.html

/** CSGO弹道相关工具 */
export class AutomaticWeaponBPointsUtil {

    /**
     * 将CSGO弹道图转化为屏幕坐标系位点
     * screen coord: 在标准化设备坐标中鼠标的二维坐标, X分量与Y分量应当在-1到1之间
     * 1. CSGO弹道图第一发为屏幕中点 [0, 0]
     * 2. 根据弹道图算出子弹之间的偏移量 deltaX,Y(px)
     * 3. 根据绘制弹道图时屏幕的分辨率缩放2中的偏移量
     * 4. 根据对屏幕中点的偏移量绘制屏幕坐标系位点
     * 5. 施加后坐力值影响
     * 
     * @param bulletPositionArray 
     * @param bulletNumber 
     * @param rateX 弹道图录制时横向的缩放比率
     * @param rateY 弹道图录制时纵向的缩放比率
     * @param recoilForce 后坐力
     * @returns 
     */
    static bulletPositionArray2ScreenCoordArray = function (bulletPositionArray: number[], bulletNumber: number, rateX: number, rateY: number, recoilForce: number) {

        // 输出
        const bulletDeltaArray = []

        let baseX = bulletPositionArray[0]; // 中心点在弹道图中的x坐标
        let baseY = bulletPositionArray[1]; // 中心点在弹道图中的y坐标

        const pmMX = 960; // 中心点在当前分辨率下屏幕中的x坐标
        const pmMy = 540; // 中心点在当前分辨率下屏幕中的y坐标

        for (let i = 0; i < bulletNumber; i++) {

            // 计算出当前点距离图中中心点x,y坐标的变化量

            let i2_x = bulletPositionArray[2 * i] - baseX;
            let i2_y = bulletPositionArray[2 * i + 1] - baseY;

            // 转换弹道图的缩放比率 X 后坐力系数

            i2_x = i2_x * rateX * recoilForce;
            i2_y = i2_y * rateY * recoilForce;

            bulletDeltaArray[2 * i] = pmMX + i2_x;
            bulletDeltaArray[2 * i + 1] = pmMy - i2_y;

        }

        for (let i = 0; i < bulletNumber; i++) {
            bulletDeltaArray[2 * i] = (bulletDeltaArray[2 * i] - 960) / 960;
            bulletDeltaArray[2 * i + 1] = (bulletDeltaArray[2 * i + 1] - 540) / 540;
        }

        return bulletDeltaArray;
    }


    /**
     * 将CSGO弹道图变化量位移转化为屏幕坐标系位点
     * screen coord: 在标准化设备坐标中鼠标的二维坐标, X分量与Y分量应当在-1到1之间
     * 1. CSGO弹道图第一发为屏幕中点 [0, 0]
     * 2. 根据弹道图算出子弹之间的偏移量 deltaX,Y(px)
     * 3. 根据绘制弹道图时屏幕的分辨率缩放2中的偏移量
     * 4. 根据对屏幕中点的偏移量绘制屏幕坐标系位点
     * 5. 施加后坐力值影响
     * 
     * @param bulletPositionArray 
     * @param bulletNumber 
     * @param rateX 弹道图录制时横向的缩放比率
     * @param rateY 弹道图录制时纵向的缩放比率
     * @param recoilForce 后坐力
     * @returns 
     */
    static bulletDeltaPositionArray2ScreenCoordArray = function (bulletPositionArray: number[], bulletNumber: number, rateX: number, rateY: number, recoilForce: number) {

        // 输出
        const bulletDeltaArray = []

        let baseX = bulletPositionArray[0]; // 中心点在弹道图中的x坐标
        let baseY = bulletPositionArray[1]; // 中心点在弹道图中的y坐标

        const pmMX = 960; // 中心点在当前分辨率下屏幕中的x坐标
        const pmMy = 540; // 中心点在当前分辨率下屏幕中的y坐标

        for (let i = 0; i < bulletNumber; i++) {

            // 计算出当前点距离图中中心点x,y坐标的变化量

            let i2_x = bulletPositionArray[2 * i] - baseX;
            let i2_y = bulletPositionArray[2 * i + 1] - baseY;

            // 转换弹道图的缩放比率 X 后坐力系数

            i2_x = i2_x * rateX * recoilForce;
            i2_y = i2_y * rateY * recoilForce;

            bulletDeltaArray[2 * i] = pmMX + i2_x;
            bulletDeltaArray[2 * i + 1] = pmMy - i2_y;

        }

        for (let i = 0; i < bulletNumber; i++) {
            bulletDeltaArray[2 * i] = (bulletDeltaArray[2 * i] - 960) / 960;
            bulletDeltaArray[2 * i + 1] = (bulletDeltaArray[2 * i + 1] - 540) / 540;
        }

        let baseXResolved = bulletDeltaArray[0];
        let baseYResolved = bulletDeltaArray[1];

        for (let i = 0; i < bulletNumber; i++) {

            let i2_x = bulletDeltaArray[2 * i];
            let i2_y = bulletDeltaArray[2 * i + 1];

            bulletDeltaArray[2 * i] = bulletDeltaArray[2 * i] - baseXResolved;
            bulletDeltaArray[2 * i + 1] = bulletDeltaArray[2 * i + 1] - baseYResolved;

            baseXResolved = i2_x;
            baseYResolved = i2_y;

        }

        return bulletDeltaArray;
    }

}