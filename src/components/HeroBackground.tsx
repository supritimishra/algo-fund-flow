import { useEffect, useRef } from 'react';

const HeroBackground = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cleanup = () => {};
    const mount = mountRef.current;
    if (!mount) return;

    // Dynamically import three to avoid build-time dependency requirement.
    (async () => {
      let THREE: any;
      try {
  // prevent Vite from statically resolving/attempting to prebundle when three isn't installed
  // the `@vite-ignore` comment tells Vite to skip import analysis for this dynamic import
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  THREE = await import(/* @vite-ignore */ 'three');
      } catch (err) {
        // If three isn't installed, degrade gracefully and do nothing.
        // Developer should `npm install three` to enable the background.
        // eslint-disable-next-line no-console
        console.warn('three.js not available — hero background disabled', err);
        return;
      }

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 1000);
      camera.position.z = 50;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mount.appendChild(renderer.domElement);

      // Particles
      const particlesCount = 400;
      const positions = new Float32Array(particlesCount * 3);
      for (let i = 0; i < particlesCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 200;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        color: 0x4fd1c5,
        size: 1.6,
        transparent: true,
        opacity: 0.9,
      });

      const particles = new THREE.Points(geometry, material);
      scene.add(particles);

      let frameId: number;
      const clock = new THREE.Clock();

      const onResize = () => {
        if (!mount) return;
        camera.aspect = mount.clientWidth / mount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mount.clientWidth, mount.clientHeight);
      };

      window.addEventListener('resize', onResize);

      const animate = () => {
        const elapsed = clock.getElapsedTime();
        particles.rotation.y = elapsed * 0.05;
        particles.rotation.x = Math.sin(elapsed * 0.1) * 0.02;

        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
      };

      animate();

      cleanup = () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
        geometry.dispose();
        material.dispose();
        if (mount && renderer.domElement) {
          mount.removeChild(renderer.domElement);
        }
      };
    })();

    return () => {
      cleanup();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 -z-10" />;
};

export default HeroBackground;
