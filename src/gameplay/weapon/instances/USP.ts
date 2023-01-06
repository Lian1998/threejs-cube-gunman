import { GameContext } from '@src/core/GameContext';
import { dealWithWeaponTexture } from '@src/core/lib/threejs_common';
import { WeaponClassificationEnum } from '@src/gameplay/abstract/WeaponClassificationEnum';
import { SemiAutomaticWeapon } from '../abstract/SemiAutomaticWeapon';
import { DoubleSide, MeshBasicMaterial, Vector3 } from 'three';

export class USP extends SemiAutomaticWeapon {

    muzzlePosition: THREE.Vector3 = new Vector3(0.887, 1.079, 0.494);
    chamberPosition: THREE.Vector3 = new Vector3(0.109, 1.101, 0.579);

    constructor() {
        super();
        const skinnedMesh = GameContext.GameResources.resourceMap.get('USP_1');
        const texture = GameContext.GameResources.textureLoader.load('/weapons/weapon.USP.jpg');
        dealWithWeaponTexture(texture);
        const material = new MeshBasicMaterial({ map: texture, side: DoubleSide });
        (skinnedMesh as THREE.SkinnedMesh).material = material;

        this.weaponClassificationEnum = WeaponClassificationEnum.Pistol;
        this.weaponName = 'USP';
        this.magazineSize = 12;
        this.fireRate = 0.17;
        this.recoverTime = 0.34;
        this.reloadTime = 2.;
        this.recoilControl = 5;
        this.accurateRange = 120;

        this.bulletLeftMagzine = this.magazineSize;

        this.init();
        this.initAnimation();

    }

}