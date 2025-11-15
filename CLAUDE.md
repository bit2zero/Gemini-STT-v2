# CLAUDE.md - AI Assistant Guide for Gemini-STT-v2

## Project Overview

**Gemini-STT-v2** is a real-time speech-to-text application that leverages Google's Gemini API for live audio transcription with optional translation capabilities. The app provides:
- Real-time audio streaming and transcription
- Multi-language support (Japanese, English, Chinese, Vietnamese, Korean, Portuguese)
- Optional translation to selected target languages
- Live audio processing using the Web Audio API
- API response logging for debugging

**AI Studio Integration**: This app is designed to run within Google's AI Studio environment, with special integration for API key management via `window.aistudio` global object.

---

## Architecture Overview

### Tech Stack
- **Framework**: React 19.2 (with TypeScript)
- **Build Tool**: Vite 6.2
- **Styling**: Tailwind CSS (via CDN)
- **AI Service**: Google Gemini API (`@google/genai` v1.29.1)
- **Audio**: Web Audio API with ScriptProcessorNode
- **Module System**: ES Modules with import maps (for AI Studio compatibility)

### Project Structure

```
Gemini-STT-v2/
├── App.tsx                    # Main application component (435 lines)
├── index.tsx                  # React entry point
├── index.html                 # HTML template with Tailwind CDN & import maps
├── services/
│   └── geminiService.ts       # Placeholder for future API integrations
├── vite.config.ts             # Vite configuration with env variable handling
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies and scripts
├── metadata.json              # AI Studio app metadata
└── README.md                  # Basic setup instructions
```

---

## Key Files Deep Dive

### App.tsx (Main Application)
**Location**: `/App.tsx`
**Lines**: 435
**Purpose**: Single-file React application containing all UI and business logic

#### Key Sections:

1. **Type Definitions** (lines 5-19)
   - `LiveSession`: Interface for Gemini live session
   - `LanguageOption`: Language configuration objects
   - `TranscriptSegment`: Transcript data structure with translation

2. **Constants** (lines 21-48)
   - `TRANSCRIPTION_LANGUAGES`: Supported languages for transcription
   - `OPTIONAL_LANGUAGES`: Languages available for translation (includes 'none')
   - `LANGUAGE_STYLES`: Tailwind classes for language-specific styling
   - `getLangStyleByName()`: Helper for dynamic styling

3. **React Component** (lines 106-435)
   - State management for recording, transcripts, API key, errors
   - Audio processing with Web Audio API
   - Gemini API integration for live transcription
   - Translation service using `gemini-2.5-flash`

#### Critical Functions:

- **`handleStartRecording()`** (App.tsx:179-314)
  - Initializes microphone access
  - Creates AudioContext with 16kHz sample rate
  - Connects to Gemini live session with `gemini-2.5-flash-native-audio-preview-09-2025`
  - Streams PCM audio data in real-time
  - Processes transcription callbacks

- **`translateText()`** (App.tsx:158-177)
  - Uses `gemini-2.5-flash` model for translation
  - Separate API call from transcription
  - Returns translated text or throws error

- **`stopRecording()`** (App.tsx:316-334)
  - Cleanup function for all audio resources
  - Closes Gemini session, media streams, audio processors

### vite.config.ts
**Purpose**: Build configuration with environment variable injection

**Important**: API key is injected at build time:
```typescript
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```

### index.html
**Purpose**: Entry HTML with special AI Studio setup

**Key Features**:
- Tailwind CSS via CDN
- Import maps for AI Studio CDN packages (React, Gemini)
- No local node_modules for React/Gemini in production

---

## Development Workflows

### Initial Setup

```bash
# Install dependencies
npm install

# Set environment variable
# Create .env.local file with:
GEMINI_API_KEY=your_api_key_here

# Start development server
npm run dev
# Server runs on http://0.0.0.0:3000
```

### Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Code Conventions & Patterns

### 1. Component Structure
- Single-file component architecture (all in App.tsx)
- Child components defined as functional components with typed props
- SVG icons defined as inline components

### 2. State Management
- React hooks (`useState`, `useRef`, `useCallback`, `useEffect`)
- **Refs** used for:
  - `sessionRef`: Gemini live session
  - `streamRef`: MediaStream from microphone
  - `inputAudioContextRef`: AudioContext instance
  - `scriptProcessorRef`: ScriptProcessorNode for audio processing
  - `currentTranscriptRef`: Accumulate transcription text

### 3. Error Handling Pattern
```typescript
const handleError = useCallback((err: unknown) => {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
    // Check for specific error types (e.g., invalid API key)
    if (errorMessage.includes('Requested entity was not found.')) {
        setError('API Key is invalid. Please select a valid key.');
        setIsKeySelected(false);
    } else {
        setError(errorMessage);
    }
}, []);
```

### 4. TypeScript Conventions
- Explicit interface definitions for all data structures
- Type guards for error handling
- Strict typing for component props

### 5. Styling Approach
- Tailwind utility classes
- Dynamic class selection via `getLangStyleByName()`
- Responsive design with mobile-first breakpoints
- Dark theme (gray/slate/cyan palette)

---

## API Integration Details

### Gemini Live API (Transcription)

**Model**: `gemini-2.5-flash-native-audio-preview-09-2025`

**Configuration** (App.tsx:272-276):
```typescript
config: {
    responseModalities: [Modality.AUDIO],
    inputAudioTranscription: {},
    systemInstruction: systemInstruction,
}
```

**System Instruction** (App.tsx:154-156):
```
"Transcribe the user's speech. You MUST prefix the output with the detected
language name in brackets. For example: '[English] Hello world' or
'[日本語] こんにちは'. Do not add any other text, conversation, or greetings.
Only provide the formatted transcription."
```

**Audio Format**:
- PCM format at 16kHz sample rate
- Int16 encoding
- Base64-encoded chunks sent via `sendRealtimeInput()`

**Callbacks**:
- `onopen`: Session established
- `onmessage`: Receives transcription updates
- `onerror`: Error handling
- `onclose`: Cleanup

### Gemini Translation API

**Model**: `gemini-2.5-flash`
**Method**: `generateContent()` with text prompts
**Trigger**: After transcription turn completes, if translation language selected

---

## State Flow & Data Processing

### Transcription Flow

1. **User clicks "Start Recording"**
2. Request microphone permission
3. Create AudioContext (16kHz)
4. Connect to Gemini live session
5. **Stream audio**: ScriptProcessorNode → PCM conversion → Gemini API
6. **Receive transcriptions**:
   - `inputTranscription.text` → Accumulate in `currentTranscriptRef`
   - `turnComplete` → Parse language, trigger translation if needed, add to `finalTranscripts`
7. **Display**: Render transcript segments with optional translation

### Language Detection Pattern

Transcription output is parsed using regex (App.tsx:220):
```typescript
const match = fullText.match(/^\[([^\]]+)\]\s*(.*)$/s);
// Extracts: [Language Name] Actual Text
```

### Translation Flow

1. Check if translation target is selected (not 'none')
2. Call `translateText(originalText, targetLangName)`
3. API call with structured prompt
4. Store translated text in `TranscriptSegment`
5. Display below original text with language badge

---

## Common Development Tasks

### Adding a New Language

1. **Update `TRANSCRIPTION_LANGUAGES`** (App.tsx:22-29):
   ```typescript
   { code: 'fr-FR', name: 'Français' }
   ```

2. **Add language style** (App.tsx:35-42):
   ```typescript
   'Français': 'bg-indigo-900/50 text-indigo-300 border border-indigo-500/30'
   ```

### Modifying System Instructions

**Location**: App.tsx:154-156
**Usage**: Controls how Gemini transcribes audio

**Example**: Adding punctuation instructions
```typescript
const getSystemInstruction = () => {
    return `Transcribe the user's speech with proper punctuation.
    You MUST prefix the output with the detected language name in brackets...`;
}
```

### Changing Audio Settings

**Sample Rate** (App.tsx:198):
```typescript
const inputAudioContext = new AudioContext({ sampleRate: 16000 });
```

**Buffer Size** (App.tsx:282):
```typescript
const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
```

### Adding API Response Logging

Pattern already implemented (App.tsx:112-113, 171, 208, etc.):
```typescript
setApiResponses(prev => [...prev, JSON.stringify(data, null, 2)]);
```

---

## Environment Variables

### Required Variables

**File**: `.env.local` (gitignored)

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

**Vite Injection**: Environment variables are injected via `vite.config.ts` as `process.env.API_KEY` and `process.env.GEMINI_API_KEY`.

### AI Studio Integration

In AI Studio environment, API key is managed via:
```typescript
window.aistudio.hasSelectedApiKey()
window.aistudio.openSelectKey()
```

**Check**: `window.aistudio` object availability (App.tsx:134-139, 148-151)

---

## Important Implementation Notes

### 1. Audio Processing Deprecation

**WARNING**: `ScriptProcessorNode` is deprecated but still used (App.tsx:282).

**Future Migration Path**: Replace with AudioWorklet
```typescript
// Current (deprecated):
const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

// Future (recommended):
await context.audioWorklet.addModule('audio-processor.js');
const workletNode = new AudioWorkletNode(context, 'audio-processor');
```

### 2. Transcript Parsing Robustness

The regex pattern for language detection (App.tsx:220) assumes format `[Language] Text`.

**Edge Case**: If Gemini doesn't follow format, falls back to:
- `originalLang = 'Unknown'`
- `originalText = fullText` (includes malformed prefix)

### 3. API Key Validation

Invalid API keys trigger specific error handling (App.tsx:124-127):
```typescript
if (errorMessage.includes('Requested entity was not found.')) {
    setError('API Key is invalid. Please select a valid key.');
    setIsKeySelected(false);
}
```

### 4. Microphone Permissions

**Browser Requirement**: HTTPS or localhost
**Error Handling**: Catches microphone denial (App.tsx:310-312)

### 5. Session Cleanup

Always cleanup resources in `stopRecording()`:
- Close Gemini session
- Stop media tracks
- Disconnect audio processors
- Close AudioContext

**Pattern**: Use refs to track all active resources

---

## Testing Considerations

### Manual Testing Checklist

- [ ] API key selection flow (valid/invalid keys)
- [ ] Microphone permission grant/denial
- [ ] Recording start/stop functionality
- [ ] Transcription accuracy across languages
- [ ] Translation accuracy (when enabled)
- [ ] UI responsiveness (mobile/desktop)
- [ ] Error states (network failure, API errors)
- [ ] Session cleanup on unmount
- [ ] API log visibility toggle

### Known Limitations

1. **No automated tests**: Add Jest + React Testing Library
2. **No E2E tests**: Consider Playwright for full flow
3. **No audio mocking**: Difficult to test Web Audio API

---

## Git Workflow

### Branch Strategy

- **Main branch**: Stable releases
- **Feature branches**: Use `claude/` prefix for AI assistant work
  - Example: `claude/claude-md-mi0dwexzgnz4dfdv-01Ajqq1f3Hx8gtipb16s8Wux`

### Commit Guidelines

- Use conventional commit format:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `refactor:` for code restructuring
  - `docs:` for documentation
  - `style:` for formatting changes

### Current Branch

```bash
claude/claude-md-mi0dwexzgnz4dfdv-01Ajqq1f3Hx8gtipb16s8Wux
```

**Recent Commits**:
```
bcc3139 feat: Setup initial AI transcription app
16ae321 Initial commit
```

---

## Dependencies Management

### Core Dependencies

```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "@google/genai": "^1.29.1"
}
```

### Dev Dependencies

```json
{
  "@vitejs/plugin-react": "^5.0.0",
  "typescript": "~5.8.2",
  "vite": "^6.2.0",
  "@types/node": "^22.14.0"
}
```

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update specific package
npm update @google/genai

# Update all (caution)
npm update
```

---

## Security Considerations

### API Key Handling

- **NEVER commit** `.env.local` file (already in .gitignore as `*.local`)
- **Browser exposure**: API key is visible in client-side code
- **Best practice**: Use server-side proxy for production

### Content Security

- User audio data is sent to Google Gemini API
- No local audio storage
- Transcripts stored only in React state (not persisted)

---

## Performance Optimization Tips

### Current Performance Characteristics

- **Audio buffer**: 4096 samples (~256ms at 16kHz)
- **API latency**: Depends on network + Gemini processing
- **State updates**: Frequent during recording (interim results)

### Optimization Opportunities

1. **Debounce transcript updates**: Reduce re-renders
2. **Virtualize transcript list**: For long sessions
3. **Memoize components**: Use `React.memo()` for SVG icons
4. **Web Workers**: Offload audio encoding

---

## Troubleshooting Guide

### Common Issues

**Issue**: "API Key is invalid"
**Solution**: Check `.env.local` file exists with correct `GEMINI_API_KEY`

**Issue**: "Microphone access denied"
**Solution**: Check browser permissions, use HTTPS/localhost

**Issue**: No transcription appearing
**Solution**:
- Check API log for errors
- Verify Gemini model availability
- Ensure audio is being captured (check browser mic indicator)

**Issue**: Build fails
**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Issue**: Translation fails
**Solution**: Check API quota, verify target language selection

---

## AI Assistant Guidelines

### When Adding Features

1. **Read existing patterns**: Follow established conventions in App.tsx
2. **Type safety**: Always add TypeScript interfaces for new data structures
3. **Error handling**: Use `handleError()` callback pattern
4. **Cleanup**: Add cleanup logic to `stopRecording()` if introducing new resources
5. **State management**: Use appropriate hook (state vs ref vs callback)

### When Refactoring

1. **Don't split too early**: Current single-file approach works for this app size
2. **Preserve AI Studio compatibility**: Keep `window.aistudio` integration
3. **Test audio pipeline**: Any changes to audio processing need manual testing
4. **Maintain backwards compatibility**: Existing transcript format should remain stable

### When Debugging

1. **Enable API log**: Use the "Show API Log" toggle for Gemini responses
2. **Console.log strategically**: Audio events, session lifecycle
3. **Check browser console**: Web Audio API errors appear there
4. **Network tab**: Verify API calls to Gemini

### Code Quality Standards

- **TypeScript strict mode**: No `any` types without justification
- **Accessibility**: Maintain ARIA labels, keyboard navigation
- **Responsive design**: Test mobile layouts
- **Error boundaries**: Consider adding React error boundaries
- **Loading states**: Show appropriate feedback during async operations

---

## Future Enhancement Ideas

1. **Audio Visualization**: Add waveform or volume meter
2. **Export Transcripts**: Download as text/JSON/PDF
3. **Session History**: Persist past transcriptions
4. **Custom Vocabulary**: Fine-tune transcription accuracy
5. **Speaker Diarization**: Identify multiple speakers
6. **Real-time Corrections**: Edit transcripts inline
7. **Offline Mode**: Cache for offline playback/review
8. **Analytics**: Track usage, accuracy metrics
9. **Theme Customization**: Light/dark mode toggle
10. **Keyboard Shortcuts**: Quick start/stop recording

---

## External Resources

- **Gemini API Docs**: https://ai.google.dev/gemini-api/docs
- **Gemini Billing**: https://ai.google.dev/gemini-api/docs/billing
- **AI Studio**: https://ai.studio/
- **Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **React 19 Docs**: https://react.dev/
- **Vite Docs**: https://vite.dev/

---

## Conclusion

This codebase is a focused, single-purpose application with clear separation between:
- **UI Layer**: React components with Tailwind styling
- **Audio Layer**: Web Audio API integration
- **AI Layer**: Gemini API for transcription and translation

**Keep it simple**: The monolithic App.tsx approach works well for this scope. Only refactor into modules when complexity genuinely demands it.

**AI Studio First**: Remember this app is designed for AI Studio environment. Test in that context, not just local dev server.

**Audio is Hard**: Web Audio API quirks require manual testing. Automated testing of audio features is non-trivial.

---

*Last Updated: 2025-11-15*
*Repository: Gemini-STT-v2*
*Branch: claude/claude-md-mi0dwexzgnz4dfdv-01Ajqq1f3Hx8gtipb16s8Wux*
