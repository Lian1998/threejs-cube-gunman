


1. animationClip loader读取的就是片段
2. animationMixer(rootObject: Object3D) 读取骨骼生成一个混合器

# AnimationClip
动画片段


# AnimationMixer
mixer与object3D 1:1; mixer参与循环`mixer.update()`;

.constructor AnimationMixer(rootObject: Object3D) 读取一个Object3D(骨骼)生成一个动画混合器
`AnimationObjectGroup` 可以作为AnimationMixer构造器中rootObject的参数

.clipAction(clip: AnimationClip, optionalRoot: Object3D)


# AnimationAction
AnimationAction是由mixer将动画片段应用到场景某个实例后生成的一段动画对象, 动画对象提供了一系列API
来操控动画片段在这一对象上的应用

const animationAction = mixer.clipAction(clip1, object1);
animationAction.play();
