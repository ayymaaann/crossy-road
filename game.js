import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

 
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

 
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 500);

                                                                    
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

 
scene.add(new THREE.AmbientLight(0xffffff, 0.75));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(20, 30, 10);
scene.add(sun);

 
const TILE = 2;
const ROAD_WIDTH = 40;
const LANE_AHEAD = 35;

let score = 0;
let moving = false;
 
const baseGround = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 500),
  new THREE.MeshStandardMaterial({ color: 0x86efac })
);
baseGround.rotation.x = -Math.PI / 2;
baseGround.position.z = -150;
scene.add(baseGround);

 
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xffffff })
);
player.position.set(0, 0.5, 2);
scene.add(player);
 
function createTree(x, z) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 1),
    new THREE.MeshStandardMaterial({ color: 0x7c2d12 })
  );
  trunk.position.set(x, 0.5, z);

  const leaves = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.2, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x166534 })
  );
  leaves.position.set(x, 1.6, z);

  scene.add(trunk, leaves);
}

function createBench(x, z) {
  const bench = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.3, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x92400e })
  );
  bench.position.set(x, 0.35, z);
  scene.add(bench);
}

function createLamp(x, z) {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 2),
    new THREE.MeshStandardMaterial({ color: 0x374151 })
  );
  pole.position.set(x, 1, z);

  const lightBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.3, 0.4),
    new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: 0xfef3c7
    })
  );
  lightBox.position.set(x, 2.2, z);

  scene.add(pole, lightBox);
}
 
const cars = [];

function createLane(z) {
  const r = Math.random();
  let type;

  if (r < 0.45) type = "grass";
  else if (r < 0.6) type = "footpath";
  else type = "road";

  const color =
    type === "grass" ? 0x86efac :
    type === "footpath" ? 0xd6b58a :
    0x374151;

  const lane = new THREE.Mesh(
    new THREE.BoxGeometry(ROAD_WIDTH, 0.4, TILE),
    new THREE.MeshStandardMaterial({ color })
  );
  lane.position.z = z;
  scene.add(lane);

  if (type === "road") {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(ROAD_WIDTH, 0.05, 0.15),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    line.position.set(0, 0.25, z);
    scene.add(line);
    spawnCars(z);
  }

  if (type === "grass") {
    if (Math.random() < 0.5) {
      createTree(-ROAD_WIDTH / 2 + 4, z);
      createTree(ROAD_WIDTH / 2 - 4, z);
    }
  }

  if (type === "footpath") {
    createBench(-ROAD_WIDTH / 2 + 3, z);
    createLamp(ROAD_WIDTH / 2 - 3, z);
  }
}
 
function randomCarColor() {
  const colors = [0xdc2626, 0x2563eb, 0x16a34a, 0xf97316, 0x9333ea];
  return colors[Math.floor(Math.random() * colors.length)];
}

function spawnCars(z) {
  const count = 3;
  const gap = 9;

  for (let i = 0; i < count; i++) {
    const car = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.6, 1.3),
      new THREE.MeshStandardMaterial({ color: randomCarColor() })
    );
    body.position.y = 0.3;

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.5, 0.9),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    top.position.set(0, 0.75, 0);

    car.add(body, top);
    car.position.set(ROAD_WIDTH / 2 + i * gap, 0, z);
    car.userData.speed = 0.18;

    scene.add(car);
    cars.push(car);
  }
}
 
for (let i = 0; i < LANE_AHEAD; i++) {
  createLane(-i * TILE);
}
 
function hop(dx, dz) {
  if (moving) return;
  moving = true;

  const start = player.position.clone();
  const end = start.clone();
  end.x = THREE.MathUtils.clamp(end.x + dx * TILE, -ROAD_WIDTH / 2 + 1, ROAD_WIDTH / 2 - 1);
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

 
function animate() {
  requestAnimationFrame(animate);

  cars.forEach(car => {
    car.position.x -= car.userData.speed;
    if (car.position.x < -ROAD_WIDTH / 2 - 10)
      car.position.x = ROAD_WIDTH / 2 + 20;

    if (
      Math.abs(car.position.z - player.position.z) < 0.9 &&
      Math.abs(car.position.x - player.position.x) < 1.2
    ) {
      alert("💀 Chicken squashed");
      location.reload();
    }
  });

 
  camera.position.set(
    player.position.x + 12,
    18,
    player.position.z + 14
  );
  camera.lookAt(
    player.position.x,
    0,
    player.position.z - 6
  );

  renderer.render(scene, camera);
}
animate();

 
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});


