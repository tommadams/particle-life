"use strict";

const VS = `#version 300 es
precision highp float;

in vec2 iPos;

out vec2 vPos;
out vec4 vCol;

uniform mat4 viewProj;
uniform ivec2 texSize;
uniform sampler2D posTex;
uniform sampler2D colTex;
uniform vec2 resolution;


void main() {
  // Compute the particle index from the hardware vertex index (6 vertices per particle).
  int particleIdx = gl_VertexID / 6;
  int vertexIdx = gl_VertexID % 6;

  // Coordinate of the particle data in the textures.
  ivec2 coord = ivec2(particleIdx % texSize.x, particleIdx / texSize.x);

  // Read particle properties.
  vec2 pos = texelFetch(posTex, coord, 0).xy;
  vec4 col = texelFetch(colTex, coord, 0);

  // Offset vertex based on which of the 6 indices of the particle this is:
  // Two triangles per particle:
  //    +-------+
  //    |     / |
  //    |   /   |
  //    | /     |
  //    +-------+
  // Arrange the triangle indices as follows:
  //    0---1
  //    | /   3
  //    2   / |
  //      4---5
  // Pack whether each vertex is left, right, top, bottom into two bit fields.
  float size = 8.0;
  vec2 ofs = vec2(
    ((0x2a >> vertexIdx) & 1) != 0 ? size : -size,
    ((0x34 >> vertexIdx) & 1) != 0 ? size : -size);

  vec2 vertexPos = (viewProj * vec4(pos + ofs, 0, 1)).xy;
  vec2 particlePos = (viewProj * vec4(pos, 0, 1)).xy;

  vPos = 0.5 * resolution * (vertexPos - particlePos);

  gl_Position = vec4(vertexPos, 0, 1);
  vCol = col;
}
`;

const PS = `#version 300 es
precision highp float;

in vec2 vPos;
in vec4 vCol;

out vec4 oCol;

void main() {
  float dis = length(vPos);
  oCol = vCol;
  oCol.w *= 1.0 - smoothstep(6.0, 8.0, dis);
  oCol.xyz = pow(oCol.xyz, vec3(1.0 / 2.2));
  oCol.xyz *= oCol.w;

}
`;

