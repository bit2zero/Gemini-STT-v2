import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock Google Gemini API
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: vi.fn().mockReturnValue('Translated text'),
        },
      }),
    },
    liveConnect: vi.fn().mockResolvedValue({
      sendRealtimeInput: vi.fn(),
      close: vi.fn(),
      on: vi.fn(),
    }),
  })),
  Modality: {},
  Blob: {},
  LiveServerMessage: {},
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders the main heading', () => {
      render(<App />);
      expect(screen.getByText('Real-time Speech-to-Text')).toBeInTheDocument();
    });

    it('renders the subtitle', () => {
      render(<App />);
      expect(screen.getByText('Live transcription with multi-language recognition.')).toBeInTheDocument();
    });

    it('renders translation language selection dropdown', () => {
      render(<App />);
      expect(screen.getByText('Translate To')).toBeInTheDocument();
    });

    it('renders Start Recording button initially', () => {
      render(<App />);
      const startButton = screen.getByRole('button', { name: /start recording/i });
      expect(startButton).toBeInTheDocument();
      expect(startButton).toHaveTextContent('Start Recording');
    });

    it('displays initial status message', () => {
      render(<App />);
      expect(screen.getByText('Ready to record')).toBeInTheDocument();
    });

    it('displays translation language options including None', () => {
      render(<App />);
      const translationSelect = screen.getByRole('combobox');

      expect(translationSelect).toBeInTheDocument();

      const options = translationSelect.querySelectorAll('option');
      expect(options.length).toBe(7); // 6 languages + "None"

      const languageNames = Array.from(options).map(option => option.textContent);
      expect(languageNames).toContain('None');
      expect(languageNames).toContain('日本語');
      expect(languageNames).toContain('English');
      expect(languageNames).toContain('中文');
      expect(languageNames).toContain('Tiếng Việt');
      expect(languageNames).toContain('한국어');
      expect(languageNames).toContain('Português');
    });
  });

  describe('Language Selection', () => {
    it('allows changing translation language', async () => {
      const user = userEvent.setup();
      render(<App />);

      const translationSelect = screen.getByRole('combobox');

      await user.selectOptions(translationSelect, 'ja-JP');

      expect(translationSelect).toHaveValue('ja-JP');
    });

    it('translation language defaults to "none"', () => {
      render(<App />);

      const translationSelect = screen.getByRole('combobox');

      expect(translationSelect).toHaveValue('none');
    });
  });

  describe('Recording Controls', () => {
    it('displays Start Recording button when not recording', () => {
      render(<App />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      expect(startButton).toBeInTheDocument();
    });

    it('button has microphone icon when ready to record', () => {
      render(<App />);

      const button = screen.getByRole('button', { name: /start recording/i });
      const svg = button.querySelector('svg');

      expect(svg).toBeInTheDocument();
    });
  });

  describe('API Log Toggle', () => {
    it('renders Show API Log checkbox', () => {
      render(<App />);

      const toggleCheckbox = screen.getByRole('checkbox', { name: /show api log/i });
      expect(toggleCheckbox).toBeInTheDocument();
    });

    it('toggles API log visibility when checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);

      const toggleCheckbox = screen.getByRole('checkbox', { name: /show api log/i });

      // Initially, API log should not be visible
      expect(screen.queryByText('API Response Log')).not.toBeInTheDocument();
      expect(toggleCheckbox).not.toBeChecked();

      // Click to show
      await user.click(toggleCheckbox);

      await waitFor(() => {
        expect(screen.getByText('API Response Log')).toBeInTheDocument();
      });

      expect(toggleCheckbox).toBeChecked();

      // Click to hide
      await user.click(toggleCheckbox);

      await waitFor(() => {
        expect(screen.queryByText('API Response Log')).not.toBeInTheDocument();
      });

      expect(toggleCheckbox).not.toBeChecked();
    });
  });

  describe('Transcript Display', () => {
    it('renders transcript section', () => {
      render(<App />);

      expect(screen.getByText('Transcript & Translation (認識結果)')).toBeInTheDocument();
    });

    it('displays message when no transcripts are available', () => {
      render(<App />);

      expect(screen.getByText('Start recording to see transcripts here...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('does not display error message initially', () => {
      render(<App />);

      const errorElements = screen.queryAllByRole('alert');
      const errorDivs = errorElements.filter(el =>
        el.className.includes('bg-red-900')
      );

      expect(errorDivs.length).toBe(0);
    });
  });

  describe('Accessibility', () => {
    it('has proper button for start recording', () => {
      render(<App />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      expect(startButton).toBeInTheDocument();
    });

    it('language selector is properly labeled', () => {
      render(<App />);

      expect(screen.getByText('Translate To')).toBeInTheDocument();
    });
  });

  describe('UI Components', () => {
    it('renders status indicator', () => {
      render(<App />);

      const statusContainer = screen.getByText('Ready to record').parentElement;
      expect(statusContainer).toBeInTheDocument();
    });

    it('renders with dark theme styling', () => {
      const { container } = render(<App />);

      // Check that the app has dark theme classes applied
      const darkThemedElement = container.querySelector('.bg-gradient-to-br');
      expect(darkThemedElement).toBeInTheDocument();
    });
  });

  describe('Constants', () => {
    it('supports 7 translation options (6 languages + None)', () => {
      render(<App />);

      const translationSelect = screen.getByRole('combobox');
      const options = translationSelect.querySelectorAll('option');

      expect(options.length).toBe(7);
    });
  });
});
