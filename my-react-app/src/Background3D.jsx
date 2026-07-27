import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 4000;

function MouseTracker({ mouse }) {
  useFrame((state) => {
    mouse.current.x = state.mouse.x;
    mouse.current.y = state.mouse.y;
  });
  return null;
}

function MagneticField({ mouse }) {
  const pointsRef = useRef(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 1.2 + Math.random() * 3.5;
      pos[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 9;
      pos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius - 2;
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array;

    pointsRef.current.rotation.y += delta * 0.03;
    pointsRef.current.rotation.x += delta * 0.01;

    const mx = mouse.current.x;
    const my = -mouse.current.y;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      const x = pos[idx];
      const y = pos[idx + 1];
      const z = pos[idx + 2];

      const dist = Math.sqrt(x * x + z * z);
      const safeDist = Math.max(dist, 0.001);
      const angle = Math.atan2(z, x);

      const curlX = -Math.sin(angle) / safeDist * 0.45;
      const curlZ = Math.cos(angle) / safeDist * 0.45;
      const pullY = -y * 0.035;

      const mouseInfluenceX = mx * 1.5;
      const mouseInfluenceY = my * 1.0;

      pos[idx] += curlX * delta + mouseInfluenceX * delta + (Math.random() - 0.5) * 0.005;
      pos[idx + 1] += pullY * delta + mouseInfluenceY * delta + 0.015 * delta * 60;
      pos[idx + 2] += curlZ * delta + (Math.random() - 0.5) * 0.005;

      if (Math.abs(y) > 4.5) {
        pos[idx + 1] = -Math.sign(y) * 4.5;
        const ra = Math.random() * Math.PI * 2;
        const rr = 1.0 + Math.random() * 3;
        pos[idx] = Math.cos(ra) * rr;
        pos[idx + 2] = Math.sin(ra) * rr - 2;
      }

      if (dist > 5.5 || dist < 0.2) {
        const ra = Math.random() * Math.PI * 2;
        const rr = 1.0 + Math.random() * 3;
        pos[idx] = Math.cos(ra) * rr;
        pos[idx + 2] = Math.sin(ra) * rr - 2;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const colors = useMemo(() => {
    const cols = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = i / PARTICLE_COUNT;
      const color = new THREE.Color();
      color.setHSL(0.58 + t * 0.22, 0.9, 0.55 + Math.sin(t * Math.PI * 7) * 0.3);
      cols[i * 3] = color.r;
      cols[i * 3 + 1] = color.g;
      cols[i * 3 + 2] = color.b;
    }
    return cols;
  }, []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={PARTICLE_COUNT}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export default function Background3D() {
  const mouse = useRef({ x: 0, y: 0 });

  return (
    <div className="bg-3d">
      <Canvas camera={{ position: [0, 0, 7], fov: 50 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.6} />
        <pointLight position={[-10, -10, -10]} intensity={0.4} />
        <MouseTracker mouse={mouse} />
        <MagneticField mouse={mouse} />
      </Canvas>
    </div>
  );
}
