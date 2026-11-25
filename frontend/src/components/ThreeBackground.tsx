import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface ThreeBackgroundProps {
  theme?: 'dark' | 'light';
}

export const ThreeBackground: React.FC<ThreeBackgroundProps> = ({ theme = 'dark' }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isLight = theme === 'light';
    const bgColor = isLight ? 0xf8fafc : 0x030712;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(bgColor, isLight ? 0.0014 : 0.0018);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    camera.position.z = 320;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(bgColor, 1);
    container.appendChild(renderer.domElement);

    // Neural Network Nodes (Particles)
    const particleCount = 110;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities: { x: number; y: number; z: number }[] = [];
    const colors = new Float32Array(particleCount * 3);

    // Color palette: Cyan (#00f0ff), Electric Blue (#38bdf8), Violet (#8b5cf6)
    const colorOptions = [
      new THREE.Color(0x00f0ff),
      new THREE.Color(0x38bdf8),
      new THREE.Color(0x06b6d4),
      new THREE.Color(0x8b5cf6),
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 600;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 450;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 350;

      velocities.push({
        x: (Math.random() - 0.5) * 0.35,
        y: (Math.random() - 0.5) * 0.35,
        z: (Math.random() - 0.5) * 0.25,
      });

      const col = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle Material
    const pMaterial = new THREE.PointsMaterial({
      size: isLight ? 5.0 : 4.5,
      vertexColors: true,
      transparent: true,
      opacity: isLight ? 0.95 : 0.85,
      blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, pMaterial);
    scene.add(particles);

    // Line Connections between neighboring nodes
    const maxConnections = particleCount * 6;
    const linePositions = new Float32Array(maxConnections * 6);
    const lineColors = new Float32Array(maxConnections * 6);
    const lineGeometry = new THREE.BufferGeometry();
    
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: isLight ? 0.22 : 0.35,
      blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
    });

    const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineSegments);

    // Subtle ambient lighting
    const ambientLight = new THREE.AmbientLight(0x06b6d4, 0.4);
    scene.add(ambientLight);

    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX - window.innerWidth / 2) * 0.08;
      mouseY = (e.clientY - window.innerHeight / 2) * 0.08;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Handle Window Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    const connectionDistance = 110;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth camera interpolation toward mouse
      targetX += (mouseX - targetX) * 0.04;
      targetY += (mouseY - targetY) * 0.04;
      camera.position.x = targetX;
      camera.position.y = -targetY;
      camera.lookAt(scene.position);

      // Rotate neural particle field gently
      particles.rotation.y += 0.0006;
      lineSegments.rotation.y += 0.0006;

      const pos = geometry.attributes.position.array as Float32Array;
      let lineIndex = 0;

      // Update particle positions & wrap around
      for (let i = 0; i < particleCount; i++) {
        pos[i * 3] += velocities[i].x;
        pos[i * 3 + 1] += velocities[i].y;
        pos[i * 3 + 2] += velocities[i].z;

        if (pos[i * 3] < -300 || pos[i * 3] > 300) velocities[i].x = -velocities[i].x;
        if (pos[i * 3 + 1] < -220 || pos[i * 3 + 1] > 220) velocities[i].y = -velocities[i].y;
        if (pos[i * 3 + 2] < -180 || pos[i * 3 + 2] > 180) velocities[i].z = -velocities[i].z;

        // Connect nearby nodes
        for (let j = i + 1; j < particleCount; j++) {
          const dx = pos[i * 3] - pos[j * 3];
          const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
          const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < connectionDistance && lineIndex < maxConnections - 1) {
            const alpha = 1.0 - dist / connectionDistance;

            linePositions[lineIndex * 6] = pos[i * 3];
            linePositions[lineIndex * 6 + 1] = pos[i * 3 + 1];
            linePositions[lineIndex * 6 + 2] = pos[i * 3 + 2];

            linePositions[lineIndex * 6 + 3] = pos[j * 3];
            linePositions[lineIndex * 6 + 4] = pos[j * 3 + 1];
            linePositions[lineIndex * 6 + 5] = pos[j * 3 + 2];

            // Cyan to violet gradient
            lineColors[lineIndex * 6] = 0.0;
            lineColors[lineIndex * 6 + 1] = 0.94 * alpha;
            lineColors[lineIndex * 6 + 2] = 1.0 * alpha;

            lineColors[lineIndex * 6 + 3] = 0.54 * alpha;
            lineColors[lineIndex * 6 + 4] = 0.36 * alpha;
            lineColors[lineIndex * 6 + 5] = 0.96 * alpha;

            lineIndex++;
          }
        }
      }

      geometry.attributes.position.needsUpdate = true;
      lineGeometry.setDrawRange(0, lineIndex * 2);
      lineGeometry.attributes.position.needsUpdate = true;
      lineGeometry.attributes.color.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      lineGeometry.dispose();
      pMaterial.dispose();
      lineMaterial.dispose();
      renderer.dispose();
    };
  }, [theme]);

  const isLight = theme === 'light';

  return (
    <div
      ref={mountRef}
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${isLight ? 'opacity-40' : 'opacity-65'} transition-opacity duration-500`}
      style={{
        background: isLight 
          ? 'radial-gradient(ellipse at 50% 20%, rgba(224, 242, 254, 0.4) 0%, #f8fafc 100%)'
          : 'radial-gradient(ellipse at 50% 20%, rgba(15, 23, 42, 0.4) 0%, #030712 100%)'
      }}
    />
  );
};
