// three.js (DS lead) — the ONLY module in the site that imports 'three' (lint enforces it). Explicit named re-exports of
// what the figures use, so esbuild emits ONE shared, tree-shaken chunk, fetched once by whichever figure needs it first.
// Need another class? Add it here (DS lead review) — never import 'three' from a chapter.
export {
  WebGLRenderer, WebGLRenderTarget, Scene, Group, Object3D, Mesh,
  OrthographicCamera, PerspectiveCamera,
  BufferGeometry, BufferAttribute, PlaneGeometry, CylinderGeometry, LatheGeometry,
  ShaderMaterial, RawShaderMaterial, MeshBasicMaterial, GLSL3,
  Color, Vector2, Vector3, Vector4, Matrix4,
  DataTexture, CanvasTexture,
  UnsignedByteType, FloatType, HalfFloatType, RGBAFormat, RedFormat,
  LinearFilter, LinearMipmapLinearFilter, NearestFilter, RepeatWrapping, ClampToEdgeWrapping,
  NoColorSpace, SRGBColorSpace, LinearSRGBColorSpace, NoToneMapping,
  FrontSide, BackSide, DoubleSide, NormalBlending, NoBlending, AdditiveBlending,
} from 'three'
