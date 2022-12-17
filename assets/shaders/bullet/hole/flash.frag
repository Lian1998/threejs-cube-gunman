uniform float uOpacity;
uniform float uFlashTime;//闪烁时间
uniform sampler2D uFlashT;

varying float vRand;
varying float elapsed;// 传递弹点存在时间

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
    
    float fadeMask=step(elapsed,uFlashTime);
    
    if(fadeMask<1.){
        discard;
    }
    
    vec4 randRotate=makeRotationZ(vRand*3.14)*vec4(gl_PointCoord-vec2(.5),0.,1.);
    vec4 colorFromT=texture2D(uFlashT,randRotate.xy+vec2(.5));
    
    gl_FragColor=vec4(colorFromT.rgb,fadeMask*uOpacity*colorFromT.a);
    
}