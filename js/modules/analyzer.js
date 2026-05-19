import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'lil-gui';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { Loader } from './core/Loader.js';
import { FlowSystem } from './effects/FlowSystem.js';
import { PathlineSystem } from './effects/PathlineSystem.js';
import { Interaction } from './ui/Interaction.js';

const isMobile = window.innerWidth < 768;

const settings = {
    count: isMobile ? 1000 : 2000,
    speedMultiplier: 0.6,
    glyphSize: 1.2,
    glyphType: 'Capsule', 
    dynamicScaling: false,
    opacity: 0.9,
    turbulence: 0.15,
    vorticity: 0.4,       
    laminarFactor: 0.4,   
    spawnSpread: 1.2,
    flowVariation: 0.4,
    colorSlow: "#00d4ff",
    colorFast: "#ff3300",
    colorMode: 'Velocity',
    moveMode: 'Spline',
    fadeRange: 0.05,
    showFlow: true,
    showPaths: true,
    ambientIntensity: 0.8,
    directIntensity: 2.0,
    bgColor: "#00122c",
    zoom: 450,
    showAorta: true,
    aortaOpacity: 0.05,
    wireframe: false,
    aortaColor: "#ffffff",
    modelPath: 'assets/models/web_optimiert/sick_aorta_pathlines.glb',
    wallModelPath: 'assets/models/web_optimiert/sick_aorta_mesh.glb',
    pathStyle: 'Comets', 
    pathColor: '#ffffff',
    pathWidth: 1.2,
    pathOpacity: 0.5,
    usePulse: false,
    bpm: 60,
    systoleRatio: 0.3,
    pulseBase: 0.12 
};

let scene, camera, renderer, controls, mainGroup, ambientLight, directLight;
let interaction, flowSystem, pathlineSystem;
let flowObj = { system: null, data: [], paths: [] };
let currentPulse = 1.0;
let pulseHistory = new Array(100).fill(0);
let pulseCanvas, pulseCtx;

const loader = new Loader();

async function init() {
    try {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(settings.bgColor);
        mainGroup = new THREE.Group(); 
        scene.add(mainGroup);

        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 5000);
        camera.position.set(0, 200, 500);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
        document.getElementById('canvas-container').appendChild(renderer.domElement);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        interaction = new Interaction(camera, controls);
        interaction.initGizmo('gizmo-container');
        interaction.initNavbar();

        flowSystem = new FlowSystem(settings);
        pathlineSystem = new PathlineSystem(settings);

        ambientLight = new THREE.AmbientLight(0xffffff, settings.ambientIntensity);
        scene.add(ambientLight);
        
        directLight = new THREE.DirectionalLight(0xffffff, settings.directIntensity);
        directLight.position.set(100, 200, 150);
        scene.add(directLight);

        pulseCanvas = document.getElementById('pulse-canvas');
        if (pulseCanvas) pulseCtx = pulseCanvas.getContext('2d');

        await loadModels(settings.modelPath, settings.wallModelPath);
        
        setupGUI();
        interaction.alignCamera(0); 
        animate();
    } catch (err) {
        console.error("Initialization Error:", err);
    }
}

async function loadModels(pathUrl, wallUrl) {
    mainGroup.clear();
    const [pathGltf, wallGltf] = await Promise.all([
        loader.loadModel(pathUrl),
        loader.loadModel(wallUrl)
    ]);

    flowObj.paths = loader.processPathlines(pathGltf.scene);
    mainGroup.add(loader.processWall(wallGltf.scene, settings));

    const box = new THREE.Box3().setFromObject(mainGroup);
    const center = box.getCenter(new THREE.Vector3());
    mainGroup.position.set(-center.x, -center.y + 80, -center.z);
    controls.target.set(0, 80, 0);
    controls.update();

    rebuildAll();
}

function rebuildAll() {
    pathlineSystem.rebuildPaths(flowObj.paths, mainGroup);
    flowSystem.createSystem(flowObj, mainGroup, getGeometry());
}

function getGeometry() {
    const s = settings.glyphSize;
    const segs = isMobile ? 4 : 8;
    let geo;
    switch(settings.glyphType) {
        case 'Arrow':
            const cone = new THREE.ConeGeometry(s * 0.4, s * 1.0, segs);
            cone.translate(0, s * 0.5, 0);
            const cylinder = new THREE.CylinderGeometry(s * 0.1, s * 0.1, s * 1.0, segs);
            cylinder.translate(0, -s * 0.2, 0);
            geo = BufferGeometryUtils.mergeGeometries([cone, cylinder]);
            break;
        case 'Tetra': geo = new THREE.TetrahedronGeometry(s); break;
        case 'Capsule': geo = new THREE.CapsuleGeometry(s * 0.3, s * 0.8, 2, segs); break;
        case 'Sphere': geo = new THREE.SphereGeometry(s * 0.5, segs, segs); break;
        case 'Box': geo = new THREE.BoxGeometry(s, s, s); break;
        default: geo = new THREE.ConeGeometry(s * 0.4, s * 1.5, segs);
    }
    geo.rotateX(Math.PI * 0.5); 
    return geo;
}

function setupGUI() {
    const gui = new GUI({ title: 'Aorta Flow EXPERT' });
    gui.domElement.style.top = '80px'; 
    if (isMobile) gui.close();
    
    const fFlow = gui.addFolder('1. Flow Physik');
    fFlow.add(settings, 'showFlow').name('Teilchen sichtbar').onChange(v => flowObj.system.visible = v);
    fFlow.add(settings, 'showPaths').name('Pfad-Linien sichtbar').onChange(v => pathlineSystem.pathLinesGroup.visible = v);
    fFlow.add(settings, 'moveMode', ['Spline', 'Linear', 'Step']).name('Algorithmus');
    fFlow.add(settings, 'count', 50, 5000, 50).name('Partikel-Pool').onFinishChange(rebuildAll);
    fFlow.add(settings, 'speedMultiplier', 0, 5).name('Grund-Tempo');
    fFlow.add(settings, 'turbulence', 0, 10).name('Turbulenz');
    fFlow.add(settings, 'vorticity', 0, 1).name('Wirbelstärke');
    fFlow.add(settings, 'spawnSpread', 0, 15).name('Pfad-Ausscherung');

    const fPaths = gui.addFolder('1b. Pfade');
    fPaths.add(settings, 'pathStyle', ['Basic', 'Tube', 'Comets', 'Flow']).name('Stil').onChange(() => pathlineSystem.rebuildPaths(flowObj.paths, mainGroup));
    fPaths.add(settings, 'pathWidth', 0.1, 5).name('Breite').onChange(() => pathlineSystem.rebuildPaths(flowObj.paths, mainGroup));
    fPaths.addColor(settings, 'pathColor').name('Farbe').onChange(() => pathlineSystem.rebuildPaths(flowObj.paths, mainGroup));

    const fPulse = gui.addFolder('6. Herz-Zyklus');
    fPulse.add(settings, 'usePulse').name('Puls simulieren');
    fPulse.add(settings, 'bpm', 30, 180, 1).name('BPM');

    const fModel = gui.addFolder('7. Modell');
    fModel.add(settings, 'modelPath', {
        'Aneurysma': 'assets/models/sick_aorta_pathlines.glb',
        'Gesund': 'assets/models/healthy_aorta_pathlines.glb'
    }).name('Wechseln').onChange((path) => loadModels(path, path.replace('_pathlines.glb', '_mesh.glb')));
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    if (settings.usePulse) {
        const cycleTime = 60 / settings.bpm;
        const t = (performance.now() * 0.001 % cycleTime) / cycleTime; 
        currentPulse = settings.pulseBase + (t < settings.systoleRatio ? Math.sin((t/settings.systoleRatio) * Math.PI) : 0.1);
    } else {
        currentPulse = 1.0;
    }

    flowSystem.updateFlow(flowObj, currentPulse);
    pathlineSystem.update(settings.speedMultiplier, currentPulse);
    interaction.updateGizmo();
    updatePulseGraph(currentPulse);

    renderer.render(scene, camera);
}

function updatePulseGraph(value) {
    if (!pulseCtx) return;
    pulseHistory.push(value);
    pulseHistory.shift();
    pulseCtx.clearRect(0, 0, pulseCanvas.width, pulseCanvas.height);
    pulseCtx.beginPath();
    pulseCtx.strokeStyle = '#00ff44';
    pulseCtx.lineWidth = 2;
    for (let i = 0; i < pulseHistory.length; i++) {
        const x = (i / pulseHistory.length) * pulseCanvas.width;
        const y = pulseCanvas.height - (pulseHistory[i] * pulseCanvas.height * 0.8) - 5;
        if (i === 0) pulseCtx.moveTo(x, y);
        else pulseCtx.lineTo(x, y);
    }
    pulseCtx.stroke();
}

init();
