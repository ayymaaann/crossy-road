import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

/* ================= SETUP ================= */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

/* CAMERA */
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 500);
camera.position.set(0, 14, 18);

/* RENDERER */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

/* ================= LIGHT ================= */
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
scene.add(sun);

/* ================= GRID BACKGROUND ================= */
const grid = new THREE.GridHelper(200, 100, 0xffffff, 0x444444);
scene.add(grid);

/* ================= CONSTANTS ================= */
const TILE = 2;
const ROAD_WIDTH = 40;
const LANE_AHEAD = 30;
let score = 0;
let moving = false;

/* ================= PLAYER (WHITE CHICKEN) ================= */
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xffffff })
);
player.position.set(0, 0.5, 2);
scene.add(player);

/* ================= LANES ================= */
const lanes = [];
const cars = [];

function createLane(z) {
  const typeRand = Math.random();

  let color;
  let isRoad = false;

  if (typeRand < 0.4) {
    color = 0x86efac; // 🌱 light green grass
  } else if (typeRand < 0.6) {
    color = 0xd6b58a; // 🟫 footpath brown
  } else {
    color = 0x374151; // 🛣️ asphalt
    isRoad = true;
  }

  const lane = new THREE.Mesh(
    new THREE.BoxGeometry(ROAD_WIDTH, 0.4, TILE),
    new THREE.MeshStandardMaterial({ color })
  );

  lane.position.z = z;
  scene.add(lane);
  lanes.push({ z, isRoad });

  if (isRoad) spawnCarsForLane(z);
}

/* ================= CARS (NO OVERLAP) ================= */
function spawnCarsForLane(z) {
  const count = 3;
  const gap = 8;

  for (let i = 0; i < count; i++) {
    const car = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.6, 1.3),
      new THREE.MeshStandardMaterial({ color: 0xdc2626 })
    );
    body.position.y = 0.3;

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.5, 0.9),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c })
    );
    top.position.set(0, 0.75, 0);

    car.add(body, top);

    car.position.set(
      ROAD_WIDTH / 2 + i * gap,
      0,
      z
    );

    car.userData.speed = 0.18;
    scene.add(car);
    cars.push(car);
  }
}

/* ================= INITIAL LANES ================= */
for (let i = 0; i < LANE_AHEAD; i++) {
  createLane(-i * TILE);
}

/* ================= MOVEMENT (WASD FIXED) ================= */
function hop(dx, dz) {
  if (moving) return;
  moving = true;

  const start = player.position.clone();
  const end = start.clone();
  end.x += dx * TILE;
  end.z += dz * TILE;

  let t = 0;
  function anim() {
    t += 0.08;
    player.position.lerpVectors(start, end, t);
    player.position.y = 0.5 + Math.sin(t * Math.PI) * 0.4;

    if (t < 1) requestAnimationFrame(anim);
    else {
      player.position.copy(end);
      player.position.y = 0.5;
      moving = false;

      if (dz < 0) {
        score++;
        document.getElementById("score").innerText = score;
        createLane(player.position.z - LANE_AHEAD * TILE);
      }
    }
  }
  anim();
}

addEventListener("keydown", e => {
  if (e.key === "w" || e.key === "ArrowUp") hop(0, -1);
  if (e.key === "s" || e.key === "ArrowDown") hop(0, 1);
  if (e.key === "a" || e.key === "ArrowLeft") hop(-1, 0);
  if (e.key === "d" || e.key === "ArrowRight") hop(1, 0);
});

/* ================= GAME LOOP ================= */
function animate() {
  requestAnimationFrame(animate);

  cars.forEach((car, i) => {
    car.position.x -= car.userData.speed;

    if (car.position.x < -ROAD_WIDTH / 2 - 10) {
      car.position.x = ROAD_WIDTH / 2 + 20;
    }

    if (
      Math.abs(car.position.z - player.position.z) < 0.9 &&
      Math.abs(car.position.x - player.position.x) < 1.2
    ) {
      alert("💀 Chicken squashed");
      location.reload();
    }
  });

  camera.position.z = player.position.z + 18;
  camera.lookAt(player.position.x, 0, player.position.z - 10);

  renderer.render(scene, camera);
}

animate();

/* ================= RESIZE ================= */
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
