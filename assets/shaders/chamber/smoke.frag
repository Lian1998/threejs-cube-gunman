
uniform sampler2D uSmokeT;
uniform float uOpacityFactor;

uniform float uDisappearTime;
uniform float uFadeTime;

varying float vElapsed;
varying float vRand;

// 我感觉该函数作为淡入淡出的函数非常不错
float pcurve(float x,float a,float b)
{
    float k=pow(a+b,a+b)/(pow(a,a)*pow(b,b));
    return k*pow(x,a)*pow(1.-x,b);
}

mat4 makeRotationZ(float theta)
{
    return mat4(
        cos(theta),-sin(theta),0,0,
        sin(theta),cos(theta),0,0,
        0,0,1,0,
        0,0,0,1
    );
}

void main(){
    
    // shader优化
    
    if(vElapsed>uDisappearTime+uFadeTime){discard;}
    
    vec4 temp=vec4(1.);
    
    // 旋转后取出贴图基本色
    
    vec2 pointCoord=gl_PointCoord;
    pointCoord=pointCoord-vec2(.5);
    vec4 randRotate=makeRotationZ(vRand*3.14)*vec4(pointCoord,0.,1.);
    vec4 colorFromT=texture2D(uSmokeT,randRotate.xy+vec2(.5));
    temp=colorFromT;
    
    // 淡入淡出
    
    float fadeFactor=pcurve(vElapsed,uDisappearTime,uFadeTime);
    
    gl_FragColor=vec4(temp.rgb,temp.a*uOpacityFactor*fadeFactor);
    // gl_FragColor=vec4(vec3(1.),fadeFactor);
    
}