uniform float uOpacity;
uniform float uExitTime;
uniform float uFadeTime;// 渐变消失时间
uniform sampler2D uAshT;

varying float vElapsed;// 传递弹点生成时间
varying float vRand;

mat4 makeRotationZ(float theta)
{
    return mat4(
        cos(theta),-sin(theta),0,0,
        sin(theta),cos(theta),0,0,
        0,0,1,0,
        0,0,0,1
    );
}

void main()
{
    float fadeMask=step(uExitTime,vElapsed);// 开始渐变消失为1
    fadeMask*=(vElapsed-uExitTime)/uFadeTime;
    
    if(uOpacity-fadeMask<0.){// 提升一下性能
        discard;
    }
    
    vec4 randRotate=makeRotationZ(vRand*3.14)*vec4(gl_PointCoord-vec2(.5),0.,1.);// gl.POINTS, (left,top):(0,0) (right, bottom): (1, 1)
    vec4 colorFromT=texture2D(uAshT,randRotate.xy+vec2(.5));// matrix 是用(0, 0)点做中心点进行旋转的
    
    gl_FragColor=vec4(colorFromT.rgb,colorFromT.a*(uOpacity-fadeMask)*vRand);
}