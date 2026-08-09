precision highp float;

uniform vec3 uColor;
uniform float uOpacity;

varying float vDepth;

void main() {

    vec2 uv = gl_PointCoord - vec2(0.5);

    float d = length(uv);

    // Scarta i pixel fuori dal cerchio
    if (d > 0.5) {
        discard;
    }

    // Glow morbido
    float alpha = smoothstep(0.5, 0.0, d);

    gl_FragColor = vec4(
        uColor,
        alpha * uOpacity
    );
}