// js/chai3d.js — Hero-only 3D chai cup with realistic ceramic texture

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('chai3d-container');
  if (!container || typeof THREE === 'undefined') return;

  /* ---- SCENE ---- */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 5, 17);
  camera.lookAt(0, 1.5, 0);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  /* ---- CUP GROUP ---- */
  const cupGroup = new THREE.Group();
  scene.add(cupGroup);

  /* ---- PROCEDURAL CERAMIC TEXTURE ---- */
  // Create a realistic porcelain surface with subtle noise grain
  function makeCeramicTexture(size) {
    const cv = document.createElement('canvas');
    cv.width = size; cv.height = size;
    const ctx = cv.getContext('2d');

    // Base white porcelain
    ctx.fillStyle = '#f0ece8';
    ctx.fillRect(0, 0, size, size);

    // Add subtle warm gradient (slightly warmer at bottom)
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, 'rgba(255,252,248,0.6)');
    grad.addColorStop(1, 'rgba(230,220,210,0.4)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Add fine grain noise for porcelain texture
    for (let i = 0; i < size * size * 0.4; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const brightness = Math.random() > 0.5 ? 255 : 220;
      const alpha = Math.random() * 0.04;
      ctx.fillStyle = `rgba(${brightness},${brightness},${brightness},${alpha})`;
      ctx.fillRect(x, y, 1, 1);
    }

    // Subtle horizontal flow lines (ceramic firing marks)
    for (let i = 0; i < 8; i++) {
      const y = Math.random() * size;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(size * 0.3, y + (Math.random() - 0.5) * 4,
                        size * 0.7, y + (Math.random() - 0.5) * 4,
                        size, y);
      ctx.strokeStyle = `rgba(200,195,190,${Math.random() * 0.06})`;
      ctx.lineWidth = 0.5 + Math.random();
      ctx.stroke();
    }

    return new THREE.CanvasTexture(cv);
  }

  function makeRoughnessTexture(size) {
    const cv = document.createElement('canvas');
    cv.width = size; cv.height = size;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#555';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < size * size * 0.3; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const v = Math.floor(60 + Math.random() * 100);
      const a = Math.random() * 0.5;
      ctx.fillStyle = `rgba(${v},${v},${v},${a})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
    return new THREE.CanvasTexture(cv);
  }

  const ceramicTex = makeCeramicTexture(512);
  const roughTex   = makeRoughnessTexture(512);

  /* ---- MATERIALS ---- */
  const ceramicMat = new THREE.MeshPhysicalMaterial({
    map: ceramicTex,
    roughnessMap: roughTex,
    metalness: 0.0,
    roughness: 0.25,
    clearcoat: 0.9,
    clearcoatRoughness: 0.08,
    side: THREE.DoubleSide,
    reflectivity: 0.5,
  });

  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: 0x7A300A,
    metalness: 0.05,
    roughness: 0.3,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
    emissive: 0x2A0E00,
    emissiveIntensity: 0.3,
  });

  /* ---- CUP BODY (LatheGeometry) ---- */
  const profilePoints = [];
  profilePoints.push(new THREE.Vector2(0.0, 0.0));
  profilePoints.push(new THREE.Vector2(0.6, 0.05));
  profilePoints.push(new THREE.Vector2(1.2, 0.3));
  profilePoints.push(new THREE.Vector2(1.9, 0.9));
  profilePoints.push(new THREE.Vector2(2.4, 1.8));
  profilePoints.push(new THREE.Vector2(2.55, 2.5));
  profilePoints.push(new THREE.Vector2(2.6, 2.75));
  profilePoints.push(new THREE.Vector2(2.55, 2.85));
  profilePoints.push(new THREE.Vector2(2.4, 2.8));
  profilePoints.push(new THREE.Vector2(2.2, 2.5));
  profilePoints.push(new THREE.Vector2(2.0, 1.8));
  profilePoints.push(new THREE.Vector2(1.6, 1.0));
  profilePoints.push(new THREE.Vector2(1.2, 0.5));
  profilePoints.push(new THREE.Vector2(0.7, 0.25));
  profilePoints.push(new THREE.Vector2(0.0, 0.18));

  const cupMesh = new THREE.Mesh(new THREE.LatheGeometry(profilePoints, 80), ceramicMat);
  cupGroup.add(cupMesh);

  /* ---- LIQUID ---- */
  const liquidMesh = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.05, 0.12, 64), liquidMat);
  liquidMesh.position.y = 2.36;
  cupGroup.add(liquidMesh);

  /* ---- HANDLE ---- */
  const handleMesh = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.28, 32, 64), ceramicMat);
  handleMesh.position.set(-2.55, 1.5, 0);
  cupGroup.add(handleMesh);

  /* ---- SAUCER ---- */
  const saucerPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.5, 0.05),
    new THREE.Vector2(2.0, 0.1),
    new THREE.Vector2(3.2, 0.25),
    new THREE.Vector2(3.5, 0.3),
    new THREE.Vector2(3.4, 0.45),
    new THREE.Vector2(3.0, 0.5),
    new THREE.Vector2(1.8, 0.3),
    new THREE.Vector2(0.0, 0.22),
  ];
  const saucerMesh = new THREE.Mesh(new THREE.LatheGeometry(saucerPts, 80), ceramicMat);
  saucerMesh.position.y = -0.55;
  cupGroup.add(saucerMesh);

  /* ---- STEAM PARTICLES ---- */
  const steamCount = 50;
  const steamPositions = new Float32Array(steamCount * 3);
  const steamVelocities = [];
  for (let i = 0; i < steamCount; i++) {
    const s = 1.8;
    steamPositions[i*3]   = (Math.random()-0.5)*s;
    steamPositions[i*3+1] = 2.8 + Math.random()*3.5;
    steamPositions[i*3+2] = (Math.random()-0.5)*s;
    steamVelocities.push({
      x: (Math.random()-0.5)*0.012,
      y: 0.018 + Math.random()*0.022,
      z: (Math.random()-0.5)*0.012,
    });
  }
  const steamGeo = new THREE.BufferGeometry();
  steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPositions, 3));
  const sc = document.createElement('canvas'); sc.width=32; sc.height=32;
  const sx = sc.getContext('2d');
  const sg = sx.createRadialGradient(16,16,0,16,16,16);
  sg.addColorStop(0,'rgba(255,255,255,0.7)'); sg.addColorStop(1,'rgba(255,255,255,0)');
  sx.fillStyle=sg; sx.fillRect(0,0,32,32);
  const steamMat = new THREE.PointsMaterial({
    size: 2.8, map: new THREE.CanvasTexture(sc),
    transparent:true, opacity:0.45, depthWrite:false,
    blending:THREE.AdditiveBlending, color:0xE8BF6A
  });
  const steamParticles = new THREE.Points(steamGeo, steamMat);
  scene.add(steamParticles);

  /* ---- LIGHTING ---- */
  scene.add(new THREE.AmbientLight(0xfff5e6, 1.0));

  const keyLight = new THREE.DirectionalLight(0xfff0d0, 2.5);
  keyLight.position.set(6, 12, 8);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 1.8);
  rimLight.position.set(-8, 4, -6);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0xD45C1E, 1.2, 25);
  fillLight.position.set(0, -3, 6);
  scene.add(fillLight);

  const topLight = new THREE.PointLight(0xE8BF6A, 1.0, 20);
  topLight.position.set(0, 10, 0);
  scene.add(topLight);

  /* ---- INTERACTION ---- */
  let targetRotX = 0.25, targetRotY = -0.35;
  let mouseX = 0, mouseY = 0;
  let halfW = window.innerWidth/2, halfH = window.innerHeight/2;
  let scrollRotation = 0;

  // Mouse (desktop)
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX - halfW) * 0.0006;
    mouseY = (e.clientY - halfH) * 0.0006;
  });

  // Touch (mobile) — drag to rotate
  let lastTouchX = 0, lastTouchY = 0;
  document.addEventListener('touchstart', e => {
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    const dx = e.touches[0].clientX - lastTouchX;
    const dy = e.touches[0].clientY - lastTouchY;
    mouseX += dx * 0.002;
    mouseY += dy * 0.002;
    // Clamp
    mouseX = Math.max(-0.5, Math.min(0.5, mouseX));
    mouseY = Math.max(-0.3, Math.min(0.3, mouseY));
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
  }, { passive: true });

  // Track scroll to drive rotation
  window.addEventListener('scroll', () => {
    const menuTop = document.getElementById('menu-section')?.offsetTop || 99999;
    const progress = Math.min(window.scrollY / menuTop, 1);
    scrollRotation = progress * Math.PI * 3; // Up to 1.5 full rotations
  }, { passive: true });

  /* ---- ANIMATION LOOP (no scroll-based animation) ---- */
  const clock = new THREE.Clock();
  cupGroup.rotation.x = 0.25;
  cupGroup.rotation.y = -0.35;

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Mouse tilt with soft limits
    targetRotX = Math.max(-0.1, Math.min(0.5, 0.25 + mouseY));
    targetRotY = -0.35 + mouseX + scrollRotation; // scroll rotation drives Y
    cupGroup.rotation.x += (targetRotX - cupGroup.rotation.x) * 0.06;
    cupGroup.rotation.y += (targetRotY - cupGroup.rotation.y) * 0.04; // slightly slower for smooth spin

    // Gentle idle bob only
    cupGroup.position.y = Math.sin(t * 1.4) * 0.18 - 1.2;

    // Steam animation
    const pos = steamParticles.geometry.attributes.position.array;
    for (let i = 0; i < steamCount; i++) {
      pos[i*3]   += steamVelocities[i].x;
      pos[i*3+1] += steamVelocities[i].y;
      pos[i*3+2] += steamVelocities[i].z;
      if (pos[i*3+1] > 7.5) {
        pos[i*3]   = (Math.random()-0.5)*1.8;
        pos[i*3+1] = 2.8;
        pos[i*3+2] = (Math.random()-0.5)*1.8;
      }
    }
    steamParticles.geometry.attributes.position.needsUpdate = true;
    steamParticles.rotation.y = t * 0.04;

    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => {
    halfW = window.innerWidth/2; halfH = window.innerHeight/2;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  animate();
});
