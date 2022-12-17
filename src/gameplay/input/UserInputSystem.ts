import { UserInputEventEnum } from '../abstract/EventsEnum';
import { UserInputEventPipe, UserInputEvent, } from '../pipes/UserinputEventPipe';

/** 
 * 处理玩家输入按键映射的控制器
 */
export class UserInputSystem {

    constructor() {
        this.browserEnviromentDefaultBinding();
    }

    /**
     * 浏览器环境下默认的按键绑定
     */
    browserEnviromentDefaultBinding() {
        // 鼠标事件
        document.addEventListener('mousedown', (e: MouseEvent) => {
            if (e.button === 0) { // 鼠标左键绑定开火状态
                UserInputEvent.detail.enum = UserInputEventEnum.BUTTON_TRIGGLE_DOWN;
                UserInputEventPipe.dispatchEvent(UserInputEvent);
            }
        })
        document.addEventListener('mouseup', (e: MouseEvent) => {
            if (e.button === 0) { // 鼠标左键绑定开火状态
                UserInputEvent.detail.enum = UserInputEventEnum.BUTTON_TRIGGLE_UP;
                UserInputEventPipe.dispatchEvent(UserInputEvent);
            }
        })

        // 键盘事件
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            switch (e.code) {
                case 'KeyR': // 换子弹
                    UserInputEvent.detail.enum = UserInputEventEnum.BUTTON_RELOAD;
                    UserInputEventPipe.dispatchEvent(UserInputEvent);
                    break;

                case 'Digit1': // 物品切换
                    UserInputEvent.detail.enum = UserInputEventEnum.BUTTON_SWITCH_PRIMARY_WEAPON;
                    UserInputEventPipe.dispatchEvent(UserInputEvent);
                    break;
                case 'Digit2':
                    UserInputEvent.detail.enum = UserInputEventEnum.BUTTON_SWITCH_SECONDARY_WEAPON;
                    UserInputEventPipe.dispatchEvent(UserInputEvent);
                    break;
                case 'Digit3':
                    UserInputEvent.detail.enum = UserInputEventEnum.BUTTON_SWITCH_MALEE_WEAPON;
                    UserInputEventPipe.dispatchEvent(UserInputEvent);
                    break;
                case 'KeyQ':
                    UserInputEvent.detail.enum = UserInputEventEnum.BUTTON_SWITCH_LAST_WEAPON;
                    UserInputEventPipe.dispatchEvent(UserInputEvent);
                    break;

                case 'KeyW': // 玩家移动
                    UserInputEvent.detail.enum = UserInputEventEnum.MOVE_FORWARD_DOWN;
                    UserInputEventPipe.dispatchEvent(UserInputEvent);
                    break;
                case 'KeyA':
                    UserInputEvent.detail.enum = UserInputEventEnum.MOVE_LEFT_DOWN;
                    UserInputEventPipe.dispatchEvent(UserInputEvent);
                    break;
                case 'KeyS':
                    UserInputEvent.detail.enum = UserInputEventEnum.MOVE_BACKWARD_DOWN;
                    UserInputEventPipe.dispatchEvent(UserInputEvent);
                    break;
                case 'KeyD':
                    UserInputEvent.detail.enum = UserInputEventEnum.MOVE_RIGHT_DOWN;
                    UserInputEventPipe.dispatchEvent(UserInputEvent);
                    break;
                case 'Space': // 跳跃
                    UserInputEvent.detail.enum = UserInputEventEnum.JUMP;
                    UserInputEventPipe.dispatchEvent(UserInputEvent);
                    break;

            }

        })
        document.addEventListener('keyup', (e: KeyboardEvent) => {
            switch (e.code) {
                case 'KeyW':
                    UserInputEvent.detail.enum = UserInputEventEnum.MOVE_FORWARD_UP;
                    UserInputEventPipe.dispatchEvent(UserInputEvent);
                    break;
                case 'KeyA':
                    UserInputEvent.detail.enum = UserInputEventEnum.MOVE_LEFT_UP;
                    UserInputEventPipe.dispatchEvent(UserInputEvent);
                    break;
                case 'KeyS':
                    UserInputEvent.detail.enum = UserInputEventEnum.MOVE_BACKWARD_UP;
                    UserInputEventPipe.dispatchEvent(UserInputEvent);
                    break;
                case 'KeyD':
                    UserInputEvent.detail.enum = UserInputEventEnum.MOVE_RIGHT_UP;
                    UserInputEventPipe.dispatchEvent(UserInputEvent);
                    break;
            }
        })
    }

}