window.addEventListener("load", () => {
  const lenis = new Lenis();
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  

// 1) Préchargement des images
const images = [];
let loadedMediaCount = 0;

function loadImages() {
  for (let i = 1; i <= 7; i++) {
    const img = new Image();
    img.src = `/assets/img${i}.jpg`;     // <— vos fichiers JPG/PNG
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      images.push(img);
      loadedMediaCount++;
      if (loadedMediaCount === 1) initializeScene();
    };
    img.onerror = () => {
      console.warn(`Image ${i} introuvable.`);
      loadedMediaCount++;
      if (loadedMediaCount === 1) initializeScene();
    };
  }
}

  

  const dragSpeed = 2; 


  function initializeScene() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|Opera Mini/i
    .test(navigator.userAgent);
    
    let autoRotateActive = true;
    const autoRotateSpeed = 0.00002;
    let isScaledDown = false;
    let scaleResetTimeout;
    const scaleResetDelay = 100;
    const shrinkDur = 0.15;
    const resetDur  = 0.4;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector("canvas"),
      antialias: true,
      alpha: true,      
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);


    // POST-PROCESSING : composer + passes
    const composer = new THREE.EffectComposer(renderer);
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    let afterPass;
    if (!isMobile) {
      // Sur desktop uniquement, on ajoute le motion-blur
      afterPass = new THREE.AfterimagePass();
      afterPass.uniforms["damp"].value = 0.75;
      composer.addPass(afterPass);
    }




    const parentWidth = 25;
    const parentHeight = 95;
    const curvature = 35;
    const segmentsX = 100;
    const segmentsY = 100;

    const parentGeometry = new THREE.PlaneGeometry(
      parentWidth,
      parentHeight,
      segmentsX,
      segmentsY
    );

    const positions = parentGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const y = positions[i + 1];
      const distanceFromCenter = Math.abs(y / (parentHeight / 2));
      positions[i + 2] = Math.pow(distanceFromCenter, 2) * curvature;
    }
    parentGeometry.computeVertexNormals();

    const totalSlides = 7;
    const slideHeight = 15;
    const gap = 0.5;
    const cycleHeight = totalSlides * (slideHeight + gap);

    const textureCanvas = document.createElement("canvas");
      // active alpha sur le context
    const ctx = textureCanvas.getContext("2d", { alpha: true });

    textureCanvas.width = 1228;
    textureCanvas.height = 4500;

    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());

    const parentMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });

    const parentMesh = new THREE.Mesh(parentGeometry, parentMaterial);
    parentMesh.position.set(0, 0, 0);
    parentMesh.rotation.x = THREE.MathUtils.degToRad(-40);
    parentMesh.rotation.y = THREE.MathUtils.degToRad(0);
    scene.add(parentMesh);

    const distance = 16;
    const heightOffset = 10;
    const offsetX = distance * Math.sin(THREE.MathUtils.degToRad(0));
    const offsetZ = distance * Math.cos(THREE.MathUtils.degToRad(0));

    camera.position.set(offsetX, heightOffset, offsetZ);
    camera.lookAt(0, 0, 0);
    camera.rotation.z = THREE.MathUtils.degToRad(0);

    const slideTitles = [
      "Crazymon",
      "Crazymon",
      "Crazymon",
      "Crazymon",
      "Crazymon",
      "Crazymon",
      "Crazymon",
    ];

    // ——— Drag-to-scroll ———
  let isDragging = false;
  let startY = 0;
  const canvasEl = document.querySelector('canvas');

  canvasEl.addEventListener('pointerdown', e => {
    isDragging = true;
    startY = e.clientY;
    e.preventDefault();
  });



  window.addEventListener('pointerup', () => { isDragging = false; });
  window.addEventListener('pointercancel', () => { isDragging = false; });
  // ————————————————

    function updateTexture(offset = 0) {
      ctx.clearRect(0, 0, textureCanvas.width, textureCanvas.height);
    
      // taille du titre et padding fixe
      const titleFontSize = 30;  
      const paddingLeft   = 80;   
      const paddingBottom   = 40;  
      ctx.font            = `bold ${titleFontSize}px Dahlia`;
      ctx.textAlign       = "left";
      ctx.textBaseline    = "bottom";
    
    
      const extraSlides = 2;
      const offsetValue = offset * cycleHeight; 
    
      for (let i = -extraSlides; i < totalSlides + extraSlides; i++) {
        // ── calcul de la position Y du slide ──
        let slideY = -i * (slideHeight + gap);
        slideY += offsetValue;
    
        // ── mappe sur la hauteur du canvas de texture ──
        const textureY = (slideY / cycleHeight) * textureCanvas.height;
    
        // ── wrap pour l’effet « infini » ──
        let wrappedY = textureY % textureCanvas.height;
        if (wrappedY < 0) wrappedY += textureCanvas.height;
    
        const slideIndex = ((-i % totalSlides) + totalSlides) % totalSlides;
        const slideRect = {
          x: textureCanvas.width * 0.05,
          y: wrappedY,
          width: textureCanvas.width * 0.9,
          height: (slideHeight / cycleHeight) * textureCanvas.height,
        };
        const img = images[slideIndex];
        if (img) {
          const imgAspect  = img.width  / img.height;
          const rectAspect = slideRect.width / slideRect.height;
          let drawW, drawH, drawX, drawY;
          if (imgAspect > rectAspect) {
            drawH = slideRect.height;
            drawW = drawH * imgAspect;
            drawX = slideRect.x + (slideRect.width - drawW)/2;
            drawY = slideRect.y;
          } else {
            drawW = slideRect.width;
            drawH = drawW / imgAspect;
            drawX = slideRect.x;
            drawY = slideRect.y + (slideRect.height - drawH)/2;
          }
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(
            slideRect.x, slideRect.y,
            slideRect.width, slideRect.height
          );
          ctx.clip();
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          ctx.restore();
    
          // titre en mix-blend
          ctx.save();
          ctx.globalCompositeOperation = "difference";
          ctx.fillStyle = "#ffffff";
          ctx.fillText(
            slideTitles[slideIndex],
            paddingLeft,
            wrappedY + slideRect.height - paddingBottom
          );
          ctx.restore();
        }
        
      }
    
      texture.needsUpdate = true;
    }
    
    

    let currentScroll = 0;       // fraction [0..1[ de la position dans le cycle
    const scrollFactor = 0.0005; // ajuste la vitesse (1 = un cycle complet pour limit px)
    


// WHEEL → mise à jour cyclique
window.addEventListener("wheel", e => {
  e.preventDefault();
  autoRotateActive = false;
  currentScroll += e.deltaY * scrollFactor;
  currentScroll = (currentScroll % 1 + 1) % 1;

  // 2) scale-on-scroll
  if (!isScaledDown) {
    gsap.to(parentMesh.scale, { x:0.7, y:0.7, z:0.7, duration: shrinkDur });
    isScaledDown = true;
  }
  clearTimeout(scaleResetTimeout);
  scaleResetTimeout = setTimeout(() => {
    gsap.to(parentMesh.scale, { x:1, y:1, z:1, duration: resetDur, ease:"power2.out" });
    isScaledDown = false;
  }, scaleResetDelay);

  // 3) mise à jour de la texture + post-processing
  updateTexture(-currentScroll);
  composer.render();
}, { passive: false });

// DRAG → même principe
canvasEl.addEventListener("pointerdown", e => {
  isDragging = true;
  autoRotateActive = false;
  startY = e.clientY;
  canvasEl.setPointerCapture(e.pointerId);

  // ——— Shrink immédiatement et annule tout reset en cours ———
  if (!isScaledDown) {
    gsap.to(parentMesh.scale, {
      x: 0.7, y: 0.7, z: 0.7,
      duration: shrinkDur
    });
    isScaledDown = true;
  }
  clearTimeout(scaleResetTimeout);
});

canvasEl.addEventListener("pointermove", e => {
  if (!isDragging) return;

  // 1) mise à jour cyclique
  const deltaY = startY - e.clientY;
  startY = e.clientY;
  currentScroll = (currentScroll + deltaY * scrollFactor * dragSpeed) % 1;

  // 2) rendu immédiat sans toucher à l’échelle
  updateTexture(-currentScroll);
  composer.render();
});


canvasEl.addEventListener("pointerup", e => {
  isDragging = false;
  canvasEl.releasePointerCapture(e.pointerId);

  scaleResetTimeout = setTimeout(() => {
    gsap.to(parentMesh.scale, {
      x: 1, y: 1, z: 1,
      duration: resetDur,
      ease: "power2.out"
    });
    isScaledDown = false;
  }, scaleResetDelay);
});

canvasEl.addEventListener("pointercancel", e => {
  isDragging = false;
  canvasEl.releasePointerCapture(e.pointerId);

  scaleResetTimeout = setTimeout(() => {
    gsap.to(parentMesh.scale, {
      x: 1, y: 1, z: 1,
      duration: resetDur,
      ease: "power2.out"
    });
    isScaledDown = false;
  }, scaleResetDelay);
});

    
    

    let resizeTimeout;
    window.addEventListener("resize", () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
      }, 250);
    });

    let prevTime = 0;
    function animate(time) {
      // a) auto‐scroll
      if (autoRotateActive) {
        const delta = time - prevTime;
        currentScroll = (currentScroll + delta * autoRotateSpeed) % 1;
      }
      prevTime = time;
  
      // b) Lenis
      lenis.raf(time);
  
      // c) update slide
      updateTexture(-currentScroll);
  
      // d) rendu
      if (isMobile || autoRotateActive) {
        // mobile ou auto‐rotate → render normal
        renderer.render(scene, camera);
      } else {
        // desktop après interaction → motion‐blur
        renderer.clear();
        composer.render();
      }
  
      requestAnimationFrame(animate);
    }
    
    // démarre la boucle
    requestAnimationFrame(animate);
 
  }

  loadImages();

});
