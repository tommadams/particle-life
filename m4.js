"use strict";

const m4 = {

newZero: () => { return new Float32Array(16); },
newIdentity: () => { return m4.setIdentity(new Float32Array(16)); },
newOrtho: (left, right, bottom, top, near, far) => { return m4.setOrtho(new Float32Array(16), left, right, bottom, top, near, far); },

setIdentity: (dst) => {
  dst.fill(0);
  dst[0] = 1; dst[5] = 1; dst[10] = 1; dst[15] = 1;
  return dst;
},

setOrtho: (dst, left, right, bottom, top, near, far) => {
  let x = 2 / (right - left);
  let y = 2 / (top - bottom);
  let z = -2 / (far - near);
  let a = -(right + left) / (right - left);
  let b = -(top + bottom) / (top - bottom);
  let c = -(far + near) / (far - near);

  dst.fill(0);
  dst[0] = x;
  dst[5] = y;
  dst[10] = z;
  dst[12] = a;
  dst[13] = b;
  dst[14] = c;
  dst[15] = 1;
  return dst;
},

mul: (dst, a, b) => {
  let a00 = a[0],  a01 = a[1],  a02 = a[2],  a03 = a[3];
  let a10 = a[4],  a11 = a[5],  a12 = a[6],  a13 = a[7];
  let a20 = a[8],  a21 = a[9],  a22 = a[10], a23 = a[11];
  let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

  let b00 = b[0],  b01 = b[1],  b02 = b[2],  b03 = b[3];
  let b10 = b[4],  b11 = b[5],  b12 = b[6],  b13 = b[7];
  let b20 = b[8],  b21 = b[9],  b22 = b[10], b23 = b[11];
  let b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];

  dst[0]  = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
  dst[1]  = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
  dst[2]  = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
  dst[3]  = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;

  dst[4]  = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
  dst[5]  = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
  dst[6]  = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
  dst[7]  = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;

  dst[8]  = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
  dst[9]  = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
  dst[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
  dst[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;

  dst[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
  dst[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
  dst[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
  dst[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
  return dst;
},

invert: (dst, a) => {
  let m00 = a[0],  m01 = a[1],  m02 = a[2],  m03 = a[3];
  let m10 = a[4],  m11 = a[5],  m12 = a[6],  m13 = a[7];
  let m20 = a[8],  m21 = a[9],  m22 = a[10], m23 = a[11];
  let m30 = a[12], m31 = a[13], m32 = a[14], m33 = a[15];

  let a0 = m00 * m11 - m01 * m10;
  let a1 = m00 * m12 - m02 * m10;
  let a2 = m00 * m13 - m03 * m10;
  let a3 = m01 * m12 - m02 * m11;
  let a4 = m01 * m13 - m03 * m11;
  let a5 = m02 * m13 - m03 * m12;
  let b0 = m20 * m31 - m21 * m30;
  let b1 = m20 * m32 - m22 * m30;
  let b2 = m20 * m33 - m23 * m30;
  let b3 = m21 * m32 - m22 * m31;
  let b4 = m21 * m33 - m23 * m31;
  let b5 = m22 * m33 - m23 * m32;

  let det = a0 * b5 - a1 * b4 + a2 * b3 + a3 * b2 - a4 * b1 + a5 * b0;
  let idet = 1.0 / det;
  dst[0] =  ( m11 * b5 - m12 * b4 + m13 * b3) * idet;
  dst[1] =  (-m01 * b5 + m02 * b4 - m03 * b3) * idet;
  dst[2] =  ( m31 * a5 - m32 * a4 + m33 * a3) * idet;
  dst[3] =  (-m21 * a5 + m22 * a4 - m23 * a3) * idet;

  dst[4] =  (-m10 * b5 + m12 * b2 - m13 * b1) * idet;
  dst[5] =  ( m00 * b5 - m02 * b2 + m03 * b1) * idet;
  dst[6] =  (-m30 * a5 + m32 * a2 - m33 * a1) * idet;
  dst[7] =  ( m20 * a5 - m22 * a2 + m23 * a1) * idet;

  dst[8] =  ( m10 * b4 - m11 * b2 + m13 * b0) * idet;
  dst[9] =  (-m00 * b4 + m01 * b2 - m03 * b0) * idet;
  dst[10] = ( m30 * a4 - m31 * a2 + m33 * a0) * idet;
  dst[11] = (-m20 * a4 + m21 * a2 - m23 * a0) * idet;

  dst[12] = (-m10 * b3 + m11 * b1 - m12 * b0) * idet;
  dst[13] = ( m00 * b3 - m01 * b1 + m02 * b0) * idet;
  dst[14] = (-m30 * a3 + m31 * a1 - m32 * a0) * idet;
  dst[15] = ( m20 * a3 - m21 * a1 + m22 * a0) * idet;
  return dst;
},

toString: (m, precision=3, sep=' ') => {
  let str = '';
  for (let i = 0; i < 16;) {
    let a = m[i++].toFixed(precision);
    let b = m[i++].toFixed(precision);
    let c = m[i++].toFixed(precision);
    let d = m[i++].toFixed(precision);
    if (a[0] != '-') { a = ' ' + a; }
    if (b[0] != '-') { b = ' ' + b; }
    if (c[0] != '-') { c = ' ' + c; }
    if (d[0] != '-') { d = ' ' + d; }
    str += `[${a}${sep}${b}${sep}${c}${sep}${d}]\n`;
  }
  return str;
},

};
