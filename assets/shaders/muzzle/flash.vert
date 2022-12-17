attribute float rand;

uniform float uScale;

varying float vRand;

void main(){
    
    vRand=rand;
    
    gl_PointSize=200.;// basic
    gl_PointSize*=uScale;// 自定义大小
    
    gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.);
}