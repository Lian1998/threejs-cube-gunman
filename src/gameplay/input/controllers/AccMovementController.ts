import { GameContext } from "@src/core/GameContext"
import { Capsule } from "three/examples/jsm/math/Capsule"
import { Octree } from "three/examples/jsm/math/Octree";
import { LoopInterface } from '@src/core/inferface/LoopInterface';
import { CycleInterface } from '@src/core/inferface/CycleInterface';
import { Vector3 } from 'three'

const config = {
    capsuleRadius: .3, // capsule 到 start, end 的距离
    capsuleHeight: 1.8, // capsule 总长
    stepsPerFrame: 10,// 每帧需要检查碰撞的次数, 避免穿模
    groundControlMass: 1.0, // 地面运动控制权重
    airControlMass: .3, // 空中运动控制权重
    resistancea: 36,// 地面摩擦减速度
    movespeeda: 72, // 移动加速度
    jumpspeed: 2.5 * 3,// 起跳速度
    movespeedmax: 4.0, // 最大移动速度
    gravity: 9.8 * 3, // 重力加速度
}

const keyStates = {}; // 按键状态

document.addEventListener('keydown', (event) => { keyStates[event.code] = true; });
document.addEventListener('keyup', (event) => { keyStates[event.code] = false; });

// 初始化一些工具变量

const v3Util: THREE.Vector3 = new Vector3();
const vhorizon = new Vector3();

let maxspeedSqrt: number = Math.pow(config.movespeedmax, 2); // 初始化时生成, 防止多次计算
let vVertical = 0;
let onFloor: boolean = true;

/**
 * 玩家控制类, 计算加速度
 */
class AccMovementController implements LoopInterface, CycleInterface {

    worldOctree: Octree = GameContext.Physical.WorldOCTree;
    camera: THREE.Camera; // 控制器对应的玩家相机
    startPoint: THREE.Vector3 = new Vector3(0, config.capsuleRadius, 0);
    endPoint: THREE.Vector3 = new Vector3(0, config.capsuleHeight - config.capsuleRadius, 0);
    playerCollider: Capsule = new Capsule(this.startPoint, this.endPoint, config.capsuleRadius); // 玩家的碰撞体积是一个胶囊体 0 ~ 1.8
    velocity: THREE.Vector3 = new Vector3(); // 存储当前的速度
    moveDirection: THREE.Vector3 = new Vector3(); // 存储当前的加速度方向(键盘按键)

    init(): void {
        this.camera = GameContext.Cameras.PlayerCamera;
        this.startPoint.set(0, config.capsuleRadius, 0);
        this.endPoint.set(0, config.capsuleHeight - config.capsuleRadius, 0);
        this.playerCollider.set(this.startPoint, this.endPoint, config.capsuleRadius);
        maxspeedSqrt = Math.pow(config.movespeedmax, 2);
    }

    callEveryFrame(deltaTime?: number, elapsedTime?: number): void {
        deltaTime = Math.min(0.05, deltaTime / config.stepsPerFrame);
        const camera = this.camera;
        const collider = this.playerCollider;
        const keyboardD = this.moveDirection;
        const v = this.velocity;

        // 将每帧的运动拆分成多次碰撞计算
        for (let i = 0; i < config.stepsPerFrame; i++) {
            vhorizon.copy(v);
            vhorizon.y = 0;
            vVertical = v.y;
            const bodyControl = (onFloor ? config.groundControlMass : config.airControlMass); // 速度的控制权重

            // 1. 获取当前键盘输入的方向
            keyboardD.set(0, 0, 0);
            if (keyStates['KeyW']) keyboardD.add(this.getCameraForwardVector());
            if (keyStates['KeyS']) keyboardD.addScaledVector(this.getCameraForwardVector(), -1);
            if (keyStates['KeyA']) keyboardD.addScaledVector(this.getCameraSideVector(), -1);
            if (keyStates['KeyD']) keyboardD.add(this.getCameraSideVector());
            keyboardD.normalize(); // 当前键盘的输入方向

            // 2. 计算 v1 = v0 + deltaV; deltaV = a * deltaTime; 
            vhorizon.addScaledVector(keyboardD, config.movespeeda * bodyControl * deltaTime);

            // 3. 阻力减速度
            const lengthSqrt = vhorizon.lengthSq(); // 当前速度
            if (lengthSqrt != 0) { // 当前速度不为0, 就会受到阻力的影响
                const deltaRT = config.resistancea * deltaTime // 减速度(向量) v = at
                if (onFloor) { // 着地才受到摩擦力的影响
                    if (lengthSqrt - Math.pow(deltaRT, 2) > 0) vhorizon.setLength(Math.pow(lengthSqrt, 1 / 2) - deltaRT); // 如果减速之后速度长度大于0, 那么减速
                    else vhorizon.set(0, 0, 0); // 否则的话就把速度设置为静止(0)
                }
            }

            // 4. 处理垂直速度, 跳跃
            if (onFloor) if (keyStates['Space']) vVertical = config.jumpspeed; // 如果在地上而且空格按下的话可以跳跃
            if (!onFloor) vVertical -= config.gravity * deltaTime; // 如果不在地上的话速度y轴受到重力影响 v = gt

            // 5. 最大速度限制
            if (lengthSqrt > maxspeedSqrt) vhorizon.setLength(config.movespeedmax); // 如果减速了之后速度还大于最大值, 那么直接赋予其最大值

            // 6. 碰撞检测
            v.set(vhorizon.x, vVertical, vhorizon.z); // 拼合速度
            const deltaPosition = v3Util.copy(v).multiplyScalar(deltaTime); // deltaPosition = v * t
            collider.translate(deltaPosition); // 对该位置进行碰撞检测
            const result = this.worldOctree.capsuleIntersect(collider); // 检测碰撞 { normal: Vector3, depth: number }
            onFloor = false;

            // 7. 处理检测结果
            if (result) {
                onFloor = result.normal.y > 0; // 通过碰撞面法向量是否朝上判断是否处于地面
                if (!onFloor) v.addScaledVector(result.normal, - result.normal.dot(v)); // 墙面或者天花板: 将速度(沿着碰撞面法向量)添加一个量, 添加量的大小取决于碰撞面法线和速度的夹角
                collider.translate(result.normal.multiplyScalar(result.depth)); // 将胶囊体重新拉回到碰撞面外
                if (onFloor) v.y = 0;
            }

            // 7.相机最终位置粘滞在胶囊体endPoint上
            camera.position.copy(collider.end);

        }

    }

    /** 获取相机水平朝向 */
    getCameraForwardVector() {
        const camera = this.camera;
        camera.getWorldDirection(v3Util);
        v3Util.y = 0;
        v3Util.normalize();
        return v3Util;
    }

    /** 获取相机水平朝向(左右, 叉乘) */
    getCameraSideVector() {
        const camera = this.camera;
        camera.getWorldDirection(v3Util);
        v3Util.y = 0;
        v3Util.normalize();
        v3Util.cross(camera.up);
        return v3Util;
    }

}

export { AccMovementController }