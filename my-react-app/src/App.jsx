import { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sparkles, Html } from '@react-three/drei';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import * as THREE from 'three';
import './App.css';
import { faceComponents } from './components/faces';

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
  const lineRef = useRef();
  const { width, height } = useThree((state) => state.size);

  const edgeLine = useMemo(() => {
    const s = 1.1;
    const positions = [
      -s, s, s,  s, s, s,
      s, s, s,  s,-s, s,
      s,-s, s, -s,-s, s,
      -s,-s, s, -s, s, s,
      -s, s,-s,  s, s,-s,
      s, s,-s,  s,-s,-s,
      s,-s,-s, -s,-s,-s,
      -s,-s,-s, -s, s,-s,
      -s, s, s, -s, s,-s,
      s, s, s,  s, s,-s,
      s,-s, s,  s,-s,-s,
      -s,-s, s, -s,-s,-s,
    ];
    const geo = new LineGeometry();
    geo.setPositions(positions);
    const mat = new LineMaterial({
      color: '#2a4d7a',
      linewidth: 0.035,
      transparent: true,
      opacity: 0.6,
    });
    mat.resolution.set(width, height);
    const line = new Line2(geo, mat);
    return line;
  }, [width, height]);

  useFrame((state) => {
    if (lineRef.current) {
      lineRef.current.material.resolution.set(width, height);
    }
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
        const FaceComponent = faceComponents[side];
        return (
          <group key={side} position={config.position} rotation={config.rotation}>
            <Html
              center
              transform
              distanceFactor={1.72}
              style={{ width: 512, height: 512 }}
            >
              <div className="face-host">
                <FaceComponent />
              </div>
            </Html>
          </group>
        );
      })}
      <primitive ref={lineRef} object={edgeLine} />
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
    gradient.addColorStop(0, 'rgba(42, 77, 122, 0.12)');
    gradient.addColorStop(0.4, 'rgba(42, 42, 42, 0.03)');
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
      <ambientLight intensity={0.9} />
      <pointLight position={[5, 5, 5]} intensity={0.95} color="#fefefe" />
      <pointLight position={[-5, 3, -5]} intensity={0.7} color="#e8edf8" />
      <pointLight position={[0, -5, 0]} intensity={0.45} color="#2a4d7a" />
      <Sparkles count={40} scale={3.5} size={1.5} speed={0.4} color="#2a4d7a" opacity={0.25} />
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
          '--hue1': 205 + mousePos.x * 20,
          '--hue2': 215 + mousePos.x * 20,
          '--hue3': 195 + mousePos.x * 20,
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
          <color attach="background" args={['#f5f0e6']} />
          <Scene cubeRef={cubeRef} targetRotation={targetRotation} />
        </Canvas>
      </div>
    </div>
  );
}

export default App;
