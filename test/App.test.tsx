import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { TRANSCRIPTION_LANGUAGES, OPTIONAL_LANGUAGES } from '../utils/helpers';

// Mock GoogleGenAI
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    live: {
      connect: vi.fn(() => ({
        sendRealtimeInput: vi.fn(),
        close: vi.fn(),
      })),
    },
    generateContent: vi.fn(() => ({
      response: {
        text: vi.fn(() => 'Translated text'),
      },
    })),
  })),
  Modality: {
    AUDIO: 'AUDIO',
  },
  Blob: vi.fn(),
  LiveServerMessage: vi.fn(),
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.aistudio mock
    (window.aistudio.hasSelectedApiKey as Mock).mockReturnValue(false);
  });

  describe('Initial Render', () => {
    it('should show API key selection overlay when no key is selected', () => {
      (window.aistudio.hasSelectedApiKey as Mock).mockReturnValue(false);
      render(<App />);
      expect(screen.getByText('API Key Required')).toBeInTheDocument();
      expect(screen.getByText('Select API Key')).toBeInTheDocument();
    });
  });

  describe('API Key Selection', () => {
    it('should call openSelectKey when Select API Key button is clicked', async () => {
      (window.aistudio.hasSelectedApiKey as Mock).mockReturnValue(false);
      render(<App />);

      const selectButton = screen.getByText('Select API Key');
      await userEvent.click(selectButton);

      expect(window.aistudio.openSelectKey).toHaveBeenCalledTimes(1);
    });
  });

  describe('Recording Controls (with API key selected)', () => {
    beforeEach(() => {
      (window.aistudio.hasSelectedApiKey as Mock).mockReturnValue(true);
    });

    it('should show Start Recording button when not recording', async () => {
      render(<App />);
      await waitFor(() => {
        expect(screen.getByText('Start Recording')).toBeInTheDocument();
      });
    });

    it('should have Show API Log button', async () => {
      render(<App />);
      await waitFor(() => {
        expect(screen.getByText('Show API Log')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      (window.aistudio.hasSelectedApiKey as Mock).mockReturnValue(true);
    });

    it('should render container with responsive classes', async () => {
      const { container } = render(<App />);
      await waitFor(() => {
        const mainContainer = container.querySelector('.min-h-screen');
        expect(mainContainer).toBeInTheDocument();
      });
    });
  });
});
