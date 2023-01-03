// 该文件定义threejs相关通用函数

import {
    AddEquation, CustomBlending, FrontSide, LinearFilter, Material,
    Mesh, MeshBasicMaterial, NearestFilter, OneMinusSrcAlphaFactor,
    SrcAlphaFactor, sRGBEncoding, Texture
} from 'three';

/**
 * 
 * 如果mesh的材质使用blender烘焙出的纹素作为顶点颜色, 使用这个函数处理
 * 1. 设置贴图的编码为SRGB
 * 2. 关闭flipY
 * 
 * @param mesh 网格体
 * @param texture 贴图
 */
export const dealWithBakedTexture = (mesh: Mesh, texture: Texture) => {
    texture.encoding = sRGBEncoding;
    texture.flipY = false;
    const mtl = new MeshBasicMaterial({ map: texture });
    mesh.material = mtl;
}

/**
 * 对某网格实例(包括其孩子)开启8x各向异性
 * @param mesh  网格体
 */
export const anisotropy8x = (mesh: Mesh) => {
    mesh.traverse((child: Mesh) => { // 遍历
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const _material = child.material as MeshBasicMaterial;
            if (_material.map) _material.map.anisotropy = 8;// 材质开启采样(8x各向异性)
        }
    });
}

/**
 * 处理MineCraft风格的角色贴图
 * 1. NearestFilter mag, minFilter 取色使用最近像素点原则
 * 2. 使用SRGBencoding
 * 3. 关闭flipY
 * @param texture 贴图
 */
export const dealWithRoleTexture = (texture: Texture) => {
    texture.generateMipmaps = false; // 不需要在显存中生成mipmap
    texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;
    texture.encoding = sRGBEncoding; // srgb编码
    texture.flipY = false; // 不需要颠倒贴图
}


/**
 * 处理MineCraft风格的角色材质
 * 
 * 1. 渲染两面
 * 2. alpha测试
 * 3. 颜色混合模式
 * 
 * @param material 材质
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
 * 处理武器贴图
 * 1. LinearFilter mag, minFilter 取色使用线性取色原则
 * 2. 使用SRGBencoding
 * 3. 关闭flipY
 * @param texture 贴图
 */
export const dealWithWeaponTexture = (texture: Texture) => {
    texture.generateMipmaps = true;
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearFilter;
    texture.encoding = sRGBEncoding;
    texture.flipY = false;
}