import * as THREE from 'three';

export class Interaction {
    constructor(camera, controls) {
        this.camera = camera;
        this.controls = controls;
        this.gizmoRenderer = null;
        this.gizmoScene = null;
        this.gizmoCamera = null;
        this.gizmoCube = null;
    }

    initNavbar() {
        const navbar = document.querySelector('.navbar');
        const navToggle = document.querySelector('.nav-toggle');
        const navLinks = document.querySelector('.nav-links');

        if (navbar) {
            window.addEventListener('scroll', () => {
                navbar.classList.toggle('scrolled', window.scrollY > 50);
            });
        }

        if (navToggle) {
            navToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });
        }
    }

    initGizmo(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        this.gizmoScene = new THREE.Scene();
        this.gizmoCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        this.gizmoCamera.position.set(0, 0, 4);

        this.gizmoRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.gizmoRenderer.setSize(120, 120);
        this.gizmoRenderer.setClearColor(0x000000, 0);
        container.appendChild(this.gizmoRenderer.domElement);

        const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        
        const createLabel = (text, bgColor, color = 'white') => {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, 128, 128);
            ctx.fillStyle = color;
            ctx.font = 'bold 80px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 64, 64);
            return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) });
        };

        const materials = [
            createLabel('X', '#ff3333'),
            createLabel('-X', '#cc0000'),
            createLabel('Y', '#33ff33'),
            createLabel('-Y', '#00cc00'),
            createLabel('Z', '#3333ff'),
            createLabel('-Z', '#0000cc')
        ];

        this.gizmoCube = new THREE.Mesh(geometry, materials);
        this.gizmoScene.add(this.gizmoCube);

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        container.addEventListener('mousedown', (event) => {
            const rect = container.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, this.gizmoCamera);
            const intersects = raycaster.intersectObject(this.gizmoCube);

            if (intersects.length > 0) {
                const faceIndex = Math.floor(intersects[0].faceIndex / 2);
                this.alignCamera(faceIndex);
            }
        });
    }

    alignCamera(axis) {
        const distance = this.camera.position.distanceTo(this.controls.target);
        const targetPos = this.controls.target.clone();

        switch(axis) {
            case 0: this.camera.position.set(targetPos.x + distance, targetPos.y, targetPos.z); break;
            case 1: this.camera.position.set(targetPos.x - distance, targetPos.y, targetPos.z); break;
            case 2: this.camera.position.set(targetPos.x, targetPos.y + distance, targetPos.z); break;
            case 3: this.camera.position.set(targetPos.x, targetPos.y - distance, targetPos.z); break;
            case 4: this.camera.position.set(targetPos.x, targetPos.y, targetPos.z + distance); break;
            case 5: this.camera.position.set(targetPos.x, targetPos.y, targetPos.z - distance); break;
        }
        this.camera.lookAt(targetPos);
        this.controls.update();
    }

    updateGizmo() {
        if (this.gizmoRenderer) {
            this.gizmoCube.quaternion.copy(this.camera.quaternion).invert();
            this.gizmoRenderer.render(this.gizmoScene, this.gizmoCamera);
        }
    }
}
