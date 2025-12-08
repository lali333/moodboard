uniform float uTime;
uniform float uZoomFactor;

attribute vec3 spherePos;
attribute vec3 planePos;
attribute float texIndex;

varying vec2 vUv;
varying float vTexIndex;

void main() {
    vUv = uv;
    vTexIndex = texIndex;

    vec3 normal = normalize(spherePos);

    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 tangent = normalize(cross(up, normal));
    vec3 bitangent = cross(normal, tangent);

    vec3 rotatedSphere =
        position.x * tangent +
        position.y * bitangent;

    vec3 globePos = spherePos + 0.15 * sin(uTime + spherePos * 2.0);

    vec3 sphereWorld = globePos + rotatedSphere;

    vec3 rotatedBoard = position;
    vec3 boardWorld = planePos + rotatedBoard;

    vec3 worldPos = mix(sphereWorld, boardWorld, clamp(uZoomFactor, 0.0, 1.0));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
}
