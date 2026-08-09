precision highp float;

uniform float uTime;
uniform float uPixelRatio;
uniform float uPointSize;

varying float vDepth;

void main() {

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    vDepth = -mvPosition.z;

    gl_PointSize = clamp(
        uPointSize * uPixelRatio * (220.0 / max(vDepth, 0.1)),
        1.0,
        6.5
    );

    gl_Position = projectionMatrix * mvPosition;
}