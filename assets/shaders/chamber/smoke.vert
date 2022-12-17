uniform float uTime;
uniform float uSpeed;

attribute float generTime;
attribute float rand;
attribute vec3 direction;

varying float vElapsed;
varying float vRand;

vec3 upperDirection=vec3(0,1,0);

float almostIdentity(float x,float n)
{
    return sqrt(x*x+n);
}

void main(){
    
    // 传递变量
    
    float elapsed=uTime-generTime;
    vElapsed=elapsed;
    vRand=rand;
    
    // 计算位置(烟雾处于运动状态)
    
    vec3 position1=position;
    position1+=direction*uSpeed*elapsed;// S = v*t
    position1+=upperDirection*elapsed*(rand*.3+.1);
    
    gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position1,1.);
    
    gl_PointSize=512.;// 烟雾基础大小
    gl_PointSize*=.3*rand+.7;// 烟雾大小需要添加一些随机值看上去更加真实
    gl_PointSize*=almostIdentity(elapsed,1.);// 烟雾扩散(增大点大小)
    vec4 positionViewCoord=viewMatrix*modelMatrix*vec4(position1,1.);
    gl_PointSize*=(1./-positionViewCoord.z);// 点大小受到距离远近影响
    
}