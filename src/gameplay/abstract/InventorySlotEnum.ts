import { WeaponClassificationEnum } from './WeaponClassificationEnum';

/**
 * 物品栏类型
 */
export enum InventorySlotEnum {
    Hands, // 空手
    Primary, // 主武器
    Secondary, // 副武器
    Malee, // 匕首
}


/**
 * 判断对应的武器分类类型属于的武器槽位
 * @param weaponClassificationEnum : 武器分类类型
 * @returns :Inventory 武器槽位
 */
export function mapIventorySlotByWeaponClassficationEnum(weaponClassificationEnum: WeaponClassificationEnum): InventorySlotEnum {
    switch (weaponClassificationEnum) {
        case WeaponClassificationEnum.Rifle:
            return InventorySlotEnum.Primary;
        case WeaponClassificationEnum.SniperRifle:
            return InventorySlotEnum.Primary;
        case WeaponClassificationEnum.Pistol:
            return InventorySlotEnum.Secondary;
        case WeaponClassificationEnum.Malee:
            return InventorySlotEnum.Malee;
        case WeaponClassificationEnum.SMG:
            return InventorySlotEnum.Primary;
        case WeaponClassificationEnum.Shotgun:
            return InventorySlotEnum.Primary;
        case WeaponClassificationEnum.Machinegun:
            return InventorySlotEnum.Primary;
    }
}