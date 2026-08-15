import { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sparkles, Html } from '@react-three/drei';
import * as THREE from 'three';
import './App.css';

const faceHtml = {
  home: `<div style="width:100%;height:100%;background:linear-gradient(135deg,#12122a,#0a0a1a);padding:20px;box-sizing:border-box;font-family:sans-serif;color:#fff;">
  <div style="width:100%;height:100%;border:3px solid rgba(0,255,255,0.2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;">
    <h1 style="color:#00ffff;text-shadow:0 0 24px #00ffff;font-size:32px;margin:0;">Jad Menkara</h1>
    <p style="color:#e0e0ff;font-size:14px;margin:0;">Full Stack Developer</p>
    <p style="color:#e0e0ff;font-size:14px;margin:0;">Creative Technologist</p>
    <p style="color:#e0e0ff;font-size:14px;margin:0;">Building digital experiences</p>
  </div>
</div>`,
  about: `<div style="width:100%;height:100%;background:linear-gradient(135deg,#12122a,#0a0a1a);padding:20px;box-sizing:border-box;font-family:sans-serif;color:#fff;">
  <div style="width:100%;height:100%;border:3px solid rgba(255,0,255,0.2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;">
    <h1 style="color:#ff00ff;text-shadow:0 0 24px #ff00ff;font-size:32px;margin:0;">About Me</h1>
    <p style="color:#e0e0ff;font-size:14px;margin:0;">Passionate about code</p>
    <p style="color:#e0e0ff;font-size:14px;margin:0;">Design + Engineering</p>
    <p style="color:#e0e0ff;font-size:14px;margin:0;">Making ideas real</p>
  </div>
</div>`,
  experiences: `<div style="width:100%;height:100%;background:linear-gradient(135deg,#12122a,#0a0a1a);padding:20px;box-sizing:border-box;font-family:sans-serif;color:#fff;">
  <div style="width:100%;height:100%;border:3px solid rgba(191,90,242,0.2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;">
    <h1 style="color:#bf5af2;text-shadow:0 0 24px #bf5af2;font-size:32px;margin:0;">Experiences</h1>
    <p style="color:#e0e0ff;font-size:14px;margin:0;">5+ years coding</p>
    <p style="color:#e0e0ff;font-size:14px;margin:0;">React, Three.js, Python</p>
    <p style="color:#e0e0ff;font-size:14px;margin:0;">Open source contributor</p>
  </div>
</div>`,
  projects: `<div style="width:100%;height:100%;background:linear-gradient(135deg,#12122a,#0a0a1a);padding:20px;box-sizing:border-box;font-family:sans-serif;color:#fff;">
  <div style="width:100%;height:100%;border:3px solid rgba(255,214,10,0.2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;">
    <h1 style="color:#ffd60a;text-shadow:0 0 24px #ffd60a;font-size:32px;margin:0;">Projects</h1>
    <p style="color:#e0e0ff;font-size:14px;margin:0;">Interactive 3D web apps</p>
    <p style="color:#e0e0ff;font-size:14px;margin:0;">AI-powered tools</p>
    <p style="color:#e0e0ff;font-size:14px;margin:0;">Creative experiments</p>
  </div>
</div>`,
  cat: `<div style="width:100%;height:100%;background:linear-gradient(135deg,#12122a,#0a0a1a);padding:20px;box-sizing:border-box;font-family:sans-serif;color:#fff;">
  <div style="width:100%;height:100%;border:3px solid rgba(255,159,10,0.2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;">
    <h1 style="color:#ff9f0a;text-shadow:0 0 24px #ff9f0a;font-size:32px;margin:0;">Cat</h1>
    <p style="color:#e0e0ff;font-size:14px;margin:0;">Meow!</p>
    <p style="color:#e0e0ff;font-size:14px;margin:0;">Digital companion</p>
    <p style="color:#e0e0ff;font-size:14px;margin:0;">Always curious</p>
  </div>
</div>`,
  contact: `<div style="width:100%;height:100%;background:linear-gradient(135deg,#12122a,#0a0a1a);padding:20px;box-sizing:border-box;font-family:sans-serif;color:#fff;">
  <div style="width:100%;height:100%;border:3px solid rgba(48,209,88,0.2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;">
    <h1 style="color:#30d158;text-shadow:0 0 24px #30d158;font-size:32px;margin:0;">Contact</h1>
    <p style="color:#e0e0ff;font-size:14px;margin:0;">Let's connect</p>
    <p style="color:#e0e0ff;font-size:14px;margin:0;">hello@jadmenkara67.com</p>
    <p style="color:#e0e0ff;font-size:14px;margin:0;">github.com/jadmenkara</p>
  </div>
</div>`,
};

const rotations = {
  home: [0, 0, 0],
  about: [0, -Math.PI / 2, 0],
  experiences: [0, Math.PI, 0],
  projects: [0, Math.PI / 2, 0],
  cat: [-Math.PI / 2, 0, 0],
  contact: [Math.PI / 2, 0, 0],
};

const sideOrder = ['about', 'projects', 'cat', 'contact', 'home', 'experiences'];

const faceConfigs = {
  about: { position: [1.1, 0, 0], rotation: [0, Math.PI / 2, 0] },
  projects: { position: [-1.1, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  cat: { position: [0, 1.1, 0], rotation: [-Math.PI / 2, 0, 0] },
  contact: { position: [0, -1.1, 0], rotation: [Math.PI / 2, 0, 0] },
  home: { position: [0, 0, 1.1], rotation: [0, 0, 0] },
  experiences: { position: [0, 0, -1.1], rotation: [0, Math.PI, 0] },
};

function Cube({ cubeRef, targetRotation }) {
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
    <group ref={cubeRef}>
      {sideOrder.map((side) => {
        const config = faceConfigs[side];
        return (
          <group key={side} position={config.position} rotation={config.rotation}>
            <Html
              center
              transform
              distanceFactor={1.5}
              style={{ width: 512, height: 512 }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'auto',
                  boxSizing: 'border-box',
                }}
                dangerouslySetInnerHTML={{ __html: faceHtml[side] }}
              />
            </Html>
          </group>
        );
      })}
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
      <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} rotateSpeed={0.4} />
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
      style={{
        '--mouse-x': mousePos.x,
        '--mouse-y': mousePos.y,
        '--hue1': mousePos.x * 360,
        '--hue2': (mousePos.x * 360 + 80) % 360,
        '--hue3': (mousePos.x * 360 + 160) % 360,
      }}
    >
      <nav className="sidebar">
        {Object.keys(rotations).map((side) => (
          <button
            key={side}
            className={'sidebar-btn ' + (activeSide === side ? 'active' : '')}
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
