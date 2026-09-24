import { useEffect, useRef } from "react";

interface MonadFluidSceneProps {
  className?: string;
  intensity?: number;
}

export function MonadFluidScene({ className = "", intensity = 1.0 }: MonadFluidSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext("webgl2", { antialias: true, alpha: true, powerPreference: "high-performance" }) ||
      (canvas.getContext("webgl", { antialias: true, alpha: true, powerPreference: "high-performance" }) as WebGLRenderingContext | null);

    if (!gl) {
      console.warn("WebGL not supported for MonadFluidScene");
      return;
    }

    const vsSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_time;
      uniform float u_intensity;

      // Simplex noise helper
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187,
                            0.366025403784439,
                           -0.577350269189626,
                            0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                               + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m;
        m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      float fbm(vec2 p) {
        float f = 0.0;
        float w = 0.5;
        mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
        for (int i = 0; i < 4; i++) {
          f += w * snoise(p);
          p = m * p;
          w *= 0.5;
        }
        return f;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

        // Broad, slow, silky cinematic scale
        p *= 0.48;

        float t = u_time * 0.12;

        // Interactive mouse displacement with smooth inertia
        vec2 mouseP = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
        float mouseDist = length(p - mouseP * 0.48);
        float mouseWave = smoothstep(0.9, 0.0, mouseDist);
        vec2 mouseDir = (mouseDist > 0.001) ? normalize(p - mouseP * 0.48) : vec2(0.0);
        p += mouseDir * mouseWave * 0.18;

        // Gentle domain warping for organic liquid silk
        vec2 q = vec2(
          fbm(p + vec2(0.0, 0.0) + vec2(t * 0.18, t * 0.12)),
          fbm(p + vec2(4.2, 1.7) - vec2(t * 0.14, t * 0.10))
        );

        vec2 r = vec2(
          fbm(p + 1.6 * q + vec2(1.7, 9.2) + vec2(t * 0.10, t * 0.18)),
          fbm(p + 1.6 * q + vec2(8.3, 2.8) - vec2(t * 0.12, t * 0.09))
        );

        float f = fbm(p + 1.9 * r + q * 0.7);

        // Curated Monad & Veris Theme Palette
        vec3 colObsidian = vec3(0.008, 0.006, 0.016);
        vec3 colDeepIndigo = vec3(0.05, 0.03, 0.14);
        vec3 colMonadPurple = vec3(0.514, 0.431, 0.976); // #836ef9
        vec3 colViolet = vec3(0.68, 0.28, 0.95);
        vec3 colCyan = vec3(0.133, 0.827, 0.933);       // #22d3ee

        // Silky, luminous ribbon layers
        float ribbon = smoothstep(0.28, 0.72, f);
        float core = smoothstep(0.52, 0.86, f);
        float highlight = pow(smoothstep(0.62, 0.92, f), 2.8);

        vec3 col = colObsidian;
        col = mix(col, colDeepIndigo, smoothstep(0.15, 0.48, f) * 0.9);
        col = mix(col, colMonadPurple, ribbon * 0.75);
        col = mix(col, colViolet, core * 0.65);
        col = mix(col, colCyan, highlight * 0.5);

        // Specular silk glint
        col += vec3(0.95, 0.92, 1.0) * pow(highlight, 2.0) * 0.35;

        // Radial falloff: keep radiant glow in upper center, fade gently outward
        float radial = 1.0 - length(p * vec2(0.75, 1.15));
        radial = clamp(radial, 0.15, 1.0);
        col *= radial;
        col *= u_intensity;

        // Vertical fade towards top nav and bottom sections
        float verticalFade = smoothstep(0.0, 0.35, uv.y) * smoothstep(1.0, 0.78, uv.y);
        float alpha = clamp(length(col) * 0.78, 0.0, 0.88) * verticalFade;

        gl_FragColor = vec4(col, alpha);
      }
    `;

    function createShader(glCtx: WebGLRenderingContext, type: number, source: string) {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        console.error("Shader compile error:", glCtx.getShaderInfoLog(shader));
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    const positionLoc = gl.getAttribLocation(program, "position");
    const resolutionLoc = gl.getUniformLocation(program, "u_resolution");
    const mouseLoc = gl.getUniformLocation(program, "u_mouse");
    const timeLoc = gl.getUniformLocation(program, "u_time");
    const intensityLoc = gl.getUniformLocation(program, "u_intensity");

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    // Mouse coordinates tracking with smooth inertia
    const mouse = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.35 };
    const targetMouse = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.35 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
      targetMouse.y = (canvas.height - (e.clientY - rect.top) * (canvas.height / rect.height));
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let animationFrameId: number;
    let isVisible = true;
    let startTime = performance.now();

    // Resize handling
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayWidth = Math.floor(canvas.clientWidth * dpr);
      const displayHeight = Math.floor(canvas.clientHeight * dpr);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      }
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    // Intersection observer to pause rendering when off-screen
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          isVisible = entry.isIntersecting;
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Render loop
    const render = (now: number) => {
      if (isVisible) {
        // Smooth lerp mouse
        mouse.x += (targetMouse.x - mouse.x) * 0.06;
        mouse.y += (targetMouse.y - mouse.y) * 0.06;

        gl.useProgram(program);

        gl.enableVertexAttribArray(positionLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

        gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
        gl.uniform2f(mouseLoc, mouse.x, mouse.y);
        gl.uniform1f(timeLoc, prefersReducedMotion ? 1.0 : (now - startTime) * 0.001);
        gl.uniform1f(intensityLoc, intensity);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", resize);
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
      if (positionBuffer) gl.deleteBuffer(positionBuffer);
      if (program) gl.deleteProgram(program);
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full pointer-events-none block ${className}`}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
