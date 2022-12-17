attribute float rand;// 给弹孔随机大小 0.5 ~ 1
attribute float generTime;

uniform float uExitTime;
uniform float uFadeTime;// 渐变消失时间
uniform float uTime;// 当前时间
uniform float uScale;// 弹孔大小

varying float vElapsed;// 传递弹点生成时间
varying float vRand;

vec3 upperDirection=vec3(0.,1.,0.);

void main()
{
    
    vRand=rand;
    
    // 计算弹孔点的位置(基础位置)
    
    vec3 pointPosition=position;
    pointPosition+=normalize(cameraPosition-position)*.01;//朝着相机方向移动(基础)
    pointPosition+=normal*.2;// 灰尘会朝着命中的面的法线方向移动
    pointPosition+=upperDirection*.1;
    
    // 计算弹孔点的大小
    
    float pointSize=32.;// 弹孔默认大小
    pointSize+=64.*rand;// 弹孔默认大小受到随机值影响后的值
    pointSize*=uScale;// 点大小受到uniform自定义值影响
    
    float elapsed=uTime-generTime;// 已经存在时间
    vElapsed=elapsed;
    float disapperTime=uExitTime+uFadeTime;// 消失总时间
    
    pointPosition+=(1.*normal+.5*upperDirection)*elapsed;// S=v*t
    pointSize*=.25+elapsed/disapperTime*.2;
    
    // 点位置
    
    gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(pointPosition,1.);
    
    // 点大小
    
    gl_PointSize=pointSize;
    vec4 viewPosition=viewMatrix*vec4(pointPosition,1.);
    gl_PointSize*=(1./-viewPosition.z);// 点大小受到距离远近影响
    
}