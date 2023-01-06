import { GameContext } from '@src/core/GameContext';
import { dealWithWeaponTexture } from '@src/core/lib/threejs_common';
import { DoubleSide, MeshBasicMaterial } from 'three';
import { DaggerWeapon } from '../abstract/DaggerWeapon';

export class M9 extends DaggerWeapon {

    constructor() {
        super();

        const skinnedMesh = GameContext.GameResources.resourceMap.get('M9_1') as THREE.SkinnedMesh;
        const texture = GameContext.GameResources.textureLoader.load('/weapons/weapon.M9.jpg');
        dealWithWeaponTexture(texture);
        const material = new MeshBasicMaterial({ map: texture, side: DoubleSide });
        skinnedMesh.material = material;

        this.weaponName = 'M9';
        this.initAnimation();
    }

}