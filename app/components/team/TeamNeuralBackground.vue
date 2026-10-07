<template>
    <div ref="hostEl" class="neural-background" aria-hidden="true">
        <canvas ref="canvasEl"></canvas>
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
    AdditiveBlending,
    BufferAttribute,
    BufferGeometry,
    Color,
    PerspectiveCamera,
    Points,
    Scene,
    ShaderMaterial,
    SRGBColorSpace,
    WebGLRenderer
} from "three";
import renderVertexShader from "../../shaders/render.vert?raw";
import renderFragmentShader from "../../shaders/render.frag?raw";
import { FlowField } from "../../classes/hero/FlowField";

type Point = { x: number; y: number };
// labelWidth/labelHeight: the name, role and department printed under the
// circle, so a line can start below them instead of running through them.
type NetworkNode = Point & { radius: number; labelWidth: number; labelHeight: number };
type Edge = { a: number; b: number; weight?: number };
type RoutePoint =
    | (Edge & { kind: "edge"; progress: number; lane: number })
    | { kind: "ring"; node: number; angle: number; layer: number };

// edges: the lines to draw, as [from, to] indices of the .team-member
// buttons (org chart). Without it, lines link nearby people.
// A third value per edge is its weight: 1 = a full line, 0.5 = a lighter
// one ("also reports to").
const props = defineProps<{ focused: boolean; edges?: Array<[number, number, number?]> | null }>();
const hostEl = ref<HTMLElement | null>(null);
const canvasEl = ref<HTMLCanvasElement | null>(null);

let renderer: WebGLRenderer | null = null;
let scene: Scene | null = null;
let camera: PerspectiveCamera | null = null;
let particles: Points<BufferGeometry, ShaderMaterial> | null = null;
let resizeObserver: ResizeObserver | null = null;
let animationFrame = 0;
let width = 1;
let height = 1;
let lastTime = 0;
let elapsed = 0;
let positions = new Float32Array();
let velocities = new Float32Array();
let routeTargets = new Float32Array();
let routePoints: RoutePoint[] = [];
let topology: Edge[] = [];
let topologyReady = false;
let networkParticleCount = 0;
let lastCenterSample = -1;
const flowField = new FlowField();
const flowForce = { x: 0, y: 0 };

function particleCount(): number {
    const viewportArea = width * height;
    if (viewportArea > 3_200_000) return Math.min(42000, Math.round((viewportArea / 3_200_000) * 24000));
    if (viewportArea > 1_600_000) return 18000;
    return 9000;
}

function createParticles(): void {
    if (!scene || particles) return;
    const count = particleCount();
    networkParticleCount = Math.min(width < 600 ? 3200 : 5000, Math.floor(count * 0.56));
    positions = new Float32Array(count * 3);
    velocities = new Float32Array(count * 3);
    routeTargets = new Float32Array(networkParticleCount * 3);
    const bounds = worldBounds();

    for (let index = 0; index < count; index += 1) {
        const offset = index * 3;
        positions[offset] = (Math.random() - 0.5) * bounds.width;
        positions[offset + 1] = (Math.random() - 0.5) * bounds.height;
        velocities[offset] = (Math.random() - 0.5) * 0.02;
        velocities[offset + 1] = (Math.random() - 0.5) * 0.02;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    // The shared particle shader (also used by the homepage) multiplies each
    // particle by its own "aOpacity"; without it every particle would be
    // invisible, so here they all get full opacity.
    geometry.setAttribute("aOpacity", new BufferAttribute(new Float32Array(positions.length / 3).fill(1), 1));
    const material = new ShaderMaterial({
        vertexShader: renderVertexShader,
        fragmentShader: renderFragmentShader,
        transparent: true,
        depthTest: false,
        blending: AdditiveBlending,
        uniforms: {
            uTime: { value: 0 },
            uPointSize: { value: 2.2 },
            uColor: { value: new Color(0x79cfff) },
            uOpacity: { value: 0.74 },
            uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.5) }
        }
    });

    particles = new Points(geometry, material);
    particles.frustumCulled = false;
    scene.add(particles);
}

function worldBounds(): { width: number; height: number } {
    if (!camera) return { width: 120, height: 68 };
    const worldHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    return { width: worldHeight * camera.aspect, height: worldHeight };
}

function resize(): void {
    const host = hostEl.value;
    if (!host || !renderer || !camera) return;

    const rect = host.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (particles) particles.material.uniforms.uPixelRatio!.value = Math.min(window.devicePixelRatio || 1, 1.5);
    createParticles();
    lastCenterSample = -1;
}

function memberCenters(): NetworkNode[] {
    const hostRect = hostEl.value?.getBoundingClientRect();
    const stage = hostEl.value?.parentElement;
    if (!hostRect || !stage) return [];
    const bounds = worldBounds();

    return [...stage.querySelectorAll<HTMLElement>(".team-member")].map((element) => {
        const rect = element.getBoundingClientRect();
        const x = rect.left - hostRect.left + rect.width / 2;
        const y = rect.top - hostRect.top + rect.width / 2;
        const labels = [...element.querySelectorAll<HTMLElement>(".member-name, .member-role, .member-dept")]
            .map((label) => label.getBoundingClientRect())
            .filter((box) => box.width > 0);
        const labelWidth = labels.length ? Math.max(...labels.map((box) => box.width)) : 0;
        const labelBottom = labels.length ? Math.max(...labels.map((box) => box.bottom)) : rect.top + rect.width;
        const toWorld = bounds.width / width;
        return {
            x: (x / width - 0.5) * bounds.width,
            y: (0.5 - y / height) * bounds.height,
            radius: (rect.width / 2) * toWorld,
            labelWidth: labelWidth * toWorld,
            labelHeight: Math.max(0, labelBottom - rect.top - rect.width) * toWorld
        };
    });
}

// How far from a person's centre a line in direction (dx, dy) must start so
// it clears both the photo circle and the labels printed under it.
function clearance(node: NetworkNode, dx: number, dy: number): number {
    const circle = node.radius + 0.55;
    if (dy >= -0.05 || node.labelHeight <= 0) return circle;
    const down = -dy;
    const enters = node.radius / down;
    const leavesBottom = (node.radius + node.labelHeight) / down;
    const leavesSide = Math.abs(dx) < 1e-6 ? Infinity : node.labelWidth / 2 / Math.abs(dx);
    if (leavesSide <= enters) return circle; // passes beside the labels
    return Math.max(circle, Math.min(leavesBottom, leavesSide) + 0.35);
}

function orientation(a: Point, b: Point, c: Point): number {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function edgesIntersect(left: Edge, right: Edge, points: Point[]): boolean {
    if (left.a === right.a || left.a === right.b || left.b === right.a || left.b === right.b) return false;
    const a = points[left.a];
    const b = points[left.b];
    const c = points[right.a];
    const d = points[right.b];
    if (!a || !b || !c || !d) return false;
    return orientation(a, b, c) * orientation(a, b, d) < 0 && orientation(c, d, a) * orientation(c, d, b) < 0;
}

function buildTopology(points: Point[]): Edge[] {
    const candidates: Array<Edge & { distance: number }> = [];
    for (let a = 0; a < points.length; a += 1) {
        for (let b = a + 1; b < points.length; b += 1) {
            candidates.push({ a, b, distance: Math.hypot(points[a]!.x - points[b]!.x, points[a]!.y - points[b]!.y) });
        }
    }
    candidates.sort((left, right) => left.distance - right.distance);

    const parent = points.map((_, index) => index);
    const find = (index: number): number => parent[index] === index ? index : (parent[index] = find(parent[index]!));
    const result: Edge[] = [];
    const degree = new Array(points.length).fill(0) as number[];

    for (const candidate of candidates) {
        const rootA = find(candidate.a);
        const rootB = find(candidate.b);
        if (rootA === rootB) continue;
        const edge = { a: candidate.a, b: candidate.b };
        if (result.some((current) => edgesIntersect(edge, current, points))) continue;
        parent[rootA] = rootB;
        result.push(edge);
        degree[edge.a]! += 1;
        degree[edge.b]! += 1;
    }

    for (const candidate of candidates) {
        if (result.length >= points.length + 4) break;
        if (degree[candidate.a]! >= 4 || degree[candidate.b]! >= 4) continue;
        if (result.some((edge) => edge.a === candidate.a && edge.b === candidate.b)) continue;
        const edge = { a: candidate.a, b: candidate.b };
        if (result.some((current) => edgesIntersect(edge, current, points))) continue;
        result.push(edge);
        degree[edge.a]! += 1;
        degree[edge.b]! += 1;
    }
    return result;
}

// The org chart changed (people loaded, phone/desktop layout): rebuild the lines.
watch(
    () => JSON.stringify(props.edges ?? null),
    () => {
        // Particles glide to the new lines (no snap): only the route changes.
        topology = [];
        topologyReady = false;
    }
);

function createRoutePoints(points: NetworkNode[]): void {
    topology = props.edges
        ? props.edges.filter(([a, b]) => points[a] && points[b]).map(([a, b, weight]) => ({ a, b, weight: weight ?? 1 }))
        : buildTopology(points);
    topologyReady = true;
    const lengths = topology.map((edge) => Math.hypot(points[edge.a]!.x - points[edge.b]!.x, points[edge.a]!.y - points[edge.b]!.y));
    const totalLength = lengths.reduce((total, length) => total + length, 0) || 1;
    routePoints = [];

    const ringLayers = 2;
    const pointsPerRing = width < 600 ? 34 : 52;
    points.forEach((_, node) => {
        for (let layer = 0; layer < ringLayers; layer += 1) {
            for (let index = 0; index < pointsPerRing; index += 1) {
                routePoints.push({
                    kind: "ring",
                    node,
                    angle: index / pointsPerRing * Math.PI * 2,
                    layer
                });
            }
        }
    });

    const edgeParticleBudget = Math.max(0, networkParticleCount - routePoints.length);
    const laneCount = width < 600 ? 5 : 7;
    // Lighter edges ("also reports to") get a thin, sparse, dotted ribbon.
    const share = topology.map((edge, i) => lengths[i]! * ((edge.weight ?? 1) < 1 ? 0.25 : 1));
    const totalShare = share.reduce((total, value) => total + value, 0) || 1;
    topology.forEach((edge, edgeIndex) => {
        const weak = (edge.weight ?? 1) < 1;
        const lanes = weak ? 2 : laneCount;
        const count = Math.max(lanes * 8, Math.round(edgeParticleBudget * share[edgeIndex]! / totalShare));
        const pointsPerLane = Math.max(8, Math.floor(count / lanes));
        for (let laneIndex = 0; laneIndex < lanes; laneIndex += 1) {
            const lane = (laneIndex - (lanes - 1) / 2) * (weak ? 0.6 : 1);
            for (let index = 0; index < pointsPerLane && routePoints.length < networkParticleCount; index += 1) {
                routePoints.push({
                    ...edge,
                    kind: "edge",
                    progress: (index + 0.5) / pointsPerLane,
                    lane
                });
            }
        }
    });
    while (routePoints.length < networkParticleCount && routePoints.length > 0) {
        routePoints.push(routePoints[routePoints.length % Math.max(1, routePoints.length)]!);
    }
}

function sampleNetworkTargets(time: number): void {
    if (lastCenterSample >= 0 && time - lastCenterSample < 50) return;
    const centers = memberCenters();
    if (centers.length < 2) return;
    const isInitialFormation = lastCenterSample < 0;
    if (!topologyReady) createRoutePoints(centers);
    for (let index = 0; index < routePoints.length; index += 1) {
        const route = routePoints[index]!;
        const offset = index * 3;

        if (route.kind === "ring") {
            const node = centers[route.node];
            if (!node) continue;
            const radius = node.radius + 0.48 + route.layer * 0.42;
            routeTargets[offset] = node.x + Math.cos(route.angle) * radius;
            routeTargets[offset + 1] = node.y + Math.sin(route.angle) * radius;
            routeTargets[offset + 2] = 0;
            continue;
        }

        const start = centers[route.a];
        const end = centers[route.b];
        if (!start || !end) continue;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.max(0.001, Math.hypot(dx, dy));
        const directionX = dx / distance;
        const directionY = dy / distance;
        const startGap = clearance(start, directionX, directionY);
        const endGap = clearance(end, -directionX, -directionY);
        const startX = start.x + directionX * startGap;
        const startY = start.y + directionY * startGap;
        const endX = end.x - directionX * endGap;
        const endY = end.y - directionY * endGap;
        const endpointSpread = 0.18 + Math.abs(Math.cos(route.progress * Math.PI)) * 0.82;
        const ribbonWidth = (width < 600 ? 0.25 : 0.34) * route.lane * endpointSpread;
        routeTargets[offset] = startX + (endX - startX) * route.progress - directionY * ribbonWidth;
        routeTargets[offset + 1] = startY + (endY - startY) * route.progress + directionX * ribbonWidth;
        routeTargets[offset + 2] = 0;
    }
    if (isInitialFormation) {
        for (let index = 0; index < routePoints.length; index += 1) {
            const offset = index * 3;
            positions[offset] = routeTargets[offset]!;
            positions[offset + 1] = routeTargets[offset + 1]!;
            positions[offset + 2] = 0;
            velocities[offset] = 0;
            velocities[offset + 1] = 0;
            velocities[offset + 2] = 0;
        }
        if (particles) (particles.geometry.getAttribute("position") as BufferAttribute).needsUpdate = true;
    }
    lastCenterSample = time;
}

function updateParticles(delta: number): void {
    if (!particles) return;
    const bounds = worldBounds();
    const halfX = bounds.width / 2;
    const halfY = bounds.height / 2;
    const count = positions.length / 3;

    for (let particleIndex = 0; particleIndex < count; particleIndex += 1) {
        const offset = particleIndex * 3;
        let px = positions[offset]!;
        let py = positions[offset + 1]!;
        flowField.getForce(px, py, flowForce);
        let fx = flowForce.x + Math.sin(particleIndex * 17.389 + elapsed * 1.9) * 0.02;
        let fy = flowForce.y + Math.cos(particleIndex * 41.713 - elapsed * 1.7) * 0.02;
        const isNetworkParticle = particleIndex < routePoints.length;

        if (isNetworkParticle) {
            const attraction = props.focused ? 0.08 : 0.055;
            fx = fx * 0.12 + (routeTargets[offset]! - px) * attraction;
            fy = fy * 0.12 + (routeTargets[offset + 1]! - py) * attraction;
        }

        let vx = (velocities[offset]! + fx) * (isNetworkParticle ? 0.9 : 0.965);
        let vy = (velocities[offset + 1]! + fy) * (isNetworkParticle ? 0.9 : 0.965);
        const maxSpeed = isNetworkParticle ? 0.5 : 0.3;
        const speed = Math.hypot(vx, vy);
        if (speed > maxSpeed) {
            vx *= maxSpeed / speed;
            vy *= maxSpeed / speed;
        }
        px += vx * delta * 60;
        py += vy * delta * 60;

        if (!isNetworkParticle && (px > halfX || px < -halfX || py > halfY || py < -halfY)) {
            px = (Math.random() - 0.5) * bounds.width;
            py = (Math.random() - 0.5) * bounds.height;
            vx = (Math.random() - 0.5) * 0.02;
            vy = (Math.random() - 0.5) * 0.02;
        }
        positions[offset] = px;
        positions[offset + 1] = py;
        velocities[offset] = vx;
        velocities[offset + 1] = vy;
    }
    (particles.geometry.getAttribute("position") as BufferAttribute).needsUpdate = true;
}

function animate(time: number): void {
    if (!renderer || !scene || !camera || !particles) return;
    const delta = lastTime === 0 ? 1 / 60 : Math.min(0.04, Math.max(0.001, (time - lastTime) / 1000));
    lastTime = time;
    elapsed += delta;
    flowField.update(delta);
    sampleNetworkTargets(time);
    updateParticles(delta);
    particles.material.uniforms.uTime!.value = elapsed;
    renderer.render(scene, camera);
    animationFrame = requestAnimationFrame(animate);
}

onMounted(() => {
    const canvas = canvasEl.value;
    if (!canvas) return;
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.setClearColor(0x020712, 1);
    scene = new Scene();
    camera = new PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 0, 100);
    resize();
    resizeObserver = new ResizeObserver(resize);
    if (hostEl.value) resizeObserver.observe(hostEl.value);
    animationFrame = requestAnimationFrame(animate);
});

onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    if (animationFrame) cancelAnimationFrame(animationFrame);
    particles?.geometry.dispose();
    particles?.material.dispose();
    renderer?.dispose();
});
</script>

<style scoped>
.neural-background,
canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
}

.neural-background {
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
}

canvas {
    display: block;
}
</style>