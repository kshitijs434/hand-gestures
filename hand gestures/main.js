// ================= THREE =================
const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("three-canvas"),
    powerPreference: "high-performance"
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 100);
camera.position.z = 4;

// ================= PARTICLES =================
const COUNT = 1600;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(COUNT * 3);
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.045,
    depthWrite: false
});

const points = new THREE.Points(geometry, material);
scene.add(points);

// ================= SHAPES =================
const shapes = {};

// ❤️ Heart
shapes.heart = (() => {
    const a = [];
    for (let i = 0; i < COUNT; i++) {
        const t = Math.random() * Math.PI * 2;
        a.push(
            16 * Math.pow(Math.sin(t), 3) / 6,
            (13 * Math.cos(t) - 5 * Math.cos(2*t)) / 6,
            (Math.random() - 0.5) * 0.2
        );
    }
    return a;
})();

// 🌸 Flower
shapes.flower = (() => {
    const a = [];
    for (let i = 0; i < COUNT; i++) {
        const t = Math.random() * Math.PI * 2;
        const r = Math.cos(5 * t);
        a.push(r * Math.cos(t), r * Math.sin(t), 0);
    }
    return a;
})();

// 🪐 Saturn
shapes.saturn = (() => {
    const a = [];
    for (let i = 0; i < COUNT; i++) {
        const t = Math.random() * Math.PI * 2;
        const r = 1 + Math.random() * 0.4;
        a.push(r * Math.cos(t), 0, r * Math.sin(t));
    }
    return a;
})();

// 🌀 Spiral
shapes.spiral = (() => {
    const a = [];
    for (let i = 0; i < COUNT; i++) {
        const t = Math.random() * 6 * Math.PI;
        const r = t * 0.08;
        a.push(r * Math.cos(t), r * Math.sin(t), (Math.random() - 0.5) * 0.3);
    }
    return a;
})();

// 🎆 Firework
shapes.firework = (() => {
    const a = [];
    for (let i = 0; i < COUNT; i++) {
        a.push(
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3
        );
    }
    return a;
})();

// 🧬 DNA Helix
shapes.dna = (() => {
    const a = [];
    for (let i = 0; i < COUNT; i++) {
        const t = i * 0.15;
        const strand = i % 2 === 0 ? 1 : -1;
        a.push(
            Math.cos(t) * 0.6,
            (i / COUNT - 0.5) * 3,
            Math.sin(t) * 0.6 * strand
        );
    }
    return a;
})();

// 🐦 Birds (V formation)
shapes.birds = (() => {
    const a = [];
    for (let i = 0; i < COUNT; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const offset = i / COUNT;
        a.push(
            side * offset * 2,
            Math.sin(offset * 6) * 0.3,
            -offset * 2
        );
    }
    return a;
})();

// 🌐 Sphere
shapes.sphere = (() => {
    const a = [];
    for (let i = 0; i < COUNT; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        a.push(
            Math.sin(phi) * Math.cos(theta),
            Math.sin(phi) * Math.sin(theta),
            Math.cos(phi)
        );
    }
    return a;
})();

let targetShape = shapes.heart;
window.setShape = s => targetShape = shapes[s];

// ================= HAND TRACKING =================
const video = document.getElementById("handCam");

const hands = new Hands({
    locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 0,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
});

let scaleTarget = 1, scaleCurrent = 1;
let lastPinch = 0;

hands.onResults(r => {
    if (!r.multiHandLandmarks.length) return;
    const lm = r.multiHandLandmarks[0];

    scaleTarget = 1 + (0.5 - lm[9].y);

    const pinch = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);
    if (pinch < 0.04 && performance.now() - lastPinch > 900) {
        const keys = Object.keys(shapes);
        setShape(keys[Math.floor(Math.random() * keys.length)]);
        lastPinch = performance.now();
    }
});

new Camera(video, {
    onFrame: async () => await hands.send({ image: video }),
    width: 640,
    height: 480,
    facingMode: "user"
}).start();

// ================= ANIMATE =================
function animate() {
    requestAnimationFrame(animate);

    scaleCurrent += (scaleTarget - scaleCurrent) * 0.08;
    points.scale.set(scaleCurrent, scaleCurrent, scaleCurrent);

    const p = geometry.attributes.position.array;
    for (let i = 0; i < p.length; i++) {
        p[i] += (targetShape[i] - p[i]) * 0.07;
    }
    geometry.attributes.position.needsUpdate = true;

    points.rotation.y += 0.0006;

    renderer.render(scene, camera);
}
animate();

// ================= RESIZE =================
addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
