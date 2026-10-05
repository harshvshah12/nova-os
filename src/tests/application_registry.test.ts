// ============================================================================
// NOVA OS — APPLICATION REGISTRY & MIME DISPATCH TEST SUITE
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  APPLICATION_REGISTRY,
  getAppForFile,
  getAppsByCategory,
  searchApps,
} from '../simulation/applications/ApplicationRegistry';

describe('ApplicationRegistry', () => {
  it('registers all 28 applications with complete metadata', () => {
    const apps = Object.values(APPLICATION_REGISTRY);
    expect(apps.length).toBe(28);

    for (const app of apps) {
      expect(app.id).toBeDefined();
      expect(app.name).toBeDefined();
      expect(app.category).toBeDefined();
      expect(app.processName).toBeDefined();
      expect(app.workloadProfile).toBeDefined();
      expect(app.workloadProfile.memoryMb).toBeGreaterThan(0);
      expect(app.defaultWidth).toBeGreaterThan(200);
      expect(app.defaultHeight).toBeGreaterThan(200);
    }
  });

  it('correctly dispatches file types to associated applications', () => {
    // Markdown / PDFs -> Document Viewer
    expect(getAppForFile('guide.md')?.id).toBe('document-viewer');
    expect(getAppForFile('whitepaper.pdf')?.id).toBe('document-viewer');

    // Images -> Image Viewer
    expect(getAppForFile('wallpaper.png')?.id).toBe('image-viewer');
    expect(getAppForFile('logo.svg')?.id).toBe('image-viewer');
    expect(getAppForFile('photo.jpg')?.id).toBe('image-viewer');

    // Audio -> Media Player
    expect(getAppForFile('track.mp3')?.id).toBe('media-player');
    expect(getAppForFile('ambient.wav')?.id).toBe('media-player');

    // Archives -> Archive Manager
    expect(getAppForFile('bundle.tar.gz')?.id).toBe('archive-manager');
    expect(getAppForFile('backup.zip')?.id).toBe('archive-manager');

    // Code and plain text -> Text Editor
    expect(getAppForFile('kernel.c')?.id).toBe('text-editor');
    expect(getAppForFile('script.py')?.id).toBe('text-editor');
    expect(getAppForFile('notes.txt')?.id).toBe('text-editor');

    // Shell scripts -> Terminal
    expect(getAppForFile('script.sh')?.id).toBe('terminal');

    // HTML / Web -> Browser
    expect(getAppForFile('index.html')?.id).toBe('browser');
  });

  it('filters applications by category accurately', () => {
    const systemApps = getAppsByCategory('System');
    expect(systemApps.some((a) => a.id === 'terminal')).toBe(true);
    expect(systemApps.some((a) => a.id === 'file-manager')).toBe(true);

    const internetApps = getAppsByCategory('Internet');
    expect(internetApps.some((a) => a.id === 'browser')).toBe(true);
    expect(internetApps.some((a) => a.id === 'download-manager')).toBe(true);

    const mediaApps = getAppsByCategory('Media');
    expect(mediaApps.some((a) => a.id === 'media-player')).toBe(true);
    expect(mediaApps.some((a) => a.id === 'image-viewer')).toBe(true);
  });

  it('searches applications by keyword across names and descriptions', () => {
    const results1 = searchApps('browser');
    expect(results1.some((a) => a.id === 'browser')).toBe(true);

    const results2 = searchApps('gantt');
    expect(results2.some((a) => a.id === 'scheduler-visualizer')).toBe(true);

    const results3 = searchApps('banker');
    expect(results3.some((a) => a.id === 'deadlock-lab')).toBe(true);
  });
});
