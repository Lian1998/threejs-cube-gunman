
import { Object3D, AnimationMixer, TextureLoader } from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'


export const GameResources = {
    loader: new GLTFLoader(),
    textureLoader: new TextureLoader(),
    resourceMap: new Map<string, THREE.Object3D | THREE.AnimationMixer | THREE.AnimationClip | THREE.AnimationAction | GLTF>(),
}

/** 初始化所有资源 */
export const initResource = async () => {

    let handBaseUrl = '/role/base/hand_base.glb';
    let roleUrl = '/role/base/role_base.glb';
    let mapUrl = '/levels/mirage.glb';

    if (import.meta.env.MODE === 'giteepage') {
        handBaseUrl = 'https://lian_1998.gitee.io/cube_gunman/role/base/hand_base.glb';
        roleUrl = 'https://lian_1998.gitee.io/cube_gunman/role/base/role_base.glb';
        mapUrl = 'https://lian_1998.gitee.io/cube_gunman/levels/mirage.glb';
    }

    const hands = GameResources.loader.loadAsync(handBaseUrl);
    const role = GameResources.loader.loadAsync(roleUrl);
    const map = GameResources.loader.loadAsync(mapUrl);

    const [gltf1, gltf2, gltf3] = await Promise.all([hands, role, map]);

    // 手部模型
    let armature: THREE.Object3D;
    gltf1.scene.traverse((child: Object3D) => {
        if (child.name === 'Armature') {
            armature = child;
            GameResources.resourceMap.set(child.name, child);
        }
        if (child.type === "SkinnedMesh") {
            child.visible = false;
            GameResources.resourceMap.set(child.name, child);
        }
    });

    const animationMixer = new AnimationMixer(armature);
    GameResources.resourceMap.set('AnimationMixer', animationMixer);
    gltf1.animations.forEach((animationClip: THREE.AnimationClip) => { // 生成AnimationActions
        const animationAction = animationMixer.clipAction(animationClip, armature);
        GameResources.resourceMap.set(animationClip.name, animationAction);
    })

    // 人物模型
    GameResources.resourceMap.set('Role', gltf2);

    // 地图模型
    GameResources.resourceMap.set('Map', gltf3);

    Promise.resolve();
}


