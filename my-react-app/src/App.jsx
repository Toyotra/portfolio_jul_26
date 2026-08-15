import { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import './App.css';

const faceContent = {
  home: {
    title: 'Jad Menkara',
    lines: ['Full Stack Developer', 'Creative Technologist', 'Building digital experiences'],
    color: '#00ffff',
  },
  about: {
    title: 'About Me',
    lines: ['Passionate about code', 'Design + Engineering', 'Making ideas real'],
    color: '#ff00ff',
  },
  experiences: {
    title: 'Experiences',
    lines: ['5+ years coding', 'React, Three.js, Python', 'Open source contributor'],
    color: '#bf5af2',
  },
  projects: {
    title: 'Projects',
    lines: ['Interactive 3D web apps', 'AI-powered tools', 'Creative experiments'],
    color: '#ffd60a',
  },
  cat: {
    title: 'Cat',
    lines: ['Meow!', 'Digital companion', 'Always curious'],
    color: '#ff9f0a',
  },
  contact: {
    title: 'Contact',
    lines: ['Let\'s connect', 'hello@jadmenkara.com', 'github.com/jadmenkara'],
    color: '#30d158',
  },
};

const rotations = {
  home: [0, 0, 0],
  about: [0, -Math.PI / 2, 0],
  experiences: [0, Math.PI, 0],
  projects: [0, Math.PI / 2, 0],
  cat: [-Math.PI / 2, 0, 0],
  contact: [Math.PI / 2, 0, 0],
};

function createFaceTexture(content) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, '#12122a');
  gradient.addColorStop(1, '#0a0a1a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = `${content.color}44`;
  ctx.lineWidth = 3;
  ctx.strokeRect(15, 15, 482, 482);

  const cx = 256;
  let y = 180;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 42px Montserrat, sans-serif';
  ctx.fillStyle = content.color;
  ctx.shadowColor = content.color;
  ctx.shadowBlur = 24;
  ctx.fillText(content.title, cx, y);
  ctx.shadowBlur = 0;

  y += 60;
  ctx.font = '18px JetBrains Mono, monospace';
  ctx.fillStyle = '#e0e0ff';
  content.lines.forEach((line) => {
    ctx.fillText(line, cx, y);
    y += 36;
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const sideOrder = ['about', 'projects', 'cat', 'contact', 'home', 'experiences'];

function Cube({ cubeRef, targetRotation }) {
  const materials = useMemo(() => {
    return sideOrder.map((side) => {
      const texture = createFaceTexture(faceContent[side]);
      return new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.25,
        metalness: 0.3,
      });
    });
  }, []); // sideOrder is a module-level constant

  const edgesGeometry = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(2.2, 2.2, 2.2)),
    []
  );

  useFrame((state) => {
    if (!cubeRef.current) return;
    const { clock } = state;
    cubeRef.current.rotation.x = THREE.MathUtils.lerp(
      cubeRef.current.rotation.x,
      targetRotation[0],
      0.08
    );
    cubeRef.current.rotation.y = THREE.MathUtils.lerp(
      cubeRef.current.rotation.y,
      targetRotation[1],
      0.08
    );
    cubeRef.current.rotation.z = THREE.MathUtils.lerp(
      cubeRef.current.rotation.z,
      targetRotation[2],
      0.08
    );
    cubeRef.current.position.y = Math.sin(clock.elapsedTime * 0.8) * 0.08;
  });

  return (
    <group>
      <mesh ref={cubeRef} position={[0, 0, 0]}>
        <boxGeometry args={[2.2, 2.2, 2.2]} />
        {materials.map((mat, i) => (
          <primitive key={i} object={mat} attach={`material-${i}`} />
        ))}
      </mesh>
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial color="#00ffff" transparent opacity={0.85} />
      </lineSegments>
    </group>
  );
}

function FloorShadow() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(0, 255, 255, 0.35)');
    gradient.addColorStop(0.4, 'rgba(255, 0, 255, 0.12)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  return (
    <mesh position={[0, -1.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[5.5, 5.5]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function Scene({ cubeRef, targetRotation }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={1.2} color="#ff00ff" />
      <pointLight position={[-5, 3, -5]} intensity={0.7} color="#00ffff" />
      <pointLight position={[0, -5, 0]} intensity={0.4} color="#bf5af2" />
      <Sparkles count={40} scale={3.5} size={1.5} speed={0.4} color="#00ffff" opacity={0.6} />
      <Cube cubeRef={cubeRef} targetRotation={targetRotation} />
      <FloorShadow />
      <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.4} />
    </>
  );
}

function App() {
  const [activeSide, setActiveSide] = useState('home');
  const [targetRotation, setTargetRotation] = useState(rotations.home);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const cubeRef = useRef();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSideClick = (side) => {
    setActiveSide(side);
    setTargetRotation(rotations[side]);
  };

  return (
    <div
      className="app-container"
      style={{ '--mouse-x': `${mousePos.x}`, '--mouse-y': `${mousePos.y}` }}
    >
      <nav className="sidebar">
        {Object.keys(rotations).map((side) => (
          <button
            key={side}
            className={`sidebar-btn ${activeSide === side ? 'active' : ''}`}
            onClick={() => handleSideClick(side)}
          >
            {side === 'home' ? 'Jad Menkara' : side.charAt(0).toUpperCase() + side.slice(1)}
          </button>
        ))}
      </nav>

      <div className="canvas-container">
        <Canvas
          camera={{ position: [0, 0, 5.5], fov: 45 }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={['#0a0a1a']} />
          <Scene cubeRef={cubeRef} targetRotation={targetRotation} />
        </Canvas>
      </div>
    </div>
  );
}

export default App;
