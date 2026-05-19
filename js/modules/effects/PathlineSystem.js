import * as THREE from 'three';

export class PathlineSystem {
    constructor(settings) {
        this.settings = settings;
        this.pathLinesGroup = new THREE.Group();
    }

    rebuildPaths(flowPaths, targetGroup) {
        if (this.pathLinesGroup.parent) this.pathLinesGroup.parent.remove(this.pathLinesGroup);
        this.pathLinesGroup = new THREE.Group();
        this.pathLinesGroup.visible = this.settings.showPaths;
        targetGroup.add(this.pathLinesGroup);

        if (!flowPaths || flowPaths.length === 0) return;

        const color = new THREE.Color(this.settings.pathColor || "#ffffff");
        const isSolid = this.settings.colorMode === 'Solid';

        flowPaths.forEach(path => {
            let pathObj;
            
            // Simplified logic from analyzer.js but generalized
            if (this.settings.pathStyle === 'Tube') {
                const tubularSegments = Math.floor(path.points.length * 0.8);
                const radialSegments = 8;
                const tubeGeo = new THREE.TubeGeometry(path.curve, tubularSegments, (this.settings.pathWidth || 1.2) * 0.5, radialSegments, false);
                const tubeMat = new THREE.MeshStandardMaterial({ 
                    color: isSolid ? color : 0xffffff,
                    transparent: true, 
                    opacity: this.settings.pathOpacity || 0.5,
                    metalness: 0.3,
                    roughness: 0.4
                });
                pathObj = new THREE.Mesh(tubeGeo, tubeMat);
            } else if (this.settings.pathStyle === 'Flow' || this.settings.pathStyle === 'Comets') {
                const isComet = this.settings.pathStyle === 'Comets';
                const lineGeo = new THREE.BufferGeometry().setFromPoints(path.points);
                const lineMat = new THREE.LineDashedMaterial({
                    color: isSolid ? color : 0xffffff,
                    transparent: true,
                    opacity: (this.settings.pathOpacity || 0.5) * (isComet ? 3 : 2),
                    dashSize: isComet ? 20 : 4,
                    gapSize: isComet ? 60 : 4,
                    scale: 1
                });
                pathObj = new THREE.Line(lineGeo, lineMat);
                pathObj.computeLineDistances();
                if (isComet) {
                    pathObj.userData.isComet = true;
                    const distAttr = pathObj.geometry.attributes.lineDistance;
                    pathObj.userData.totalLength = distAttr.getX(distAttr.count - 1);
                } else { 
                    pathObj.userData.isFlow = true; 
                }
            } else {
                const lineGeo = new THREE.BufferGeometry().setFromPoints(path.points);
                const lineMat = new THREE.LineBasicMaterial({ 
                    color: isSolid ? color : 0xffffff,
                    transparent: true, 
                    opacity: this.settings.pathOpacity || 0.5
                });
                pathObj = new THREE.Line(lineGeo, lineMat);
            }
            this.pathLinesGroup.add(pathObj);
        });
    }

    update(speedMultiplier, currentPulse) {
        if (!this.pathLinesGroup.visible) return;

        this.pathLinesGroup.children.forEach(child => {
            if ((child.userData.isFlow || child.userData.isComet) && child.material.dashOffset !== undefined) {
                const speed = child.userData.isComet ? 0.15 : 0.05;
                child.material.dashOffset -= speed * speedMultiplier * currentPulse;
            }
        });
    }
}
