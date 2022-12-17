
import { AK47 } from "../weapon/instances/AK47";
import { USP } from "../weapon/instances/USP";
import { M9 } from "../weapon/instances/M9";
import { LoopInterface } from '../../core/inferface/LoopInterface';
import { UserInputSystem } from '../input/UserInputSystem';
import { WeaponSystem } from '../weapon/WeaponSystem';
import { InventorySystem } from '../Inventory/InventorySystem';
import { FPSCameraController } from '../input/controllers/FPSCameraController';
import { MovementController } from '../input/controllers/MovementController';
import { GameContext } from '../../core/GameContext';
import { InventorySlotEnum } from '../abstract/InventorySlotEnum';
import { dealWithRoleMaterial, dealWithRoleTexture } from '@src/core/lib/threejs_common';
import { CycleInterface } from '../../core/inferface/CycleInterface';
import { MeshBasicMaterial } from 'three';

const roleTexture = GameContext.GameResources.textureLoader.load('/role/role.TF2.heavy.png');
dealWithRoleTexture(roleTexture);
const roleMaterial = new MeshBasicMaterial({ map: roleTexture });
dealWithRoleMaterial(roleMaterial);

/**
 * 本地玩家
 */
export class LocalPlayer implements CycleInterface, LoopInterface {

    private static localPlayerInstance: LocalPlayer;
    private constructor() { }
    public static getInstance(): LocalPlayer {
        if (!this.localPlayerInstance) this.localPlayerInstance = new LocalPlayer();
        return this.localPlayerInstance;
    }

    init() {
        // 用户输入系统
        this.userInputSystem = new UserInputSystem();
        this.weaponSystem = WeaponSystem.getInstance(); // 武器系统

        this.cameraController = new FPSCameraController(); // 相机控制器
        this.cameraController.init();
        this.movementController = new MovementController(); // 移动控制器
        this.movementController.init();
        this.inventorySystem = new InventorySystem(); // 物品栏
        this.inventorySystem.init();

        // 枪械初始化
        const ak47 = new AK47(); // 生成一把AK
        this.inventorySystem.pickUpWeapon(ak47); // 捡起AK
        const usp = new USP(); // 生成USP
        this.inventorySystem.pickUpWeapon(usp); // 捡起USP
        const m9 = new M9(); // 生成USP
        this.inventorySystem.pickUpWeapon(m9); // 捡起USP

        // 装备主武器
        this.inventorySystem.switchEquipment(InventorySlotEnum.Primary);
    }

    userInputSystem: UserInputSystem; // 处理输入事件
    inventorySystem: InventorySystem; // 处理物品栏信息
    weaponSystem: WeaponSystem; // 处理武器信息(弹道计算,落点计算,武器动画)

    cameraController: FPSCameraController; // 相机控制器
    movementController: MovementController; // 位移控制器

    roleMaterial: THREE.Material = roleMaterial; // 玩家网格当前的材质(角色)

    callEveryFrame(deltaTime?: number, elapsedTime?: number): void {
        this.movementController.callEveryFrame(deltaTime, elapsedTime);
        this.inventorySystem.callEveryFrame(deltaTime, elapsedTime);
    }

}