window.addEventListener("load", () => {
  const lenis = new Lenis();
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  

// 1) Préchargement des images
const totalSlides = 7;
const images = new Array(totalSlides);
let loadedMediaCount = 0;

function loadImages() {
  for (let i = 1; i <= totalSlides; i++) {
    const img = new Image();
    img.src         = `/assets/img${i}.jpg`;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      images[i - 1] = img;                // on stocke à l’indice i-1
      loadedMediaCount++;
      if (loadedMediaCount === totalSlides) {
        initializeScene();
      }
    };
    img.onerror = () => {
      console.warn(`Image ${i} introuvable.`);
      images[i - 1] = null;
      loadedMediaCount++;
      if (loadedMediaCount === totalSlides) {
        initializeScene();
      }
    };
  }
}


  

  const dragSpeed = 2; 

  function initializeScene() {
    // détection mobile
    const canvasEl = document.querySelector('canvas');
  const isMobile = /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent);

  const dragFactor  = isMobile ? 1     : 2;

  
    // paramètres slider
    const totalSlides     = images.length;
    const slideHeight     = 15;
    const gap             = 0.5;
    const cycleHeight     = totalSlides * (slideHeight + gap);
    let currentScroll     = 0;       // fraction [0..1)
    const autoRotateSpeed = 0.00002; // vitesse auto-scroll
    let autoRotateActive  = true;
  
    // scale-on-interaction
    let isScaledDown      = false;
    let scaleResetTimeout;
    const shrinkDur       = 0.15;
    const resetDur        = 0.4;
    const scaleResetDelay = 100;
  
    // THREE.js init
    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("canvas"), antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
  
    // post-processing (desktop only)
    const composer   = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));
    if (!isMobile) {
      const after = new THREE.AfterimagePass();
      after.uniforms["damp"].value = 0.75;
      composer.addPass(after);
    }
  
    // plan courbe
    const parentWidth  = 25;
    const parentHeight = 95;
    const curvature    = 35;
    const segX         = 100;
    const segY         = 100;
    const geometry     = new THREE.PlaneGeometry(parentWidth, parentHeight, segX, segY);
    // appliquer la courbure
    const pos = geometry.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      const y = pos[i+1], d = Math.abs(y/(parentHeight/2));
      pos[i+2] = Math.pow(d,2)*curvature;
    }
    geometry.computeVertexNormals();
  
    // texture-canvas
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width  = 1228;
    textureCanvas.height = 4500;
    const ctx     = textureCanvas.getContext("2d");
    const texture = new THREE.CanvasTexture(textureCanvas);
  
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const mesh     = new THREE.Mesh(geometry, material);
    mesh.rotation.x = THREE.MathUtils.degToRad(-40);
    scene.add(mesh);
  
    // position caméra
    const dist = 16, hOff = 10;
    camera.position.set(dist * Math.sin(0), hOff, dist * Math.cos(0));
    camera.lookAt(0,0,0);
  
    // titrage
    const slideTitles = [ "Crazymon", "Crazymon", "Crazymon", "Crazymon", "Crazymon", "Crazymon", "Crazymon" ];
  
    // helper : dessine toutes les images dans le canvas
    function updateTexture(offset=0) {
      ctx.clearRect(0,0,textureCanvas.width,textureCanvas.height);
      const extra = 2;
      const offsetPx = offset * cycleHeight;
      const rectH = (slideHeight/cycleHeight)*textureCanvas.height;
      const rectW = textureCanvas.width * 0.9;
      const padL  = 80, padB = 40, fontSize = 30;
  
      ctx.font = `bold ${fontSize}px Dahlia`;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
  
      for (let i = -extra; i < totalSlides+extra; i++) {
        let y = -i*(slideHeight+gap) + offsetPx;
        let ty = (y/cycleHeight)*textureCanvas.height;
        let wy = ty % textureCanvas.height;
        if (wy<0) wy += textureCanvas.height;
  
        const idx = ((-i%totalSlides)+totalSlides)%totalSlides;
        const img = images[idx];
        // calc image fit
        const imgRatio  = img.width/img.height,
              rectRatio = rectW/rectH;
        let dw, dh, dx, dy;
        if (imgRatio>rectRatio) {
          dh = rectH; dw = dh*imgRatio;
          dx = (textureCanvas.width-dw)/2; dy = wy;
        } else {
          dw = rectW; dh = dw/imgRatio;
          dx = textureCanvas.width*0.05; dy = wy + (rectH-dh)/2;
        }
  
        // clip & draw
        ctx.save();
        ctx.beginPath();
        ctx.rect(textureCanvas.width*0.05, wy, rectW, rectH);
        ctx.clip();
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
  
        // titre en mix-blend
        ctx.save();
        ctx.globalCompositeOperation = "difference";
        ctx.fillStyle = "#fff";
        ctx.fillText(slideTitles[idx], padL, wy+rectH-padB);
        ctx.restore();
      }
      texture.needsUpdate = true;
    }
  
    // scroll & drag
    let isDragging=false, startY=0;
    const wheelFactor = isMobile ? 0.0002 : 0.0005;
    
    window.addEventListener("wheel", e => {
      e.preventDefault();
      autoRotateActive = false;
      currentScroll = (currentScroll + e.deltaY * wheelFactor) % 1;
      if (currentScroll < 0) currentScroll += 1;
      updateTexture(-currentScroll);
      renderer.render(scene, camera);
    }, { passive: false });
  
   // juste après avoir créé ton renderer :
const cv = renderer.domElement;
cv.style.touchAction = 'none'; // bloque le scroll natif sur mobile




    cv.addEventListener("pointerdown", e => {
      isDragging = true;
      autoRotateActive = false;
      startY = e.clientY;
      cv.setPointerCapture(e.pointerId);
    }, { passive: false });

    cv.addEventListener("pointermove", e => {
      if (!isDragging) return;
      e.preventDefault();
      const delta = startY - e.clientY;
      startY = e.clientY;
      // on remplace dragSpeed par dragFactor et wheelFactor déjà adapté
      currentScroll = (currentScroll + delta * wheelFactor * dragFactor) % 1;
      if (currentScroll < 0) currentScroll += 1;
      updateTexture(-currentScroll);
      renderer.render(scene, camera);
    }, { passive: false });

    cv.addEventListener("pointerup", e => {
      isDragging = false;
      cv.releasePointerCapture(e.pointerId);
    }, { passive: false });

    cv.addEventListener("pointercancel", e => {
      isDragging = false;
      cv.releasePointerCapture(e.pointerId);
    }, { passive: false });

  
    // auto-scroll + render loop
    let prevTime = performance.now();
    function animate(t) {
      const dt = t - prevTime;
      prevTime = t;
      if (autoRotateActive) {
        currentScroll = (currentScroll + dt*autoRotateSpeed) % 1;
        updateTexture(-currentScroll);
      }
      // render selon device
      if (isMobile || autoRotateActive) {
        renderer.render(scene,camera);
      } else {
        renderer.clear();
        composer.render();
      }
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }
  

  loadImages();

});
