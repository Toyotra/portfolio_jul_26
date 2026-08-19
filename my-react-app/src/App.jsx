import SidePanel from './SidePanel';
import CustomCursor from './CustomCursor';
import AdvertisementRails from './components/AdvertisementRails/AdvertisementRails';
import StartupLoader from './components/LoadingScreen';
import LiquidChrome from './components/LiquidChrome';
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
  const [show, setShow] = useState(
    () => window.innerWidth / window.innerHeight >= 0.75
  );

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

const faceConfigs = {

  home: {
    position: [0, 0, 1.1],
    rotation: [0, 0, 0],
  },

  experiences: {
    position: [0, 0, -1.1],
    rotation: [0, Math.PI, 0],
  },


  projects: {
    position: [-1.1, 0, 0],
    rotation: [0, -Math.PI / 2, 0],
  },

  skills: {
    position: [1.1, 0, 0],
    rotation: [0, Math.PI / 2, 0],
  },


  cat: {
    position: [0, 1.1, 0],
    rotation: [-Math.PI / 2, 0, 0],
  },

  contact: {
    position: [0, -1.1, 0],
    rotation: [Math.PI / 2, 0, 0],
  },

  

  
};

const sideOrder = [
  'home',
  'experiences',
  'projects',
  'skills',
  'cat',
  'contact',
];

/*
 * The tilt is kept separate from the face rotation.
 * This is the SAME tilt you had originally.
 */
const TILT = new THREE.Euler(
  0.3,
  -0.25,
  0,
  'XYZ'
);

function Cube({
  cubeRef,
  targetQuaternion,
  selectedProject,
  onSelectProject,
}) {
  const { width, height } = useThree((state) => state.size);

  const cubeScale = useMemo(() => {
    const minWidth = 1024;
    const maxWidth = 1920;
    const minHeight = 700;
    const maxHeight = 1200;

    const minScale = 0.65;
    const maxScale = 1.2;

    const widthScale =
      width <= minWidth
        ? minScale
        : width >= maxWidth
          ? maxScale
          : minScale +
            (maxScale - minScale) *
              ((width - minWidth) / (maxWidth - minWidth));

    const heightScale =
      height <= minHeight
        ? minScale
        : height >= maxHeight
          ? maxScale
          : minScale +
            (maxScale - minScale) *
              ((height - minHeight) / (maxHeight - minHeight));

    return Math.min(widthScale, heightScale);
  }, [width, height]);

  useFrame(() => {
    if (!cubeRef.current) return;

    /*
     * Smoothly interpolate the quaternion instead of
     * independently interpolating X/Y/Z Euler angles.
     *
     * This prevents the cube from taking a weird path
     * when switching between X-axis and Y-axis faces.
     */
    cubeRef.current.quaternion.slerp(targetQuaternion, 0.08);
  });

  return (
    <group
      ref={cubeRef}
      scale={cubeScale}
      position={[0.08, 0, 0]}
    >
      {sideOrder.map((side) => {
        const config = faceConfigs[side];
        const FaceComponent = faceComponents[side];

        return (
          <group
            key={side}
            position={config.position}
            rotation={config.rotation}
          >
            <Html
              center
              transform
              distanceFactor={1.72}
              style={{
                width: 512,
                height: 512,
              }}
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
      })}
    </group>
  );
}

function Scene({
  cubeRef,
  targetQuaternion,
  selectedProject,
  onSelectProject,
}) {
  return (
    <>
      <ambientLight intensity={0.5} />

      <pointLight
        position={[5, 5, 5]}
        intensity={1.0}
        color="#ffffff"
      />

      <pointLight
        position={[-5, 3, -5]}
        intensity={0.5}
        color="#e0e0e0"
      />

      <pointLight
        position={[0, -4, -3]}
        intensity={0.4}
        color="#ffffff"
      />

      <Cube
        cubeRef={cubeRef}
        targetQuaternion={targetQuaternion}
        selectedProject={selectedProject}
        onSelectProject={onSelectProject}
      />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
        rotateSpeed={0.4}
      />
    </>
  );
}

function App() {
  const [activeSide, setActiveSide] = useState('home');

  /*
   * The initial orientation is exactly the same as before:
   * [0.3, -0.25, 0]
   */
  const initialQuaternion = useMemo(() => {
    return new THREE.Quaternion().setFromEuler(TILT);
  }, []);

  const [targetQuaternion, setTargetQuaternion] =
    useState(initialQuaternion);

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

    /*
     * Get the rotation of the selected FACE itself.
     *
     * For example:
     *
     * home        -> [0, 0, 0]
     * skills      -> [0, +90°, 0]
     * projects    -> [0, -90°, 0]
     * cat         -> [-90°, 0, 0]
     * contact     -> [+90°, 0, 0]
     * experiences -> [0, 180°, 0]
     */
    const faceEuler = new THREE.Euler(
      faceConfigs[side].rotation[0],
      faceConfigs[side].rotation[1],
      faceConfigs[side].rotation[2],
      'XYZ'
    );

    const faceQuaternion = new THREE.Quaternion()
      .setFromEuler(faceEuler);

    /*
     * We need the inverse of the face rotation because
     * we are rotating the CUBE, not the face itself.
     *
     * This brings the selected face back to the camera.
     */
    const faceAlignment = faceQuaternion.clone().invert();

    /*
     * Apply the SAME tilt that the home screen starts with.
     *
     * IMPORTANT:
     *
     * We multiply the tilt AFTER aligning the face.
     *
     * This means:
     *
     * 1. Face points toward camera.
     * 2. Entire cube gets the same visual tilt.
     *
     * This is fundamentally different from adding
     * Euler angles together.
     */
    const tiltQuaternion = new THREE.Quaternion()
      .setFromEuler(TILT);

    const finalQuaternion = tiltQuaternion
      .clone()
      .multiply(faceAlignment);

    setTargetQuaternion(finalQuaternion);
  }, []);

  const handleProjectSelect = useCallback(
    (project) => {
      if (activeSide !== 'projects') {
        handleSideClick('projects');
      }

      setSelectedProject(project);
    },
    [activeSide, handleSideClick]
  );

  return (
    <div className="app-container">
      <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 0 }}>
        <LiquidChrome
          baseColor={[0.4, 0.01, 0.01]}
          speed={0.2}
          amplitude={0.9}
          interactive
        />
      </div>

      <BackgroundArchitecture />

      {!startupComplete && (
        <StartupLoader onComplete={handleStartupComplete} />
      )}

      <CustomCursor />

      {showSidePanels && <SidePanel side="left" />}
      {showSidePanels && <SidePanel side="right" />}

      {showRails && (
        <AdvertisementRails
          activeSide={activeSide}
          onProjectSelect={handleProjectSelect}
        />
      )}

      <nav className="sidebar">
        {Object.keys(faceConfigs).map((side) => (
          <button
            key={side}
            className={
              'sidebar-btn ' +
              (activeSide === side ? 'active' : '')
            }
            onClick={() => handleSideClick(side)}
          >
            {side === 'home'
              ? 'Jad Menkara'
              : side.charAt(0).toUpperCase() + side.slice(1)}
          </button>
        ))}
      </nav>

      <div className="canvas-container">
        <Canvas
          style={{
            width: '100%',
            height: '100%',
          }}
          resize={{ scroll: false }}
          camera={{
            position: [0, 0, 5.5],
            fov: 45,
          }}
          gl={{
            antialias: true,
          }}
        >
          <Scene
            cubeRef={cubeRef}
            targetQuaternion={targetQuaternion}
            selectedProject={selectedProject}
            onSelectProject={handleProjectSelect}
          />
        </Canvas>
      </div>
    </div>
  );
}

export default App;