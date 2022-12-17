import { AddEquation, CustomBlending, FrontSide, LinearFilter, Material, Mesh, MeshBasicMaterial, NearestFilter, OneMinusSrcAlphaFactor, SrcAlphaFactor, sRGBEncoding, Texture } from 'three';

/**
 * changeEncoding & flipY
 * 使用Blender做场景并导出时需要将贴图的编码转化成SRGB
 * 并且材质在导入到显卡buffer时不需要翻转图片
 * 
 * @param mesh 网格体
 * @param texture 材质图片
 */
export const dealWithBakedTexture = (mesh: Mesh, texture: Texture) => {
    texture.encoding = sRGBEncoding;
    texture.flipY = false;

    const mtl = new MeshBasicMaterial({ map: texture });
    mesh.material = mtl;
}

/**
 * 对某网格实例(包括其孩子)开启8x各向异性读取贴图
 * @param mesh  网格体
 */
export const anisotropy8x = (mesh: Mesh) => {
    mesh.traverse((child: Mesh) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const _material = child.material as MeshBasicMaterial;
            if (_material.map) _material.map.anisotropy = 8;// 材质开启采样(8x各向异性)
        }
    });
}

/**
 * 处理角色材质
 * @param material 
 */
export const dealWithRoleTexture = (texture: Texture) => {
    texture.generateMipmaps = false; // 不需要在显存中生成mipmap
    texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;
    texture.encoding = sRGBEncoding; // srgb编码
    texture.flipY = false; // 不需要颠倒贴图
}


/**
 * 处理角色材质
 * @param material 
 */
export const dealWithRoleMaterial = (material: Material) => {
    material.side = FrontSide; // 渲染两面
    material.alphaTest = 1; // alpha检测, 两层材质的minecraft材质图是可以做衣服效果的
    material.blending = CustomBlending;  // 使用threeJs默认的Custom混合模式
    material.blendEquation = AddEquation; //default
    material.blendSrc = SrcAlphaFactor; //default
    material.blendDst = OneMinusSrcAlphaFactor; //default
}

/**
 * 处理武器材质
 * @param texture 
 */
export const dealWithWeaponTexture = (texture: Texture) => {
    texture.generateMipmaps = true;
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearFilter;
    texture.encoding = sRGBEncoding;
    texture.flipY = false;
}