import React, { useEffect, useMemo, useRef } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";

export interface LiquidEtherProps {
  mouseForce?: number;
  cursorSize?: number;
  isViscous?: boolean;
  viscous?: number;
  iterationsViscous?: number;
  iterationsPoisson?: number;
  dt?: number;
  BFECC?: boolean;
  resolution?: number;
  isBounce?: boolean;
  colors?: string[];
  style?: React.CSSProperties;
  className?: string;
  autoSpeed?: number;
  seed?: number;
  children?: React.ReactNode;
}

interface SimOptions {
  iterations_poisson: number;
  iterations_viscous: number;
  mouse_force: number;
  resolution: number;
  cursor_size: number;
  viscous: number;
  isBounce: boolean;
  dt: number;
  isViscous: boolean;
  BFECC: boolean;
}

const defaultColors = ["#ec8b49", "#fcc192", "#343331", "#1c1b1a"];

function mulberry32(seed: number) {
  let value = seed | 0;
  return () => {
    value = (value + 0x6d2b79f5) | 0;
    let tmp = Math.imul(value ^ (value >>> 15), 1 | value);
    tmp = (tmp + Math.imul(tmp ^ (tmp >>> 7), 61 | tmp)) ^ tmp;
    return ((tmp ^ (tmp >>> 14)) >>> 0) / 4294967296;
  };
}

export const LiquidEther: React.FC<LiquidEtherProps> = ({
  mouseForce = 20,
  cursorSize = 100,
  isViscous = false,
  viscous = 30,
  iterationsViscous = 32,
  iterationsPoisson = 32,
  dt = 0.014,
  BFECC = true,
  resolution = 0.5,
  isBounce = false,
  colors = defaultColors,
  style,
  className,
  autoSpeed = 0.2,
  seed = 42,
  children,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const webglRef = useRef<{
    render: (delta: number) => void;
    dispose: () => void;
  } | null>(null);

  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const colorsKey = useMemo(() => (colors.length > 0 ? colors.join("|") : ""), [colors]);
  const normalizedColors = useMemo(
    () => (colors.length > 0 ? colors : defaultColors),
    [colorsKey]
  );

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    function makePaletteTexture(stops: string[]) {
      const normalized = stops.length === 0 ? ["#ffffff", "#ffffff"] : stops.length === 1 ? [stops[0], stops[0]] : stops;
      const data = new Uint8Array(normalized.length * 4);

      for (let index = 0; index < normalized.length; index++) {
        const parsed = new THREE.Color(normalized[index]);
        data[index * 4 + 0] = Math.round(parsed.r * 255);
        data[index * 4 + 1] = Math.round(parsed.g * 255);
        data[index * 4 + 2] = Math.round(parsed.b * 255);
        data[index * 4 + 3] = 255;
      }

      const texture = new THREE.DataTexture(data, normalized.length, 1, THREE.RGBAFormat);
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.generateMipmaps = false;
      texture.needsUpdate = true;
      return texture;
    }

    const paletteTexture = makePaletteTexture(normalizedColors);
    const backgroundColor = new THREE.Vector4(0, 0, 0, 0);

    class CommonClass {
      width = 0;
      height = 0;
      aspect = 1;
      pixelRatio = 1;
      time = 0;
      delta = 0;
      renderer: THREE.WebGLRenderer | null = null;

      init(canvasWidth: number, canvasHeight: number) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.aspect = canvasWidth / canvasHeight;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.autoClear = false;
        this.renderer.setClearColor(new THREE.Color(0x000000), 0);
        this.renderer.setPixelRatio(this.pixelRatio);
        this.renderer.setSize(this.width, this.height);

        const element = this.renderer.domElement;
        element.style.width = "100%";
        element.style.height = "100%";
        element.style.display = "block";
      }

      resize(canvasWidth: number, canvasHeight: number) {
        this.width = Math.max(1, canvasWidth);
        this.height = Math.max(1, canvasHeight);
        this.aspect = this.width / this.height;
        this.renderer?.setSize(this.width, this.height, false);
      }

      update(delta: number) {
        this.delta = delta;
        this.time += delta;
      }
    }

    class MouseClass {
      coords = new THREE.Vector2();
      previous = new THREE.Vector2();
      diff = new THREE.Vector2();
      isAutoActive = false;
      autoIntensity = 2;

      setNormalized(x: number, y: number) {
        this.coords.set(x, y);
      }

      update() {
        this.diff.subVectors(this.coords, this.previous);
        this.previous.copy(this.coords);
        if (this.previous.x === 0 && this.previous.y === 0) {
          this.diff.set(0, 0);
        }
        if (this.isAutoActive) {
          this.diff.multiplyScalar(this.autoIntensity);
        }
      }
    }

    class AutoDriver {
      mouse: MouseClass;
      speed: number;
      current = new THREE.Vector2(0, 0);
      target = new THREE.Vector2();
      margin = 0.2;
      random: () => number;
      tmpDirection = new THREE.Vector2();

      constructor(mouse: MouseClass, speedValue: number, random: () => number) {
        this.mouse = mouse;
        this.speed = speedValue;
        this.random = random;
        this.pickTarget();
      }

      pickTarget() {
        this.target.set((this.random() * 2 - 1) * (1 - this.margin), (this.random() * 2 - 1) * (1 - this.margin));
      }

      update(deltaSeconds: number) {
        this.mouse.isAutoActive = true;
        const delta = deltaSeconds > 0.2 ? 0.016 : deltaSeconds;

        const direction = this.tmpDirection.subVectors(this.target, this.current);
        const distance = direction.length();

        if (distance < 0.01) {
          this.pickTarget();
          return;
        }

        direction.normalize();
        const step = this.speed * 0.8 * delta;
        this.current.addScaledVector(direction, Math.min(step, distance));
        this.mouse.setNormalized(this.current.x, this.current.y);
      }
    }

    const faceVertex = `
attribute vec3 position;
uniform vec2 boundarySpace;
varying vec2 uv;
precision highp float;
void main(){
  vec3 pos = position;
  vec2 scale = 1.0 - boundarySpace * 2.0;
  pos.xy = pos.xy * scale;
  uv = vec2(0.5) + (pos.xy) * 0.5;
  gl_Position = vec4(pos, 1.0);
}
`;

    const lineVertex = `
attribute vec3 position;
uniform vec2 px;
precision highp float;
varying vec2 uv;
void main(){
  vec3 pos = position;
  uv = 0.5 + pos.xy * 0.5;
  vec2 n = sign(pos.xy);
  pos.xy = abs(pos.xy) - px;
  pos.xy *= n;
  gl_Position = vec4(pos, 1.0);
}
`;

    const mouseVertex = `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
uniform vec2 center;
uniform vec2 scale;
uniform vec2 px;
varying vec2 vUv;
void main(){
  vec2 pos = position.xy * scale * 2.0 * px + center;
  vUv = uv;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

    const advectionFragment = `
precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform bool isBFECC;
uniform vec2 fboSize;
varying vec2 uv;
void main(){
  vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
  if (!isBFECC) {
    vec2 vel = texture2D(velocity, uv).xy;
    vec2 uv2 = uv - vel * dt * ratio;
    vec2 newVel = texture2D(velocity, uv2).xy;
    gl_FragColor = vec4(newVel, 0.0, 0.0);
  } else {
    vec2 spotNew = uv;
    vec2 velOld = texture2D(velocity, uv).xy;
    vec2 spotOld = spotNew - velOld * dt * ratio;
    vec2 velNew = texture2D(velocity, spotOld).xy;
    vec2 spotNew2 = spotOld + velNew * dt * ratio;
    vec2 error = spotNew2 - spotNew;
    vec2 spotNew3 = spotNew - error / 2.0;
    vec2 vel2 = texture2D(velocity, spotNew3).xy;
    vec2 spotOld2 = spotNew3 - vel2 * dt * ratio;
    vec2 newVel2 = texture2D(velocity, spotOld2).xy;
    gl_FragColor = vec4(newVel2, 0.0, 0.0);
  }
}
`;

    const colorFragment = `
precision highp float;
uniform sampler2D velocity;
uniform sampler2D palette;
uniform vec4 bgColor;
varying vec2 uv;
void main(){
  vec2 vel = texture2D(velocity, uv).xy;
  float lenv = clamp(length(vel), 0.0, 1.0);
  vec3 sampled = texture2D(palette, vec2(lenv, 0.5)).rgb;
  vec3 rgb = mix(bgColor.rgb, sampled, lenv);
  float alpha = mix(bgColor.a, 1.0, lenv);
  gl_FragColor = vec4(rgb, alpha);
}
`;

    const divergenceFragment = `
precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform vec2 px;
varying vec2 uv;
void main(){
  float x0 = texture2D(velocity, uv - vec2(px.x, 0.0)).x;
  float x1 = texture2D(velocity, uv + vec2(px.x, 0.0)).x;
  float y0 = texture2D(velocity, uv - vec2(0.0, px.y)).y;
  float y1 = texture2D(velocity, uv + vec2(0.0, px.y)).y;
  float divergence = (x1 - x0 + y1 - y0) / 2.0;
  gl_FragColor = vec4(divergence / dt);
}
`;

    const externalForceFragment = `
precision highp float;
uniform vec2 force;
varying vec2 vUv;
void main(){
  vec2 circle = (vUv - 0.5) * 2.0;
  float d = 1.0 - min(length(circle), 1.0);
  d *= d;
  gl_FragColor = vec4(force * d, 0.0, 1.0);
}
`;

    const poissonFragment = `
precision highp float;
uniform sampler2D pressure;
uniform sampler2D divergence;
uniform vec2 px;
varying vec2 uv;
void main(){
  float p0 = texture2D(pressure, uv + vec2(px.x * 2.0, 0.0)).r;
  float p1 = texture2D(pressure, uv - vec2(px.x * 2.0, 0.0)).r;
  float p2 = texture2D(pressure, uv + vec2(0.0, px.y * 2.0)).r;
  float p3 = texture2D(pressure, uv - vec2(0.0, px.y * 2.0)).r;
  float div = texture2D(divergence, uv).r;
  float next = (p0 + p1 + p2 + p3) / 4.0 - div;
  gl_FragColor = vec4(next);
}
`;

    const pressureFragment = `
precision highp float;
uniform sampler2D pressure;
uniform sampler2D velocity;
uniform vec2 px;
uniform float dt;
varying vec2 uv;
void main(){
  float p0 = texture2D(pressure, uv + vec2(px.x, 0.0)).r;
  float p1 = texture2D(pressure, uv - vec2(px.x, 0.0)).r;
  float p2 = texture2D(pressure, uv + vec2(0.0, px.y)).r;
  float p3 = texture2D(pressure, uv - vec2(0.0, px.y)).r;
  vec2 vel = texture2D(velocity, uv).xy;
  vec2 gradP = vec2(p0 - p1, p2 - p3) * 0.5;
  gl_FragColor = vec4(vel - gradP * dt, 0.0, 1.0);
}
`;

    const viscousFragment = `
precision highp float;
uniform sampler2D velocity;
uniform sampler2D velocity_new;
uniform float v;
uniform vec2 px;
uniform float dt;
varying vec2 uv;
void main(){
  vec2 oldv = texture2D(velocity, uv).xy;
  vec2 n0 = texture2D(velocity_new, uv + vec2(px.x * 2.0, 0.0)).xy;
  vec2 n1 = texture2D(velocity_new, uv - vec2(px.x * 2.0, 0.0)).xy;
  vec2 n2 = texture2D(velocity_new, uv + vec2(0.0, px.y * 2.0)).xy;
  vec2 n3 = texture2D(velocity_new, uv - vec2(0.0, px.y * 2.0)).xy;
  vec2 result = (4.0 * oldv + v * dt * (n0 + n1 + n2 + n3)) / (4.0 * (1.0 + v * dt));
  gl_FragColor = vec4(result, 0.0, 0.0);
}
`;

    type UniformMap = Record<string, { value: unknown }>;

    class ShaderPass {
      props: {
        material?: {
          vertexShader: string;
          fragmentShader: string;
          uniforms: UniformMap;
          transparent?: boolean;
          depthWrite?: boolean;
          blending?: THREE.Blending;
        };
        output?: THREE.WebGLRenderTarget | null;
      };
      uniforms?: UniformMap;
      scene: THREE.Scene | null = null;
      camera: THREE.Camera | null = null;

      constructor(
        props: {
          material?: {
            vertexShader: string;
            fragmentShader: string;
            uniforms: UniformMap;
            transparent?: boolean;
            depthWrite?: boolean;
            blending?: THREE.Blending;
          };
          output?: THREE.WebGLRenderTarget | null;
        } = {}
      ) {
        this.props = props;
        this.uniforms = props.material?.uniforms;
      }

      init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();

        if (!this.props.material) return;

        const material = new THREE.RawShaderMaterial(this.props.material);
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
        this.scene.add(mesh);
      }

      update(renderer: THREE.WebGLRenderer, ..._args: unknown[]) {
        if (!this.scene || !this.camera) return;
        renderer.setRenderTarget(this.props.output ?? null);
        renderer.render(this.scene, this.camera);
        renderer.setRenderTarget(null);
      }
    }

    class Advection extends ShaderPass {
      line: THREE.LineSegments | null = null;

      constructor(simProps: {
        cellScale: THREE.Vector2;
        fboSize: THREE.Vector2;
        dt: number;
        src: THREE.WebGLRenderTarget;
        dst: THREE.WebGLRenderTarget;
      }) {
        const uniforms: UniformMap = {
          boundarySpace: { value: simProps.cellScale },
          px: { value: simProps.cellScale },
          fboSize: { value: simProps.fboSize },
          velocity: { value: simProps.src.texture },
          dt: { value: simProps.dt },
          isBFECC: { value: true },
        };

        super({
          material: {
            vertexShader: faceVertex,
            fragmentShader: advectionFragment,
            uniforms,
          },
          output: simProps.dst,
        });

        this.init();
        this.createBoundary(uniforms);
      }

      createBoundary(uniforms: UniformMap) {
        if (!this.scene) return;

        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
          -1, -1, 0, -1, 1, 0, -1, 1, 0, 1, 1, 0,
          1, 1, 0, 1, -1, 0, 1, -1, 0, -1, -1, 0,
        ]);

        geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

        const material = new THREE.RawShaderMaterial({
          vertexShader: lineVertex,
          fragmentShader: advectionFragment,
          uniforms,
        });

        this.line = new THREE.LineSegments(geometry, material);
        this.scene.add(this.line);
      }

      update(renderer: THREE.WebGLRenderer, options: { dt?: number; isBounce?: boolean; BFECC?: boolean } = {}) {
        if (!this.uniforms) return;

        if (typeof options.dt === "number") this.uniforms.dt.value = options.dt;
        if (typeof options.BFECC === "boolean") this.uniforms.isBFECC.value = options.BFECC;
        if (typeof options.isBounce === "boolean" && this.line) this.line.visible = options.isBounce;

        super.update(renderer);
      }
    }

    class ExternalForce extends ShaderPass {
      mouse: THREE.Mesh | null = null;

      constructor(simProps: { cellScale: THREE.Vector2; cursor_size: number; dst: THREE.WebGLRenderTarget }) {
        super({ output: simProps.dst });
        this.init();

        if (!this.scene) return;

        const mouseMaterial = new THREE.RawShaderMaterial({
          vertexShader: mouseVertex,
          fragmentShader: externalForceFragment,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          uniforms: {
            px: { value: simProps.cellScale },
            force: { value: new THREE.Vector2(0, 0) },
            center: { value: new THREE.Vector2(0, 0) },
            scale: { value: new THREE.Vector2(simProps.cursor_size, simProps.cursor_size) },
          },
        });

        this.mouse = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mouseMaterial);
        this.scene.add(this.mouse);
      }

      update(
        renderer: THREE.WebGLRenderer,
        mouse?: MouseClass,
        options?: { cursor_size: number; mouse_force: number; cellScale: THREE.Vector2 }
      ) {
        if (!this.mouse || !mouse || !options) return;

        const uniforms = (this.mouse.material as THREE.RawShaderMaterial).uniforms;
        const forceX = (mouse.diff.x / 2) * options.mouse_force;
        const forceY = (mouse.diff.y / 2) * options.mouse_force;
        const cursorScaleX = options.cursor_size * options.cellScale.x;
        const cursorScaleY = options.cursor_size * options.cellScale.y;

        const centerX = Math.min(
          Math.max(mouse.coords.x, -1 + cursorScaleX + options.cellScale.x * 2),
          1 - cursorScaleX - options.cellScale.x * 2
        );

        const centerY = Math.min(
          Math.max(mouse.coords.y, -1 + cursorScaleY + options.cellScale.y * 2),
          1 - cursorScaleY - options.cellScale.y * 2
        );

        uniforms.force.value.set(forceX, forceY);
        uniforms.center.value.set(centerX, centerY);
        uniforms.scale.value.set(options.cursor_size, options.cursor_size);

        super.update(renderer);
      }
    }

    class Viscous extends ShaderPass {
      output0: THREE.WebGLRenderTarget;
      output1: THREE.WebGLRenderTarget;

      constructor(simProps: {
        boundarySpace: THREE.Vector2;
        cellScale: THREE.Vector2;
        viscous: number;
        src: THREE.WebGLRenderTarget;
        dst: THREE.WebGLRenderTarget;
        dst_: THREE.WebGLRenderTarget;
        dt: number;
      }) {
        const uniforms: UniformMap = {
          boundarySpace: { value: simProps.boundarySpace },
          velocity: { value: simProps.src.texture },
          velocity_new: { value: simProps.dst_.texture },
          v: { value: simProps.viscous },
          px: { value: simProps.cellScale },
          dt: { value: simProps.dt },
        };

        super({
          material: {
            vertexShader: faceVertex,
            fragmentShader: viscousFragment,
            uniforms,
          },
          output: simProps.dst,
        });

        this.output0 = simProps.dst_;
        this.output1 = simProps.dst;
        this.init();
      }

      update(renderer: THREE.WebGLRenderer, options: { viscous?: number; iterations?: number; dt?: number } = {}) {
        if (!this.uniforms) return this.output1;

        if (typeof options.viscous === "number") this.uniforms.v.value = options.viscous;
        if (typeof options.dt === "number") this.uniforms.dt.value = options.dt;

        const iterations = options.iterations ?? 0;
        let fboIn = this.output0;
        let fboOut = this.output1;

        for (let index = 0; index < iterations; index++) {
          if (index % 2 === 0) {
            fboIn = this.output0;
            fboOut = this.output1;
          } else {
            fboIn = this.output1;
            fboOut = this.output0;
          }

          this.uniforms.velocity_new.value = fboIn.texture;
          this.props.output = fboOut;
          super.update(renderer);
        }

        return fboOut;
      }
    }

    class Divergence extends ShaderPass {
      constructor(simProps: {
        boundarySpace: THREE.Vector2;
        cellScale: THREE.Vector2;
        src: THREE.WebGLRenderTarget;
        dst: THREE.WebGLRenderTarget;
        dt: number;
      }) {
        super({
          material: {
            vertexShader: faceVertex,
            fragmentShader: divergenceFragment,
            uniforms: {
              boundarySpace: { value: simProps.boundarySpace },
              velocity: { value: simProps.src.texture },
              px: { value: simProps.cellScale },
              dt: { value: simProps.dt },
            },
          },
          output: simProps.dst,
        });

        this.init();
      }

      update(renderer: THREE.WebGLRenderer, options: { vel?: THREE.WebGLRenderTarget } = {}) {
        if (this.uniforms && options.vel) {
          this.uniforms.velocity.value = options.vel.texture;
        }
        super.update(renderer);
      }
    }

    class Poisson extends ShaderPass {
      output0: THREE.WebGLRenderTarget;
      output1: THREE.WebGLRenderTarget;

      constructor(simProps: {
        boundarySpace: THREE.Vector2;
        cellScale: THREE.Vector2;
        src: THREE.WebGLRenderTarget;
        dst: THREE.WebGLRenderTarget;
        dst_: THREE.WebGLRenderTarget;
      }) {
        super({
          material: {
            vertexShader: faceVertex,
            fragmentShader: poissonFragment,
            uniforms: {
              boundarySpace: { value: simProps.boundarySpace },
              pressure: { value: simProps.dst_.texture },
              divergence: { value: simProps.src.texture },
              px: { value: simProps.cellScale },
            },
          },
          output: simProps.dst,
        });

        this.output0 = simProps.dst_;
        this.output1 = simProps.dst;
        this.init();
      }

      update(renderer: THREE.WebGLRenderer, options: { iterations?: number } = {}) {
        if (!this.uniforms) return this.output1;

        const iterations = options.iterations ?? 0;
        let pressureIn = this.output0;
        let pressureOut = this.output1;

        for (let index = 0; index < iterations; index++) {
          if (index % 2 === 0) {
            pressureIn = this.output0;
            pressureOut = this.output1;
          } else {
            pressureIn = this.output1;
            pressureOut = this.output0;
          }

          this.uniforms.pressure.value = pressureIn.texture;
          this.props.output = pressureOut;
          super.update(renderer);
        }

        return pressureOut;
      }
    }

    class Pressure extends ShaderPass {
      constructor(simProps: {
        boundarySpace: THREE.Vector2;
        cellScale: THREE.Vector2;
        src_p: THREE.WebGLRenderTarget;
        src_v: THREE.WebGLRenderTarget;
        dst: THREE.WebGLRenderTarget;
        dt: number;
      }) {
        super({
          material: {
            vertexShader: faceVertex,
            fragmentShader: pressureFragment,
            uniforms: {
              boundarySpace: { value: simProps.boundarySpace },
              pressure: { value: simProps.src_p.texture },
              velocity: { value: simProps.src_v.texture },
              px: { value: simProps.cellScale },
              dt: { value: simProps.dt },
            },
          },
          output: simProps.dst,
        });

        this.init();
      }

      update(
        renderer: THREE.WebGLRenderer,
        options: { vel?: THREE.WebGLRenderTarget; pressure?: THREE.WebGLRenderTarget } = {}
      ) {
        if (this.uniforms && options.vel && options.pressure) {
          this.uniforms.velocity.value = options.vel.texture;
          this.uniforms.pressure.value = options.pressure.texture;
        }
        super.update(renderer);
      }
    }

    class Simulation {
      options: SimOptions;
      fbos: Record<string, THREE.WebGLRenderTarget>;
      fboSize = new THREE.Vector2();
      cellScale = new THREE.Vector2();
      boundarySpace = new THREE.Vector2();
      advection: Advection;
      externalForce: ExternalForce;
      viscousPass: Viscous;
      divergence: Divergence;
      poisson: Poisson;
      pressure: Pressure;

      constructor(common: CommonClass, options: Partial<SimOptions> = {}) {
        this.options = {
          iterations_poisson: 32,
          iterations_viscous: 32,
          mouse_force: 20,
          resolution: 0.5,
          cursor_size: 100,
          viscous: 30,
          isBounce: false,
          dt: 0.014,
          isViscous: false,
          BFECC: true,
          ...options,
        };

        this.calcSize(common);

        const targetOptions: THREE.RenderTargetOptions = {
          type: THREE.FloatType,
          depthBuffer: false,
          stencilBuffer: false,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          wrapS: THREE.ClampToEdgeWrapping,
          wrapT: THREE.ClampToEdgeWrapping,
        };

        this.fbos = {
          vel_0: new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, targetOptions),
          vel_1: new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, targetOptions),
          vel_viscous0: new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, targetOptions),
          vel_viscous1: new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, targetOptions),
          div: new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, targetOptions),
          pressure_0: new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, targetOptions),
          pressure_1: new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, targetOptions),
        };

        this.advection = new Advection({
          cellScale: this.cellScale,
          fboSize: this.fboSize,
          dt: this.options.dt,
          src: this.fbos.vel_0,
          dst: this.fbos.vel_1,
        });

        this.externalForce = new ExternalForce({
          cellScale: this.cellScale,
          cursor_size: this.options.cursor_size,
          dst: this.fbos.vel_1,
        });

        this.viscousPass = new Viscous({
          cellScale: this.cellScale,
          boundarySpace: this.boundarySpace,
          viscous: this.options.viscous,
          src: this.fbos.vel_1,
          dst: this.fbos.vel_viscous1,
          dst_: this.fbos.vel_viscous0,
          dt: this.options.dt,
        });

        this.divergence = new Divergence({
          cellScale: this.cellScale,
          boundarySpace: this.boundarySpace,
          src: this.fbos.vel_viscous0,
          dst: this.fbos.div,
          dt: this.options.dt,
        });

        this.poisson = new Poisson({
          cellScale: this.cellScale,
          boundarySpace: this.boundarySpace,
          src: this.fbos.div,
          dst: this.fbos.pressure_1,
          dst_: this.fbos.pressure_0,
        });

        this.pressure = new Pressure({
          cellScale: this.cellScale,
          boundarySpace: this.boundarySpace,
          src_p: this.fbos.pressure_0,
          src_v: this.fbos.vel_viscous0,
          dst: this.fbos.vel_0,
          dt: this.options.dt,
        });
      }

      calcSize(common: CommonClass) {
        const computedWidth = Math.max(1, Math.round(this.options.resolution * common.width));
        const computedHeight = Math.max(1, Math.round(this.options.resolution * common.height));
        this.cellScale.set(1 / computedWidth, 1 / computedHeight);
        this.fboSize.set(computedWidth, computedHeight);
      }

      resize(common: CommonClass) {
        this.calcSize(common);
        Object.values(this.fbos).forEach((fbo) => fbo.setSize(this.fboSize.x, this.fboSize.y));
      }

      update(renderer: THREE.WebGLRenderer, mouse: MouseClass) {
        if (this.options.isBounce) this.boundarySpace.set(0, 0);
        else this.boundarySpace.copy(this.cellScale);

        this.advection.update(renderer, {
          dt: this.options.dt,
          isBounce: this.options.isBounce,
          BFECC: this.options.BFECC,
        });

        this.externalForce.update(renderer, mouse, {
          cursor_size: this.options.cursor_size,
          mouse_force: this.options.mouse_force,
          cellScale: this.cellScale,
        });

        let velocity = this.fbos.vel_1;
        if (this.options.isViscous) {
          velocity = this.viscousPass.update(renderer, {
            viscous: this.options.viscous,
            iterations: this.options.iterations_viscous,
            dt: this.options.dt,
          });
        }

        this.divergence.update(renderer, { vel: velocity });
        const pressureResult = this.poisson.update(renderer, { iterations: this.options.iterations_poisson });
        this.pressure.update(renderer, { vel: velocity, pressure: pressureResult });
      }

      dispose() {
        Object.values(this.fbos).forEach((fbo) => fbo.dispose());
      }
    }

    class Output {
      simulation: Simulation;
      scene: THREE.Scene;
      camera: THREE.Camera;

      constructor(common: CommonClass, options: Partial<SimOptions>) {
        this.simulation = new Simulation(common, options);
        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();

        const material = new THREE.RawShaderMaterial({
          vertexShader: faceVertex,
          fragmentShader: colorFragment,
          transparent: true,
          depthWrite: false,
          uniforms: {
            velocity: { value: this.simulation.fbos.vel_0.texture },
            boundarySpace: { value: new THREE.Vector2() },
            palette: { value: paletteTexture },
            bgColor: { value: backgroundColor },
          },
        });

        this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
      }

      resize(common: CommonClass) {
        this.simulation.resize(common);
      }

      update(renderer: THREE.WebGLRenderer, mouse: MouseClass) {
        this.simulation.update(renderer, mouse);
        renderer.setRenderTarget(null);
        renderer.render(this.scene, this.camera);
      }

      dispose() {
        this.simulation.dispose();
      }
    }

    const common = new CommonClass();
    const mouse = new MouseClass();
    const random = mulberry32(seed);

    common.init(width, height);

    if (!common.renderer) return;

    container.prepend(common.renderer.domElement);

    const output = new Output(common, {
      mouse_force: mouseForce,
      cursor_size: cursorSize,
      isViscous,
      viscous,
      iterations_viscous: iterationsViscous,
      iterations_poisson: iterationsPoisson,
      dt,
      BFECC,
      resolution,
      isBounce,
    });

    const autoDriver = new AutoDriver(mouse, autoSpeed, random);

    webglRef.current = {
      render(deltaSeconds: number) {
        autoDriver.update(deltaSeconds);
        mouse.update();
        common.update(deltaSeconds);
        output.update(common.renderer as THREE.WebGLRenderer, mouse);
      },
      dispose() {
        output.dispose();
        paletteTexture.dispose();

        if (common.renderer) {
          const canvas = common.renderer.domElement;
          if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
          common.renderer.dispose();
        }
      },
    };

    return () => {
      webglRef.current?.dispose();
      webglRef.current = null;
    };
  }, [
    BFECC,
    autoSpeed,
    colorsKey,
    cursorSize,
    dt,
    height,
    isBounce,
    isViscous,
    iterationsPoisson,
    iterationsViscous,
    mouseForce,
    resolution,
    seed,
    viscous,
    width,
  ]);

  useEffect(() => {
    if (!webglRef.current) return;
    webglRef.current.render(1 / fps);
  }, [fps, frame]);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        height: "100%",
        touchAction: "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
