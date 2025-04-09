
import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Float, Text3D, Center, Sparkles, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function Brain(props: any) {
  const mesh = useRef<THREE.Mesh>(null!);
  
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.getElapsedTime() * 0.15;
    }
  });

  return (
    <mesh ref={mesh} {...props}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="#9b87f5" wireframe />
    </mesh>
  );
}

function FloatingParticles() {
  return (
    <Sparkles 
      count={50} 
      size={4} 
      scale={6} 
      speed={0.4}
      color="#7E69AB" 
      opacity={0.5}
    />
  );
}

function MemoraBrand() {
  return (
    <Float
      speed={2}
      rotationIntensity={0.5}
      floatIntensity={1}
    >
      <Center>
        <Text3D
          font="/fonts/inter_bold.json"
          size={0.5}
          height={0.1}
          curveSegments={12}
        >
          Memora
          <meshStandardMaterial color="#9b87f5" />
        </Text3D>
      </Center>
    </Float>
  );
}

export default function ThreeScene() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Create a dummy font file for the scene
    const createDummyFont = async () => {
      const fontData = {
        "glyphs": {},
        "familyName": "Inter Bold",
        "ascender": 1,
        "descender": 0,
        "underlinePosition": -0.1,
        "underlineThickness": 0.05,
        "boundingBox": {"yMin": -0.25, "xMin": -0.1, "yMax": 1, "xMax": 1},
        "resolution": 1000,
        "original_font_information": {"format": 0, "copyright": "", "fontFamily": "", "fontSubfamily": "", "uniqueID": "", "fullName": "", "version": "", "postScriptName": ""}
      };
      
      const fontsDir = await window.fetch('/fonts');
      if (!fontsDir.ok) {
        try {
          await fetch('/fonts/inter_bold.json', {
            method: 'HEAD'
          });
        } catch (e) {
          const fontBlob = new Blob([JSON.stringify(fontData)], {type: 'application/json'});
          const fontUrl = URL.createObjectURL(fontBlob);
          console.log("Created dummy font for development");
        }
      }
    };
    
    createDummyFont();
    
    return () => setIsMounted(false);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="h-full w-full">
      <Canvas className="touch-none" camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={0.5} />
        <FloatingParticles />
        <group position={[0, 0, 0]}>
          <Float speed={2} rotationIntensity={0.2} floatIntensity={1}>
            <Brain position={[0, 0, 0]} scale={1.5} />
          </Float>
        </group>
        <OrbitControls 
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 2 - 0.5} 
          maxPolarAngle={Math.PI / 2 + 0.5} 
        />
      </Canvas>
    </div>
  );
}
