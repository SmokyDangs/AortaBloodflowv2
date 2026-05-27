# Aorta Scrollytelling Project

Dieses Projekt ist eine interaktive, webbasierte Aufklärungsanwendung, die dem Nutzer die Anatomie, Pathologie und Behandlung der Aorta (Hauptschlagader) mittels Scrollytelling und 3D-Visualisierungen näherbringt.

## Tech-Stack

*   **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6 Modules).
*   **3D-Engine:** [Three.js](https://threejs.org/) für die browserbasierte 3D-Darstellung.
*   **Struktur:** Modulare Architektur zur Trennung von UI-Logik, 3D-Rendering und Datenverarbeitung.

## Hauptfunktionen

*   **Scrollytelling:** Der Inhalt der Story passt sich dynamisch dem Scroll-Fortschritt des Nutzers an.
*   **Interaktive 3D-Visualisierung:** Komplexe 3D-Modelle (im `.glb`-Format) werden geladen und in die Story integriert.
*   **Zustandsbasierte Darstellung:** Je nach aktivem Scroll-Abschnitt werden spezifische 3D-Modelle eingeblendet oder ausgeblendet.
*   **Responsive Layout:** Die Anwendung optimiert die Darstellung für verschiedene Bildschirmgrößen, inklusive eines speziellen Layouts für mobile Geräte.

## Projektstruktur

*   `/assets/models/`: Enthält die 3D-Modelle (`.glb`).
*   `/css/`: Stylesheets (`base.css`, `sections.css`, `scrollytelling.css`, `icons.css`, etc.).
*   `/js/modules/`: JavaScript-Module:
    *   `scrollytelling.js`: Zentrale Steuerung der App (Rendering, Scroll-Event-Handling).
    *   `core/Loader.js`: Hilfsklasse zum Laden und Vorverarbeiten der 3D-Modelle.
    *   `effects/`: Spezialisierte Systeme für Flow- und Pathline-Visualisierungen.
    *   `ui/`: Module zur Interaktionssteuerung und Chart-Verwaltung.
*   `/vendor/three/`: Lokale Kopie der Three.js Bibliothek und Add-ons.

## Wichtige Konzepte für Entwickler

1.  **3D-Sichtbarkeitssteuerung:** Die Funktion `update3DVisibility(section)` in `js/modules/scrollytelling.js` steuert, welche 3D-Gruppen bei welchem Scroll-Abschnitt sichtbar sind. Neue Modelle müssen hier registriert werden.
2.  **Responsive Layout:** `applyResponsiveAortaLayout()` sorgt dafür, dass 3D-Modelle zentriert und in der richtigen Größe im Container dargestellt werden.
3.  **Hinzufügen neuer Kapitel:** Neue Schritte im Scrollytelling werden als `<section class="step">` in `index.html` hinzugefügt. Die ID der Sektion muss im JavaScript-Code bei Bedarf zur Logiksteuerung (z.B. in `update3DVisibility`) berücksichtigt werden.

## Installation & Start

1.  Projekt lokal klonen.
2.  Da keine komplexen Build-Tools verwendet werden, kann das Projekt über einen lokalen Webserver (z.B. `npx serve` oder VS Code Live Server) gestartet werden, um CORS-Probleme beim Laden der Module zu vermeiden.
