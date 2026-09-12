import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Float } from '@react-three/drei';
import CarpetModel from './CarpetModel';

function LoaderFallback() {
  return (
    <mesh>
      <boxGeometry args={[3.6, 0.04, 2.4]} />
      <meshStandardMaterial color="#2A221C" roughness={0.8} />
    </mesh>
  );
}

export default function CarpetScene({ activeTextureUrl }) {
  const controlsRef = useRef();

  return (
    <div className="w-full h-full relative three-canvas-container">
      <Canvas
        shadows
        camera={{ position: [0, 2.8, 3.8], fov: 42 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        {/* Warm Studio Lighting */}
        <ambientLight intensity={0.85} color="#FFF8EE" />
        
        {/* Key Light: Warm directional sun from top-left */}
        <directionalLight
          position={[5, 8, 4]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={20}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
          shadow-bias={-0.0001}
          color="#FFF2DC"
        />

        {/* Fill Light: Soft cool bounce from opposite corner */}
        <directionalLight position={[-5, 4, -3]} intensity={0.4} color="#E2E8F0" />
        
        {/* Soft Uplight simulating architectural floor bounce */}
        <pointLight position={[0, -1, 0]} intensity={0.2} color="#D8CCA3" />

        <Suspense fallback={<LoaderFallback />}>
          <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.12}>
            <CarpetModel activeTextureUrl={activeTextureUrl} />
          </Float>

          {/* Realistic Contact Shadow on floor */}
          <ContactShadows
            position={[0, -0.3, 0]}
            opacity={0.7}
            scale={7}
            blur={1.8}
            far={2.5}
            color="#0F0C0A"
          />
        </Suspense>

        {/* Constrained Smooth Orbit Controls */}
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={true}
          minDistance={2.4}
          maxDistance={5.8}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          dampingFactor={0.05}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}
