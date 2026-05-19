import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Loader } from './core/Loader.js';
import { FlowSystem } from './effects/FlowSystem.js';
import { ChartManager } from './ui/ChartManager.js';

let renderer, scene1, scene2, camera1, camera2, controls1;
let ambient1, ambient2, direct1, direct2;
let group1, group2, section2Group, aortaObj, camS2; 
let flow1 = { system: null, data: [], paths: [] };
let flow2 = { system: null, data: [], paths: [] };
let posCurve, lookCurve;

const loader = new Loader();
const chartManager = new ChartManager();

const blickHoehe = 200; 
const hoehe = 200;      
const radiusNormal = 600; // Mehr Abstand für Sicherheit
const radiusZoom = 380;   // Etwas defensiverer Zoom gegen Clipping

const hotspots = [
    // 1. Überblick (Start)
    { pos: new THREE.Vector3(Math.cos(0) * radiusNormal, hoehe, Math.sin(0) * radiusNormal), target: new THREE.Vector3(0, blickHoehe, 0) },

    // 2. Zoom & Rotation (360 Grad Fahrt)
    { pos: new THREE.Vector3(Math.cos(Math.PI * 0.5) * radiusZoom, hoehe, Math.sin(Math.PI * 0.5) * radiusZoom), target: new THREE.Vector3(0, blickHoehe, 0) },
    { pos: new THREE.Vector3(Math.cos(Math.PI) * radiusZoom, hoehe, Math.sin(Math.PI) * radiusZoom), target: new THREE.Vector3(0, blickHoehe, 0) },
    { pos: new THREE.Vector3(Math.cos(Math.PI * 1.5) * radiusZoom, hoehe, Math.sin(Math.PI * 1.5) * radiusZoom), target: new THREE.Vector3(0, blickHoehe, 0) },

    // 3. Abschluss
    { pos: new THREE.Vector3(Math.cos(Math.PI * 2) * radiusNormal, hoehe, Math.sin(Math.PI * 2) * radiusNormal), target: new THREE.Vector3(0, blickHoehe, 0) }
];

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const settings = {
    count: isMobile ? 300 : 800,
    speedMultiplier: 0.5,
    glyphSize: 1.5,
    turbulence: 0.2,
    spawnSpread: 1.0,
    flowVariation: 0.4,
    dynamicScaling: true,
    moveMode: 'Spline',
    colorSlow: "#ff4444",
    colorFast: "#ff4444",
    colorMode: 'Solid',
    aortaOpacity: 0.15,
    aortaColor: "#888888",
    wireframe: false,
    ambientIntensity: 1.0,
    directIntensity: 2.5,
    fadeRange: 0.02,
    bgColor: "#000000"
};

const flowSystem = new FlowSystem(settings);

async function init() {
    renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    renderer.setScissorTest(true);
    renderer.setClearColor(settings.bgColor);
    document.getElementById('container3d').appendChild(renderer.domElement);

    scene1 = new THREE.Scene();
    scene2 = new THREE.Scene();
    scene1.background = new THREE.Color(settings.bgColor);
    scene2.background = new THREE.Color(settings.bgColor);

    group1 = new THREE.Group();
    group2 = new THREE.Group();
    section2Group = new THREE.Group();
    scene1.add(group1, section2Group);
    scene2.add(group2);

    ambient1 = new THREE.AmbientLight(0xffffff, settings.ambientIntensity);
    direct1 = new THREE.DirectionalLight(0xffffff, settings.directIntensity);
    direct1.position.set(2, 2, 5);
    scene1.add(ambient1, direct1);

    ambient2 = ambient1.clone();
    direct2 = direct1.clone();
    scene2.add(ambient2, direct2);

    posCurve = new THREE.CatmullRomCurve3(hotspots.map(h => h.pos));
    lookCurve = new THREE.CatmullRomCurve3(hotspots.map(h => h.target));

    camera1 = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    camera2 = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    
    controls1 = new OrbitControls(camera1, renderer.domElement);
    controls1.enableDamping = true;
    controls1.enableZoom = false; 
    controls1.enablePan = false;  

    const [sickLinesGltf, sickMeshGltf, healthyLinesGltf, healthyMeshGltf] = await Promise.all([
        loader.loadModel('assets/models/web_optimiert/sick_aorta_pathlines.glb'),
        loader.loadModel('assets/models/web_optimiert/sick_aorta_mesh.glb'),
        loader.loadModel('assets/models/web_optimiert/healthy_aorta_pathlines.glb'),
        loader.loadModel('assets/models/web_optimiert/healthy_aorta_mesh.glb')
    ]);

    group1.add(loader.processWall(sickMeshGltf.scene, settings));
    flow1.paths = loader.processPathlines(sickLinesGltf.scene);
    
    group2.add(loader.processWall(healthyMeshGltf.scene, settings));
    flow2.paths = loader.processPathlines(healthyLinesGltf.scene);

    centerGroup(group1);
    centerGroup(group2);
    applyResponsiveAortaLayout();
    
    flowSystem.createSystem(flow1, group1);
    flowSystem.createSystem(flow2, group2);

    updateCameraScroll();
    controls1.update();
    animate();

    const anatomySection = document.getElementById('anatomy');
    if (anatomySection) {
        new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) loadSection2Models();
        }, { threshold: 0.1 }).observe(anatomySection);
    }

    setupUI();
    chartManager.init();
}

let s2Loaded = false;
async function loadSection2Models() {
    if (s2Loaded) return;
    s2Loaded = true;
    
    const modelsS2 = [
        'assets/models/anatomy/VH_M_Blood_Vasculature.glb',
        'assets/models/anatomy/VH_M_Heart.glb',
        'assets/models/anatomy/VH_M_Kidney_L.glb',
        'assets/models/anatomy/VH_M_Kidney_R.glb',
        'assets/models/anatomy/VH_M_Liver.glb',
        'assets/models/anatomy/3d-vh-f-lung.glb',
        'assets/models/anatomy/3d-vh-m-skin.glb'
    ];

    try {
        const gltfModels = await Promise.all(modelsS2.map(url => loader.loadModel(url)));
        gltfModels.forEach(gltf => { if (gltf) section2Group.add(gltf.scene); });

        section2Group.traverse((child) => {
            if (child.isMesh && child.name.toLowerCase().includes('aorta')) aortaObj = child;
        });

        const s2Container = document.getElementById('model-s2-container');
        if (s2Container) {
            const rendererS2 = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            rendererS2.setSize(s2Container.clientWidth, s2Container.clientHeight);
            s2Container.appendChild(rendererS2.domElement);
            const sceneS2 = new THREE.Scene();
            
            camS2 = new THREE.PerspectiveCamera(60, s2Container.clientWidth / s2Container.clientHeight, 1, 10000);
            camS2.position.set(0, 0, 50);
            camS2.lookAt(0, 0, 0);

            section2Group.position.set(0, -10, 0);
            section2Group.scale.set(50, 50, 50);
            sceneS2.add(section2Group);
            section2Group.traverse(child => {
                if (child.isMesh) {
                    if (child === aortaObj) child.material = new THREE.MeshBasicMaterial({ color: 0xff0000, depthWrite: true });
                    else child.material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false });
                }
            });

            const animateS2 = () => {
                requestAnimationFrame(animateS2);
                section2Group.rotation.y += 0.01;
                rendererS2.render(sceneS2, camS2);
            };
            animateS2();
        }
    } catch (e) { console.error("Loader Error S2:", e); }
}

function centerGroup(group) {
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    group.position.sub(center);
}

function applyResponsiveAortaLayout() {
    const mobilePortrait = window.innerWidth <= 820;
    const scale = mobilePortrait ? 0.8 : 1.4; // Etwas reduziert für Sicherheit gegen Clipping
    const yTarget = mobilePortrait ? 100 : 200; 

    [group1, group2].forEach((group) => {
        // Erst Reset für saubere Berechnung
        group.position.set(0, 0, 0);
        group.rotation.set(-Math.PI * 0.5, 0, 0);
        group.scale.setScalar(scale);
        
        // Individuelle Zentrierung basierend auf Bounding Box
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        
        // Positionieren: Zentrieren am Ursprung und dann auf yTarget schieben
        group.position.x = -center.x;
        group.position.y = yTarget - center.y;
        group.position.z = -center.z;
    });
}

function updateCameraScroll() {
    const scrollY = window.scrollY;
    const h = window.innerHeight;
    const stepHeight = h * 1.5; 
    const totalHeight = (hotspots.length - 1) * stepHeight;

    if (scrollY > stepHeight * 0.5 && scrollY < totalHeight + stepHeight) document.body.classList.add('in-comparison');
    else document.body.classList.remove('in-comparison');

    const progress = Math.min(100, Math.max(0, (scrollY / (document.documentElement.scrollHeight - h)) * 100));
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) progressBar.style.width = `${progress}%`;

    const t = Math.max(0, Math.min(scrollY / totalHeight, 1));
    posCurve.getPoint(t, camera1.position);
    lookCurve.getPoint(t, controls1.target);

    if (window.innerWidth <= 820) {
        camera1.position.set(0, 0, 900);
        controls1.target.set(0, 0, 0);
    }
}

function animate() {
    requestAnimationFrame(animate);
    updateCameraScroll();
    controls1.update();

    if (aortaObj) {
        const pulse = 1.0 + Math.sin(performance.now() * 0.005) * 0.05;
        aortaObj.scale.set(pulse, pulse, pulse);
    }

    flowSystem.updateFlow(flow1);
    flowSystem.updateFlow(flow2);

    const w = window.innerWidth, h = window.innerHeight, scrollY = window.scrollY;
    if (w <= 820) {
        const topH = Math.floor(h * 0.5), botH = h - topH;
        camera1.aspect = w / topH; camera1.updateProjectionMatrix();
        renderer.setViewport(0, botH, w, topH); renderer.setScissor(0, botH, w, topH);
        renderer.render(scene1, camera1);

        camera2.position.copy(camera1.position); camera2.quaternion.copy(camera1.quaternion);
        camera2.aspect = w / botH; camera2.updateProjectionMatrix();
        renderer.setViewport(0, 0, w, botH); renderer.setScissor(0, 0, w, botH);
        renderer.render(scene2, camera2);
        return;
    }

    const split = scrollY < h * 1.5 ? 1.0 - (scrollY / (h * 1.5)) * 0.5 : 0.5;
    const w1 = Math.floor(w * (1 - split)), w2 = w - w1;
    
    if (w1 > 0) {
        camera1.aspect = w1 / h; camera1.updateProjectionMatrix();
        renderer.setViewport(0, 0, w1, h); renderer.setScissor(0, 0, w1, h);
        renderer.render(scene1, camera1);
    }
    if (w2 > 0) {
        camera2.position.copy(camera1.position); camera2.quaternion.copy(camera1.quaternion);
        camera2.aspect = w2 / h; camera2.updateProjectionMatrix();
        renderer.setViewport(w1, 0, w2, h); renderer.setScissor(w1, 0, w2, h);
        renderer.render(scene2, camera2);
    }
}

function setupUI() {
    const inputSpeed = document.getElementById('input-speed');
    if(inputSpeed) inputSpeed.oninput = (e) => settings.speedMultiplier = parseFloat(e.target.value);
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => entry.target.classList.toggle('active', entry.isIntersecting));
    }, { threshold: 0.5 });
    document.querySelectorAll('.step').forEach(step => observer.observe(step));

    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu-mobile');
    if (navToggle && navMenu) navToggle.addEventListener('click', () => navMenu.classList.toggle('active'));
}

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    applyResponsiveAortaLayout();
});

init();
