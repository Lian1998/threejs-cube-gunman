uniform float uSize;
uniform float uThinkness;
uniform float uGap;
uniform float uAspect;

mat4 scale(float x,float y,float z)
{
    return mat4(
        x,0,0,0,
        0,y,0,0,
        0,0,z,0,
        0,0,0,1
    );
}

mat4 translate(float x,float y,float z)
{
    return mat4(
        1,0,0,0,
        0,1,0,0,
        0,0,1,0,
        x,y,z,1
    );
}

mat4 makeRotationZ(float angle)
{
    return mat4(
        cos(angle),-sin(angle),0,0,
        sin(angle),cos(angle),0,0,
        0,0,1,0,
        0,0,0,1
    );
}

void main(){
    
    float PI=3.141592653589793;
    
    mat4 withoutAspect=scale(1./uAspect,uAspect,1.);// 缩放y轴, 去除浏览器aspect影响
    mat4 thinknessAndSize=scale(uThinkness,uSize,1.);// 应用长短粗细
    mat4 crossLeft=makeRotationZ(PI/2.);// 左转90
    mat4 crossIndex=translate(uSize/2.,0.,0.);// 向右平移1个准星长度
    mat4 crossGap=translate(uGap,0.,0.);// gap变换
    
    // projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); // 由于使用了正交相机因此不用mvp
    gl_Position=withoutAspect*crossGap*crossIndex*crossLeft*thinknessAndSize*vec4(position,1.);
    
}