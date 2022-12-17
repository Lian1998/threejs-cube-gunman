uniform float uOpacity;
uniform float uExitTime;
uniform float uFadeTime;// 渐变消失时间
uniform sampler2D uBulletHoleT;

varying float vElapsed;// 传递弹点生成时间
varying float vRand;// [.5,1.]

void main()
{
    
    float fadeMask=step(uExitTime,vElapsed);// 开始渐变消失为1
    fadeMask*=(vElapsed-uExitTime)/uFadeTime;
    
    // 性能优化
    
    if(uOpacity-fadeMask<0.){
        discard;
    }
    
    // 利用随机数显示4种弹孔其中的一种
    
    vec2 pointCoord=gl_PointCoord/2.;
    pointCoord.x+=.5;
    pointCoord.y+=.5;
    float index=floor(vRand/.125);// [4, 8]
    if(index==4.){
        pointCoord.x-=.5;
        pointCoord.y-=.5;
    }else if(index==5.){
        pointCoord.y-=.5;
    }else if(index==6.){
        pointCoord.x-=.5;
    }
    vec4 temp=texture2D(uBulletHoleT,pointCoord);
    
    // gl_FragColor=vec4(vec3(0.),uOpacity-fadeMask);
    gl_FragColor=vec4(temp.rgb,(uOpacity-fadeMask)*temp.a);
    
}