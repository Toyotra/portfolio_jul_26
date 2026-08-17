import { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
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
  cat: [Math.PI / 2, 0, 0],
  contact: [-Math.PI / 2, 0, 0],
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
      color: '#00D4FF',
      linewidth: 0.04,
      transparent: true,
      opacity: 0.7,
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
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.12)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  return (
    <mesh position={[0, -1.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
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

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.8, 0]}>
      <planeGeometry args={[14, 14]} />
      <meshBasicMaterial color="#020508" />
    </mesh>
  );
}

function CameraRig({ activeScreen }) {
  const { camera } = useThree();
  const returningRef = useRef(false);

  useFrame((state, delta) => {
    const defaultPos = new THREE.Vector3(0, 0, 5.5);
    const defaultLook = new THREE.Vector3(0, 0, 0);
    let target = defaultPos.clone();
    let lookAt = defaultLook.clone();

    if (activeScreen === 'left') {
      target.set(-2.2, 0.35, 2.2);
      lookAt.set(-2.6, 0, -1.4);
      returningRef.current = false;
    } else if (activeScreen === 'right') {
      target.set(2.2, 0.35, 2.2);
      lookAt.set(2.6, 0, -1.4);
      returningRef.current = false;
    } else if (returningRef.current) {
      target = defaultPos.clone();
      lookAt = defaultLook.clone();
    }

    const dist = camera.position.distanceTo(target);
    if (dist < 0.05 && !activeScreen) {
      returningRef.current = false;
      return;
    }

    if (!activeScreen && dist > 0.05) {
      returningRef.current = true;
    }

    camera.position.lerp(target, delta * 2.5);
    const currentLook = new THREE.Vector3();
    camera.getWorldDirection(currentLook);
    const desiredLook = lookAt.clone().sub(camera.position).normalize();
    currentLook.lerp(desiredLook, delta * 2.5);
    camera.lookAt(camera.position.clone().add(currentLook));
  });

  return null;
}

function TVScreen({ position, rotation, active }) {
  const meshRef = useRef();
  const [images, setImages] = useState([]);
  const groupRef = useRef();

  useFrame(() => {
    if (meshRef.current && groupRef.current) {
      meshRef.current.lookAt(0, 0, 5.5);
    }
  });

  useEffect(() => {
    if (active) {
      const urls = Array.from({ length: 6 }, () => `https://picsum.photos/seed/${Math.random().toString(36).slice(2)}/256/256`);
      setImages(urls);
    }
  }, [active]);

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[3.2, 1.4]} />
        <meshBasicMaterial color="#080c12" />
      </mesh>
      {active && (
        <Html center transform distanceFactor={1.72} style={{ width: 640, height: 280 }}>
          <div style={tvStyle}>
            {images.map((src, idx) => (
              <img key={idx} src={src} alt="" style={tvImgStyle} />
            ))}
          </div>
        </Html>
      )}
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[3.4, 1.6, 0.08]} />
        <meshStandardMaterial color="#0b0f14" roughness={0.7} metalness={0.4} />
      </mesh>
    </group>
  );
}

const tvStyle = {
  width: '640px',
  height: '280px',
  background: '#05070a',
  border: '1px solid rgba(0, 212, 255, 0.45)',
  borderRadius: '2px',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  padding: '8px',
  boxSizing: 'border-box',
  boxShadow: '0 0 0 1px rgba(0, 212, 255, 0.15), inset 0 0 18px rgba(0, 212, 255, 0.08)',
};

const tvImgStyle = {
  width: 'calc(50% - 3px)',
  height: '132px',
  objectFit: 'cover',
  border: '1px solid rgba(0, 212, 255, 0.12)',
};

function Scene({ cubeRef, targetRotation, activeScreen, controlsEnabled }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[5, 5, 5]} intensity={1.2} color="#fefefe" />
      <pointLight position={[-5, 3, -5]} intensity={0.6} color="#e0f0ff" />
      <pointLight position={[0, -4, -3]} intensity={0.8} color="#00B4D8" />
      <pointLight position={[3, 2, -4]} intensity={0.5} color="#7B2FFF" />
      <CameraRig activeScreen={activeScreen} />
      <Cube cubeRef={cubeRef} targetRotation={targetRotation} />
      <TVScreen
        position={[-2.6, 0, -1.4]}
        rotation={[0, 0.52, 0]}
        active={activeScreen === 'left'}
      />
      <TVScreen
        position={[2.6, 0, -1.4]}
        rotation={[0, -0.52, 0]}
        active={activeScreen === 'right'}
      />
      <FloorShadow />
      <Floor />
      <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} rotateSpeed={0.4} enabled={controlsEnabled} />
    </>
  );
}

function App() {
  const [activeSide, setActiveSide] = useState('home');
  const [targetRotation, setTargetRotation] = useState(rotations.home);
  const [activeScreen, setActiveScreen] = useState(null);
  const [controlsEnabled, setControlsEnabled] = useState(true);
  const cubeRef = useRef();

  const handleSideClick = (side) => {
    if (activeScreen) {
      setActiveScreen(null);
      setControlsEnabled(false);
      setTimeout(() => {
        setControlsEnabled(true);
        setActiveSide(side);
        setTargetRotation(rotations[side]);
      }, 900);
    } else {
      setActiveSide(side);
      setTargetRotation(rotations[side]);
    }
  };

  const handleTVClick = (screen) => {
    if (screen === activeScreen) {
      setActiveScreen(null);
      setControlsEnabled(false);
      setTimeout(() => setControlsEnabled(true), 900);
    } else {
      setActiveScreen(screen);
      setControlsEnabled(false);
    }
  };

  return (
    <div className="app-container">
      <nav className="sidebar">
        <button
          className={'sidebar-btn ' + (activeScreen === 'left' ? 'active' : '')}
          onClick={() => handleTVClick('left')}
        >
          TV L
        </button>
        {Object.keys(rotations).map((side) => (
          <button
            key={side}
            className={'sidebar-btn ' + (activeSide === side ? 'active' : '')}
            onClick={() => handleSideClick(side)}
          >
            {side === 'home' ? 'Jad Menkara' : side.charAt(0).toUpperCase() + side.slice(1)}
          </button>
        ))}
        <button
          className={'sidebar-btn ' + (activeScreen === 'right' ? 'active' : '')}
          onClick={() => handleTVClick('right')}
        >
          TV R
        </button>
      </nav>

      <div className="canvas-container">
        <Canvas
          camera={{ position: [0, 0, 5.5], fov: 45 }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={['#020508']} />
          <Scene cubeRef={cubeRef} targetRotation={targetRotation} activeScreen={activeScreen} controlsEnabled={controlsEnabled} />
        </Canvas>
      </div>
    </div>
  );
}

export default App;
