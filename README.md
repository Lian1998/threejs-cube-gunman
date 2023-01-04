# 项目简介
使用vite作为构建工具, typescript 和 threejs作为渲染库 在浏览器端制作webgl3d射击游戏案例;
该项目是我在系统学习了图形学和threejs这一库后进行的小练习;

可供学习/参考的点:
1. 使用typescript封装游戏级别的代码框架
   1. 系统拆分/封装: 武器系统(全自动/半自动/匕首), 物品栏系统, 运动系统
   2. javascript打包module作为容器的思想
   3. 特效/渲染层(./src/viewlayers/*)实现思路
2. 前端复杂文件架构/打包架构的参考(需要对打包工具的掌握)
3. threejs vbo 特效代码风格, 以及各个特效实现参考
4. blender 场景烘焙/动画制作

目前添加的视觉/特效效果:
1. 弹壳弹出淡出特效
2. 开枪场景烟雾
3. 枪口闪光特效
4. 弹孔弹坑特效
5. 弹孔打击闪光特效
6. 弹孔打击烟尘特效

目前导出武器:
1. 主武器: AK47
2. 副武器: USP
3. 匕首: M9

blender武器导出动画轨道名插槽(代码自动读取动画):
1. `<weaponName>_equip` 武器装备动画
1. `<weaponName>_reload` 武器装填弹药动画
1. `<weaponName>_fire` 武器开火动画
1. `<weaponName>_hold` 武器握持动画
1. `<weaponName>_view` 武器检阅动画

资源白嫖:
1. 网易Buff商城(枪模型, 贴图) https://buff.163.com/
2. 我的世界皮肤站(同uv角色皮) http://skin.minecraftxz.com/
3. 弹道图: 上csgo中文网查看弹道gif使用画图工具手动统计x, y坐标获取每个弹道位点信息
   1. 使用时添加一些程序噪音即可

# 在线体验链接
我的服务器可能会随时挂, 且看且珍惜!
http://101.34.53.23/projects/fps-game-website/index.html

操作说明:
wasd移动, 123q切换武器, 左键开枪, r换弹

# 待实现/难点
待实现:
1. 人物的俯视仰视转身, 视角操控骨骼
2. 人物移动动画混合

难点:
1. 高效的场景检测碰撞(几种算法), 我用了已经实现的octree
2. decal贴花
3. 网络同步/延迟算法(玩家和玩家之间的碰撞)
4. 布娃娃
5. 怎么在threejs中更好的渲染文字

# 其他优质资源/参考
1. 通过threejs封装的人工智能, 作者也是threejs的作者之一 https://github.com/Mugen87/yuka
2. 取骨骼与customer操作互动 https://codepen.io/kylewetton/pen/WNNeyWJ?editors=0010
3. websocket案例与vite的websocket插件 https://gitee.com/lian_1998
4. krunker在steam上线了的webgl设计游戏 https://krunker.io/