import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

export default function CarpetModel({ activeTextureUrl }) {
  const meshRef = useRef();

  // Load the selected high-resolution authentic carpet texture
  const texture = useLoader(THREE.TextureLoader, activeTextureUrl);

  // Generate procedural fabric weave bump map
  const bumpMap = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);
    
    // Fine criss-cross weave pattern
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 1;
    for (let i = 0; i < 512; i += 4) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(30, 20);
    return tex;
  }, []);

  // Configure texture filters for ultra-crisp editorial rendering
  useMemo(() => {
    if (texture) {
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 16;
    }
  }, [texture]);

  // Subtle floating idle motion
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.015;
    }
  });

  // Dimensions of the 3D carpet: 3.6 units x 2.4 units, thickness 0.04 units
  const width = 3.6;
  const length = 2.4;
  const thickness = 0.04;

  return (
    <group ref={meshRef}>
      {/* Carpet Top Pile with Authentic Texture & PBR properties */}
      <mesh position={[0, thickness / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[width, thickness, length, 32, 1, 32]} />
        <meshStandardMaterial
          map={texture}
          bumpMap={bumpMap}
          bumpScale={0.012}
          roughness={0.78}
          metalness={0.04}
          envMapIntensity={0.6}
        />
      </mesh>

      {/* Underneath Canvas & Leather Binding Selvage */}
      <mesh position={[0, -0.005, 0]}>
        <boxGeometry args={[width * 1.002, 0.01, length * 1.002]} />
        <meshStandardMaterial
          color="#3A312A"
          roughness={0.9}
        />
      </mesh>

      {/* East End Realistic Cotton Fringes */}
      <group position={[width / 2, thickness / 4, 0]}>
        {Array.from({ length: 36 }).map((_, i) => {
          const zOffset = (i / 35 - 0.5) * (length * 0.96);
          const randAngle = ((i % 5) - 2) * 0.06;
          return (
            <mesh key={`fe-${i}`} position={[0.1, 0, zOffset]} rotation={[0, randAngle, -0.15]}>
              <cylinderGeometry args={[0.007, 0.004, 0.22, 6]} />
              <meshStandardMaterial color="#EAE5D9" roughness={0.95} />
            </mesh>
          );
        })}
      </group>

      {/* West End Realistic Cotton Fringes */}
      <group position={[-width / 2, thickness / 4, 0]}>
        {Array.from({ length: 36 }).map((_, i) => {
          const zOffset = (i / 35 - 0.5) * (length * 0.96);
          const randAngle = ((i % 5) - 2) * 0.06;
          return (
            <mesh key={`fw-${i}`} position={[-0.1, 0, zOffset]} rotation={[0, randAngle, 0.15]}>
              <cylinderGeometry args={[0.007, 0.004, 0.22, 6]} />
              <meshStandardMaterial color="#EAE5D9" roughness={0.95} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
