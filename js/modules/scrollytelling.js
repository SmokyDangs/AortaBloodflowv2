import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Loader } from './core/Loader.js';
import { FlowSystem } from './effects/FlowSystem.js';
import { ChartManager } from './ui/ChartManager.js';
import { getEditorState, getUploadedModelEntries, getUploadedModelUrl, initStoryEditor } from './editor.js';
import { renderStoryPage } from './storyRenderer.js?v=11';

const storyConfig = renderStoryPage();
const storyVersion = document.body.dataset.storyVersion || 'aneurysm';

let renderer, scene1, scene2, camera1, camera2, controls1;
let ambient1, ambient2, direct1, direct2;
let group1, group2, section2Group, rainerGroup, rainerAnatomyGroup, aortaHoleGroup, dnaGroup, aortaObj, camS2; 
let visualStatusLabel, visualStatusTitle;
let flow1 = { system: null, data: [], paths: [] };
let flow2 = { system: null, data: [], paths: [] };
let posCurve, lookCurve;
const customSectionGroups = new Map();
const modelOverrides = new Map();

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
const storySectionCount = storyConfig.sections.length;

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
    aortaOpacity: 0.26,
    aortaColor: "#ffffff",
    wireframe: false,
    ambientIntensity: 1.0,
    directIntensity: 2.5,
    fadeRange: 0.02,
    bgColor: "#000000"
};

const flowSystem = new FlowSystem(settings);

const editorModelOptions = [
    { id: 'healthy-aorta', label: 'Gesunde Aorta', url: 'assets/models/healthy_aorta_mesh.glb', color: 0xffffff, wall: true },
    { id: 'sick-aorta', label: 'Pathologische Aorta', url: 'assets/models/sick_aorta_mesh.glb', color: 0xff7777, wall: true },
    { id: 'rainer', label: 'Patient Rainer', url: 'assets/models/rainer.glb', color: 0xffb07a },
    { id: 'rainer-anatomy', label: 'Rainer Anatomie', url: 'assets/models/rainer_anatomy.glb', color: 0xff7777 },
    { id: 'aorta-hole', label: 'Aorta Defekt', url: 'assets/models/aorta_hole.glb', color: 0xff4f4f },
    { id: 'dna', label: 'DNA / Biologie', url: 'assets/models/dna.glb', color: 0x6ee7ff },
    { id: 'heart', label: 'Herz', url: 'assets/models/anatomy/VH_M_Heart.glb', color: 0xff7777 },
    { id: 'vasculature', label: 'Blutgefaesse', url: 'assets/models/anatomy/VH_M_Blood_Vasculature.glb', color: 0xff7777 },
    { id: 'kidney-left', label: 'Niere links', url: 'assets/models/anatomy/VH_M_Kidney_L.glb', color: 0x6ee7ff },
    { id: 'kidney-right', label: 'Niere rechts', url: 'assets/models/anatomy/VH_M_Kidney_R.glb', color: 0x6ee7ff },
    { id: 'liver', label: 'Leber', url: 'assets/models/anatomy/VH_M_Liver.glb', color: 0xffb07a },
    { id: 'lung', label: 'Lunge', url: 'assets/models/anatomy/3d-vh-f-lung.glb', color: 0x6ee7ff },
    { id: 'skin', label: 'Koerperhuelle', url: 'assets/models/anatomy/3d-vh-m-skin.glb', color: 0xffffff }
];

const sectionVisualLabels = [
    'Gesunde Aorta mit Blutfluss',
    'Patientenmodell',
    'Anatomische Uebersicht',
    'Gesunde Anatomie',
    'Pathologische Veraenderung',
    'Biologische Ursache',
    'Risikoprofil und Aorta',
    'Symptome und Warnzeichen',
    'Diagnostische Ansicht',
    'Bildgebung und Planung',
    'Dynamischer Blutfluss',
    'Krankheitsstadium',
    'Therapieplanung',
    'Intervention',
    'Risiko-Nutzen-Abwaegung',
    'Stabilisierte Aorta',
    'Nachsorge und Kontrolle',
    'Zusammenfassung'
];

function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

function enhanceModelMaterials(group, color = 0xff4444) {
    if (!group) return;

    group.traverse((child) => {
        if (!child.isMesh || !child.material) return;

        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
            material.side = THREE.DoubleSide;
            material.transparent = true;
            material.opacity = Math.max(material.opacity || 0, child.name === 'AortaWall' ? settings.aortaOpacity : 0.72);
            if (material.color) material.color.lerp(new THREE.Color(color), 0.24);
            if (material.emissive) {
                material.emissive = new THREE.Color(color);
                material.emissiveIntensity = child.name === 'AortaWall' ? 0.08 : 0.04;
            }
            material.needsUpdate = true;
        });
    });
}

function getLayoutGroups() {
    return [group1, group2, rainerGroup, rainerAnatomyGroup, aortaHoleGroup, section2Group, dnaGroup, ...customSectionGroups.values()];
}

function getEditorOption(modelId) {
    return editorModelOptions.find((option) => option.id === modelId);
}

async function createEditorModelGroup(modelId) {
    const option = getEditorOption(modelId);
    if (!option) return null;

    const gltf = await loader.loadModel(option.url);
    if (!gltf) return null;

    const group = new THREE.Group();
    const model = option.wall ? loader.processWall(gltf.scene, settings) : gltf.scene;
    group.add(model);
    group.visible = false;
    group.userData.editorModelId = modelId;
    scene1.add(group);
    enhanceModelMaterials(group, option.color);
    return group;
}

async function createEditorModelGroupFromUrl(url, label = 'uploaded-glb') {
    const gltf = await loader.loadModel(url);
    if (!gltf) return null;

    const group = new THREE.Group();
    group.add(gltf.scene);
    group.visible = false;
    group.userData.editorModelId = 'uploaded';
    group.userData.editorModelLabel = label;
    scene1.add(group);
    enhanceModelMaterials(group, 0xffffff);
    return group;
}

async function setSectionEditorModel(sectionIndex, modelId) {
    const existing = customSectionGroups.get(sectionIndex);
    if (existing) {
        scene1.remove(existing);
        customSectionGroups.delete(sectionIndex);
    }

    if (!modelId) {
        modelOverrides.delete(sectionIndex);
        update3DVisibility(getScrollState().currentSection);
        requestRender();
        return;
    }

    modelOverrides.set(sectionIndex, modelId);
    const group = await createEditorModelGroup(modelId);
    if (!group) return;

    customSectionGroups.set(sectionIndex, group);
    applyResponsiveAortaLayout();
    update3DVisibility(getScrollState().currentSection);
    requestRender();
}

async function setSectionEditorModelFile(sectionIndex, url, label) {
    const existing = customSectionGroups.get(sectionIndex);
    if (existing) {
        scene1.remove(existing);
        customSectionGroups.delete(sectionIndex);
    }

    modelOverrides.set(sectionIndex, 'uploaded');
    const group = await createEditorModelGroupFromUrl(url, label);
    if (!group) return;

    customSectionGroups.set(sectionIndex, group);
    applyResponsiveAortaLayout();
    update3DVisibility(getScrollState().currentSection);
    requestRender();
}

function resetSectionEditorModel(sectionIndex) {
    const existing = customSectionGroups.get(sectionIndex);
    if (existing) scene1.remove(existing);
    customSectionGroups.delete(sectionIndex);
    modelOverrides.delete(sectionIndex);
    update3DVisibility(getScrollState().currentSection);
    requestRender();
}

async function applySavedEditorModels() {
    const savedModels = getEditorState(storyVersion).models || {};
    for (const [sectionIndex, modelId] of Object.entries(savedModels)) {
        await setSectionEditorModel(Number(sectionIndex), modelId);
    }

    const uploadedEntries = await getUploadedModelEntries(storyVersion);
    for (const entry of uploadedEntries) {
        const uploaded = await getUploadedModelUrl(storyVersion, entry.sectionIndex);
        if (uploaded) await setSectionEditorModelFile(entry.sectionIndex, uploaded.url, uploaded.name);
    }
}

async function init() {
    renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
    const container = document.getElementById('container3d');
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.autoClear = false;
    renderer.setScissorTest(true);
    renderer.setClearColor(settings.bgColor);
    container.appendChild(renderer.domElement);
    createVisualStatus();

    scene1 = new THREE.Scene();
    scene2 = new THREE.Scene();
    scene1.background = new THREE.Color(0x020203);
    scene2.background = new THREE.Color(0x020203);
    scene1.fog = new THREE.FogExp2(0x050507, 0.00085);
    scene2.fog = new THREE.FogExp2(0x050507, 0.00085);

    group1 = new THREE.Group();
    group2 = new THREE.Group();
    section2Group = new THREE.Group();
    rainerGroup = new THREE.Group();
    rainerAnatomyGroup = new THREE.Group();
    aortaHoleGroup = new THREE.Group();
    dnaGroup = new THREE.Group();
    scene1.add(group1, group2, section2Group, rainerGroup, rainerAnatomyGroup, aortaHoleGroup, dnaGroup);
    // scene2.add(group2); // No longer needed for scene2

    ambient1 = new THREE.AmbientLight(0xffffff, settings.ambientIntensity);
    direct1 = new THREE.DirectionalLight(0xffffff, settings.directIntensity);
    direct1.position.set(2, 2, 5);
    const fillLight = new THREE.DirectionalLight(0xff7777, 0.9);
    fillLight.position.set(-4, 1, -3);
    const rimLight = new THREE.DirectionalLight(0x66dfff, 1.25);
    rimLight.position.set(4, 5, -6);
    scene1.add(ambient1, direct1, fillLight, rimLight);
    // ambient2 = ambient1.clone(); // Not strictly needed
    // direct2 = direct1.clone();
    // scene2.add(ambient2, direct2);

    posCurve = new THREE.CatmullRomCurve3(hotspots.map(h => h.pos));
    lookCurve = new THREE.CatmullRomCurve3(hotspots.map(h => h.target));

    camera1 = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 10000);
    camera2 = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 10000);
    controls1 = new OrbitControls(camera1, renderer.domElement);
    controls1.enableDamping = true;
    controls1.dampingFactor = 0.08;
    controls1.enableZoom = false; 
    controls1.enablePan = false;  

    setupUI();
    updateCameraScroll();
    window.addEventListener('scroll', requestRender, { passive: true });
    controls1.addEventListener('change', requestRender);

    const [sickLinesGltf, sickMeshGltf, healthyLinesGltf, healthyMeshGltf, rainerGltf, rainerAnatomyGltf, aortaHoleGltf, dnaGltf] = await Promise.all([
        loader.loadModel('assets/models/sick_aorta_pathlines.glb'),
        loader.loadModel('assets/models/sick_aorta_mesh.glb'),
        loader.loadModel('assets/models/healthy_aorta_pathlines.glb'),
        loader.loadModel('assets/models/healthy_aorta_mesh.glb'),
        loader.loadModel('assets/models/rainer.glb'),
        loader.loadModel('assets/models/rainer_anatomy.glb'),
        loader.loadModel('assets/models/aorta_hole.glb'),
        loader.loadModel('assets/models/dna.glb')
    ]);

    console.log("Models loaded:", { sickLinesGltf, sickMeshGltf, healthyLinesGltf, healthyMeshGltf, rainerGltf, rainerAnatomyGltf, aortaHoleGltf, dnaGltf });

    if (sickMeshGltf) group1.add(loader.processWall(sickMeshGltf.scene, settings));
    if (sickLinesGltf) flow1.paths = loader.processPathlines(sickLinesGltf.scene);
    if (healthyMeshGltf) group2.add(loader.processWall(healthyMeshGltf.scene, settings));
    if (healthyLinesGltf) flow2.paths = loader.processPathlines(healthyLinesGltf.scene);

    if (rainerGltf) {
        rainerGroup.add(rainerGltf.scene);
    }
    if (rainerAnatomyGltf) {
        rainerAnatomyGroup.add(rainerAnatomyGltf.scene);
    }
    if (aortaHoleGltf) {
        aortaHoleGroup.add(aortaHoleGltf.scene);
    }
    if (dnaGltf) {
        dnaGroup.add(dnaGltf.scene);
        console.log("DNA added, children:", dnaGroup.children.length);
    }

    enhanceModelMaterials(group1, 0xffffff);
    enhanceModelMaterials(group2, 0xffffff);
    enhanceModelMaterials(rainerGroup, 0xffb07a);
    enhanceModelMaterials(rainerAnatomyGroup, 0xff7777);
    enhanceModelMaterials(aortaHoleGroup, 0xff4f4f);
    enhanceModelMaterials(dnaGroup, 0x6ee7ff);

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
    chartManager.init();
    await applySavedEditorModels();
    initStoryEditor({
        version: storyVersion,
        storyConfig,
        modelOptions: editorModelOptions,
        getCurrentSection: () => getScrollState().currentSection,
        setSectionModel: setSectionEditorModel,
        setSectionModelFile: setSectionEditorModelFile,
        resetSectionModel: resetSectionEditorModel,
        exportState: () => ({
            version: storyVersion,
            savedAt: new Date().toISOString(),
            changes: getEditorState(storyVersion)
        })
    });

    requestRender();
}

function createVisualStatus() {
    const rightColumn = document.querySelector('.right-column');
    if (!rightColumn) return;

    const status = document.createElement('div');
    status.className = 'visual-status';
    status.innerHTML = `
        <span class="visual-status-label">${storyConfig.title}</span>
        <span class="visual-status-title">3D-Modell wird geladen</span>
    `;
    rightColumn.appendChild(status);
    visualStatusLabel = status.querySelector('.visual-status-label');
    visualStatusTitle = status.querySelector('.visual-status-title');
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
    const fitSize = mobilePortrait ? 420 : 620;

    getLayoutGroups().forEach((group) => {
        if (!group || group.children.length === 0) return;
        
        group.position.set(0, 0, 0);
        group.scale.setScalar(1); // Reset für Messung

        const editorModelId = group.userData?.editorModelId;
        const editorNeedsPatientRotation = ['rainer', 'rainer-anatomy', 'aorta-hole'].includes(editorModelId);
        const editorKeepsNativeRotation = ['uploaded', 'dna', 'heart', 'vasculature', 'kidney-left', 'kidney-right', 'liver', 'lung', 'skin'].includes(editorModelId);

        if (group === rainerGroup || group === rainerAnatomyGroup || editorNeedsPatientRotation) {
            group.rotation.set(0, Math.PI, 0); 
        } else if (group === aortaHoleGroup) {
            group.rotation.set(0, Math.PI, 0); // 180 Grad Drehung für Defekt-Ansicht
        } else if (group === dnaGroup || editorKeepsNativeRotation) {
            group.rotation.set(0, 0, 0);
        } else if (group !== section2Group) {
            group.rotation.set(-Math.PI * 0.5, 0, 0);
        }
        
        // Messen der Größe
        const box = new THREE.Box3().setFromObject(group);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        // Skalierung berechnen (Auto-Fit)
        let targetScale = fitSize / maxDim;

        // Nur für die Standard-Aorta Modelle im Vergleichsmodus (S4, S6-S12)
        // nutzen wir einen festen Faktor für die Vergleichbarkeit.
        if (group === group1) {
            targetScale = mobilePortrait ? 1.08 : 1.34;
        }

        if (group === group2) {
            targetScale = mobilePortrait ? 1.62 : 2.08;
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

function getScrollState() {
    const steps = Array.from(document.querySelectorAll('#story .step'));
    if (!steps.length) {
        return { currentSection: 0, sectionT: 0, cameraT: 0 };
    }

    const marker = window.innerHeight * (window.innerWidth <= 820 ? 0.62 : 0.5);
    let currentSection = 0;
    let smallestDistance = Infinity;

    steps.forEach((step, index) => {
        const rect = step.getBoundingClientRect();
        const containsMarker = rect.top <= marker && rect.bottom >= marker;
        const distance = containsMarker ? 0 : Math.min(Math.abs(rect.top - marker), Math.abs(rect.bottom - marker));

        if (distance < smallestDistance) {
            smallestDistance = distance;
            currentSection = index;
        }
    });

    const activeStep = steps[currentSection];
    const start = activeStep.offsetTop;
    const range = Math.max(1, activeStep.offsetHeight - window.innerHeight * 0.4);
    const sectionT = clamp((window.scrollY - start + window.innerHeight * 0.28) / range, 0, 1);
    const cameraT = clamp((currentSection + sectionT) / Math.max(1, storySectionCount - 1), 0, 1);

    return { currentSection, sectionT, cameraT };
}

function setActiveStep(sectionIndex) {
    document.querySelectorAll('#story .step').forEach((step, index) => {
        step.classList.toggle('active', index === sectionIndex);
    });
}

function updateVisualStatus(sectionIndex) {
    if (!visualStatusLabel || !visualStatusTitle) return;

    visualStatusLabel.textContent = `${storyConfig.title} · ${sectionIndex + 1}/${storySectionCount}`;
    visualStatusTitle.textContent = sectionVisualLabels[sectionIndex] || 'Interaktive 3D-Ansicht';
}

function updateCameraScroll() {
    const scrollState = getScrollState();
    const h = window.innerHeight;

    // Divider komplett entfernt (ab Sektion 4 und generell)
    document.body.classList.remove('in-comparison');

    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        const progress = clamp(window.scrollY / Math.max(1, document.documentElement.scrollHeight - h), 0, 1);
        progressBar.style.width = `${progress * 100}%`;
    }

    posCurve.getPoint(scrollState.cameraT, camera1.position);
    lookCurve.getPoint(scrollState.cameraT, controls1.target);
    if (window.innerWidth <= 820) {
        camera1.position.lerp(new THREE.Vector3(0, 70, 850), 0.65);
        controls1.target.lerp(new THREE.Vector3(0, 90, 0), 0.65);
    }
    setActiveStep(scrollState.currentSection);
    updateNavLinks(scrollState.currentSection);
    updateVisualStatus(scrollState.currentSection);

    return scrollState;
}

function updateNavLinks(sectionIndex) {
    let navIndex = 0;
    if (sectionIndex >= 15) navIndex = 6; 
    else if (sectionIndex >= 12) navIndex = 5; 
    else if (sectionIndex >= 10) navIndex = 4; 
    else if (sectionIndex >= 7) navIndex = 3; 
    else if (sectionIndex >= 5) navIndex = 2; 
    else if (sectionIndex >= 3) navIndex = 1; 
    else navIndex = 0;

    [document.querySelectorAll('.nav-links a'), document.querySelectorAll('.nav-menu-mobile a')].forEach((links) => {
        links.forEach((link, index) => {
            link.classList.toggle('active', index === navIndex);
        });
    });
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
    
    const scrollState = updateCameraScroll();
    const currentSection = scrollState.currentSection;
    const sectionT = scrollState.sectionT;

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
    const animFactor = Math.min(1, 0.25 + sectionT * 1.4); 

    getLayoutGroups().forEach(group => {
        if (group && group.visible) {
            const base = baseScales.get(group) || 1;
            const pulse = 1 + Math.sin(sectionT * Math.PI) * 0.035;
            group.scale.setScalar(base * (0.92 + 0.08 * animFactor) * pulse);
            group.traverse(child => {
                if (child.isMesh && child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach((material) => {
                        if (!material.transparent) return;
                        const originalOpacity = (child.name === "AortaWall") ? settings.aortaOpacity : Math.max(material.opacity || 0.72, 0.72);
                        material.opacity = Math.max(0.18, originalOpacity * animFactor);
                    });
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

    // Einzelansicht: Immer scene1
    camera1.aspect = width / height; camera1.updateProjectionMatrix();
    renderer.setViewport(0, 0, width, height); renderer.setScissor(0, 0, width, height);
    renderer.render(scene1, camera1);
}

function update3DVisibility(section) {
    group1.visible = group2.visible = section2Group.visible = rainerGroup.visible = rainerAnatomyGroup.visible = aortaHoleGroup.visible = dnaGroup.visible = false;
    customSectionGroups.forEach((group) => {
        group.visible = false;
    });
    if (flow1.system) flow1.system.visible = false;
    if (flow2.system) flow2.system.visible = false;

    const rainerAnatomyPlaceholder = document.getElementById('rainer-anatomy-placeholder');
    const aortaHolePlaceholder = document.getElementById('aorta-hole-placeholder');
    const dnaPlaceholder6 = document.getElementById('s6-placeholder');
    const dnaPlaceholder8 = document.getElementById('s8-placeholder');
    if (rainerAnatomyPlaceholder) rainerAnatomyPlaceholder.style.display = 'none';
    if (aortaHolePlaceholder) aortaHolePlaceholder.style.display = 'none';
    if (dnaPlaceholder6) dnaPlaceholder6.style.display = 'none';
    if (dnaPlaceholder8) dnaPlaceholder8.style.display = 'none';

    const editorGroup = customSectionGroups.get(section);
    if (editorGroup) {
        editorGroup.visible = true;
        return;
    }

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
    else if (section === 5) { // Sektion 6
        if (dnaGroup.children.length > 0) {
            dnaGroup.visible = true;
        } else if (dnaPlaceholder6) {
            dnaPlaceholder6.style.display = 'block';
        }
    }
    else if (section === 6) { 
        group1.visible = true; 
        section2Group.visible = true; 
    }
    else if (section === 7) { // Sektion 8
        if (dnaGroup.children.length > 0) {
            dnaGroup.visible = true;
        } else if (dnaPlaceholder8) {
            dnaPlaceholder8.style.display = 'block';
        }
    }
    else if (section >= 8 && section <= 9) group1.visible = true;
    else if (section === 10) { group1.visible = true; if (flow1.system) flow1.system.visible = true; }
    else if (section >= 11 && section <= 14) group1.visible = true;
    else if (section >= 15) group2.visible = true;
}

document.addEventListener('visibilitychange', () => { isRendering = !document.hidden; if (isRendering) animate(); });
function setupUI() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu-mobile');
    if (navToggle && navMenu) navToggle.addEventListener('click', () => navMenu.classList.toggle('active'));
    
    setupTechTerms();
}
window.addEventListener('resize', () => { const container = document.getElementById('container3d'); if (container) { renderer.setSize(container.clientWidth, container.clientHeight); applyResponsiveAortaLayout(); } });
init();
