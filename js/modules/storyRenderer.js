import { getEffectiveStoryConfig } from './editor.js';
import { storyVersions } from './storyContent.js?v=2';

const iconLibrary = {
    aorta: '<path d="M12 3c3 2 5 5 5 9 0 5-3 9-5 9s-5-4-5-9c0-4 2-7 5-9Z"/><path d="M12 8v11"/><path d="M9 11c2 1 4 1 6 0"/>',
    patient: '<circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/>',
    alert: '<path d="m21 16-8.5-14-8.5 14a2 2 0 0 0 1.7 3h13.6a2 2 0 0 0 1.7-3Z"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
    anatomy: '<path d="M12 2v20"/><path d="M8 5c-2 1-3 3-3 5 0 4 3 7 7 7"/><path d="M16 5c2 1 3 3 3 5 0 4-3 7-7 7"/>',
    split: '<path d="M12 3v18"/><path d="M6 8c3 0 3 3 6 3s3-3 6-3"/><path d="M6 16c3 0 3-3 6-3s3 3 6 3"/>',
    dna: '<path d="M17 3c0 6-10 6-10 12 0 2 1 4 3 6"/><path d="M7 3c0 6 10 6 10 12 0 2-1 4-3 6"/><path d="M8 7h8"/><path d="M8 17h8"/>',
    pressure: '<path d="M12 14a3 3 0 1 0-3-3"/><path d="M19 11a7 7 0 1 0-14 0"/><path d="M12 14v7"/><path d="M8 21h8"/>',
    symptom: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
    scan: '<path d="M4 7V5a1 1 0 0 1 1-1h2"/><path d="M17 4h2a1 1 0 0 1 1 1v2"/><path d="M20 17v2a1 1 0 0 1-1 1h-2"/><path d="M7 20H5a1 1 0 0 1-1-1v-2"/><path d="M7 12h10"/>',
    flow: '<path d="M4 12c4-6 8 6 12 0 1-2 2-3 4-3"/><path d="M4 17c4-6 8 6 12 0 1-2 2-3 4-3"/>',
    therapy: '<path d="M10 21h4"/><path d="M12 17v4"/><path d="M8 3h8v8a4 4 0 0 1-8 0V3Z"/><path d="M9 7h6"/>',
    success: '<path d="M20 6 9 17l-5-5"/>',
    heart: '<path d="M19 14c1.5-1.5 3-3.3 3-5.5A5.5 5.5 0 0 0 12 5a5.5 5.5 0 0 0-10 3.5C2 13 12 21 12 21s3.5-2.8 7-7Z"/>',
    summary: '<path d="M4 4h16v16H4z"/><path d="M8 9h8"/><path d="M8 13h6"/><path d="M8 17h4"/>'
};

const statIconMap = {
    A: 'aorta',
    R: 'patient',
    '!': 'alert',
    '3D': 'anatomy',
    X: 'split',
    DNA: 'dna',
    BP: 'pressure',
    S: 'symptom',
    CT: 'scan',
    US: 'scan',
    M: 'scan',
    F: 'flow',
    I: 'split',
    Rx: 'therapy',
    OP: 'therapy',
    EV: 'therapy',
    '%': 'success',
    N: 'success',
    H: 'heart',
    '*': 'summary',
    '5.5': 'alert'
};

const abbreviationLegend = {
    BD: 'Blutdruck',
    CT: 'Computertomographie',
    DNA: 'Erbinformation',
    EVAR: 'endovaskuläre Aortenreparatur',
    OP: 'Operation',
    Rx: 'Medikamentöse Therapie',
    US: 'Ultraschall',
    Gen: 'Genetische Faktoren',
    Lab: 'Laborwerte'
};

function renderIcon(key) {
    const iconName = statIconMap[key] || 'summary';
    return `
        <svg class="stat-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            ${iconLibrary[iconName]}
        </svg>
    `;
}

function collectAbbreviations(section, chart) {
    const source = [
        section.statIcon,
        section.statText,
        section.statLabel,
        ...(chart?.items?.map((item) => item.label) || [])
    ].filter(Boolean).join(' ');

    return Object.entries(abbreviationLegend)
        .filter(([abbr]) => new RegExp(`(^|[^A-Za-zÄÖÜäöü])${abbr}([^A-Za-zÄÖÜäöü]|$)`).test(source))
        .map(([abbr, meaning]) => `${abbr} = ${meaning}`);
}

function renderParagraphs(paragraphs = [], sectionIndex = 0) {
    const editBasePath = typeof sectionIndex === 'string' ? sectionIndex : `sections.${sectionIndex}`;
    return paragraphs.map((paragraph, paragraphIndex) => `
        <p data-edit-path="${editBasePath}.paragraphs.${paragraphIndex}">${paragraph}</p>
    `).join('');
}

function clampPercent(value) {
    const numeric = Number.parseFloat(value);
    if (Number.isNaN(numeric)) return 0;
    return Math.max(0, Math.min(100, numeric));
}

function renderStats(section, chart, editBasePath = `sections.${section.__index}`) {
    if (!section.statText) return '';
    const legends = collectAbbreviations(section, chart);

    return `
        <div class="stats-box">
            <div class="icon-placeholder">${renderIcon(section.statIcon || 'i')}</div>
            <div>
                <strong data-edit-path="${editBasePath}.statLabel">${section.statLabel || 'Info:'}</strong>
                <span data-edit-path="${editBasePath}.statText">${section.statText}</span>
                ${legends.length ? `<small class="abbr-legend">${legends.join(' · ')}</small>` : ''}
            </div>
        </div>
    `;
}

const chartPresets = {
    dissection: [
        null,
        { type: 'meter', label: 'Akutverlauf', value: 82, caption: 'Zeitkritik bei Verdacht' },
        { type: 'bars', label: 'Versorgungskette', items: [{ label: '0h', value: 95 }, { label: '2h', value: 68 }, { label: '6h', value: 42 }] },
        null,
        { type: 'split', label: 'Gefäßwand', items: [{ label: 'echtes Lumen', value: 54 }, { label: 'falsches Lumen', value: 46 }] },
        null,
        { type: 'bars', label: 'Risikotreiber', items: [{ label: 'BD', value: 88 }, { label: 'Gen', value: 58 }, { label: 'Alter', value: 46 }] },
        { type: 'meter', label: 'Symptomdruck', value: 91, caption: 'starker Schmerz als Warnsignal' },
        null,
        { type: 'bars', label: 'Bildgebung', items: [{ label: 'CT', value: 92 }, { label: 'Echo', value: 70 }, { label: 'Lab', value: 36 }] },
        { type: 'flow', label: 'Strömung', items: [{ label: 'normal', value: 42 }, { label: 'turbulent', value: 86 }] },
        null,
        { type: 'split', label: 'Therapie', items: [{ label: 'Druck', value: 38 }, { label: 'OP', value: 62 }] },
        null,
        { type: 'meter', label: 'Nutzen früh', value: 78, caption: 'Komplikationsrisiko sinkt' },
        null,
        { type: 'bars', label: 'Nachsorge', items: [{ label: 'BD', value: 90 }, { label: 'CT', value: 72 }, { label: 'Plan', value: 64 }] },
        null
    ],
    aneurysm: [
        null,
        { type: 'meter', label: 'Belastung', value: 64, caption: 'Druck auf Gefäßwand' },
        { type: 'bars', label: 'Prävalenz', items: [{ label: '<55', value: 12 }, { label: '65+', value: 58 }, { label: '75+', value: 76 }] },
        null,
        { type: 'split', label: 'Wandspannung', items: [{ label: 'stabil', value: 36 }, { label: 'kritisch', value: 64 }] },
        null,
        { type: 'bars', label: 'Risikotreiber', items: [{ label: 'BD', value: 84 }, { label: 'Nikotin', value: 72 }, { label: 'Lipide', value: 52 }] },
        { type: 'meter', label: 'Symptomarm', value: 86, caption: 'häufig lange unbemerkt' },
        null,
        { type: 'bars', label: 'Messung', items: [{ label: 'US', value: 78 }, { label: 'CT', value: 94 }, { label: 'Plan', value: 68 }] },
        { type: 'flow', label: 'Turbulenz', items: [{ label: 'laminar', value: 38 }, { label: 'Wirbel', value: 82 }] },
        { type: 'meter', label: 'Grenzwert', value: 92, caption: '5,8 cm liegt kritisch' },
        null,
        { type: 'split', label: 'EVAR', items: [{ label: 'Stent', value: 74 }, { label: 'Kontrolle', value: 26 }] },
        { type: 'meter', label: 'Nutzen', value: 95, caption: 'früh behandelt sehr gute Prognose' },
        null,
        { type: 'bars', label: 'Prävention', items: [{ label: 'BD', value: 88 }, { label: 'Screen', value: 72 }, { label: 'Lifestyle', value: 60 }] },
        null
    ]
};

function renderChart(chart, editPath = '') {
    if (!chart) return '';
    const labelPath = editPath ? ` data-edit-path="${editPath}.label"` : '';

    if (chart.type === 'meter') {
        return `
            <div class="mini-chart mini-chart-meter">
                <div class="mini-chart-head">
                    <strong${labelPath}>${chart.label}</strong>
                    <span${editPath ? ` data-edit-path="${editPath}.value"` : ''}>${chart.value}%</span>
                </div>
                <div class="meter-track">
                    <span style="width: ${clampPercent(chart.value)}%"></span>
                </div>
                ${chart.caption ? `<p${editPath ? ` data-edit-path="${editPath}.caption"` : ''}>${chart.caption}</p>` : ''}
            </div>
        `;
    }

    if (chart.type === 'split') {
        return `
            <div class="mini-chart mini-chart-split">
                <div class="mini-chart-head">
                    <strong${labelPath}>${chart.label}</strong>
                    <span>${chart.items.map((item) => item.label).join(' / ')}</span>
                </div>
                <div class="split-track">
                    ${chart.items.map((item) => `<span style="flex-basis: ${clampPercent(item.value)}%"></span>`).join('')}
                </div>
            </div>
        `;
    }

    return `
        <div class="mini-chart mini-chart-bars${chart.type === 'flow' ? ' mini-chart-flow' : ''}">
            <div class="mini-chart-head">
                <strong${labelPath}>${chart.label}</strong>
                <span>Index</span>
            </div>
            <div class="bar-grid">
                ${chart.items.map((item, itemIndex) => `
                    <div class="bar-item">
                        <span class="bar-label"${editPath ? ` data-edit-path="${editPath}.items.${itemIndex}.label"` : ''}>${item.label}</span>
                        <span class="bar-track"><span style="width: ${clampPercent(item.value)}%"></span></span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderIconGrid(items = []) {
    if (!items.length) return '';

    return `
        <div class="icon-grid">
            ${items.map((item) => `
                <div class="icon-item">
                    <div class="icon-placeholder">${renderIcon(item.icon)}</div>
                    <span>${item.label}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function renderIconImages(images = []) {
    if (!images.length) return '';

    return `
        <div class="icon-list">
            ${images.map((image) => `<img src="${image.src}" alt="${image.alt}" class="icon-image">`).join('')}
        </div>
    `;
}

function renderElements(elements = [], editBasePath = 'sections.0') {
    if (!elements.length) return '';

    return elements.map((element, index) => {
        const elementPath = `${editBasePath}.elements.${index}`;

        if (element.type === 'heading') {
            return `<h3 class="info-heading" data-edit-path="${elementPath}.text">${element.text || 'Neue Ueberschrift'}</h3>`;
        }

        if (element.type === 'text') {
            return `<p class="info-text" data-edit-path="${elementPath}.text">${element.text || 'Neuer Text'}</p>`;
        }

        if (element.type === 'stat') {
            return `
                <div class="stats-box stats-box-extra">
                    <div class="icon-placeholder">${renderIcon(element.icon || 'A')}</div>
                    <div>
                        <strong data-edit-path="${elementPath}.label">${element.label || 'Info:'}</strong>
                        <span data-edit-path="${elementPath}.text">${element.text || 'Neue Information'}</span>
                    </div>
                </div>
            `;
        }

        if (element.type === 'chart') {
            return renderChart({
                type: element.chartType || 'bars',
                label: element.label || 'Diagramm',
                value: element.value ?? 60,
                caption: element.caption,
                items: element.items || []
            }, elementPath);
        }

        return '';
    }).join('');
}

function renderPlaceholder(section) {
    if (!section.placeholderId) return '';

    return `
        <div class="placeholder-box" id="${section.placeholderId}">
            <i>${section.placeholderText || '3D-Modell Platzhalter'}</i>
        </div>
    `;
}

function renderSections(sections = [], version = 'aneurysm') {
    return sections.map((section, index) => {
        const chart = section.chart || chartPresets[version]?.[index];
        const editBasePath = Number.isInteger(section.__extraIndex)
            ? `extraSections.${section.__extraIndex}`
            : `sections.${Number.isInteger(section.__baseIndex) ? section.__baseIndex : index}`;

        return `
            <section class="step" id="s${index + 1}" data-section-index="${index}">
                <div class="text-box">
                    <h2 data-edit-path="${editBasePath}.title">${section.title}</h2>
                    ${renderParagraphs(section.paragraphs, editBasePath)}
                    ${renderPlaceholder(section)}
                    ${renderChart(chart)}
                    ${renderElements(section.elements, editBasePath)}
                    ${renderStats({ ...section, __index: index }, chart, editBasePath)}
                    ${renderIconGrid(section.iconGrid)}
                    ${renderIconImages(section.iconImages)}
                </div>
            </section>
        `;
    }).join('');
}

function renderNavLinks(config) {
    const desktopNav = document.getElementById('nav-links');
    const mobileNav = document.querySelector('#nav-menu-mobile ul');
    const links = [
        ...config.nav.map((item, index) => ({
            href: item.href,
            label: item.label,
            index,
            active: index === 0
        })),
        { href: 'index.html', label: 'Dashboard', active: false }
    ];

    const markup = links.map((link) => `
        <li><a href="${link.href}"${link.active ? ' class="active"' : ''}${Number.isInteger(link.index) ? ` data-edit-path="nav.${link.index}.label"` : ''}>${link.label}</a></li>
    `).join('');

    if (desktopNav) desktopNav.innerHTML = markup;
    if (mobileNav) mobileNav.innerHTML = markup;
}

export function getStoryVersion() {
    const requestedVersion = document.body.dataset.storyVersion || 'aneurysm';
    return storyVersions[requestedVersion] ? requestedVersion : 'aneurysm';
}

export function renderStoryPage() {
    const version = getStoryVersion();
    const config = getEffectiveStoryConfig(version, storyVersions[version]);
    const story = document.getElementById('story');
    const pageTitle = document.querySelector('[data-story-title]');

    if (story) story.innerHTML = renderSections(config.sections, version);
    if (pageTitle) pageTitle.textContent = config.title;
    renderNavLinks(config);

    return config;
}
