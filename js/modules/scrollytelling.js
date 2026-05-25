import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Loader } from './core/Loader.js';
import { FlowSystem } from './effects/FlowSystem.js';
import { ChartManager } from './ui/ChartManager.js';

let renderer, scene1, scene2, camera1, camera2, controls1;
let ambient1, ambient2, direct1, direct2;
let group1, group2, section2Group, rainerGroup, rainerAnatomyGroup, aortaHoleGroup, aortaObj, camS2; 
let flow1 = { system: null, data: [], paths: [] };
let flow2 = { system: null, data: [], paths: [] };
let posCurve, lookCurve;

const loader = new Loader();
const chartManager = new ChartManager();

const blickHoehe = 200; 
const hoehe = 200;      
const radiusNormal = 600; 
const radiusZoom = 380;   

const hotspots = [
    { pos: new THREE.Vector3(0, 200, 1000), target: new THREE.Vector3(0, 200, 0) }, // S1: Start (Stable)
    { pos: new THREE.Vector3(0, 200, 1000), target: new THREE.Vector3(0, 200, 0) }, // S1: End / S2: Start (Far)
    { pos: new THREE.Vector3(0, 200, 700),  target: new THREE.Vector3(0, 200, 0) }, // S2: End / S3: Start (Zoomed)
    { pos: new THREE.Vector3(0, 200, 400),  target: new THREE.Vector3(0, 200, 0) }, // S3: End / S4: Start (Detail)
    { pos: new THREE.Vector3(0, 200, 700),  target: new THREE.Vector3(0, 200, 0) }, // S4: End / S5: Start (Zoom Front)
    { pos: new THREE.Vector3(0, 200, 400),  target: new THREE.Vector3(0, 200, 0) }, // S5: End / S6: Start (Detail Front)
    { pos: new THREE.Vector3(0, hoehe, -radiusZoom), target: new THREE.Vector3(0, blickHoehe, 0) }, // S7
    { pos: new THREE.Vector3(radiusZoom, blickHoehe, radiusZoom), target: new THREE.Vector3(0, blickHoehe, 0) }, // S8
    { pos: new THREE.Vector3(-radiusZoom, blickHoehe, radiusZoom), target: new THREE.Vector3(0, blickHoehe, 0) }, // S9
    { pos: new THREE.Vector3(0, blickHoehe + 100, radiusZoom), target: new THREE.Vector3(0, blickHoehe, 0) }, // S10
    { pos: new THREE.Vector3(radiusZoom * 0.8, blickHoehe, radiusZoom * 0.8), target: new THREE.Vector3(0, blickHoehe, 0) }, // S11
    { pos: new THREE.Vector3(radiusNormal, blickHoehe, 0), target: new THREE.Vector3(0, blickHoehe, 0) }, // S12
    { pos: new THREE.Vector3(0, blickHoehe, radiusNormal), target: new THREE.Vector3(0, blickHoehe, 0) }, // S13
    { pos: new THREE.Vector3(0, blickHoehe, radiusZoom), target: new THREE.Vector3(0, blickHoehe, 0) }, // S14
    { pos: new THREE.Vector3(radiusZoom, blickHoehe, 0), target: new THREE.Vector3(0, blickHoehe, 0) }, // S15
    { pos: new THREE.Vector3(0, 400, 1000), target: new THREE.Vector3(0, 200, 0) }, // S16
    { pos: new THREE.Vector3(300, 300, 800), target: new THREE.Vector3(0, 200, 0) }, // S17
    { pos: new THREE.Vector3(0, 200, radiusNormal), target: new THREE.Vector3(0, 200, 0) }  // S18
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
    const container = document.getElementById('container3d');
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.autoClear = false;
    renderer.setScissorTest(true);
    renderer.setClearColor(settings.bgColor);
    container.appendChild(renderer.domElement);

    scene1 = new THREE.Scene();
    scene2 = new THREE.Scene();
    scene1.background = new THREE.Color(settings.bgColor);
    scene2.background = new THREE.Color(settings.bgColor);

    group1 = new THREE.Group();
    group2 = new THREE.Group();
    section2Group = new THREE.Group();
    rainerGroup = new THREE.Group();
    rainerAnatomyGroup = new THREE.Group();
    aortaHoleGroup = new THREE.Group();
    scene1.add(group1, section2Group, rainerGroup, rainerAnatomyGroup, aortaHoleGroup);
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

    camera1 = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 10000);
    camera2 = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 10000);
    controls1 = new OrbitControls(camera1, renderer.domElement);
    controls1.enableDamping = true;
    controls1.enableZoom = false; 
    controls1.enablePan = false;  

    const [sickLinesGltf, sickMeshGltf, healthyLinesGltf, healthyMeshGltf, rainerGltf, rainerAnatomyGltf, aortaHoleGltf] = await Promise.all([
        loader.loadModel('assets/models/sick_aorta_pathlines.glb'),
        loader.loadModel('assets/models/sick_aorta_mesh.glb'),
        loader.loadModel('assets/models/healthy_aorta_pathlines.glb'),
        loader.loadModel('assets/models/healthy_aorta_mesh.glb'),
        loader.loadModel('assets/models/rainer.glb'),
        loader.loadModel('assets/models/rainer_anatomy.glb'),
        loader.loadModel('assets/models/aorta_hole.glb')
    ]);

    console.log("Models loaded:", { sickLinesGltf, sickMeshGltf, healthyLinesGltf, healthyMeshGltf, rainerGltf, rainerAnatomyGltf, aortaHoleGltf });

    if (sickMeshGltf) group1.add(loader.processWall(sickMeshGltf.scene, settings));
    if (sickLinesGltf) flow1.paths = loader.processPathlines(sickLinesGltf.scene);
    if (healthyMeshGltf) group2.add(loader.processWall(healthyMeshGltf.scene, settings));
    if (healthyLinesGltf) flow2.paths = loader.processPathlines(healthyLinesGltf.scene);

    if (rainerGltf) {
        rainerGroup.add(rainerGltf.scene);
        console.log("Rainer added, children:", rainerGroup.children.length);
    }
    if (rainerAnatomyGltf) {
        rainerAnatomyGroup.add(rainerAnatomyGltf.scene);
        console.log("Rainer Anatomy added, children:", rainerAnatomyGroup.children.length);
    }
    if (aortaHoleGltf) {
        aortaHoleGroup.add(aortaHoleGltf.scene); // Original Shader
        console.log("Aorta Hole added, children:", aortaHoleGroup.children.length);
    }

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
    setupTechTerms();

    // Smart Rendering: Hook requestRender to events
    window.addEventListener('scroll', requestRender, { passive: true });
    controls1.addEventListener('change', requestRender);
}

function setupTechTerms() {
    document.querySelectorAll('.tech-term').forEach(term => {
        term.addEventListener('click', () => {
            const termKey = term.getAttribute('data-term');
            alert(`Erklärung für ${termKey}: Hier könnte eine Infobox erscheinen.`);
        });
    });
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
    } catch (e) { console.error("Loader Error S2:", e); }
}

function centerGroup(group) {
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    group.position.sub(center);
}

let baseScales = new Map();
function applyResponsiveAortaLayout(section = 0) {
    const mobilePortrait = window.innerWidth <= 820;
    const yTarget = mobilePortrait ? 100 : 200; 

    [group1, group2, rainerGroup, rainerAnatomyGroup, aortaHoleGroup, section2Group].forEach((group) => {
        if (!group || group.children.length === 0) return;
        
        group.position.set(0, 0, 0);
        group.scale.setScalar(1); // Reset für Messung

        if (group === rainerGroup || group === rainerAnatomyGroup) {
            group.rotation.set(0, Math.PI, 0); 
        } else if (group === aortaHoleGroup) {
            group.rotation.set(0, Math.PI, 0); // 180 Grad Drehung für Defekt-Ansicht
        } else if (group !== section2Group) {
            group.rotation.set(-Math.PI * 0.5, 0, 0);
        }
        
        // Messen der Größe
        const box = new THREE.Box3().setFromObject(group);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        // Skalierung berechnen (Auto-Fit)
        let targetScale = 450 / maxDim;

        // Nur für die Standard-Aorta Modelle im Vergleichsmodus (S4, S6-S12)
        // nutzen wir einen festen Faktor für die Vergleichbarkeit.
        if ((group === group1 || group === group2) && (section === 3 || section >= 5)) {
            targetScale = 1.4;
        }

        group.scale.setScalar(targetScale);
        baseScales.set(group, targetScale);

        // Erneutes Messen für finale Zentrierung
        const finalBox = new THREE.Box3().setFromObject(group);
        const center = finalBox.getCenter(new THREE.Vector3());
        
        group.position.x = -center.x;
        group.position.y = yTarget - center.y;
        group.position.z = -center.z;
    });
}

let isRendering = true;
let lastScrollY = -1;
let currentSectionIdx = -1;

function updateCameraScroll() {
    const scrollY = window.scrollY;
    if (scrollY === lastScrollY) return;
    lastScrollY = scrollY;
    const h = window.innerHeight;
    const stepHeight = h * 2.5; 
    const totalHeight = (hotspots.length - 1) * stepHeight;
    const t = Math.max(0, Math.min(scrollY / totalHeight, 1));
    const currentSection = Math.floor(t * (hotspots.length - 1));

    // Divider komplett entfernt (ab Sektion 4 und generell)
    document.body.classList.remove('in-comparison');

    const progressBar = document.getElementById('progress-bar');
    if (progressBar) progressBar.style.width = `${(scrollY / (document.documentElement.scrollHeight - h)) * 100}%`;

    posCurve.getPoint(t, camera1.position);
    lookCurve.getPoint(t, controls1.target);
    if (window.innerWidth <= 820) {
        camera1.position.set(0, 0, 900);
        controls1.target.set(0, 0, 0);
    }
    updateNavLinks(currentSection);
}

function updateNavLinks(sectionIndex) {
    const navLinks = document.querySelectorAll('.nav-links a, .nav-menu-mobile a');
    navLinks.forEach(link => link.classList.remove('active'));
    let navIndex = 0;
    if (sectionIndex >= 15) navIndex = 6; 
    else if (sectionIndex >= 12) navIndex = 5; 
    else if (sectionIndex >= 10) navIndex = 4; 
    else if (sectionIndex >= 7) navIndex = 3; 
    else if (sectionIndex >= 5) navIndex = 2; 
    else if (sectionIndex >= 3) navIndex = 1; 
    else navIndex = 0; 
    if (navLinks[navIndex]) navLinks[navIndex].classList.add('active');
}

let isAnimating = false;

function requestRender() {
    if (isAnimating) return;
    isAnimating = true;
    requestAnimationFrame(animate);
}

function animate() {
    if (!isRendering) {
        isAnimating = false;
        return;
    }
    
    updateCameraScroll();
    
    const scrollY = window.scrollY;
    const h = window.innerHeight;
    const stepHeight = h * 2.5; 
    const totalHeight = (hotspots.length - 1) * stepHeight;
    const t = Math.max(0, Math.min(scrollY / totalHeight, 1));
    const currentSection = Math.floor(t * (hotspots.length - 1));
    const sectionT = (t * (hotspots.length - 1)) % 1; 

    // Rotation Limits for Aorta Hole (S5)
    if (currentSection === 4) {
        controls1.minAzimuthAngle = -0.16; // ~9 Grad links
        controls1.maxAzimuthAngle = 0.16;  // ~9 Grad rechts
    } else {
        controls1.minAzimuthAngle = -Infinity;
        controls1.maxAzimuthAngle = Infinity;
    }

    const moved = controls1.update();

    // Performance & Visibility State Update
    if (currentSection !== currentSectionIdx) {
        currentSectionIdx = currentSection;
        applyResponsiveAortaLayout(currentSection);
        update3DVisibility(currentSection);
    }

    // Entrance Animation
    const animFactor = Math.min(1, sectionT * 4); 

    [group1, group2, rainerGroup, rainerAnatomyGroup, section2Group].forEach(group => {
        if (group && group.visible) {
            const base = baseScales.get(group) || 1;
            group.scale.setScalar(base * (0.8 + 0.2 * animFactor));
            group.traverse(child => {
                if (child.isMesh && child.material && child.material.transparent) {
                    const originalOpacity = (child.name === "AortaWall") ? settings.aortaOpacity : 1.0;
                    child.material.opacity = originalOpacity * animFactor;
                }
            });
        }
    });

    // Determine if we need to keep the loop running
    let continueLoop = moved; // Damping in controls
    
    // Flow requires constant updates
    if (currentSection === 0 || currentSection === 10) {
        if (flow1.system && flow1.system.visible) {
            flowSystem.updateFlow(flow1);
            continueLoop = true;
        }
        if (flow2.system && flow2.system.visible) {
            flowSystem.updateFlow(flow2);
            continueLoop = true;
        }
    }

    // Render logic
    const container = document.getElementById('container3d');
    renderScene(currentSection, container.clientWidth, container.clientHeight);

    if (continueLoop) {
        requestAnimationFrame(animate);
    } else {
        isAnimating = false;
    }
}

function renderScene(currentSection, width, height) {
    if (window.innerWidth <= 820) {
        const topH = Math.floor(height * 0.5), botH = height - topH;
        camera1.aspect = width / topH; camera1.updateProjectionMatrix();
        renderer.setViewport(0, botH, width, topH); renderer.setScissor(0, botH, width, topH);
        renderer.render(scene1, camera1);
        camera2.position.copy(camera1.position); camera2.quaternion.copy(camera1.quaternion);
        camera2.aspect = width / botH; camera2.updateProjectionMatrix();
        renderer.setViewport(0, 0, width, botH); renderer.setScissor(0, 0, width, botH);
        renderer.render(scene2, camera2);
        return;
    }

    let split = 0.0;
    if (currentSection >= 5 && currentSection <= 12) split = 0.5;
    else if (currentSection === 0 || currentSection === 3 || currentSection >= 15) split = 1.0;
    else split = 0.0;

    const w1 = Math.floor(width * (1 - split)), w2 = width - w1;
    if (w1 > 0) {
        camera1.aspect = w1 / height; camera1.updateProjectionMatrix();
        renderer.setViewport(0, 0, w1, height); renderer.setScissor(0, 0, w1, height);
        renderer.render(scene1, camera1);
    }
    if (w2 > 0) {
        camera2.position.copy(camera1.position); camera2.quaternion.copy(camera1.quaternion);
        camera2.aspect = w2 / height; camera2.updateProjectionMatrix();
        renderer.setViewport(w1, 0, w2, height); renderer.setScissor(w1, 0, w2, height);
        renderer.render(scene2, camera2);
    }
}

function update3DVisibility(section) {
    group1.visible = group2.visible = section2Group.visible = rainerGroup.visible = rainerAnatomyGroup.visible = aortaHoleGroup.visible = false;
    if (flow1.system) flow1.system.visible = false;
    if (flow2.system) flow2.system.visible = false;

    const rainerAnatomyPlaceholder = document.getElementById('rainer-anatomy-placeholder');
    const aortaHolePlaceholder = document.getElementById('aorta-hole-placeholder');
    if (rainerAnatomyPlaceholder) rainerAnatomyPlaceholder.style.display = 'none';
    if (aortaHolePlaceholder) aortaHolePlaceholder.style.display = 'none';

    if (section === 0) { 
        group2.visible = true; 
        if (flow2.system) flow2.system.visible = true; 
    }
    else if (section === 1) { 
        rainerGroup.visible = true; 
    }
    else if (section === 2) { // Sektion 3
        if (rainerAnatomyGroup.children.length > 0) {
            rainerAnatomyGroup.visible = true;
        } else if (rainerAnatomyPlaceholder) {
            rainerAnatomyPlaceholder.style.display = 'block';
        }
    }
    else if (section === 3) { 
        group2.visible = true; 
    }
    else if (section === 4) { // Sektion 5
        if (aortaHoleGroup.children.length > 0) {
            aortaHoleGroup.visible = true;
        } else {
            if (aortaHolePlaceholder) aortaHolePlaceholder.style.display = 'block';
        }
    }
    else if (section === 5 || section === 6) { 
        group1.visible = true; 
        section2Group.visible = true; 
    }
    else if (section >= 7 && section <= 9) group1.visible = true;
    else if (section === 10) { group1.visible = true; if (flow1.system) flow1.system.visible = true; }
    else if (section >= 11 && section <= 14) group1.visible = true;
    else if (section >= 15) group2.visible = true;
}

document.addEventListener('visibilitychange', () => { isRendering = !document.hidden; if (isRendering) animate(); });
function setupUI() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            } else {
                // Nur entfernen wenn wir weit weg sind um Flackern zu vermeiden
                if (entry.boundingClientRect.top > window.innerHeight || entry.boundingClientRect.bottom < 0) {
                    entry.target.classList.remove('active');
                }
            }
        });
    }, { 
        threshold: 0.1,
        rootMargin: "-20% 0px -20% 0px" // Trigger wenn Karte in der Mitte ist
    });
    
    document.querySelectorAll('.step').forEach(step => observer.observe(step));
    
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu-mobile');
    if (navToggle && navMenu) navToggle.addEventListener('click', () => navMenu.classList.toggle('active'));
    
    setupTechTerms();
}
window.addEventListener('resize', () => { const container = document.getElementById('container3d'); if (container) { renderer.setSize(container.clientWidth, container.clientHeight); applyResponsiveAortaLayout(); } });
init();
