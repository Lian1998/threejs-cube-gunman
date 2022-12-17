
uniform float uBulletTracerFaded;
varying float vElapsed;

void main() {

    if (vElapsed >= uBulletTracerFaded) discard;

    float circleMask = step(distance(gl_PointCoord, vec2(.5,.5)), .5);

    gl_FragColor = vec4(1.) * circleMask;

}