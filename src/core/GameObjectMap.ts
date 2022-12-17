import { LevelMirage } from '../gameplay/levels/LevelMirage';
import { LocalPlayer } from '../gameplay/player/LocalPlayer';
import { DOMLayer } from '../viewlayers/DomLayer';
import { GLViewportLayer } from '../viewlayers/GLViewportLayer';
import { BulletHoleAshLayer } from '../viewlayers/scene/BulletHoleAshLayer';
import { BulletHoleFlashLayer } from '../viewlayers/scene/BulletHoleFlashLayer';
import { BulletHoleLayer } from '../viewlayers/scene/BulletHoleLayer';
import { SkyLayer } from '../viewlayers/SkyLayer';
import { CrosshairLayer } from '../viewlayers/ui/CrosshairLayer';
import { HandModelLayer } from '../viewlayers/ui/HandModelLayer';
import { ChamberBulletShell } from '../viewlayers/weapon/ChamberBulletShellLayer';
import { ChamberSmokeLayer } from '../viewlayers/weapon/ChamberSmokeLayer';
import { MuzzleFlashLayer } from '../viewlayers/weapon/MuzzleFlashLayer';
import { CycleInterface } from './inferface/CycleInterface';
import { LoopInterface } from './inferface/LoopInterface';

const GameObjects: Array<LoopInterface | CycleInterface> = [
    new DOMLayer(), // DOM层
    new SkyLayer(), // 天空盒
    new HandModelLayer(), // 手模
    new CrosshairLayer(), // 准星
    new BulletHoleLayer(), // 弹孔
    new BulletHoleFlashLayer(), // 单孔闪光
    new BulletHoleAshLayer(), // 单孔尘
    new ChamberBulletShell(), // 弹舱弹壳
    new ChamberSmokeLayer(), // 弹舱烟雾
    new MuzzleFlashLayer(), // 枪口闪光
    new GLViewportLayer(), // WEBGL渲染层
    new LevelMirage(),
    LocalPlayer.getInstance(),
];

/** 游戏封装类型对象 */
export const GameObjectsMap = new Map<string, LoopInterface | CycleInterface>();
GameObjects.forEach(item => { GameObjectsMap.set(item.constructor.name, item); })