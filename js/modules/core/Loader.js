import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'https://unpkg.com/three@0.160.0/examples/jsm/libs/meshopt_decoder.module.js';

export class Loader {
    constructor() {
        this.loader = new GLTFLoader();
        this.loader.setMeshoptDecoder(MeshoptDecoder);
    }

    async loadModel(url) {
        try {
            return await this.loader.loadAsync(url);
        } catch (e) {
            console.error("Failed to load model:", url, e);
            return null;
        }
    }

    processWall(model, settings) {
        model.updateMatrixWorld(true);
        model.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(settings.aortaColor || "#ffffff"),
                    transparent: true,
                    opacity: settings.aortaOpacity || 0.15,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                    wireframe: settings.wireframe || false
                });
                child.name = "AortaWall";
            }
        });
        return model;
    }

    processPathlines(model) {
        const paths = [];
        const dummy = new THREE.Object3D();
        model.updateMatrixWorld(true);
        model.traverse((child) => {
            if (child.geometry && (child.isLine || child.name.toLowerCase().includes("flow") || child.isMesh)) {
                const posAttr = child.geometry.attributes.position;
                if (!posAttr) return;

                let currentPoints = [];
                const threshold = 10.0; // Distance threshold to detect a "jump" between separate paths

                for (let i = 0; i < posAttr.count; i++) {
                    let v = new THREE.Vector3().fromBufferAttribute(posAttr, i);
                    v.applyMatrix4(child.matrixWorld);

                    if (currentPoints.length > 0) {
                        const dist = v.distanceTo(currentPoints[currentPoints.length - 1]);
                        if (dist > threshold) {
                            // Break detected, finalize current path and start new one
                            this._addPath(paths, currentPoints, dummy);
                            currentPoints = [];
                        }
                    }
                    currentPoints.push(v);
                }
                // Add the last path
                this._addPath(paths, currentPoints, dummy);
            }
        });
        return paths;
    }

    _addPath(paths, points, dummy) {
        if (points.length > 1) {
            const curve = new THREE.CatmullRomCurve3(points);
            const rawQuats = [];
            for (let i = 0; i < points.length; i++) {
                const next = points[(i + 1) % points.length] || points[0];
                dummy.position.copy(points[i]);
                dummy.lookAt(next);
                rawQuats.push(new THREE.Quaternion().copy(dummy.quaternion));
            }
            paths.push({ curve, points, quats: rawQuats });
        }
    }
}
