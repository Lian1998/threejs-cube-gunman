
import { Capsule } from "three/examples/jsm/math/Capsule";
import { Octree } from "three/examples/jsm/math/Octree";
import { GameContext } from '@src/core/GameContext';
import { CycleInterface } from '@src/core/inferface/CycleInterface';
import { LoopInterface } from '@src/core/inferface/LoopInterface';
import { UserInputEventEnum } from '@src/gameplay/abstract/EventsEnum';
import { UserInputEvent, UserInputEventPipe } from '@src/gameplay/pipes/UserinputEventPipe';
import { Vector3 } from 'three';

const STEPS_PER_FRAME = 5;
const GRAVITY = 30;
const vec3Util = new Vector3();

const config = {
    groundControlFactor: 20.,
    airControlFactor: 5.,
    dampFactor: -10.,
    movespeedFactor: 2.4
}

/**
 * 移动控制器, 根据输入映射控制玩家的移动
 */
export class MovementController implements CycleInterface, LoopInterface {

    playerOctree: Octree = GameContext.Physical.WorldOCTree; // 用于检测玩家碰撞场景的OCTree
    playerCamera: THREE.Camera; // 玩家相机
    playerCollider: Capsule; // 玩家碰撞模型

    playerOnFloor: boolean = true;
    keyStates: Map<UserInputEventEnum, boolean> = new Map();

    playerVelocity: THREE.Vector3 = new Vector3(); // 玩家速度
    playerDirection: THREE.Vector3 = new Vector3(); // 玩家键盘运动方向

    init(): void {

        this.playerOctree = GameContext.Physical.WorldOCTree;
        this.playerCamera = GameContext.Cameras.PlayerCamera;
        this.playerCollider = new Capsule(new Vector3(0, 0.35, 0), new Vector3(0, 1.45, 0), 0.35);

        UserInputEventPipe.addEventListener(UserInputEvent.type, (e: CustomEvent) => {
            switch (e.detail.enum) {
                case UserInputEventEnum.MOVE_FORWARD_DOWN:
                    this.keyStates.set(UserInputEventEnum.MOVE_FORWARD_DOWN, true);
                    break;
                case UserInputEventEnum.MOVE_BACKWARD_DOWN:
                    this.keyStates.set(UserInputEventEnum.MOVE_BACKWARD_DOWN, true);
                    break;
                case UserInputEventEnum.MOVE_LEFT_DOWN:
                    this.keyStates.set(UserInputEventEnum.MOVE_LEFT_DOWN, true);
                    break;
                case UserInputEventEnum.MOVE_RIGHT_DOWN:
                    this.keyStates.set(UserInputEventEnum.MOVE_RIGHT_DOWN, true);
                    break;
                case UserInputEventEnum.MOVE_FORWARD_UP:
                    this.keyStates.set(UserInputEventEnum.MOVE_FORWARD_DOWN, false);
                    break;
                case UserInputEventEnum.MOVE_BACKWARD_UP:
                    this.keyStates.set(UserInputEventEnum.MOVE_BACKWARD_DOWN, false);
                    break;
                case UserInputEventEnum.MOVE_LEFT_UP:
                    this.keyStates.set(UserInputEventEnum.MOVE_LEFT_DOWN, false);
                    break;
                case UserInputEventEnum.MOVE_RIGHT_UP:
                    this.keyStates.set(UserInputEventEnum.MOVE_RIGHT_DOWN, false);
                    break;
                case UserInputEventEnum.JUMP: // 跳跃
                    this.jump();
                    break;
            }

        })

    }

    callEveryFrame(deltaTime?: number, elapsedTime?: number): void {
        const dt = Math.min(0.05, deltaTime) / STEPS_PER_FRAME; // 最小deltaTime
        for (let i = 0; i < STEPS_PER_FRAME; i++) { // 在cpu中多次计算, 以免出现速度过快穿墙的问题
            this.controls(dt); // 接受控制器输入控制身体方向
            this.updatePlayer(dt); // 更新玩家位置
            this.teleportPlayerIfOob(); // 检测玩家是否出了地图
        }
    }

    /**
     * 身体方向控制
     * @param deltaTime 帧间隔时间 
     */
    controls(deltaTime: number): void {
        const airControlFactor = deltaTime * (this.playerOnFloor ? config.groundControlFactor : config.airControlFactor); // 在空中只有一点点的身体控制
        this.playerDirection.set(0, 0, 0);
        if (this.playerOnFloor) {
            if (this.keyStates.get(UserInputEventEnum.MOVE_FORWARD_DOWN))
                this.playerDirection.add(this.getForwardVector().normalize());
            if (this.keyStates.get(UserInputEventEnum.MOVE_BACKWARD_DOWN))
                this.playerDirection.add(this.getForwardVector().normalize().multiplyScalar(-1));
            if (this.keyStates.get(UserInputEventEnum.MOVE_LEFT_DOWN))
                this.playerDirection.add(this.getSideVector().normalize().multiplyScalar(-1));
            if (this.keyStates.get(UserInputEventEnum.MOVE_RIGHT_DOWN))
                this.playerDirection.add(this.getSideVector().normalize());
            if (this.playerDirection.lengthSq() > 1.)
                this.playerDirection.normalize(); // 方向向量
        }
        this.playerVelocity.add(this.playerDirection.multiplyScalar(airControlFactor * config.movespeedFactor));
    }

    /**
     * 碰撞检测玩家位置
     * @param deltaTime 帧间隔时间
     */
    updatePlayer(deltaTime: number) {

        // 对数 e^x
        let damping = Math.exp(config.dampFactor * deltaTime) - 1;

        if (!this.playerOnFloor) {
            this.playerVelocity.y -= GRAVITY * deltaTime;
            damping *= 0.1; // small air resistance
        }

        this.playerVelocity.addScaledVector(this.playerVelocity, damping);
        const deltaPosition = this.playerVelocity.clone().multiplyScalar(deltaTime);
        this.playerCollider.translate(deltaPosition);
        const result = this.playerOctree.capsuleIntersect(this.playerCollider);
        this.playerOnFloor = false;
        if (result) {
            this.playerOnFloor = result.normal.y > 0;
            if (!this.playerOnFloor) this.playerVelocity.addScaledVector(result.normal, - result.normal.dot(this.playerVelocity));
            this.playerCollider.translate(result.normal.multiplyScalar(result.depth));
        }
        this.playerCamera.position.copy(this.playerCollider.end);

    }

    /**
     * 检测玩家是否跳出地图
     */
    teleportPlayerIfOob() {
        if (this.playerCamera.position.y <= -25) {
            this.playerCollider.start.set(0, 0.35, 0);
            this.playerCollider.end.set(0, 1, 0);
            this.playerCollider.radius = 0.35;
            this.playerCamera.position.copy(this.playerCollider.end);
            this.playerCamera.rotation.set(0, 0, 0);
        }
    }

    /**
     * 获取相机正向的方向
     * @returns THREE.Vector3 正向方向
     */
    getForwardVector() {
        this.playerCamera.getWorldDirection(vec3Util);
        vec3Util.y = 0;
        vec3Util.normalize();
        return vec3Util;
    }

    /**
     * 获取相机侧向的方向
     * @returns THREE.Vector3 侧向方向
     */
    getSideVector() {
        this.playerCamera.getWorldDirection(vec3Util);
        vec3Util.y = 0;
        vec3Util.normalize();
        vec3Util.cross(this.playerCamera.up);
        return vec3Util;
    }

    /**
     * 跳跃
     */
    jump() {
        if (this.playerOnFloor) { this.playerVelocity.y = 8; }
    }

}