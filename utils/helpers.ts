// --- Type Definitions ---
export interface LanguageOption {
  code: string;
  name: string;
}

// --- Constants ---
export const TRANSCRIPTION_LANGUAGES: LanguageOption[] = [
  { code: 'ja-JP', name: '日本語' },
  { code: 'en-US', name: 'English' },
  { code: 'zh-CN', name: '中文' },
  { code: 'vi-VN', name: 'Tiếng Việt' },
  { code: 'ko-KR', name: '한국어' },
  { code: 'pt-BR', name: 'Português' },
];

export const OPTIONAL_LANGUAGES: LanguageOption[] = [
  { code: 'none', name: 'None' },
  ...TRANSCRIPTION_LANGUAGES
];

export const LANGUAGE_STYLES: Record<string, string> = {
  '日本語': 'bg-red-900/50 text-red-300 border border-red-500/30',
  'English': 'bg-blue-900/50 text-blue-300 border border-blue-500/30',
  '中文': 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/30',
  'Tiếng Việt': 'bg-green-900/50 text-green-300 border border-green-500/30',
  '한국어': 'bg-purple-900/50 text-purple-300 border border-purple-500/30',
  'Português': 'bg-orange-900/50 text-orange-300 border border-orange-500/30',
};

export const DEFAULT_STYLE = 'bg-cyan-900/50 text-cyan-300 border border-cyan-500/30';

/**
 * Get language-specific Tailwind CSS style by language name
 * @param langName - The language name to search for
 * @returns The corresponding Tailwind CSS classes
 */
export const getLangStyleByName = (langName: string): string => {
  const foundKey = Object.keys(LANGUAGE_STYLES).find(key => langName.includes(key));
  return foundKey ? LANGUAGE_STYLES[foundKey] : DEFAULT_STYLE;
};

/**
 * Encode Uint8Array to base64 string
 * @param bytes - The byte array to encode
 * @returns Base64 encoded string
 */
export const encode = (bytes: Uint8Array): string => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};
