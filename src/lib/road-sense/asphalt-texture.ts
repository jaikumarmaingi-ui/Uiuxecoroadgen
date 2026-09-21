import * as THREE from "three";

let cached: THREE.CanvasTexture | null = null;

export function getAsphaltTexture() {
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#26282c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // speckle noise for asphalt grain
  for (let i = 0; i < 2200; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const v = 20 + Math.random() * 25;
    ctx.fillStyle = `rgba(${v + 10},${v + 10},${v + 12},${0.15 + Math.random() * 0.2})`;
    ctx.fillRect(x, y, 1.4, 1.4);
  }

  // shoulder edge lines
  ctx.fillStyle = "rgba(235,235,225,0.75)";
  ctx.fillRect(8, 0, 3, canvas.height);
  ctx.fillRect(canvas.width - 11, 0, 3, canvas.height);

  // dashed center line
  ctx.fillStyle = "rgba(255,214,84,0.85)";
  const dashH = 22;
  const gapH = 16;
  let y = 0;
  while (y < canvas.height) {
    ctx.fillRect(canvas.width / 2 - 2, y, 4, dashH);
    y += dashH + gapH;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.anisotropy = 4;
  cached = texture;
  return texture;
}
