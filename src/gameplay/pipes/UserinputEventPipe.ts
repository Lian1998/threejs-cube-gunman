import { DomPipe } from '@src/core/DOMPipe';
import { UserInputEventEnum } from '../abstract/EventsEnum';

/**
 * 记录所有用户输入操作的事件
 */
export const UserInputEventPipe = new DomPipe();

/**
 * 用户输入事件
 */
export const UserInputEvent = new CustomEvent<{ enum: UserInputEventEnum }>('input', {
    detail: { enum: undefined }
});
