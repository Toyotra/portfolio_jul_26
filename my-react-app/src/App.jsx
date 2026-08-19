import SidePanel from './SidePanel';
import CustomCursor from './CustomCursor';
import AdvertisementRails from './components/AdvertisementRails/AdvertisementRails';
import StartupLoader from './components/LoadingScreen';
import BackgroundArchitecture from './BackgroundArchitecture';
import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
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

const useShowSidePanels = () => {
  const [show, setShow] = useState(() => window.innerWidth / window.innerHeight >= 0.75);

  useEffect(() => {
    let raf;
    const handleResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setShow(window.innerWidth / window.innerHeight >= 0.75);
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return show;
};

const rotations = {
  home: [0, 0, 0],
  skills: [0, -Math.PI / 2, 0],
  experiences: [0, Math.PI, 0],
  projects: [0, Math.PI / 2, 0],
  cat: [Math.PI / 2, 0, 0],
  contact: [-Math.PI / 2, 0, 0],
};

const sideOrder = ['skills', 'projects', 'cat', 'contact', 'home', 'experiences'];

const faceConfigs = {
  skills: { position: [1.1, 0, 0], rotation: [0, Math.PI / 2, 0] },
  projects: { position: [-1.1, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  cat: { position: [0, 1.1, 0], rotation: [-Math.PI / 2, 0, 0] },
  contact: { position: [0, -1.1, 0], rotation: [Math.PI / 2, 0, 0] },
  home: { position: [0, 0, 1.1], rotation: [0, 0, 0] },
  experiences: { position: [0, 0, -1.1], rotation: [0, Math.PI, 0] },
};

function Cube({ cubeRef, targetRotation, selectedProject, onSelectProject }) {
  const { width, height } = useThree((state) => state.size);

  const cubeScale = useMemo(() => {
    const minWidth = 1024;
    const maxWidth = 1920;
    const minHeight = 700;
    const maxHeight = 1200;
    const minScale = 0.65;
    const maxScale = 1.2;

    const widthScale = width <= minWidth ? minScale : width >= maxWidth ? maxScale : minScale + (maxScale - minScale) * ((width - minWidth) / (maxWidth - minWidth));
    const heightScale = height <= minHeight ? minScale : height >= maxHeight ? maxScale : minScale + (maxScale - minScale) * ((height - minHeight) / (maxHeight - minHeight));

    return Math.min(widthScale, heightScale);
  }, [width, height]);

  useFrame((state) => {
    if (!cubeRef.current) return;
    const { clock } = state;
    const tiltX = 0.3;
    const tiltY = -0.25;
    const tiltZ = 0;
    cubeRef.current.rotation.x = THREE.MathUtils.lerp(
      cubeRef.current.rotation.x,
      targetRotation[0] + tiltX,
      0.08
    );
    cubeRef.current.rotation.y = THREE.MathUtils.lerp(
      cubeRef.current.rotation.y,
      targetRotation[1] + tiltY,
      0.08
    );
    cubeRef.current.rotation.z = THREE.MathUtils.lerp(
      cubeRef.current.rotation.z,
      targetRotation[2] + tiltZ,
      0.08
    );
  });

  return (
    <group ref={cubeRef} scale={cubeScale} position={[0.08, 0, 0]}>
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
                <FaceComponent
                  selectedProject={selectedProject}
                  onSelectProject={onSelectProject}
                />
              </div>
            </Html>
          </group>
        );
      }      )}
    </group>
  );
}

function Scene({ cubeRef, targetRotation, selectedProject, onSelectProject }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={1.0} color="#ffffff" />
      <pointLight position={[-5, 3, -5]} intensity={0.5} color="#e0e0e0" />
      <pointLight position={[0, -4, -3]} intensity={0.4} color="#ffffff" />
      <Cube
        cubeRef={cubeRef}
        targetRotation={targetRotation}
        selectedProject={selectedProject}
        onSelectProject={onSelectProject}
      />
      <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} rotateSpeed={0.4} />
    </>
  );
}

function App() {
  const [activeSide, setActiveSide] = useState('home');
  const [targetRotation, setTargetRotation] = useState(rotations.home);
  const [startupComplete, setStartupComplete] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const cubeRef = useRef();
  const { showRails } = useShowAdRails();
  const showSidePanels = useShowSidePanels();

  const handleStartupComplete = useCallback(() => {
    setStartupComplete(true);
  }, []);

  const handleSideClick = useCallback((side) => {
    setActiveSide(side);
    setTargetRotation(rotations[side]);
  }, []);

  const handleProjectSelect = useCallback((project) => {
    if (activeSide !== 'projects') {
      handleSideClick('projects');
    }
    setSelectedProject(project);
  }, [activeSide, handleSideClick]);

  return (
    <div className="app-container">
      <BackgroundArchitecture />
      {!startupComplete && <StartupLoader onComplete={handleStartupComplete} />}
      <CustomCursor />
      {showSidePanels && <SidePanel side="left" />}
      {showSidePanels && <SidePanel side="right" />}
      {showRails && <AdvertisementRails activeSide={activeSide} onProjectSelect={handleProjectSelect} />}

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
        <Scene
          cubeRef={cubeRef}
          targetRotation={targetRotation}
          selectedProject={selectedProject}
          onSelectProject={handleProjectSelect}
        />
      </Canvas>
      </div>
    </div>
  );
}

export default App;
