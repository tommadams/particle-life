"use strict";

function createShader(gl, type, source) {
  let shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return;
  }

  return shader;
}


class ShaderProgram {
  constructor(handle, attribs, uniforms, samplers) {
    this.handle = handle;
    this.attribs = attribs;
    this.uniforms = uniforms;
    this.samplers = samplers;
  }
}


class Sampler {
  constructor(loc, texUnit) {
    this.loc = loc;
    this.texUnit = texUnit;
  }
}


class Texture {
  constructor(handle, internalFormat, format, type, width, height, depth = 0) {
    this.handle = handle;
    this.internalFormat = internalFormat;
    this.format = format;
    this.type = type;
    this.width = width;
    this.height = height;
    this.depth = depth;
  }
}


class Uniform {
  constructor(loc) {
    this.loc = loc;
  }
}


function isSampler(gl, uniform) {
  let type = uniform.type;
  return (
    type == gl.SAMPLER_2D ||
    type == gl.SAMPLER_2D_SHADOW ||
    type == gl.SAMPLER_3D ||
    type == gl.SAMPLER_CUBE ||
    type == gl.INT_SAMPLER_2D ||
    type == gl.INT_SAMPLER_3D ||
    type == gl.INT_SAMPLER_CUBE ||
    type == gl.UNSIGNED_INT_SAMPLER_2D ||
    type == gl.UNSIGNED_INT_SAMPLER_3D ||
    type == gl.UNSIGNED_INT_SAMPLER_CUBE);
}


function createProgram(gl, vertexShader, fragmentShader) {
  let handle = gl.createProgram();
  gl.attachShader(handle, vertexShader);
  gl.attachShader(handle, fragmentShader);
  gl.linkProgram(handle);
  if (!gl.getProgramParameter(handle, gl.LINK_STATUS)) {
    console.log(gl.getProgramInfoLog(handle));
    gl.deleteProgram(handle);
    return;
  }

  let attribs = {};
  let numAttribs = gl.getProgramParameter(handle, gl.ACTIVE_ATTRIBUTES);
  for (let i = 0; i < numAttribs; ++i) {
    let attrib = gl.getActiveAttrib(handle, i);
    if (attrib.name.startsWith('gl_')) continue;
    let loc = gl.getAttribLocation(handle, attrib.name);
    attribs[attrib.name] = loc;
  }

  let uniforms = {};
  let samplers = {};
  let numUniforms = gl.getProgramParameter(handle, gl.ACTIVE_UNIFORMS);
  let texUnit = 0;
  for (let i = 0; i < numUniforms; ++i) {
    let uniform = gl.getActiveUniform(handle, i);
    if (uniform.name.startsWith('gl_')) continue;
    let loc = gl.getUniformLocation(handle, uniform.name);
    if (isSampler(gl, uniform)) {
      samplers[uniform.name] = new Sampler(loc, texUnit);
      texUnit += 1;
    } else {
      uniforms[uniform.name] = new Uniform(loc);
    }
  }

  gl.useProgram(handle);
  for (let key in samplers) {
    let sampler = samplers[key];
    gl.uniform1i(sampler.loc, sampler.texUnit);
  }

  return new ShaderProgram(handle, attribs, uniforms, samplers);
}


function inferTextureType(internalFormat) {
  switch (internalFormat) {
    case gl.RGBA4:
      return gl.UNSIGNED_SHORT_4_4_4_4

    case gl.RGB5_A1:
      return gl.UNSIGNED_SHORT_5_5_5_1

    case gl.RGB565:
      return gl.UNSIGNED_SHORT_5_6_5

    case gl.RGBA16UI: case gl.RG16UI: case gl.R16UI: case gl.RGB16UI:
    case gl.DEPTH_COMPONENT16:
      return gl.UNSIGNED_SHORT

    case gl.RGBA8_SNORM: case gl.RGB8_SNORM: case gl.RG8_SNORM: case gl.RGBA8I:
    case gl.RGB8I: case gl.RG8I: case gl.R8_SNORM: case gl.R8I:
      return gl.BYTE

    case gl.RGBA16I: case gl.RGB16I: case gl.RG16I: case gl.R16I:
      return gl.SHORT;

    case gl.RGBA8: case gl.RGB8: case gl.RG8: case gl.R8: case gl.SRGB8_ALPHA8:
    case gl.SRGB8: case gl.RGBA8UI: case gl.RGB8UI: case gl.LUMINANCE_ALPHA:
    case gl.LUMINANCE: case gl.RG8UI: case gl.R8UI: case gl.RGBA: case gl.RGB:
    case gl.ALPHA:
      return gl.UNSIGNED_BYTE

    case gl.RGB10_A2: case gl.RGB10_A2UI:
      return gl.UNSIGNED_INT_2_10_10_10_REV

    case gl.RGBA16F: case gl.RGB16F: case gl.RG16F: case gl.R16F:
      return gl.HALF_FLOAT

    case gl.RGBA32F: case gl.RGB32F: case gl.RG32F: case gl.R11F_G11F_B10F:
    case gl.RGB9_E5: case gl.R32F: case gl.DEPTH_COMPONENT32F:
      return gl.FLOAT

    case gl.RGBA32UI: case gl.RG32UI: case gl.R32UI: case gl.RGB32UI:
    case gl.DEPTH_COMPONENT24:
      return gl.UNSIGNED_INT

    case gl.DEPTH24_STENCIL8:
      return gl.UNSIGNED_INT_24_8

    case gl.DEPTH32F_STENCIL8:
      return gl.FLOAT_32_UNSIGNED_INT_24_8_REV

    case gl.RGBA32I: case gl.RGB32I: case gl.RG32I: case gl.R32I:
      return gl.INT;

    case gl.R11F_G11F_B10F:
      return gl.UNSIGNED_INT_10F_11F_11F_REV

    case gl.RGB9_E5:
      return gl.UNSIGNED_INT_5_9_9_9_REV
  }

  throw new Error(`unrecognized internal format ${internalFormat}`);
}


function inferTextureFormat(internalFormat) {
  switch (internalFormat) {
    case gl.RGBA8: case gl.RGB5_A1: case gl.RGBA4: case gl.SRGB8_ALPHA8:
    case gl.RGBA8_SNORM: case gl.RGBA4: case gl.RGB5_A1: case gl.RGB10_A2:
    case gl.RGB5_A1: case gl.RGBA16F: case gl.RGBA32F: case gl.RGBA16F:
      return gl.RGBA;

    case gl.RGBA8UI: case gl.RGBA8I: case gl.RGBA16UI: case gl.RGBA16I:
    case gl.RGBA32UI: case gl.RGBA32I: case gl.RGB10_A2UI:
      return gl.RGBA_INTEGER

    case gl.RGB8: case gl.RGB565: case gl.SRGB8: case gl.RGB8_SNORM:
    case gl.RGB565: case gl.R11F_G11F_B10F: case gl.RGB9_E5: case gl.RGB16F:
    case gl.R11F_G11F_B10F: case gl.RGB9_E5: case gl.RGB32F: case gl.RGB16F:
    case gl.R11F_G11F_B10F: case gl.RGB9_E5:
      return gl.RGB;

    case gl.RGB8UI: case gl.RGB8I: case gl.RGB16UI: case gl.RGB16I:
    case gl.RGB32UI: case gl.RGB32I:
      return gl.RGB_INTEGER

    case gl.RG8: case gl.RG8_SNORM: case gl.RG16F: case gl.RG32F: case gl.RG16F:
      return gl.RG

    case gl.RG8UI: case gl.RG8I: case gl.RG16UI: case gl.RG16I: case gl.RG32UI:
    case gl.RG32I:
      return gl.RG_INTEGER

    case gl.R8: case gl.R8_SNORM: case gl.R16F: case gl.R32F: case gl.R16F:
      return gl.RED

    case gl.R8UI: case gl.R8I: case gl.R16UI: case gl.R16I: case gl.R32UI:
    case gl.R32I:
      return gl.RED_INTEGER

    case gl.DEPTH_COMPONENT16: case gl.DEPTH_COMPONENT24:
    case gl.DEPTH_COMPONENT32F:
      return gl.DEPTH_COMPONENT

    case gl.DEPTH24_STENCIL8:
    case gl.DEPTH32F_STENCIL8:
      return gl.DEPTH_STENCIL

    case gl.RGBA:
      return gl.RGBA;

    case gl.RGB:
      return gl.RGB

    case gl.LUMINANCE_ALPHA:
      return gl.LUMINANCE_ALPHA;

    case gl.LUMINANCE:
      return gl.LUMINANCE;

    case gl.ALPHA:
      return gl.ALPHA
  }

  throw new Error(`unrecognized internal format ${internalFormat}`);
}


function createTexture2D(gl, width, height, internalFormat, data = null) {
  let handle = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, handle);

  let format = inferTextureFormat(internalFormat);
  let type = inferTextureType(internalFormat);

  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, data);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  return new Texture(handle, internalFormat, format, type, width, height, 0);
}

