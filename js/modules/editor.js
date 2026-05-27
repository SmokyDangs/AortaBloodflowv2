const STORAGE_PREFIX = 'aorta-story-editor';
const DB_NAME = 'aorta-story-editor-assets';
const DB_VERSION = 1;
const MODEL_STORE = 'models';

function cloneConfig(config) {
    return JSON.parse(JSON.stringify(config));
}

function getStorageKey(version) {
    return `${STORAGE_PREFIX}:${version}`;
}

function readState(version) {
    try {
        return JSON.parse(localStorage.getItem(getStorageKey(version))) || {};
    } catch (error) {
        console.warn('Editor state could not be read.', error);
        return {};
    }
}

function writeState(version, state) {
    localStorage.setItem(getStorageKey(version), JSON.stringify(state));
}

function setDeepValue(target, path, value) {
    let cursor = target;
    path.slice(0, -1).forEach((key) => {
        if (cursor[key] === undefined) cursor[key] = /^\d+$/.test(key) ? [] : {};
        cursor = cursor[key];
    });
    cursor[path[path.length - 1]] = value;
}

function openEditorDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(MODEL_STORE)) {
                db.createObjectStore(MODEL_STORE, { keyPath: 'key' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function writeUploadedModel(version, sectionIndex, file) {
    const db = await openEditorDb();
    const key = `${version}:${sectionIndex}`;

    return new Promise((resolve, reject) => {
        const tx = db.transaction(MODEL_STORE, 'readwrite');
        tx.objectStore(MODEL_STORE).put({
            key,
            version,
            sectionIndex,
            name: file.name,
            size: file.size,
            type: file.type || 'model/gltf-binary',
            updatedAt: new Date().toISOString(),
            file
        });
        tx.oncomplete = () => {
            db.close();
            resolve();
        };
        tx.onerror = () => {
            db.close();
            reject(tx.error);
        };
    });
}

async function deleteUploadedModel(version, sectionIndex) {
    const db = await openEditorDb();
    const key = `${version}:${sectionIndex}`;

    return new Promise((resolve, reject) => {
        const tx = db.transaction(MODEL_STORE, 'readwrite');
        tx.objectStore(MODEL_STORE).delete(key);
        tx.oncomplete = () => {
            db.close();
            resolve();
        };
        tx.onerror = () => {
            db.close();
            reject(tx.error);
        };
    });
}

async function deleteUploadedModelsForVersion(version) {
    const entries = await getUploadedModelEntries(version);
    await Promise.all(entries.map((entry) => deleteUploadedModel(version, entry.sectionIndex)));
}

export async function getUploadedModelUrl(version, sectionIndex) {
    const db = await openEditorDb();
    const key = `${version}:${sectionIndex}`;

    return new Promise((resolve, reject) => {
        const tx = db.transaction(MODEL_STORE, 'readonly');
        const request = tx.objectStore(MODEL_STORE).get(key);
        request.onsuccess = () => {
            db.close();
            const entry = request.result;
            resolve(entry ? { ...entry, url: URL.createObjectURL(entry.file) } : null);
        };
        request.onerror = () => {
            db.close();
            reject(request.error);
        };
    });
}

export async function getUploadedModelEntries(version) {
    const db = await openEditorDb();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(MODEL_STORE, 'readonly');
        const request = tx.objectStore(MODEL_STORE).getAll();
        request.onsuccess = () => {
            db.close();
            resolve(request.result.filter((entry) => entry.version === version));
        };
        request.onerror = () => {
            db.close();
            reject(request.error);
        };
    });
}

function mergeSectionOverrides(section, override = {}) {
    const merged = { ...section, ...override };
    if (override.paragraphs) {
        merged.paragraphs = section.paragraphs.map((paragraph, index) => override.paragraphs[index] ?? paragraph);
    }
    return merged;
}

export function getEditorState(version) {
    return readState(version);
}

export function getEffectiveStoryConfig(version, baseConfig) {
    const state = readState(version);
    const config = cloneConfig(baseConfig);

    if (state.title) config.title = state.title;
    if (state.nav) {
        config.nav = config.nav.map((item, index) => ({ ...item, label: state.nav[index]?.label ?? item.label }));
    }
    if (state.sections) {
        config.sections = config.sections.map((section, index) => mergeSectionOverrides(section, state.sections[index]));
    }

    return config;
}

export function initStoryEditor({
    version,
    storyConfig,
    modelOptions,
    getCurrentSection,
    setSectionModel,
    setSectionModelFile,
    resetSectionModel,
    exportState
}) {
    let active = false;
    let statusTimer = null;
    const state = readState(version);

    const shell = document.createElement('aside');
    shell.className = 'editor-panel';
    shell.innerHTML = `
        <div class="editor-panel-head">
            <div>
                <strong>Editor</strong>
                <span>${storyConfig.title}</span>
            </div>
            <span class="editor-save-state" id="editor-save-state">Bereit</span>
        </div>
        <div class="editor-current" id="editor-current"></div>
        <div class="editor-row">
            <label for="editor-section">Sektion</label>
            <select id="editor-section"></select>
        </div>
        <div class="editor-row">
            <label for="editor-model">3D-Modell</label>
            <select id="editor-model"></select>
        </div>
        <div class="editor-upload" id="editor-upload" tabindex="0" role="button">
            <input id="editor-model-file" type="file" accept=".glb,model/gltf-binary">
            <span>GLB-Datei ablegen</span>
            <small>ersetzt das Modell der gewaehlten Sektion</small>
        </div>
        <p class="editor-file-status" id="editor-file-status"></p>
        <div class="editor-actions">
            <button type="button" data-editor-action="reset-model">Modell reset</button>
            <button type="button" data-editor-action="export">Export</button>
            <button type="button" data-editor-action="reset-all">Alle Aenderungen zuruecksetzen</button>
        </div>
        <textarea id="editor-export" readonly aria-label="Editor Export"></textarea>
    `;
    document.body.appendChild(shell);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'editor-toggle';
    toggle.setAttribute('aria-pressed', 'false');
    toggle.textContent = 'Editor';
    document.body.appendChild(toggle);

    const sectionSelect = shell.querySelector('#editor-section');
    const modelSelect = shell.querySelector('#editor-model');
    const currentInfo = shell.querySelector('#editor-current');
    const saveState = shell.querySelector('#editor-save-state');
    const uploadZone = shell.querySelector('#editor-upload');
    const fileInput = shell.querySelector('#editor-model-file');
    const fileStatus = shell.querySelector('#editor-file-status');
    const exportBox = shell.querySelector('#editor-export');

    storyConfig.sections.forEach((section, index) => {
        const option = document.createElement('option');
        option.value = String(index);
        option.textContent = section.title.replace(/<[^>]+>/g, '');
        sectionSelect.appendChild(option);
    });

    [{ id: '', label: 'Standardmodell' }, ...modelOptions].forEach((model) => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.label;
        modelSelect.appendChild(option);
    });

    const uploadedOption = document.createElement('option');
    uploadedOption.value = '__uploaded';
    uploadedOption.textContent = 'Hochgeladene GLB';
    modelSelect.appendChild(uploadedOption);

    function setStatus(message, tone = 'neutral') {
        saveState.textContent = message;
        saveState.dataset.tone = tone;
        if (statusTimer) clearTimeout(statusTimer);
        if (tone !== 'neutral') {
            statusTimer = setTimeout(() => {
                saveState.textContent = 'Bereit';
                saveState.dataset.tone = 'neutral';
            }, 2200);
        }
    }

    function syncPanel() {
        const sectionIndex = getCurrentSection();
        updatePanelForSection(sectionIndex);
    }

    function updatePanelForSection(sectionIndex) {
        const section = storyConfig.sections[sectionIndex];
        const title = section?.title?.replace(/<[^>]+>/g, '') || `Sektion ${sectionIndex + 1}`;
        sectionSelect.value = String(sectionIndex);
        modelSelect.value = state.uploadedModels?.[sectionIndex] ? '__uploaded' : state.models?.[sectionIndex] || '';
        currentInfo.innerHTML = `
            <span>Aktive Sektion</span>
            <strong>${sectionIndex + 1}. ${title.replace(/^\d+\.\s*/, '')}</strong>
        `;
        fileStatus.textContent = state.uploadedModels?.[sectionIndex]?.name
            ? `Aktiv: ${state.uploadedModels[sectionIndex].name}`
            : '';
    }

    function setActive(nextActive) {
        active = nextActive;
        document.body.classList.toggle('editor-mode', active);
        toggle.setAttribute('aria-pressed', String(active));
        document.querySelectorAll('[data-edit-path]').forEach((node) => {
            node.contentEditable = active ? 'true' : 'false';
            node.spellcheck = active;
        });
        syncPanel();
    }

    function saveEditableValue(element) {
        const path = element.dataset.editPath.split('.');
        const nextState = readState(version);
        const value = element.innerHTML.trim();
        setDeepValue(nextState, path, value);
        Object.assign(state, nextState);
        writeState(version, nextState);
        setStatus('Gespeichert', 'saved');
        document.querySelectorAll(`[data-edit-path="${element.dataset.editPath}"]`).forEach((matchingElement) => {
            if (matchingElement !== element) matchingElement.innerHTML = value;
        });
    }

    document.querySelectorAll('[data-edit-path]').forEach((element) => {
        element.addEventListener('click', (event) => {
            if (active && element.closest('a')) event.preventDefault();
        });
        element.addEventListener('blur', () => {
            if (active) saveEditableValue(element);
        });
        element.addEventListener('input', () => {
            if (active) setStatus('Ungespeichert', 'dirty');
        });
        element.addEventListener('keydown', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                event.preventDefault();
                saveEditableValue(element);
            }
        });
    });

    toggle.addEventListener('click', () => setActive(!active));
    window.addEventListener('scroll', syncPanel, { passive: true });

    sectionSelect.addEventListener('change', () => {
        const sectionIndex = Number(sectionSelect.value);
        updatePanelForSection(sectionIndex);
        setStatus('Sektion aktiv', 'saved');
        const step = document.getElementById(`s${Number(sectionSelect.value) + 1}`);
        if (step) step.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    modelSelect.addEventListener('change', async () => {
        const sectionIndex = Number(sectionSelect.value);
        const nextState = readState(version);
        if (!nextState.models) nextState.models = {};
        if (!nextState.uploadedModels) nextState.uploadedModels = {};

        if (modelSelect.value === '__uploaded') {
            setStatus('GLB ablegen', 'dirty');
            syncPanel();
            return;
        }

        if (modelSelect.value) {
            nextState.models[sectionIndex] = modelSelect.value;
            delete nextState.uploadedModels[sectionIndex];
            await deleteUploadedModel(version, sectionIndex);
            await setSectionModel(sectionIndex, modelSelect.value);
        } else {
            delete nextState.models[sectionIndex];
            delete nextState.uploadedModels[sectionIndex];
            await deleteUploadedModel(version, sectionIndex);
            resetSectionModel(sectionIndex);
        }

        Object.assign(state, nextState);
        writeState(version, nextState);
        setStatus('Modell gespeichert', 'saved');
        syncPanel();
    });

    async function handleModelFile(file) {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.glb')) {
            fileStatus.textContent = 'Bitte eine .glb-Datei waehlen.';
            setStatus('Falscher Dateityp', 'error');
            return;
        }

        const sectionIndex = Number(sectionSelect.value);
        const nextState = readState(version);
        if (!nextState.models) nextState.models = {};
        if (!nextState.uploadedModels) nextState.uploadedModels = {};

        fileStatus.textContent = `Lade ${file.name} ...`;
        setStatus('Import laeuft', 'dirty');
        await writeUploadedModel(version, sectionIndex, file);
        delete nextState.models[sectionIndex];
        nextState.uploadedModels[sectionIndex] = {
            name: file.name,
            size: file.size,
            updatedAt: new Date().toISOString()
        };

        Object.assign(state, nextState);
        writeState(version, nextState);
        await setSectionModelFile(sectionIndex, URL.createObjectURL(file), file.name);
        setStatus('GLB gespeichert', 'saved');
        syncPanel();
    }

    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            fileInput.click();
        }
    });
    fileInput.addEventListener('change', () => handleModelFile(fileInput.files?.[0]));

    ['dragenter', 'dragover'].forEach((eventName) => {
        uploadZone.addEventListener(eventName, (event) => {
            event.preventDefault();
            uploadZone.classList.add('is-dragging');
        });
    });
    ['dragleave', 'drop'].forEach((eventName) => {
        uploadZone.addEventListener(eventName, (event) => {
            event.preventDefault();
            uploadZone.classList.remove('is-dragging');
        });
    });
    uploadZone.addEventListener('drop', (event) => {
        handleModelFile(event.dataTransfer?.files?.[0]);
    });

    shell.addEventListener('click', (event) => {
        const action = event.target.closest('[data-editor-action]')?.dataset.editorAction;
        if (!action) return;

        if (action === 'reset-model') {
            const sectionIndex = Number(sectionSelect.value);
            const nextState = readState(version);
            if (nextState.models) delete nextState.models[sectionIndex];
            if (nextState.uploadedModels) delete nextState.uploadedModels[sectionIndex];
            Object.assign(state, nextState);
            writeState(version, nextState);
            deleteUploadedModel(version, sectionIndex).finally(() => resetSectionModel(sectionIndex));
            setStatus('Modell entfernt', 'saved');
            syncPanel();
        }

        if (action === 'export') {
            exportBox.value = JSON.stringify(exportState(), null, 2);
            exportBox.classList.add('is-visible');
            exportBox.select();
            setStatus('Export bereit', 'saved');
        }

        if (action === 'reset-all' && confirm('Alle lokalen Editor-Aenderungen fuer diese Story zuruecksetzen?')) {
            localStorage.removeItem(getStorageKey(version));
            deleteUploadedModelsForVersion(version).finally(() => window.location.reload());
        }
    });

    syncPanel();
}
