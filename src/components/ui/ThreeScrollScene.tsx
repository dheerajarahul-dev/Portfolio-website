"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type SceneState = {
  scroll: number;
  pointerX: number;
  pointerY: number;
};

function makeGrid(size: number, divisions: number, color: THREE.ColorRepresentation) {
  const grid = new THREE.GridHelper(size, divisions, color, color);
  grid.material.transparent = true;
  grid.material.opacity = 0.18;
  grid.material.fog = false;
  return grid;
}

function makeWirePanel(width: number, height: number, depth: number, color: THREE.ColorRepresentation) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const edges = new THREE.EdgesGeometry(geometry);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.42,
    fog: false,
  });
  return new THREE.LineSegments(edges, material);
}

function makeWaveform(color: THREE.ColorRepresentation) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < 96; i += 1) {
    const x = (i / 95 - 0.5) * 13;
    const y = Math.sin(i * 0.55) * 0.34 + Math.sin(i * 0.17) * 0.22;
    points.push(new THREE.Vector3(x, y, 0));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.62,
    fog: false,
  });
  return new THREE.Line(geometry, material);
}

function makeTimelineSpine(color: THREE.ColorRepresentation) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < 8; i += 1) {
    const y = 3.8 - i * 1.05;
    points.push(new THREE.Vector3(-2.8, y, 0), new THREE.Vector3(2.8, y, 0));
    points.push(new THREE.Vector3(-2.8 + i * 0.18, y, 0), new THREE.Vector3(-1.8 + i * 0.18, y - 0.42, 0));
    points.push(new THREE.Vector3(1.7 - i * 0.12, y, 0), new THREE.Vector3(2.8 - i * 0.12, y + 0.38, 0));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.68,
    fog: false,
  });
  return new THREE.LineSegments(geometry, material);
}

function makePlayIcon(color: THREE.ColorRepresentation) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.4, 0.08, 8, 64),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.45,
      fog: false,
    })
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const triangle = new THREE.Mesh(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.35, -0.45, 0),
      new THREE.Vector3(0.75, 0, 0),
      new THREE.Vector3(-0.35, 0.45, 0),
    ]),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      fog: false,
    })
  );
  triangle.rotation.x = Math.PI / 2;
  group.add(triangle);
  return group;
}

function makeClapperboard(color: THREE.ColorRepresentation) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 0.16, 2.4),
    new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity: 0.42,
      roughness: 0.35,
      metalness: 0.1,
      fog: false,
    })
  );
  body.position.y = 0.06;
  group.add(body);

  const slate = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 0.24, 0.4),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
      roughness: 0.5,
      metalness: 0,
      fog: false,
    })
  );
  slate.position.set(0, 0.28, -0.9);
  group.add(slate);

  const stripes = new THREE.Group();
  for (let i = 0; i < 3; i += 1) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.16, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.55, fog: false })
    );
    strip.position.set(-1.3 + i * 1.3, 0.28, -0.68);
    stripes.add(strip);
  }
  group.add(stripes);

  return group;
}

export default function ThreeScrollScene() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const state: SceneState = {
      scroll: 0,
      pointerX: 0,
      pointerY: 0,
    };

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.026);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 140);
    camera.position.set(0, 2.8, 18);
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.domElement.className = "three-scroll-canvas";
    host.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    const key = new THREE.DirectionalLight(0x9f7aea, 2.2);
    key.position.set(8, 8, 10);
    scene.add(ambient, key);

    const backGrid = makeGrid(42, 28, 0x7c3aed);
    backGrid.position.set(0, -4.5, -10);
    backGrid.rotation.x = Math.PI / 2;
    root.add(backGrid);

    const floorGrid = makeGrid(52, 34, 0x2dd4bf);
    floorGrid.position.set(0, -5.2, 0);
    root.add(floorGrid);

    const panels = new THREE.Group();
    const panelColor = 0xc4b5fd;
    for (let i = 0; i < 9; i += 1) {
      const panel = makeWirePanel(4.8 + (i % 3) * 0.6, 2.8, 0.12, panelColor);
      panel.position.set((i % 3 - 1) * 6.2, (Math.floor(i / 3) - 1) * 3.1, -i * 3.7);
      panel.rotation.set(0.12 * i, (i % 2 === 0 ? 1 : -1) * 0.34, 0.04 * i);
      panels.add(panel);
    }
    panels.position.set(0, 1.2, 1);
    root.add(panels);

    const rings = new THREE.Group();
    for (let i = 0; i < 5; i += 1) {
      const geometry = new THREE.TorusGeometry(2.2 + i * 0.55, 0.018, 8, 96);
      const material = new THREE.MeshBasicMaterial({
        color: i % 2 ? 0x2dd4bf : 0x7c3aed,
        transparent: true,
        opacity: 0.44,
        wireframe: true,
        fog: false,
      });
      const ring = new THREE.Mesh(geometry, material);
      ring.position.set(i % 2 ? -7.5 : 7.5, 1.6 - i * 1.1, -6 - i * 4.5);
      ring.rotation.set(Math.PI / 2.6, 0.25 * i, 0.1 * i);
      rings.add(ring);
    }
    root.add(rings);

    const waveformA = makeWaveform(0xffffff);
    waveformA.position.set(-1, -1.7, -2);
    waveformA.rotation.y = -0.18;
    root.add(waveformA);

    const waveformB = makeWaveform(0x2dd4bf);
    waveformB.position.set(0.8, 3.7, -14);
    waveformB.rotation.set(0.3, 0.25, 0);
    root.add(waveformB);

    const spine = makeTimelineSpine(0xddd6fe);
    spine.position.set(0, 0.2, -5.4);
    spine.rotation.set(-0.12, 0.18, 0);
    root.add(spine);

    const clapper = makeClapperboard(0x1e293b);
    clapper.position.set(-8.2, 2.1, -7.5);
    clapper.rotation.set(0.12, -0.22, 0.14);
    root.add(clapper);

    const playIcon = makePlayIcon(0xf472b6);
    playIcon.position.set(7.1, 1.6, -11.2);
    playIcon.rotation.set(0.16, 0.38, 0);
    root.add(playIcon);

    const foregroundSpine = makeTimelineSpine(0x2dd4bf);
    foregroundSpine.position.set(0, -0.15, -10);
    foregroundSpine.scale.set(0.58, 0.58, 0.58);
    foregroundSpine.renderOrder = 4;
    foregroundSpine.traverse((object) => {
      if (object instanceof THREE.LineSegments) {
        object.material.depthTest = false;
        object.material.opacity = 0.52;
      }
    });
    camera.add(foregroundSpine);

    const resize = () => {
      const { innerWidth, innerHeight } = window;
      camera.aspect = innerWidth / Math.max(1, innerHeight);
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight, false);
    };

    const updateScroll = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      state.scroll = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    };

    const updatePointer = (event: PointerEvent) => {
      state.pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
      state.pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    let frame = 0;
    let last = 0;
    const animate = (time: number) => {
      const delta = Math.min(0.035, (time - last) / 1000 || 0.016);
      last = time;

      const drift = state.scroll * 34;
      camera.position.x += (state.pointerX * 1.4 - camera.position.x) * 0.035;
      camera.position.y += (2.8 - state.pointerY * 0.9 + state.scroll * 2.4 - camera.position.y) * 0.035;
      camera.position.z += (18 - state.scroll * 7 - camera.position.z) * 0.035;
      camera.lookAt(state.pointerX * 1.8, -0.2 + state.scroll * 2.5, -9 - drift * 0.18);

      root.rotation.y += ((state.pointerX * 0.16) - root.rotation.y) * 0.04;
      root.rotation.x += ((state.pointerY * -0.08) - root.rotation.x) * 0.04;
      panels.position.z = drift * 0.36;
      panels.rotation.y += delta * 0.08;
      rings.rotation.z += delta * 0.11;
      spine.rotation.z = Math.sin(time * 0.00035) * 0.035;
      spine.position.y = 0.2 + Math.sin(time * 0.0005) * 0.18;
      foregroundSpine.rotation.z = state.scroll * 0.28 + Math.sin(time * 0.0004) * 0.025;
      foregroundSpine.position.x = state.pointerX * 0.28;
      foregroundSpine.position.y = -0.15 - state.pointerY * 0.16;
      waveformA.position.z = -2 + drift * 0.22;
      waveformB.position.z = -14 + drift * 0.3;

      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(animate);
    };

    resize();
    updateScroll();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("pointermove", updatePointer, { passive: true });
    frame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("pointermove", updatePointer);
      host.removeChild(renderer.domElement);
      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments || object instanceof THREE.Line) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) {
            material.forEach((entry) => entry.dispose());
          } else {
            material.dispose();
          }
        }
      });
    };
  }, []);

  return <div ref={hostRef} className="three-scroll-scene" aria-hidden="true" />;
}
