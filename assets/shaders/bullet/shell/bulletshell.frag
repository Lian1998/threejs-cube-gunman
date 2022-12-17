
uniform sampler2D uBulletShellT;
uniform float uDisapperTime;

varying float vElapsed;
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

float pcurve(float x,float a,float b)
{
    float k=pow(a+b,a+b)/(pow(a,a)*pow(b,b));
    return k*pow(x,a)*pow(1.-x,b);
}

void main(){
    
    if(uDisapperTime>.4){
        discard;
    }
    
    // 旋转
    float rotateRandomFactor=pcurve(vElapsed/uDisapperTime,vRand,vElapsed);
    vec4 randRotate=makeRotationZ(vRand*3.1415926+rotateRandomFactor)*vec4(gl_PointCoord-vec2(.5),0.,1.);// gl.POINTS, (left,top):(0,0) (right, bottom): (1, 1)
    vec4 colorFromT=texture2D(uBulletShellT,randRotate.xy+vec2(.5));// matrix 是用(0, 0)点做中心点进行旋转的
    
    // 不旋转
    // vec4 temp=texture2D(uBulletShellT,gl_PointCoord);
    
    gl_FragColor=colorFromT;
    
}