uniform sampler2D uOpenFireT;
uniform float uTime;
uniform float uFireTime;
uniform float uFlashTime;// 出现闪光的持续时间

varying float vRand;

float expImpulse(float x,float k)
{
    float h=k*x;
    return h*exp(1.-h);
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
    
    vec4 randRotate=makeRotationZ(vRand*3.14)*vec4(gl_PointCoord-vec2(.5),0.,1.);
    vec4 colorFromT=texture2D(uOpenFireT,randRotate.xy+vec2(.5));
    
    float elapsedTime=uTime-uFireTime;
    float flashMask=step(elapsedTime,uFlashTime);
    
    gl_FragColor=vec4(colorFromT.rgb,colorFromT.a*flashMask);
    
}