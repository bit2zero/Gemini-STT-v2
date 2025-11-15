import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.aistudio for testing
global.window = global.window || {};
global.window.aistudio = {
  hasSelectedApiKey: vi.fn(() => false),
  openSelectKey: vi.fn(),
};

// Mock Web Audio API
global.AudioContext = vi.fn().mockImplementation(function() {
  return {
    createScriptProcessor: vi.fn(() => ({
      connect: vi.fn(),
      disconnect: vi.fn(),
      addEventListener: vi.fn(),
      onaudioprocess: null,
    })),
    createMediaStreamSource: vi.fn(() => ({
      connect: vi.fn(),
      disconnect: vi.fn(),
    })),
    close: vi.fn(),
    sampleRate: 16000,
    state: 'running',
  };
}) as any;

// Mock MediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn(() =>
      Promise.resolve({
        getTracks: vi.fn(() => []),
        getAudioTracks: vi.fn(() => [
          {
            stop: vi.fn(),
          },
        ]),
      })
    ),
  },
});
