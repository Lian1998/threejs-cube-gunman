
/**
 * 指针锁定事件
 */
export enum PointLockEventEnum {
    LOCK,
    UNLOCK,
    MOUSEMOVE,
};


/**
 * 游戏输入按键事件
 */
export enum UserInputEventEnum {

    BUTTON_SWITCH_PRIMARY_WEAPON, // 切换至主武器
    BUTTON_SWITCH_SECONDARY_WEAPON, // 切换至副武器
    BUTTON_SWITCH_MALEE_WEAPON, // 切换至匕首
    BUTTON_SWITCH_LAST_WEAPON, // 切换至一次装备物品
    BUTTON_RELOAD, // 换弹
    BUTTON_TRIGGLE_DOWN, // 扣下扳机
    BUTTON_TRIGGLE_UP, // 抬起扳机

    JUMP, // 跳跃
    MOVE_FORWARD_DOWN, // 向前移动
    MOVE_BACKWARD_DOWN, // 向后移动
    MOVE_LEFT_DOWN, // 向左移动 
    MOVE_RIGHT_DOWN, // 向右移动
    MOVE_FORWARD_UP,
    MOVE_BACKWARD_UP,
    MOVE_LEFT_UP,
    MOVE_RIGHT_UP,
}


/**
 * 武器动画事件
 */
export enum WeaponAnimationEventEnum {
    HOLD, // 握持
    EQUIP, // 装备
    RELIEVE_EQUIP, // 丢弃
    FIRE, // 开火
    RELOAD, // 换弹
    PICKUP, // 捡起
}