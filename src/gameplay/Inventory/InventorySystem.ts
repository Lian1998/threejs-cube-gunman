
import { WeaponInterface } from '../weapon/abstract/WeaponInterface';
import { InventorySlotEnum, mapIventorySlotByWeaponClassficationEnum } from '../abstract/InventorySlotEnum';
import { CycleInterface } from '../../core/inferface/CycleInterface';
import { LoopInterface } from '../../core/inferface/LoopInterface';
import { UserInputEvent, UserInputEventPipe } from '../pipes/UserinputEventPipe';
import { UserInputEventEnum, WeaponAnimationEventEnum } from '../abstract/EventsEnum';
import { AnimationEventPipe, WeaponAnimationEvent } from '../pipes/AnimationEventPipe';
import { GameLogicEventPipe, WeaponEquipEvent } from '../pipes/GameLogicEventPipe';


/**
 * 物品栏系统
 */
export class InventorySystem implements CycleInterface, LoopInterface {

    weapons: Map<InventorySlotEnum, WeaponInterface> = new Map<InventorySlotEnum, WeaponInterface>(); // 武器列表,存储玩家当前所持有的所有武器
    nowEquipInventory: InventorySlotEnum = InventorySlotEnum.Hands; // 当前装备的武器
    lastEquipInventory: InventorySlotEnum = InventorySlotEnum.Malee; // 上一个装备的武器, 初始化时切换到匕首武器

    init(): void {
        this.weapons.set(InventorySlotEnum.Hands, null); // 初始化武器为空武器
        this.switchEquipment(InventorySlotEnum.Hands); // 装备武器 
        UserInputEventPipe.addEventListener(UserInputEvent.type, (e: CustomEvent) => { // 玩家按键事件影响
            switch (e.detail.enum) { // 物品栏切换
                case UserInputEventEnum.BUTTON_SWITCH_PRIMARY_WEAPON: // 主武器
                    this.switchEquipment(InventorySlotEnum.Primary);
                    break;
                case UserInputEventEnum.BUTTON_SWITCH_SECONDARY_WEAPON: // 副武器
                    this.switchEquipment(InventorySlotEnum.Secondary);
                    break;
                case UserInputEventEnum.BUTTON_SWITCH_MALEE_WEAPON: // 匕首
                    this.switchEquipment(InventorySlotEnum.Malee);
                    break;
                case UserInputEventEnum.BUTTON_SWITCH_LAST_WEAPON: // 上一次装备武器
                    this.switchEquipment(this.lastEquipInventory);
                    break;
            }
        });
    }

    callEveryFrame(deltaTime?: number, elapsedTime?: number): void {
        // 准星恢复 必须和callEveryFrame分开计算 因为切枪后也会准星恢复
        this.weapons.forEach(weapon => { if (weapon && weapon.recover) weapon.recover(deltaTime, elapsedTime) });

        const nowEquipWeapon = this.weapons.get(this.nowEquipInventory);
        if (!nowEquipWeapon) return; // 如果当前没有装备任何武器那么就退出循环方法
        if (nowEquipWeapon.callEveryFrame) nowEquipWeapon.callEveryFrame(deltaTime, elapsedTime); // 当前装备的武器激活帧计算方法
    }

    /**
     * 切换到目标武器
     * @param inventory 目标武器栏位
     */
    switchEquipment(targetInventory: InventorySlotEnum) {
        const nowEquipInventory = this.nowEquipInventory;
        if (nowEquipInventory !== targetInventory) { // 目前装备武器不和切换目标武器一样才执行动作
            // 发出解除旧武器的事件
            WeaponAnimationEvent.detail.enum = WeaponAnimationEventEnum.RELIEVE_EQUIP;
            if (this.weapons.get(nowEquipInventory)) WeaponAnimationEvent.detail.weaponInstance = this.weapons.get(nowEquipInventory);
            AnimationEventPipe.dispatchEvent(WeaponAnimationEvent);

            // 发出装备新武器的事件
            WeaponAnimationEvent.detail.enum = WeaponAnimationEventEnum.EQUIP;
            if (this.weapons.get(targetInventory)) WeaponAnimationEvent.detail.weaponInstance = this.weapons.get(targetInventory);
            AnimationEventPipe.dispatchEvent(WeaponAnimationEvent); // 武器系统层

            WeaponEquipEvent.detail.weaponInstance = this.weapons.get(targetInventory);
            GameLogicEventPipe.dispatchEvent(WeaponEquipEvent); // 渲染层

            this.nowEquipInventory = targetInventory;
            this.lastEquipInventory = nowEquipInventory;
        }
    }

    /** 
     * 从地面捡起武器 
     */
    pickUpWeapon(weaponInstance: WeaponInterface) {
        const belongInventory = mapIventorySlotByWeaponClassficationEnum(weaponInstance.weaponClassificationEnum); // 判断武器应该属于哪个槽位
        if (!this.weapons.get(belongInventory)) this.weapons.set(belongInventory, weaponInstance); // 如果当前武器栏位为空, 那么就将武器捡起
    }

}