import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { ARButton as ThreeARButton } from 'three/examples/jsm/webxr/ARButton';

export default function App() {
  const containerRef = useRef(null);

  useEffect(() => {
    // Escena y cámara
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Botón AR
    const arButton = ThreeARButton.createButton(renderer, { requiredFeatures: ['hit-test'] });
    Object.assign(arButton.style, {
      position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: '999'
    });
    document.body.appendChild(arButton);

    // Luz
    scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1));

    // Hit test variables
    let hitTestSource = null;
    let hitTestSourceRequested = false;
    let reticle;
    let placed = false;

    // Sesión AR start
    renderer.xr.addEventListener('sessionstart', async () => {
      const session = renderer.xr.getSession();
      const refSpace = await session.requestReferenceSpace('viewer');
      hitTestSource = await session.requestHitTestSource({ space: refSpace });
      hitTestSourceRequested = true;

      // Reticle
      const geo = new THREE.RingGeometry(0.1, 0.15, 32).rotateX(-Math.PI/2);
      const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      reticle = new THREE.Mesh(geo, mat);
      reticle.visible = false;
      scene.add(reticle);

      // On tap select
      session.addEventListener('select', () => {
        if (reticle.visible && !placed) {
          const loader = new GLTFLoader();
          loader.load('/models/sillon.glb', gltf => {
            const model = gltf.scene;
            model.scale.set(0.5,0.5,0.5);
            model.position.copy(reticle.position);
            scene.add(model);
            placed = true;
          });
        }
      });
    });

    // Loop
    renderer.setAnimationLoop((time, frame) => {
      if (frame && hitTestSourceRequested) {
        const refSpace = renderer.xr.getReferenceSpace();
        const hits = frame.getHitTestResults(hitTestSource);
        if (hits.length) {
          const pose = hits[0].getPose(refSpace);
          reticle.visible = true;
          reticle.position.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
        }
      }
      renderer.render(scene, camera);
    });

    // Cleanup
    return () => {
      renderer.setAnimationLoop(null);
      document.body.removeChild(arButton);
      if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} />;
}