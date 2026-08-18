import SidePanel from './SidePanel';
import CustomCursor from './CustomCursor';
import AdvertisementRails from './components/AdvertisementRails/AdvertisementRails';
import StartupLoader from './components/LoadingScreen';
import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import * as THREE from 'three';
import './App.css';
import './SidePanel.css';
import { faceComponents } from './components/faces';

const useShowAdRails = () => {
  const [showRails, setShowRails] = useState(() => window.innerWidth > 1024);

  useEffect(() => {
    let raf;
    const handleResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setShowRails(window.innerWidth > 1024);
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return { showRails };
};

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
      color: '#000000',
      linewidth: 0.035,
      transparent: true,
      opacity: 0.5,
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

function Scene({ cubeRef, targetRotation }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={1.0} color="#ffffff" />
      <pointLight position={[-5, 3, -5]} intensity={0.5} color="#e0e0e0" />
      <pointLight position={[0, -4, -3]} intensity={0.4} color="#ffffff" />
      <Cube cubeRef={cubeRef} targetRotation={targetRotation} />
      <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} rotateSpeed={0.4} />
    </>
  );
}

function App() {
  const [activeSide, setActiveSide] = useState('home');
  const [targetRotation, setTargetRotation] = useState(rotations.home);
  const [startupComplete, setStartupComplete] = useState(false);
  const cubeRef = useRef();
  const { showRails } = useShowAdRails();

  const handleStartupComplete = useCallback(() => {
    setStartupComplete(true);
  }, []);

  const handleSideClick = (side) => {
    setActiveSide(side);
    setTargetRotation(rotations[side]);
  };

  return (
    <div className="app-container">
      {!startupComplete && <StartupLoader onComplete={handleStartupComplete} />}
      <CustomCursor />
      <SidePanel side="left" />
      <SidePanel side="right" />
      {showRails && <AdvertisementRails activeSide={activeSide} />}

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
        style={{ width: '100%', height: '100%' }}
        resize={{ scroll: false }}
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{ antialias: true }}
      >
        <Scene cubeRef={cubeRef} targetRotation={targetRotation} />
      </Canvas>
      </div>
    </div>
  );
}

export default App;
