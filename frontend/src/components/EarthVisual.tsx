import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Orbit, Compass, Radio } from 'lucide-react';

// Real NASA satellite imagery served locally from /public/textures/ (no CORS issues)
const TEXTURE_URLS = {
  day:      '/textures/earth_atmos_2048.jpg',
  night:    '/textures/earth_lights_2048.png',
  specular: '/textures/earth_specular_2048.jpg',
  bump:     '/textures/earth_normal_2048.jpg',
  clouds:   '/textures/earth_clouds_1024.png',
};

export const EarthVisual: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [telemetry, setTelemetry] = useState({ pitch: '0.0', yaw: '0.0', azimuth: '284' });

  // Refs for animation loop & mouse coordinates
  const mouseTargetRef = useRef({ x: 0, y: 0 });
  const mouseCurrentRef = useRef({ x: 0, y: 0 });
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    earthGroup: THREE.Group;
    earthMesh: THREE.Mesh;
    cloudsMesh: THREE.Mesh;
    gimbalOuter: THREE.Mesh;
    gimbalMiddle: THREE.Group;
    satelliteMesh: THREE.Group;
    satelliteAngle: number;
  } | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 440;
    const height = container.clientHeight || 440;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.35);

    // 2. WebGL Renderer with Filmic Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 3. Lighting — Natural Solar Illumination
    // Primary sunlight key
    const sunLight = new THREE.DirectionalLight(0xfff4e0, 2.2);
    sunLight.position.set(-4.8, 2.8, 3.2);
    scene.add(sunLight);

    // Deep space ambient (very subtle — preserves night-side darkness)
    const ambientLight = new THREE.AmbientLight(0x061126, 0.18);
    scene.add(ambientLight);

    // Soft specular sun accent
    const sunAccent = new THREE.PointLight(0xbae6fd, 0.9, 10);
    sunAccent.position.set(-3.8, 2.2, 2.8);
    scene.add(sunAccent);

    // 4. Load Real NASA Satellite Textures
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';

    // Helper: load with anisotropy for sharpness
    const loadTex = (url: string): Promise<THREE.Texture> =>
      new Promise((resolve, reject) =>
        loader.load(
          url,
          (tex) => {
            tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
            tex.colorSpace = THREE.SRGBColorSpace;
            resolve(tex);
          },
          undefined,
          reject
        )
      );

    // Kick off all five texture loads in parallel
    Promise.all([
      loadTex(TEXTURE_URLS.day),
      loadTex(TEXTURE_URLS.night),
      loadTex(TEXTURE_URLS.specular),
      loadTex(TEXTURE_URLS.bump),
      loadTex(TEXTURE_URLS.clouds),
    ]).then(([dayTexture, nightTexture, specularTexture, bumpTexture, cloudsTexture]) => {
      // Bump/normal map is not sRGB
      bumpTexture.colorSpace = THREE.LinearSRGBColorSpace;
      specularTexture.colorSpace = THREE.LinearSRGBColorSpace;
      nightTexture.colorSpace = THREE.SRGBColorSpace;

      // 5. Earth Parent Group (for 3D gyroscope rotations)
      const earthGroup = new THREE.Group();
      scene.add(earthGroup);

      // Base Earth Sphere
      const earthGeometry = new THREE.SphereGeometry(1.22, 128, 128);
      const earthMaterial = new THREE.MeshStandardMaterial({
        map: dayTexture,
        bumpMap: bumpTexture,
        bumpScale: 0.06,
        roughnessMap: specularTexture,
        roughness: 0.55,
        metalness: 0.02,
        emissiveMap: nightTexture,
        emissive: new THREE.Color(0xffd080),
        emissiveIntensity: 0.95,
      });
      const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
      earthMesh.rotation.y = 1.95; // Focus on South Asia / Indian Ocean / Middle East
      earthGroup.add(earthMesh);

      // Outer Cloud Sphere
      const cloudsGeometry = new THREE.SphereGeometry(1.238, 128, 128);
      const cloudsMaterial = new THREE.MeshStandardMaterial({
        map: cloudsTexture,
        transparent: true,
        opacity: 0.78,
        blending: THREE.AdditiveBlending,
        roughness: 0.9,
        depthWrite: false,
      });
      const cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
      earthGroup.add(cloudsMesh);

      // Atmospheric Rayleigh Scattering Glow (natural limb shader)
      const atmosphereGeometry = new THREE.SphereGeometry(1.265, 64, 64);
      const atmosphereMaterial = new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vec3 viewDir = normalize(-vPosition);
            vec3 sunDir = normalize(vec3(-0.8, 0.45, 0.65));

            float sunDot = dot(vNormal, sunDir);
            float rim = 1.0 - max(0.0, dot(vNormal, viewDir));
            float intensity = pow(rim, 3.2);

            float sunFactor = smoothstep(-0.2, 0.5, sunDot);
            vec3 dayAtmosphere  = vec3(0.22, 0.62, 0.95) * (intensity * 1.45);
            vec3 nightAtmosphere = vec3(0.03, 0.09, 0.28) * (intensity * 0.22);

            vec3 finalColor = mix(nightAtmosphere, dayAtmosphere, sunFactor);
            float alpha = intensity * (0.18 + sunFactor * 0.68);

            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
      });
      const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      earthGroup.add(atmosphereMesh);

      // 6. 3D Gyroscope Gimbal Rings
      // Outer azimuth ring
      const gimbalOuterGeo = new THREE.TorusGeometry(1.62, 0.011, 16, 120);
      const gimbalOuterMat = new THREE.MeshStandardMaterial({
        color: 0x1e2c45,
        roughness: 0.35,
        metalness: 0.85,
        emissive: 0x0c172e,
        emissiveIntensity: 0.35,
      });
      const gimbalOuter = new THREE.Mesh(gimbalOuterGeo, gimbalOuterMat);
      gimbalOuter.rotation.x = Math.PI / 6;
      scene.add(gimbalOuter);

      // Middle axial ring (23.5° Earth tilt)
      const gimbalMiddle = new THREE.Group();
      gimbalMiddle.rotation.z = (23.5 * Math.PI) / 180;
      scene.add(gimbalMiddle);

      const gimbalMiddleGeo = new THREE.TorusGeometry(1.46, 0.008, 16, 120);
      const gimbalMiddleMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.2,
        metalness: 0.9,
        emissive: 0x0284c7,
        emissiveIntensity: 0.6,
      });
      const gimbalMiddleMesh = new THREE.Mesh(gimbalMiddleGeo, gimbalMiddleMat);
      gimbalMiddle.add(gimbalMiddleMesh);

      // Gimbal pivot pins
      const pinGeo = new THREE.SphereGeometry(0.03, 16, 16);
      const pinMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        metalness: 0.95,
        roughness: 0.1,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.7,
      });
      const pin1 = new THREE.Mesh(pinGeo, pinMat);
      pin1.position.set(1.46, 0, 0);
      gimbalMiddle.add(pin1);
      const pin2 = new THREE.Mesh(pinGeo, pinMat);
      pin2.position.set(-1.46, 0, 0);
      gimbalMiddle.add(pin2);

      // 7. Orbiting Sentinel Satellite 3D Mesh
      const satelliteMesh = new THREE.Group();
      const busGeo = new THREE.BoxGeometry(0.04, 0.04, 0.055);
      const busMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
      satelliteMesh.add(new THREE.Mesh(busGeo, busMat));
      const wingGeo = new THREE.BoxGeometry(0.16, 0.004, 0.045);
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.3, emissive: 0x0369a1 });
      satelliteMesh.add(new THREE.Mesh(wingGeo, wingMat));
      const beacon = new THREE.PointLight(0x38bdf8, 0.9, 1.4);
      satelliteMesh.add(beacon);
      gimbalMiddle.add(satelliteMesh);

      sceneRef.current = {
        renderer,
        scene,
        camera,
        earthGroup,
        earthMesh,
        cloudsMesh,
        gimbalOuter,
        gimbalMiddle,
        satelliteMesh,
        satelliteAngle: 0,
      };

      setIsLoading(false);

      // 8. Animation & Gyroscope Physics Render Loop
      let animId: number;
      const renderLoop = () => {
        animId = requestAnimationFrame(renderLoop);
        if (!sceneRef.current) return;

        const { earthGroup, earthMesh, cloudsMesh, gimbalOuter, gimbalMiddle, satelliteMesh } =
          sceneRef.current;

        // Smooth lerp gyroscope rotation based on mouse target
        const lerpFactor = 0.05;
        mouseCurrentRef.current.x +=
          (mouseTargetRef.current.x - mouseCurrentRef.current.x) * lerpFactor;
        mouseCurrentRef.current.y +=
          (mouseTargetRef.current.y - mouseCurrentRef.current.y) * lerpFactor;

        const gyroX = mouseCurrentRef.current.y * 0.42;
        const gyroY = mouseCurrentRef.current.x * 0.72;

        // Apply 3D tilt to parent group
        earthGroup.rotation.x = gyroX;
        earthGroup.rotation.z = -mouseCurrentRef.current.x * 0.12;

        // Slow continuous planetary axial spin
        earthMesh.rotation.y += 0.0016;

        // Independent atmospheric cloud drift
        cloudsMesh.rotation.y += 0.0022;

        // Gyroscope gimbal ring reactive inertia
        gimbalOuter.rotation.x = Math.PI / 6 + gyroX * 0.45;
        gimbalOuter.rotation.y = gyroY * 0.45;
        gimbalMiddle.rotation.y += 0.0028;

        // Orbiting satellite path along middle ring
        sceneRef.current.satelliteAngle += 0.014;
        const satRadius = 1.46;
        satelliteMesh.position.x = Math.cos(sceneRef.current.satelliteAngle) * satRadius;
        satelliteMesh.position.y = Math.sin(sceneRef.current.satelliteAngle) * satRadius;
        satelliteMesh.rotation.z = sceneRef.current.satelliteAngle + Math.PI / 2;

        renderer.render(scene, camera);
      };

      renderLoop();

      // Cleanup for inner scope
      return () => {
        cancelAnimationFrame(animId);
        earthGeometry.dispose();
        earthMaterial.dispose();
        cloudsGeometry.dispose();
        cloudsMaterial.dispose();
        atmosphereGeometry.dispose();
        atmosphereMaterial.dispose();
        gimbalOuterGeo.dispose();
        gimbalOuterMat.dispose();
        gimbalMiddleGeo.dispose();
        gimbalMiddleMat.dispose();
        [dayTexture, nightTexture, specularTexture, bumpTexture, cloudsTexture].forEach((t) => t.dispose());
      };
    }).catch((err) => {
      console.error('[EarthVisual] Failed to load textures:', err);
      setIsLoading(false);
    });

    // Resize Handler
    const handleResize = () => {
      if (!container || !sceneRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      sceneRef.current.camera.aspect = newWidth / newHeight;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Mouse Move Handler for Gyroscope Interaction
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = mountRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    mouseTargetRef.current = { x: x * 2, y: y * 2 };

    setTelemetry({
      pitch: (y * -40).toFixed(1),
      yaw: (x * 40).toFixed(1),
      azimuth: ((x * 80 + 284 + 360) % 360).toFixed(0),
    });
  }, []);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseTargetRef.current = { x: 0, y: 0 };
    setTelemetry({ pitch: '0.0', yaw: '0.0', azimuth: '284' });
  };

  return (
    <div
      ref={mountRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative flex items-center justify-center w-full max-w-[420px] sm:max-w-[480px] lg:max-w-[540px] aspect-square mx-auto select-none cursor-grab active:cursor-grabbing group"
    >
      {/* Loading shimmer while textures download */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-40 pointer-events-none">
          <div
            className="w-[62%] aspect-square rounded-full animate-pulse"
            style={{
              background:
                'radial-gradient(circle at 38% 35%, #1a3a5c 0%, #0d1f38 50%, #060f1e 100%)',
              boxShadow: '0 0 60px 8px rgba(56,189,248,0.18)',
            }}
          />
          <span className="mt-4 text-[10px] font-mono tracking-widest text-cyan-400/70 uppercase animate-pulse">
            Loading NASA Imagery…
          </span>
        </div>
      )}

      {/* 1. Soft Natural Sun-Kissed Optical Limb Glow */}
      <div
        className="absolute -top-6 -left-6 w-60 h-60 rounded-full pointer-events-none z-10"
        style={{
          background:
            'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.5) 0%, rgba(186, 230, 253, 0.25) 25%, rgba(56, 189, 248, 0.08) 55%, transparent 75%)',
          filter: 'blur(20px)',
        }}
      />

      {/* 2. Delicate Atmospheric Cyan/Sapphire Outer Bloom */}
      <div
        className="absolute inset-[-8%] rounded-full pointer-events-none transition-all duration-700 z-0"
        style={{
          background:
            'radial-gradient(circle at 38% 32%, rgba(56, 189, 248, 0.14) 0%, rgba(37, 99, 235, 0.08) 45%, rgba(2, 6, 23, 0) 70%)',
          filter: 'blur(35px)',
          transform: isHovered ? 'scale(1.06)' : 'scale(1)',
        }}
      />

      {/* 3. Live 3D Gyroscope Telemetry HUD (Displays on Hover) */}
      <div
        className={`
          absolute bottom-[-14px] left-1/2 -translate-x-1/2
          flex items-center gap-3 px-3.5 py-1.5 rounded-full
          bg-[#070d1c]/95 border border-cyan-400/40 backdrop-blur-xl shadow-2xl
          transition-all duration-300 pointer-events-none z-30
          ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        `}
      >
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-300 font-bold">
          <Orbit className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <span>3D GYRO</span>
        </div>
        <span className="text-slate-600 text-[10px]">|</span>
        <div className="text-[9px] font-mono text-slate-300">
          PITCH: <span className="text-cyan-400 font-semibold">{telemetry.pitch}°</span> YAW:{' '}
          <span className="text-cyan-400 font-semibold">{telemetry.yaw}°</span>
        </div>
        <span className="text-slate-600 text-[10px]">|</span>
        <div className="text-[9px] font-mono text-amber-300 flex items-center gap-1">
          <Compass className="w-3 h-3" />
          <span>AZ: {telemetry.azimuth}°</span>
        </div>
      </div>

      {/* 4. Live Satellite Telemetry Badge */}
      <div className="absolute top-[18%] left-[78%] flex items-center gap-1.5 bg-[#030712]/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-cyan-400/40 shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-30">
        <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
        <span className="text-[8px] font-mono font-bold tracking-widest text-cyan-200 uppercase">
          SENTINEL-2 ACTIVE
        </span>
      </div>
    </div>
  );
};
