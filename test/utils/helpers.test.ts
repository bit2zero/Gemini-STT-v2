import { describe, it, expect } from 'vitest';
import {
  getLangStyleByName,
  encode,
  TRANSCRIPTION_LANGUAGES,
  OPTIONAL_LANGUAGES,
  LANGUAGE_STYLES,
  DEFAULT_STYLE,
} from '../../utils/helpers';

describe('helpers', () => {
  describe('getLangStyleByName', () => {
    it('should return the correct style for Japanese', () => {
      const style = getLangStyleByName('日本語');
      expect(style).toBe(LANGUAGE_STYLES['日本語']);
      expect(style).toContain('bg-red-900/50');
    });

    it('should return the correct style for English', () => {
      const style = getLangStyleByName('English');
      expect(style).toBe(LANGUAGE_STYLES['English']);
      expect(style).toContain('bg-blue-900/50');
    });

    it('should return the correct style for Chinese', () => {
      const style = getLangStyleByName('中文');
      expect(style).toBe(LANGUAGE_STYLES['中文']);
      expect(style).toContain('bg-yellow-900/50');
    });

    it('should return the correct style for Vietnamese', () => {
      const style = getLangStyleByName('Tiếng Việt');
      expect(style).toBe(LANGUAGE_STYLES['Tiếng Việt']);
      expect(style).toContain('bg-green-900/50');
    });

    it('should return the correct style for Korean', () => {
      const style = getLangStyleByName('한국어');
      expect(style).toBe(LANGUAGE_STYLES['한국어']);
      expect(style).toContain('bg-purple-900/50');
    });

    it('should return the correct style for Portuguese', () => {
      const style = getLangStyleByName('Português');
      expect(style).toBe(LANGUAGE_STYLES['Português']);
      expect(style).toContain('bg-orange-900/50');
    });

    it('should return default style for unknown language', () => {
      const style = getLangStyleByName('Unknown Language');
      expect(style).toBe(DEFAULT_STYLE);
    });

    it('should match partial language names', () => {
      const style = getLangStyleByName('[日本語] こんにちは');
      expect(style).toBe(LANGUAGE_STYLES['日本語']);
    });

    it('should return default style for empty string', () => {
      const style = getLangStyleByName('');
      expect(style).toBe(DEFAULT_STYLE);
    });
  });

  describe('encode', () => {
    it('should encode empty Uint8Array to empty base64 string', () => {
      const bytes = new Uint8Array([]);
      const encoded = encode(bytes);
      expect(encoded).toBe('');
    });

    it('should encode single byte correctly', () => {
      const bytes = new Uint8Array([65]); // 'A' in ASCII
      const encoded = encode(bytes);
      expect(encoded).toBe('QQ==');
    });

    it('should encode multiple bytes correctly', () => {
      const bytes = new Uint8Array([72, 101, 108, 108, 111]); // 'Hello' in ASCII
      const encoded = encode(bytes);
      expect(encoded).toBe('SGVsbG8=');
    });

    it('should encode binary data correctly', () => {
      const bytes = new Uint8Array([0, 1, 2, 3, 4, 5]);
      const encoded = encode(bytes);
      // Verify it's a valid base64 string
      expect(encoded).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
      // Verify it can be decoded
      const decoded = atob(encoded);
      expect(decoded.length).toBe(6);
    });

    it('should handle large byte arrays', () => {
      const bytes = new Uint8Array(1000).map((_, i) => i % 256);
      const encoded = encode(bytes);
      expect(encoded).toBeTruthy();
      expect(encoded.length).toBeGreaterThan(0);
      // Verify it's valid base64
      expect(encoded).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
    });
  });

  describe('TRANSCRIPTION_LANGUAGES', () => {
    it('should contain 6 languages', () => {
      expect(TRANSCRIPTION_LANGUAGES).toHaveLength(6);
    });

    it('should have correct language codes', () => {
      const codes = TRANSCRIPTION_LANGUAGES.map(lang => lang.code);
      expect(codes).toContain('ja-JP');
      expect(codes).toContain('en-US');
      expect(codes).toContain('zh-CN');
      expect(codes).toContain('vi-VN');
      expect(codes).toContain('ko-KR');
      expect(codes).toContain('pt-BR');
    });

    it('should have correct language names', () => {
      const names = TRANSCRIPTION_LANGUAGES.map(lang => lang.name);
      expect(names).toContain('日本語');
      expect(names).toContain('English');
      expect(names).toContain('中文');
      expect(names).toContain('Tiếng Việt');
      expect(names).toContain('한국어');
      expect(names).toContain('Português');
    });
  });

  describe('OPTIONAL_LANGUAGES', () => {
    it('should contain 7 options (6 languages + None)', () => {
      expect(OPTIONAL_LANGUAGES).toHaveLength(7);
    });

    it('should have "None" as first option', () => {
      expect(OPTIONAL_LANGUAGES[0].code).toBe('none');
      expect(OPTIONAL_LANGUAGES[0].name).toBe('None');
    });

    it('should include all transcription languages', () => {
      const optionalCodes = OPTIONAL_LANGUAGES.map(lang => lang.code);
      TRANSCRIPTION_LANGUAGES.forEach(lang => {
        expect(optionalCodes).toContain(lang.code);
      });
    });
  });

  describe('LANGUAGE_STYLES', () => {
    it('should have styles for all supported languages', () => {
      expect(LANGUAGE_STYLES['日本語']).toBeDefined();
      expect(LANGUAGE_STYLES['English']).toBeDefined();
      expect(LANGUAGE_STYLES['中文']).toBeDefined();
      expect(LANGUAGE_STYLES['Tiếng Việt']).toBeDefined();
      expect(LANGUAGE_STYLES['한국어']).toBeDefined();
      expect(LANGUAGE_STYLES['Português']).toBeDefined();
    });

    it('should contain valid Tailwind classes', () => {
      Object.values(LANGUAGE_STYLES).forEach(style => {
        expect(style).toContain('bg-');
        expect(style).toContain('text-');
        expect(style).toContain('border');
      });
    });

    it('should have unique styles for each language', () => {
      const styles = Object.values(LANGUAGE_STYLES);
      const uniqueStyles = new Set(styles);
      expect(uniqueStyles.size).toBe(styles.length);
    });
  });
});
