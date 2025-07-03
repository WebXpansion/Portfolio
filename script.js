window.addEventListener("load", () => {
  const canvas = document.getElementById("test-canvas");
  const ctx    = canvas.getContext("2d");

  const img = new Image();
  img.src        = "/assets/img1.jpg";     // Chemin vers ton image
  img.crossOrigin = "anonymous";           // si nécessaire

  img.onload = () => {
    // on l'étire pour remplir le canevas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };

  img.onerror = () => {
    console.error("Échec de chargement de /assets/img1.jpg");
  };
});
