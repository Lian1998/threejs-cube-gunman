attribute float rand;// 给弹孔随机大小
attribute float generTime;

uniform float uTime;// 当前时间
uniform float uScale;// 弹孔大小

varying float vRand;
varying float elapsed;// 传递弹点存在时间

void main()
{
    
    vRand=rand;
    elapsed=uTime-generTime;// 已经存在时间
    
    // 计算弹孔点的位置
    vec3 position1=position;
    position1+=normalize(cameraPosition-position)*.05;//朝着相机方向移动(基础)
    position1+=normal*.05;// 朝着命中的面的法线方向移动
    gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position1,1.);// 点位置
    
    // 计算弹孔点的大小
    
    gl_PointSize=32.;// 弹孔默认大小
    gl_PointSize+=(48.*rand);// 弹孔默认大小受到随机值影响后的值
    gl_PointSize*=uScale;// 点大小受到uniform自定义值影响
    vec4 viewPosition=viewMatrix*vec4(position1,1.);
    gl_PointSize*=(1./-viewPosition.z);// 点大小受到距离远近影响
    
}