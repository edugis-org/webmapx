// Pannellum 2.5 ships a script that sets `window.pannellum`, and no types.
// Only what the street photos tool uses is declared.

declare module 'pannellum/build/pannellum.js';

interface PannellumViewer {
    destroy(): void;
}

interface PannellumConfig {
    type: 'equirectangular';
    panorama: string;
    autoLoad?: boolean;
    yaw?: number;
    pitch?: number;
    hfov?: number;
    showFullscreenCtrl?: boolean;
    compass?: boolean;
    northOffset?: number;
    crossOrigin?: 'anonymous' | 'use-credentials';
    strings?: Record<string, string>;
}

interface Window {
    pannellum?: {
        viewer(container: HTMLElement | string, config: PannellumConfig): PannellumViewer;
    };
}
