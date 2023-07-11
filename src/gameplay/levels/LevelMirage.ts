

import { Octree } from 'three/examples/jsm/math/Octree';
import { GameContext } from '@src/core/GameContext';
import { anisotropy8x, dealWithBakedTexture } from '@src/core/lib/threejs_common';
import { GameObjectMaterialEnum } from '../abstract/GameObjectMaterialEnum';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { CycleInterface } from '@src/core/inferface/CycleInterface';


class LevelMirage implements CycleInterface {

    init() {

        const boardScene = GameContext.Scenes.Level;

        // 地图生成物理octree
        const octTree: Octree = new Octree();
        GameContext.Physical.WorldOCTree = octTree;
        const gltf = GameContext.GameResources.resourceMap.get('Map') as GLTF;
        const boardMesh = gltf.scene.children[0]; // 需要渲染的网格
        const physicsMesh = gltf.scene; // 需要计算物理信息的场景
        octTree.fromGraphNode(physicsMesh); // 将物理信息加载到内存中

        let bakedTextureUrl = '/levels/t.mirage.baked.75.jpg';
        if (import.meta.env.MODE === 'giteepage') {
            bakedTextureUrl = 'https://lian_1998.gitee.io/cube_gunman/levels/t.mirage.baked.75.jpg'
        }
        // 地图材质处理
        const bakedTexture = GameContext.GameResources.textureLoader.load(bakedTextureUrl);
        dealWithBakedTexture(boardMesh as THREE.Mesh, bakedTexture); // 使用工具给渲染网格绑定材质
        anisotropy8x(boardMesh as THREE.Mesh);

        // 绑定游戏逻辑材质
        boardMesh.userData['GameObjectMaterialEnum'] = GameObjectMaterialEnum.GrassGround;
        boardScene.add(boardMesh);
    }

}

export { LevelMirage }