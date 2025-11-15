# Gemini-STT-v2 UMLシステム仕様書

**バージョン:** 1.0
**作成日:** 2025-11-15
**プロジェクト:** Gemini-STT-v2 (Real-time Speech-to-Text Application)

---

## 目次

1. [システム概要](#システム概要)
2. [アーキテクチャ概要](#アーキテクチャ概要)
3. [クラス図](#クラス図)
4. [コンポーネント図](#コンポーネント図)
5. [シーケンス図](#シーケンス図)
   - 5.1 [録音開始フロー](#51-録音開始フロー)
   - 5.2 [音声転写フロー](#52-音声転写フロー)
   - 5.3 [翻訳フロー](#53-翻訳フロー)
   - 5.4 [録音停止フロー](#54-録音停止フロー)
6. [状態遷移図](#状態遷移図)
7. [データフロー図](#データフロー図)
8. [データモデル](#データモデル)

---

## システム概要

**Gemini-STT-v2**は、Google Gemini APIを活用したリアルタイム音声認識・翻訳アプリケーションです。

### 主要機能

- **リアルタイム音声認識**: Web Audio APIを使用した低遅延な音声ストリーミング
- **多言語サポート**: 日本語、英語、中国語、ベトナム語、韓国語、ポルトガル語の認識
- **オプション翻訳**: 認識された音声を選択した言語に翻訳
- **APIログ機能**: デバッグ用のGemini APIレスポンスログ表示
- **AI Studio統合**: Google AI Studio環境でのAPIキー管理

### 技術スタック

- **フロントエンド**: React 19.2 + TypeScript
- **ビルドツール**: Vite 6.2
- **スタイリング**: Tailwind CSS (CDN)
- **AI API**: Google Gemini API (`@google/genai` v1.29.1)
- **音声処理**: Web Audio API (ScriptProcessorNode)

---

## アーキテクチャ概要

### システムアーキテクチャ

```mermaid
graph TB
    subgraph "Browser Environment"
        subgraph "User Interface Layer"
            UI[React Components]
            APP[App Component]
            OVERLAY[ApiKeySelectionOverlay]
        end

        subgraph "Audio Processing Layer"
            MIC[Microphone Input]
            AUDIO_CTX[AudioContext]
            STREAM[MediaStream]
            PROCESSOR[ScriptProcessorNode]
            PCM[PCM Encoder]
        end

        subgraph "State Management"
            STATE[React State/Refs]
            TRANSCRIPT[Transcript State]
            ERROR[Error State]
        end
    end

    subgraph "External Services"
        GEMINI_LIVE[Gemini Live API<br/>gemini-2.5-flash-native-audio]
        GEMINI_TEXT[Gemini Text API<br/>gemini-2.5-flash]
        AI_STUDIO[AI Studio API Key Management]
    end

    MIC --> AUDIO_CTX
    AUDIO_CTX --> STREAM
    STREAM --> PROCESSOR
    PROCESSOR --> PCM
    PCM --> GEMINI_LIVE
    GEMINI_LIVE --> TRANSCRIPT
    TRANSCRIPT --> GEMINI_TEXT
    GEMINI_TEXT --> TRANSCRIPT
    TRANSCRIPT --> UI
    AI_STUDIO --> STATE
    STATE --> APP
    APP --> UI
    APP --> OVERLAY
    ERROR --> UI

    style GEMINI_LIVE fill:#4285f4
    style GEMINI_TEXT fill:#4285f4
    style AI_STUDIO fill:#34a853
```

---

## クラス図

### 型定義とインターフェース

```mermaid
classDiagram
    class LiveSession {
        <<interface>>
        +sendRealtimeInput(input: InputData) void
        +close() void
    }

    class LanguageOption {
        <<interface>>
        +code: string
        +name: string
    }

    class TranscriptSegment {
        <<interface>>
        +originalText: string
        +originalLang: string
        +translatedText: string | null
        +targetLang: string | null
    }

    class InputData {
        <<interface>>
        +media: Blob
    }

    class Blob {
        <<interface>>
        +data: string
        +mimeType: string
    }

    class LiveServerMessage {
        <<interface>>
        +serverContent: ServerContent | null
    }

    class ServerContent {
        <<interface>>
        +inputTranscription: InputTranscription | null
        +turnComplete: boolean
    }

    class InputTranscription {
        <<interface>>
        +text: string
    }

    class App {
        -isKeySelected: boolean
        -translationLang: string
        -isRecording: boolean
        -finalTranscripts: TranscriptSegment[]
        -error: string | null
        -showApiLog: boolean
        -apiResponses: string[]
        -sessionRef: LiveSession | null
        -streamRef: MediaStream | null
        -inputAudioContextRef: AudioContext | null
        -scriptProcessorRef: ScriptProcessorNode | null
        -currentTranscriptRef: string
        +handleError(err: unknown) void
        +handleSelectKey() Promise~void~
        +getSystemInstruction() string
        +translateText(text: string, targetLangName: string) Promise~string~
        +handleStartRecording() Promise~void~
        +stopRecording() void
        +render() ReactElement
    }

    class ApiKeySelectionOverlay {
        +onSelectKey: Function
        +render() ReactElement
    }

    class MicIcon {
        +className: string
        +render() ReactElement
    }

    class StopIcon {
        +className: string
        +render() ReactElement
    }

    class UtilityFunctions {
        <<utility>>
        +encode(bytes: Uint8Array) string
        +getLangStyleByName(langName: string) string
    }

    LiveSession ..> InputData : uses
    InputData --> Blob : contains
    LiveServerMessage --> ServerContent : contains
    ServerContent --> InputTranscription : contains
    App ..> LiveSession : uses
    App ..> TranscriptSegment : manages
    App ..> LanguageOption : uses
    App ..> LiveServerMessage : receives
    App --> ApiKeySelectionOverlay : renders
    App --> MicIcon : renders
    App --> StopIcon : renders
    App ..> UtilityFunctions : uses
```

### 定数とコンフィグレーション

```mermaid
classDiagram
    class Constants {
        <<constant>>
        +TRANSCRIPTION_LANGUAGES: LanguageOption[]
        +OPTIONAL_LANGUAGES: LanguageOption[]
        +LANGUAGE_STYLES: Record~string, string~
        +DEFAULT_STYLE: string
    }

    class AudioConfig {
        <<configuration>>
        +SAMPLE_RATE: 16000
        +BUFFER_SIZE: 4096
        +CHANNELS: 1
        +MIME_TYPE: "audio/pcm;rate=16000"
    }

    class GeminiConfig {
        <<configuration>>
        +TRANSCRIPTION_MODEL: "gemini-2.5-flash-native-audio-preview-09-2025"
        +TRANSLATION_MODEL: "gemini-2.5-flash"
        +RESPONSE_MODALITIES: [AUDIO]
    }

    App ..> Constants : uses
    App ..> AudioConfig : uses
    App ..> GeminiConfig : uses
```

---

## コンポーネント図

### React コンポーネント階層

```mermaid
graph TD
    subgraph "Application Root"
        APP[App Component<br/>Main Application Logic]
    end

    subgraph "Child Components"
        OVERLAY[ApiKeySelectionOverlay<br/>API Key Selection UI]
        MIC_ICON[MicIcon<br/>SVG Component]
        STOP_ICON[StopIcon<br/>SVG Component]
    end

    subgraph "UI Sections"
        HEADER[Header Section<br/>Title & Description]
        CONTROLS[Controls Section<br/>Language Selection]
        BUTTONS[Action Buttons<br/>Start/Stop Recording]
        ERROR_DISPLAY[Error Display]
        RESULTS[Results Section<br/>Transcripts & Translation]
        API_LOG[API Log Section<br/>Debug Information]
    end

    subgraph "State & Logic"
        STATE_MGR[State Management<br/>useState, useRef, useCallback]
        AUDIO_PROC[Audio Processing Logic<br/>Web Audio API Integration]
        GEMINI_INT[Gemini Integration<br/>Live & Text API]
        ERROR_HANDLER[Error Handling Logic]
    end

    APP --> OVERLAY
    APP --> MIC_ICON
    APP --> STOP_ICON
    APP --> HEADER
    APP --> CONTROLS
    APP --> BUTTONS
    APP --> ERROR_DISPLAY
    APP --> RESULTS
    APP --> API_LOG

    APP --> STATE_MGR
    APP --> AUDIO_PROC
    APP --> GEMINI_INT
    APP --> ERROR_HANDLER

    AUDIO_PROC --> GEMINI_INT
    GEMINI_INT --> STATE_MGR
    ERROR_HANDLER --> STATE_MGR

    style APP fill:#4285f4,color:#fff
    style STATE_MGR fill:#34a853,color:#fff
    style AUDIO_PROC fill:#fbbc04,color:#000
    style GEMINI_INT fill:#ea4335,color:#fff
```

### モジュール依存関係

```mermaid
graph LR
    subgraph "External Dependencies"
        REACT[react<br/>v19.2.0]
        REACT_DOM[react-dom<br/>v19.2.0]
        GENAI[@google/genai<br/>v1.29.1]
    end

    subgraph "Application Modules"
        APP_TSX[App.tsx<br/>Main Component]
        INDEX_TSX[index.tsx<br/>Entry Point]
        GEMINI_SVC[services/geminiService.ts<br/>Placeholder]
    end

    subgraph "Build & Config"
        VITE_CONFIG[vite.config.ts<br/>Build Configuration]
        TS_CONFIG[tsconfig.json<br/>TypeScript Config]
        INDEX_HTML[index.html<br/>Template]
    end

    subgraph "Browser APIs"
        WEB_AUDIO[Web Audio API]
        MEDIA_DEVICES[MediaDevices API]
        AI_STUDIO_API[window.aistudio]
    end

    INDEX_TSX --> REACT
    INDEX_TSX --> REACT_DOM
    INDEX_TSX --> APP_TSX

    APP_TSX --> REACT
    APP_TSX --> GENAI
    APP_TSX --> WEB_AUDIO
    APP_TSX --> MEDIA_DEVICES
    APP_TSX --> AI_STUDIO_API

    VITE_CONFIG --> INDEX_HTML
    TS_CONFIG --> APP_TSX

    style GENAI fill:#4285f4,color:#fff
    style WEB_AUDIO fill:#fbbc04,color:#000
    style AI_STUDIO_API fill:#34a853,color:#fff
```

---

## シーケンス図

### 5.1 録音開始フロー

```mermaid
sequenceDiagram
    actor User
    participant UI as App UI
    participant App as App Component
    participant AIStudio as AI Studio
    participant Browser as Browser APIs
    participant AudioCtx as AudioContext
    participant Processor as ScriptProcessor
    participant Gemini as Gemini Live API

    User->>UI: Click "Start Recording"
    UI->>App: handleStartRecording()

    App->>App: Validate API Key
    alt API Key not selected
        App->>UI: Display Error
        App-->>User: Show error message
    else API Key valid
        App->>App: Reset State
        Note over App: Clear transcripts<br/>Clear API logs<br/>Reset error

        App->>Browser: navigator.mediaDevices.getUserMedia()

        alt Microphone Permission Denied
            Browser-->>App: Error
            App->>App: handleError()
            App->>UI: Display Error
            App-->>User: "Microphone access required"
        else Permission Granted
            Browser-->>App: MediaStream
            App->>App: Store in streamRef

            App->>AudioCtx: new AudioContext({sampleRate: 16000})
            AudioCtx-->>App: AudioContext instance
            App->>App: Store in inputAudioContextRef

            App->>Gemini: ai.live.connect()
            Note over Gemini: Model: gemini-2.5-flash-native-audio<br/>Config: inputAudioTranscription

            Gemini-->>App: onopen callback
            App->>App: Log "Session Opened"
            App->>UI: Update apiResponses

            Gemini-->>App: LiveSession instance
            App->>App: Store in sessionRef

            App->>AudioCtx: createMediaStreamSource(stream)
            AudioCtx-->>App: MediaStreamSource

            App->>AudioCtx: createScriptProcessor(4096, 1, 1)
            AudioCtx-->>App: ScriptProcessorNode
            App->>App: Store in scriptProcessorRef

            App->>Processor: Set onaudioprocess handler
            Note over Processor: Convert Float32 to Int16<br/>Encode to Base64 PCM

            App->>AudioCtx: source.connect(scriptProcessor)
            App->>AudioCtx: scriptProcessor.connect(destination)

            App->>UI: setIsRecording(true)
            UI-->>User: Show "Stop Recording" button

            loop Every audio buffer (256ms)
                Processor->>Processor: onaudioprocess event
                Processor->>Processor: Convert to PCM Int16
                Processor->>Processor: Base64 encode
                Processor->>Gemini: session.sendRealtimeInput({media: pcmBlob})
            end
        end
    end
```

### 5.2 音声転写フロー

```mermaid
sequenceDiagram
    participant Gemini as Gemini Live API
    participant App as App Component
    participant TranscriptRef as currentTranscriptRef
    participant State as React State
    participant UI as App UI
    actor User

    loop During Recording
        Gemini->>App: onmessage(LiveServerMessage)
        App->>App: Log API response
        App->>State: Update apiResponses

        alt Message has inputTranscription
            Gemini->>App: serverContent.inputTranscription.text
            App->>TranscriptRef: Append text
            Note over TranscriptRef: Accumulate interim results
        end

        alt Turn Complete
            Gemini->>App: serverContent.turnComplete = true
            App->>TranscriptRef: Get accumulated text

            App->>App: Parse language format
            Note over App: Regex: /^\[([^\]]+)\]\s*(.*)$/

            alt Format matches [Language] Text
                App->>App: Extract originalLang
                App->>App: Extract originalText
            else Format doesn't match
                App->>App: originalLang = "Unknown"
                App->>App: originalText = fullText
            end

            App->>App: Check translationLang

            alt Translation enabled (not 'none')
                App->>App: translateText(originalText, targetLangName)
                Note over App: See Translation Flow
                App-->>App: translatedText
            else No translation
                App->>App: translatedText = null
                App->>App: targetLang = null
            end

            App->>State: Add to finalTranscripts
            Note over State: {originalText, originalLang,<br/>translatedText, targetLang}

            State->>UI: Re-render with new transcript
            UI-->>User: Display new transcript segment

            App->>TranscriptRef: Clear (reset to '')
            Note over TranscriptRef: Ready for next turn
        end
    end

    alt Session Error
        Gemini->>App: onerror(ErrorEvent)
        App->>App: handleError()
        App->>State: Set error message
        App->>App: stopRecording()
        State->>UI: Display error
        UI-->>User: Show error message
    end
```

### 5.3 翻訳フロー

```mermaid
sequenceDiagram
    participant App as App Component
    participant Gemini as Gemini Text API
    participant State as React State
    participant UI as App UI

    App->>App: translateText(text, targetLangName)

    App->>App: Validate API Key
    alt API Key not available
        App-->>App: throw Error("API Key not available")
    else API Key valid
        App->>App: Create GoogleGenAI instance

        App->>App: Build translation prompt
        Note over App: "Translate the following text to {targetLangName}.<br/>Return only the translated text..."

        App->>Gemini: ai.models.generateContent()
        Note over Gemini: Model: gemini-2.5-flash<br/>Contents: translation prompt

        alt Translation Success
            Gemini-->>App: Response with translated text
            App->>App: Extract response.text.trim()
            App->>State: Log to apiResponses
            Note over State: {request: 'translation',<br/>prompt, response}
            App-->>App: Return translatedText
        else Translation Error
            Gemini-->>App: Error
            App->>App: handleError(err)
            App->>State: Set error message
            App-->>App: throw Error
            Note over App: Caller will catch<br/>and set "Translation failed."
        end
    end
```

### 5.4 録音停止フロー

```mermaid
sequenceDiagram
    actor User
    participant UI as App UI
    participant App as App Component
    participant Session as LiveSession
    participant Stream as MediaStream
    participant Processor as ScriptProcessor
    participant AudioCtx as AudioContext
    participant Gemini as Gemini Live API

    User->>UI: Click "Stop Recording"
    UI->>App: stopRecording()

    alt sessionRef exists
        App->>Session: close()
        Session->>Gemini: Close connection
        Gemini-->>App: onclose callback
        App->>App: Log "Session Closed"
        App->>App: sessionRef = null
    end

    alt streamRef exists
        App->>Stream: getTracks()
        Stream-->>App: MediaStreamTrack[]
        loop For each track
            App->>Stream: track.stop()
        end
        App->>App: streamRef = null
    end

    alt scriptProcessorRef exists
        App->>Processor: disconnect()
        App->>App: scriptProcessorRef = null
    end

    alt inputAudioContextRef exists and not closed
        App->>AudioCtx: Check state !== 'closed'
        App->>AudioCtx: close()
        App->>App: inputAudioContextRef = null
    end

    App->>App: setIsRecording(false)
    App->>UI: Update UI state
    UI-->>User: Show "Start Recording" button
```

---

## 状態遷移図

### アプリケーション状態遷移

```mermaid
stateDiagram-v2
    [*] --> Initial

    Initial --> WaitingForAPIKey: App Loads

    WaitingForAPIKey --> APIKeySelected: AI Studio Key Selected
    WaitingForAPIKey --> WaitingForAPIKey: Invalid Key

    APIKeySelected --> Idle: Key Validated

    Idle --> RequestingMic: User clicks Start

    RequestingMic --> MicDenied: Permission Denied
    RequestingMic --> ConnectingToGemini: Permission Granted

    MicDenied --> Idle: Error Displayed

    ConnectingToGemini --> SessionFailed: Connection Error
    ConnectingToGemini --> Recording: Session Opened

    SessionFailed --> Idle: Error Displayed

    Recording --> Recording: Audio Processing
    Recording --> Recording: Transcription Received
    Recording --> Translating: Turn Complete & Translation Enabled
    Recording --> Idle: User clicks Stop
    Recording --> SessionError: API Error

    Translating --> Recording: Translation Complete
    Translating --> Recording: Translation Failed (show error)

    SessionError --> Idle: Cleanup & Error Displayed

    Idle --> RequestingMic: User clicks Start (retry)

    state Recording {
        [*] --> Listening
        Listening --> Accumulating: Interim Transcription
        Accumulating --> Processing: Turn Complete
        Processing --> [*]: Segment Added
    }

    state Translating {
        [*] --> SendingRequest
        SendingRequest --> WaitingResponse
        WaitingResponse --> [*]: Success/Error
    }
```

### 録音セッション状態

```mermaid
stateDiagram-v2
    [*] --> Idle

    Idle --> Initializing: Start Recording

    Initializing --> CreatingAudioContext: Mic Permission OK
    Initializing --> Error: Mic Permission Denied

    CreatingAudioContext --> ConnectingGemini: AudioContext Ready
    CreatingAudioContext --> Error: Audio Setup Failed

    ConnectingGemini --> SettingUpProcessor: Session Opened
    ConnectingGemini --> Error: Connection Failed

    SettingUpProcessor --> Streaming: Audio Pipeline Ready
    SettingUpProcessor --> Error: Processor Setup Failed

    Streaming --> Streaming: Sending Audio Chunks
    Streaming --> ProcessingTranscript: Transcription Received

    ProcessingTranscript --> Streaming: Transcript Processed
    ProcessingTranscript --> TranslationPending: Translation Required

    TranslationPending --> Streaming: Translation Complete

    Streaming --> Cleanup: Stop Recording
    Error --> Cleanup: Error Handled

    Cleanup --> CleaningSession: Close Gemini Session
    CleaningSession --> CleaningStream: Stop Media Tracks
    CleaningStream --> CleaningProcessor: Disconnect Processor
    CleaningProcessor --> CleaningAudioContext: Close AudioContext
    CleaningAudioContext --> Idle

    Idle --> [*]
```

---

## データフロー図

### 音声データフロー

```mermaid
graph LR
    subgraph "Input"
        MIC[Microphone<br/>User Voice]
    end

    subgraph "Browser Audio Processing"
        MEDIA[MediaStream<br/>Raw Audio]
        AUDIO_CTX[AudioContext<br/>16kHz Sample Rate]
        SOURCE[MediaStreamSource<br/>Audio Node]
        SCRIPT[ScriptProcessor<br/>4096 Buffer]
        FLOAT32[Float32Array<br/>-1.0 to 1.0]
    end

    subgraph "Audio Encoding"
        INT16[Int16Array<br/>PCM Data]
        UINT8[Uint8Array<br/>Binary Data]
        BASE64[Base64 String<br/>Encoded]
        BLOB[PCM Blob<br/>audio/pcm;rate=16000]
    end

    subgraph "Gemini API"
        LIVE_API[Gemini Live API<br/>Streaming Endpoint]
        TRANSCRIPTION[Speech Recognition<br/>Engine]
        LANG_DETECT[Language Detection<br/>Format: [Lang] Text]
    end

    subgraph "Output Processing"
        PARSE[Text Parser<br/>Regex Matching]
        TRANSCRIPT[Transcript Segment<br/>Original Text + Lang]
    end

    MIC --> MEDIA
    MEDIA --> AUDIO_CTX
    AUDIO_CTX --> SOURCE
    SOURCE --> SCRIPT
    SCRIPT --> FLOAT32
    FLOAT32 --> INT16
    INT16 --> UINT8
    UINT8 --> BASE64
    BASE64 --> BLOB
    BLOB --> LIVE_API
    LIVE_API --> TRANSCRIPTION
    TRANSCRIPTION --> LANG_DETECT
    LANG_DETECT --> PARSE
    PARSE --> TRANSCRIPT

    style MIC fill:#fbbc04
    style LIVE_API fill:#4285f4,color:#fff
    style TRANSCRIPT fill:#34a853,color:#fff
```

### 翻訳データフロー

```mermaid
graph TD
    subgraph "Input"
        ORIGINAL[Original Text<br/>Transcribed Speech]
        TARGET_LANG[Target Language<br/>User Selection]
    end

    subgraph "Translation Logic"
        CHECK{Translation<br/>Enabled?}
        BUILD_PROMPT[Build Translation Prompt<br/>Structured Request]
    end

    subgraph "Gemini Text API"
        TEXT_API[Gemini 2.5 Flash<br/>Text Generation]
        TRANSLATE[Translation Engine<br/>Multi-language Support]
    end

    subgraph "Output"
        TRANSLATED[Translated Text<br/>Target Language]
        SEGMENT[Combined Segment<br/>Original + Translation]
    end

    subgraph "Error Handling"
        ERROR{Error?}
        FALLBACK[Set "Translation failed."]
    end

    ORIGINAL --> CHECK
    TARGET_LANG --> CHECK

    CHECK -->|Yes| BUILD_PROMPT
    CHECK -->|No| SEGMENT

    BUILD_PROMPT --> TEXT_API
    TEXT_API --> TRANSLATE
    TRANSLATE --> ERROR

    ERROR -->|No| TRANSLATED
    ERROR -->|Yes| FALLBACK

    TRANSLATED --> SEGMENT
    FALLBACK --> SEGMENT

    style TEXT_API fill:#4285f4,color:#fff
    style TRANSLATED fill:#34a853,color:#fff
    style FALLBACK fill:#ea4335,color:#fff
```

### 状態更新データフロー

```mermaid
graph TB
    subgraph "Event Sources"
        USER_INPUT[User Interactions<br/>Clicks, Selections]
        GEMINI_MSG[Gemini Messages<br/>onmessage callbacks]
        AUDIO_EVENT[Audio Events<br/>onaudioprocess]
        ERROR_EVENT[Error Events<br/>onerror callbacks]
    end

    subgraph "State Updates"
        USE_STATE[useState Hooks<br/>UI State]
        USE_REF[useRef Hooks<br/>Resource References]
        USE_CALLBACK[useCallback Hooks<br/>Memoized Functions]
    end

    subgraph "React State"
        IS_RECORDING[isRecording: boolean]
        TRANSCRIPTS[finalTranscripts: Array]
        ERROR_STATE[error: string | null]
        API_LOG[apiResponses: Array]
        TRANSLATION_LANG[translationLang: string]
        IS_KEY_SELECTED[isKeySelected: boolean]
        SHOW_LOG[showApiLog: boolean]
    end

    subgraph "React Refs"
        SESSION_REF[sessionRef: LiveSession]
        STREAM_REF[streamRef: MediaStream]
        AUDIO_REF[inputAudioContextRef: AudioContext]
        PROCESSOR_REF[scriptProcessorRef: ScriptProcessor]
        TRANSCRIPT_REF[currentTranscriptRef: string]
    end

    subgraph "UI Re-render"
        RENDER[Component Re-render<br/>Virtual DOM Update]
        DOM[Browser DOM Update]
    end

    USER_INPUT --> USE_CALLBACK
    GEMINI_MSG --> USE_CALLBACK
    AUDIO_EVENT --> USE_CALLBACK
    ERROR_EVENT --> USE_CALLBACK

    USE_CALLBACK --> USE_STATE
    USE_CALLBACK --> USE_REF

    USE_STATE --> IS_RECORDING
    USE_STATE --> TRANSCRIPTS
    USE_STATE --> ERROR_STATE
    USE_STATE --> API_LOG
    USE_STATE --> TRANSLATION_LANG
    USE_STATE --> IS_KEY_SELECTED
    USE_STATE --> SHOW_LOG

    USE_REF --> SESSION_REF
    USE_REF --> STREAM_REF
    USE_REF --> AUDIO_REF
    USE_REF --> PROCESSOR_REF
    USE_REF --> TRANSCRIPT_REF

    IS_RECORDING --> RENDER
    TRANSCRIPTS --> RENDER
    ERROR_STATE --> RENDER
    API_LOG --> RENDER
    TRANSLATION_LANG --> RENDER
    IS_KEY_SELECTED --> RENDER
    SHOW_LOG --> RENDER

    RENDER --> DOM

    style USE_STATE fill:#61dafb,color:#000
    style USE_REF fill:#61dafb,color:#000
    style RENDER fill:#34a853,color:#fff
```

---

## データモデル

### エンティティ関係図

```mermaid
erDiagram
    APP ||--o{ TRANSCRIPT_SEGMENT : manages
    APP ||--|| LIVE_SESSION : uses
    APP ||--|| MEDIA_STREAM : controls
    APP ||--|| AUDIO_CONTEXT : owns
    APP ||--|| SCRIPT_PROCESSOR : owns

    TRANSCRIPT_SEGMENT {
        string originalText
        string originalLang
        string_nullable translatedText
        string_nullable targetLang
    }

    LIVE_SESSION {
        function sendRealtimeInput
        function close
    }

    MEDIA_STREAM {
        MediaStreamTrack[] tracks
        function getTracks
    }

    AUDIO_CONTEXT {
        number sampleRate
        string state
        function createMediaStreamSource
        function createScriptProcessor
        function close
    }

    SCRIPT_PROCESSOR {
        number bufferSize
        function onaudioprocess
        function disconnect
    }

    LANGUAGE_OPTION {
        string code
        string name
    }

    APP ||--o{ LANGUAGE_OPTION : references

    LIVE_SERVER_MESSAGE {
        ServerContent serverContent
    }

    SERVER_CONTENT {
        InputTranscription inputTranscription
        boolean turnComplete
    }

    INPUT_TRANSCRIPTION {
        string text
    }

    LIVE_SERVER_MESSAGE ||--|| SERVER_CONTENT : contains
    SERVER_CONTENT ||--o| INPUT_TRANSCRIPTION : contains

    PCM_BLOB {
        string data
        string mimeType
    }

    SCRIPT_PROCESSOR ||--o{ PCM_BLOB : generates
    LIVE_SESSION ||--o{ PCM_BLOB : receives
```

### 型定義詳細

```mermaid
classDiagram
    class TranscriptSegment {
        +string originalText "認識されたテキスト"
        +string originalLang "検出された言語名"
        +string | null translatedText "翻訳されたテキスト"
        +string | null targetLang "翻訳先言語名"
    }

    class LanguageOption {
        +string code "言語コード (e.g., ja-JP)"
        +string name "言語表示名 (e.g., 日本語)"
    }

    class AppState {
        +boolean isKeySelected "APIキー選択済みか"
        +string translationLang "選択された翻訳先言語"
        +boolean isRecording "録音中か"
        +TranscriptSegment[] finalTranscripts "確定した転写結果"
        +string | null error "エラーメッセージ"
        +boolean showApiLog "APIログ表示フラグ"
        +string[] apiResponses "APIレスポンスログ"
    }

    class AppRefs {
        +LiveSession | null sessionRef "Geminiライブセッション"
        +MediaStream | null streamRef "マイク入力ストリーム"
        +AudioContext | null inputAudioContextRef "オーディオコンテキスト"
        +ScriptProcessorNode | null scriptProcessorRef "音声処理ノード"
        +string currentTranscriptRef "現在の転写蓄積"
    }

    class AudioProcessingEvent {
        +AudioBuffer inputBuffer "入力音声バッファ"
        +number playbackTime "再生時刻"
    }

    class PCMBlob {
        +string data "Base64エンコードされたPCMデータ"
        +string mimeType "audio/pcm;rate=16000"
    }

    class LiveServerMessage {
        +ServerContent | null serverContent "サーバーコンテンツ"
        +string | null modelTurn "モデルターン"
    }

    class ServerContent {
        +InputTranscription | null inputTranscription "入力転写"
        +boolean turnComplete "ターン完了フラグ"
    }

    class InputTranscription {
        +string text "転写テキスト"
    }

    AppState --> TranscriptSegment : contains
    AppState --> LanguageOption : uses
    AppRefs --> LiveSession : references
    AppRefs --> MediaStream : references
    AppRefs --> AudioContext : references
    AppRefs --> ScriptProcessorNode : references
    AudioProcessingEvent --> PCMBlob : produces
    LiveServerMessage --> ServerContent : contains
    ServerContent --> InputTranscription : contains
```

---

## 補足情報

### Web Audio API フロー詳細

**ScriptProcessorNode (非推奨だが使用中)**

```
getUserMedia()
  → MediaStream
  → AudioContext (16kHz)
  → MediaStreamSource
  → ScriptProcessorNode (4096 buffer)
  → onaudioprocess event (毎 256ms)
  → Float32Array → Int16Array → Base64 → PCM Blob
  → Gemini Live API
```

**将来の移行パス**: AudioWorklet への移行推奨

### Gemini API 統合詳細

**転写用モデル**
- モデル名: `gemini-2.5-flash-native-audio-preview-09-2025`
- 入力: PCM音声 (16kHz, Int16)
- 出力形式: `[言語名] 転写テキスト`
- コールバック: `onopen`, `onmessage`, `onerror`, `onclose`

**翻訳用モデル**
- モデル名: `gemini-2.5-flash`
- 入力: テキストプロンプト
- 出力: 翻訳テキスト
- 呼び出し: `ai.models.generateContent()`

### エラーハンドリングパターン

```typescript
handleError(err: unknown) {
  // 1. エラーメッセージ抽出
  const errorMessage = err instanceof Error ? err.message : 'Unknown error'

  // 2. エラー種別判定
  if (errorMessage.includes('Requested entity was not found.')) {
    // APIキー無効
    setError('API Key is invalid')
    setIsKeySelected(false)
  } else {
    // その他のエラー
    setError(errorMessage)
  }

  // 3. コンソールログ
  console.error(err)
}
```

### クリーンアップパターン

```typescript
stopRecording() {
  // 1. Geminiセッションクローズ
  if (sessionRef.current) {
    sessionRef.current.close()
    sessionRef.current = null
  }

  // 2. メディアストリーム停止
  if (streamRef.current) {
    streamRef.current.getTracks().forEach(track => track.stop())
    streamRef.current = null
  }

  // 3. 音声処理ノード切断
  if (scriptProcessorRef.current) {
    scriptProcessorRef.current.disconnect()
    scriptProcessorRef.current = null
  }

  // 4. AudioContextクローズ
  if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
    inputAudioContextRef.current.close()
  }

  // 5. 状態リセット
  setIsRecording(false)
}
```

---

## 改善提案

### 1. AudioWorklet への移行

ScriptProcessorNode は非推奨のため、AudioWorklet への移行を推奨。

```javascript
// 現在 (非推奨)
const scriptProcessor = context.createScriptProcessor(4096, 1, 1)

// 推奨される方法
await context.audioWorklet.addModule('audio-processor.js')
const workletNode = new AudioWorkletNode(context, 'audio-processor')
```

### 2. コンポーネント分割

App.tsx (435行) を複数ファイルに分割:
- `components/AudioRecorder.tsx`
- `components/TranscriptDisplay.tsx`
- `components/ApiKeyManager.tsx`
- `hooks/useGeminiLive.ts`
- `hooks/useAudioProcessing.ts`

### 3. テストの追加

- ユニットテスト: Jest + React Testing Library
- E2Eテスト: Playwright
- 音声処理テスト: Web Audio API モック

### 4. 状態管理の改善

- React Context API または Redux の導入
- グローバル状態の一元管理
- 状態更新ロジックの分離

### 5. パフォーマンス最適化

- `React.memo()` でコンポーネントのメモ化
- `useMemo()` で重い計算結果のキャッシュ
- 仮想スクロール (長時間の転写結果表示時)
- デバウンス処理 (転写結果の頻繁な更新)

---

## まとめ

本UML仕様書は、Gemini-STT-v2アプリケーションの包括的な設計ドキュメントです。

**カバー範囲**:
- ✅ システムアーキテクチャ
- ✅ クラス図・型定義
- ✅ コンポーネント構成
- ✅ シーケンス図 (4種類の主要フロー)
- ✅ 状態遷移図
- ✅ データフロー図
- ✅ データモデル・ER図

**活用方法**:
- 新機能追加時の設計参考
- バグ修正時のフロー理解
- チームメンバーへのオンボーディング
- リファクタリング計画の策定
- テストケース設計の基礎資料

**更新推奨**: 重要な機能追加や構造変更時に本ドキュメントを更新してください。

---

**Document Version:** 1.0
**Last Updated:** 2025-11-15
**Author:** AI Assistant (Claude)
**Project Repository:** Gemini-STT-v2
