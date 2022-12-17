import { WeaponClassificationEnum } from '@src/gameplay/abstract/WeaponClassificationEnum';

/** 武器接口 */
export type WeaponInterface = {

    active: boolean; // 是否处于激活状态
    lastFireTime: number; // 上一次开火时间(ms)
    bulletLeftMagzine: number; // 当前弹夹子弹剩余
    bulletLeftTotal: number; // 总子弹剩余

    weaponUUID: string; // 该武器对象的唯一标识
    weaponClassificationEnum: WeaponClassificationEnum; // 武器类型
    weaponName: string; // 武器名字
    weaponNameSuffix: string; // 武器后缀名
    magazineSize: number; // 弹夹容量
    recoverTime: number; // 弹道恢复时间
    reloadTime: number;
    speed: number; // 手持移动速度
    killaward: number; // 击杀奖励
    damage: number; // 伤害
    fireRate: number; // 射速
    recoilControl: number; // 弹道控制, 镜头表现
    accurateRange: number; // 在accurate range距离内第一发子弹必定会落到30cm内的标靶上
    armorPenetration: number; // 穿透能力

    muzzlePosition?: THREE.Vector3; // 枪口位置, 烟雾和火光
    chamberPosition?: THREE.Vector3; // 弹膛位置, 弹壳

    init?: () => void;
    callEveryFrame?: (deltaTime?: number, elapsedTime?: number) => void; // 帧计算方法只有当前装备的武器才会被呼叫
    recover?: (deltaTime?: number, elapsedTime?: number) => void;
    fire?: () => void;

}