precision highp float;

varying vec2 vUv;
varying float vTexIndex;

uniform sampler2D uTextures[16];
uniform float uTextureCount;
uniform float uSwirlStrength;

vec2 swirl(vec2 uv, float strength) {
    vec2 centered = uv - 0.5;
    float r = length(centered);
    if (r < 1e-4) return uv;

    float angle = strength * r * 3.14159;
    float s = sin(angle);
    float c = cos(angle);

    vec2 rotated = vec2(
        centered.x * c - centered.y * s,
        centered.x * s + centered.y * c
    );
    return rotated + 0.5;
}

vec4 sampleTexture(float idx, vec2 uv) {
    float wrapped = mod(idx, max(uTextureCount, 1.0));

    if (wrapped < 0.5) return texture2D(uTextures[0], uv);
    else if (wrapped < 1.5) return texture2D(uTextures[1], uv);
    else if (wrapped < 2.5) return texture2D(uTextures[2], uv);
    else if (wrapped < 3.5) return texture2D(uTextures[3], uv);
    else if (wrapped < 4.5) return texture2D(uTextures[4], uv);
    else if (wrapped < 5.5) return texture2D(uTextures[5], uv);
    else if (wrapped < 6.5) return texture2D(uTextures[6], uv);
    else if (wrapped < 7.5) return texture2D(uTextures[7], uv);
    else if (wrapped < 8.5) return texture2D(uTextures[8], uv);
    else if (wrapped < 9.5) return texture2D(uTextures[9], uv);
    else if (wrapped < 10.5) return texture2D(uTextures[10], uv);
    else if (wrapped < 11.5) return texture2D(uTextures[11], uv);
    else if (wrapped < 12.5) return texture2D(uTextures[12], uv);
    else if (wrapped < 13.5) return texture2D(uTextures[13], uv);
    else if (wrapped < 14.5) return texture2D(uTextures[14], uv);
    else return texture2D(uTextures[15], uv);
}

void main() {
    vec2 uv = swirl(vUv, uSwirlStrength);
    vec4 texColor = sampleTexture(vTexIndex, uv);
    gl_FragColor = texColor;
}
