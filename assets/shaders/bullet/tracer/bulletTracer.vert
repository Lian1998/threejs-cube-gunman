attribute vec3 diappearPosition;
attribute float generTime;
attribute float rand;

uniform float uTime;
uniform float uBulletTracerFaded;

varying float vElapsed;

void main(){
    
    float elapsed=uTime-generTime;
    vElapsed=elapsed;
    
    float uBulletTracerFaded1=rand*uBulletTracerFaded;
    
    float lamp=smoothstep(uBulletTracerFaded1,0.,elapsed);
    vec3 positionTrans=lamp*position+(1.-lamp)*diappearPosition;// 计算当前子弹的位置
    
    gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(positionTrans,1.);
    gl_PointSize=40.;
    
    vec4 viewPosition=viewMatrix*vec4(positionTrans,1.);
    gl_PointSize*=(1./-viewPosition.z);// 点大小受到距离远近影响
    
}