
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality, Blob, LiveServerMessage } from '@google/genai';

// --- Type Definitions ---
interface LiveSession {
  sendRealtimeInput(input: { media: Blob }): void;
  close(): void;
}
interface LanguageOption {
  code: string;
  name: string;
}
interface TranscriptSegment {
  originalText: string;
  originalLang: string;
  translatedText: string | null;
  targetLang: string | null;
}

// --- Constants ---
const TRANSCRIPTION_LANGUAGES: LanguageOption[] = [
  { code: 'ja-JP', name: '日本語' },
  { code: 'en-US', name: 'English' },
  { code: 'zh-CN', name: '中文' },
  { code: 'vi-VN', name: 'Tiếng Việt' },
  { code: 'ko-KR', name: '한국어' },
  { code: 'pt-BR', name: 'Português' },
];
const OPTIONAL_LANGUAGES: LanguageOption[] = [
    { code: 'none', name: 'None' },
    ...TRANSCRIPTION_LANGUAGES
];

const LANGUAGE_STYLES: Record<string, string> = {
  '日本語': 'bg-red-900/50 text-red-300 border border-red-500/30',
  'English': 'bg-blue-900/50 text-blue-300 border border-blue-500/30',
  '中文': 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/30',
  'Tiếng Việt': 'bg-green-900/50 text-green-300 border border-green-500/30',
  '한국어': 'bg-purple-900/50 text-purple-300 border border-purple-500/30',
  'Português': 'bg-orange-900/50 text-orange-300 border border-orange-500/30',
};
const DEFAULT_STYLE = 'bg-cyan-900/50 text-cyan-300 border border-cyan-500/30';

const getLangStyleByName = (langName: string): string => {
    const foundKey = Object.keys(LANGUAGE_STYLES).find(key => langName.includes(key));
    return foundKey ? LANGUAGE_STYLES[foundKey] : DEFAULT_STYLE;
};


// --- SVG Icons ---
const MicIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Zm0 12a5 5 0 0 1-5-5V5a5 5 0 0 1 10 0v6a5 5 0 0 1-5 5Z" />
    <path d="M12 14a1 1 0 0 0-1 1v2.05A7 7 0 0 0 18 19a1 1 0 1 0 2 0A9 9 0 0 1 5 19a1 1 0 1 0 2 0 7 7 0 0 0 6-1.95V15a1 1 0 0 0-1-1Z" />
  </svg>
);

const StopIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 7h10v10H7V7Z" />
  </svg>
);

const encode = (bytes: Uint8Array): string => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// --- Main App Component ---

export default function App() {
  const [translationLang, setTranslationLang] = useState<string>('none');
  const [isRecording, setIsRecording] = useState(false);
  const [finalTranscripts, setFinalTranscripts] = useState<TranscriptSegment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showApiLog, setShowApiLog] = useState(false);
  const [apiResponses, setApiResponses] = useState<string[]>([]);
  const [apiStatus, setApiStatus] = useState<string>('Ready to record');

  const sessionRef = useRef<LiveSession | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const currentTranscriptRef = useRef<string>('');

  const stopRecording = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close();
    }
    
    setIsRecording(false);
  }, []);

  const handleError = useCallback((err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error(err);
      if (errorMessage.includes('Requested entity was not found.')) {
          setError('API Key is invalid or missing.');
      } else {
          setError(errorMessage);
      }
      setApiStatus('An error occurred.');
  }, []);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);
    
    const getSystemInstruction = () => {
        return `Transcribe the user's speech. You MUST prefix the output with the detected language name in brackets. For example: '[English] Hello world' or '[日本語] こんにちは'. Do not add any other text, conversation, or greetings. Only provide the formatted transcription.`;
    }

    const translateText = useCallback(async (text: string, targetLangName: string): Promise<string> => {
        if (!process.env.API_KEY) {
            throw new Error("API Key not available for translation.");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const prompt = `Translate the following text to ${targetLangName}. Return only the translated text, without any introductory phrases or explanations.\n\nTEXT: "${text}"`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setApiResponses(prev => [...prev, JSON.stringify({request: 'translation', prompt, response}, null, 2)]);
            return response.text.trim();
        } catch (err) {
            handleError(err);
            throw err;
        }
    }, [handleError]);

  const handleStartRecording = async () => {
    if (isRecording) return;
    setError(null);
    setFinalTranscripts([]);
    setApiResponses([]);
    currentTranscriptRef.current = '';

    if (!process.env.API_KEY) {
        setError("API Key is not configured. Please ensure it's set up correctly.");
        return;
    }
    
    try {
      setApiStatus('Initializing microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioContextRef.current = inputAudioContext;
      
      const systemInstruction = getSystemInstruction();
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      setIsRecording(true);
      setApiStatus('Connecting to service...');

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => {
                console.log('Session opened.');
                setApiResponses(prev => [...prev, '{"status": "Session Opened"}']);
                setApiStatus('Listening...');
            },
            onmessage: async (message: LiveServerMessage) => {
                setApiResponses(prev => [...prev, JSON.stringify(message, null, 2)]);
                const transcription = message.serverContent?.inputTranscription;
                if (transcription) {
                  currentTranscriptRef.current += transcription.text;
                }

                if (message.serverContent?.turnComplete) {
                  const fullText = currentTranscriptRef.current.trim();
                  if (fullText) {
                      setApiStatus('Processing speech...');
                      const match = fullText.match(/^\[([^\]]+)\]\s*(.*)$/s);
                      
                      let originalLang = 'Unknown';
                      let originalText = fullText;
              
                      if (match && match.length === 3) {
                          originalLang = match[1];
                          originalText = match[2];
                      }
              
                      if (originalText.trim()) {
                          let translatedText: string | null = null;
                          let targetLangName: string | null = null;
                          const targetLangOption = OPTIONAL_LANGUAGES.find(l => l.code === translationLang);

                          if (targetLangOption && targetLangOption.code !== 'none') {
                              try {
                                  targetLangName = targetLangOption.name;
                                  setApiStatus(`Translating to ${targetLangName}...`);
                                  translatedText = await translateText(originalText, targetLangName);
                              } catch (translationError) {
                                  console.error("Translation failed:", translationError);
                                  translatedText = "Translation failed.";
                              }
                          }

                          setFinalTranscripts((prev) => [
                              ...prev,
                              { 
                                  originalText: originalText.trim(), 
                                  originalLang: originalLang,
                                  translatedText: translatedText,
                                  targetLang: targetLangName,
                              },
                          ]);
                      }
                  }
                  currentTranscriptRef.current = '';
                  if (sessionRef.current) {
                      setApiStatus('Listening...');
                  }
                }
            },
            onerror: (e: ErrorEvent) => {
                console.error('Session error:', e);
                setApiResponses(prev => [...prev, JSON.stringify({error: e.message}, null, 2)]);
                handleError(new Error('An error occurred during the session. Please try again. ' + e.message));
                stopRecording();
            },
            onclose: (e: CloseEvent) => {
                console.log('Session closed.');
                setApiResponses(prev => [...prev, '{"status": "Session Closed"}']);
                if (isRecording) {
                    setApiStatus('Session ended.');
                    setIsRecording(false);
                }
            },
        },
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            systemInstruction: systemInstruction,
        },
      });
      
      sessionPromise.then(session => {
        sessionRef.current = session;
        const source = inputAudioContext.createMediaStreamSource(stream);
        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = scriptProcessor;

        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
          const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
          const l = inputData.length;
          const int16 = new Int16Array(l);
          for (let i = 0; i < l; i++) {
            int16[i] = inputData[i] * 32768;
          }
          const pcmBlob: Blob = {
            data: encode(new Uint8Array(int16.buffer)),
            mimeType: 'audio/pcm;rate=16000',
          };
          sessionPromise.then((session) => {
            session.sendRealtimeInput({ media: pcmBlob });
          });
        };
        source.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);
      }).catch(err => {
         console.error('Failed to connect to session:', err);
         handleError(err);
         setIsRecording(false);
         setApiStatus('Connection failed.');
      });

    } catch (err) {
      console.error('Microphone access denied:', err);
      setError('Microphone access is required. Please allow microphone permissions in your browser.');
      setIsRecording(false);
      setApiStatus('Microphone access denied.');
    }
  };

  const handleStopRecording = () => {
    setApiStatus('Stopping session...');
    stopRecording();
    setApiStatus('Ready to record');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 p-4 sm:p-6 md:p-8 font-sans">
        <div className="max-w-4xl mx-auto">
            <header className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Real-time Speech-to-Text
            </h1>
            <p className="text-gray-400 mt-2">Live transcription with multi-language recognition.</p>
            </header>

            <main className="space-y-6">
            {/* Controls Section */}
            <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg shadow-xl flex flex-col md:flex-row justify-center items-center gap-4">
                <div className="w-full md:w-1/2">
                    <label htmlFor="lang-translate" className="block text-sm font-medium text-gray-300 mb-1">Translate To</label>
                    <select id="lang-translate" value={translationLang} onChange={(e) => setTranslationLang(e.target.value)} disabled={isRecording} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition">
                        {OPTIONAL_LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                    </select>
                </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sticky top-4 z-10 py-2">
                {!isRecording ? (
                <button onClick={handleStartRecording} className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out">
                    <MicIcon className="h-6 w-6" />
                    <span>Start Recording</span>
                </button>
                ) : (
                <button onClick={handleStopRecording} className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out animate-pulse">
                    <StopIcon className="h-6 w-6" />
                    <span>Stop Recording</span>
                </button>
                )}
            </div>

            {/* Status Indicator */}
            <div className="text-center text-sm text-gray-400 my-2 h-6 flex items-center justify-center gap-2">
                {(apiStatus.includes('...') && isRecording) ? (
                    <div className="w-4 h-4 border-2 border-dashed rounded-full animate-spin border-cyan-400"></div>
                ) : apiStatus === 'Listening...' ? (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                ) : null}
                <span className="font-semibold text-cyan-300">{apiStatus}</span>
            </div>

            {error && <div className="bg-red-500/30 border border-red-500 text-red-300 p-3 rounded-md text-center">{error}</div>}

            {/* Results Section */}
            <div className="bg-gray-800 rounded-lg p-4 w-full min-h-[20rem] flex flex-col shadow-lg">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold text-cyan-400">Transcript & Translation (認識結果)</h2>
                    <label htmlFor="api-log-toggle" className="flex items-center cursor-pointer">
                        <span className="text-sm text-gray-400 mr-2">Show API Log</span>
                        <input 
                            type="checkbox" 
                            id="api-log-toggle" 
                            checked={showApiLog} 
                            onChange={(e) => setShowApiLog(e.target.checked)}
                            className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                        />
                    </label>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 text-gray-200 bg-gray-900/50 rounded-md p-2 border border-gray-700">
                    {finalTranscripts.length > 0 ? (
                        finalTranscripts.map((segment, index) => (
                            <div key={index} className="bg-gray-800/50 p-3 rounded-md mb-3 last:mb-0 border border-gray-700/50">
                                <p className="text-base whitespace-pre-wrap break-words">
                                    {segment.originalText}
                                </p>
                                {segment.translatedText && segment.targetLang && (
                                    <div className="border-t border-cyan-500/20 mt-2 pt-2">
                                        <p className="text-base whitespace-pre-wrap break-words text-cyan-300">
                                            <span className={`inline-block rounded-md px-2 py-1 text-sm font-semibold mr-2 align-middle ${getLangStyleByName(segment.targetLang)}`}>
                                                {segment.targetLang}
                                            </span>
                                            {segment.translatedText}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                         <div className="flex items-center justify-center h-full">
                            <span className="text-gray-500 italic">
                                {isRecording ? "Listening..." : "Start recording to see transcripts here..."}
                            </span>
                        </div>
                    )}
                </div>
                {showApiLog && (
                    <div className="mt-4">
                        <h3 className="text-md font-semibold text-gray-300 mb-2">API Response Log</h3>
                        <pre className="bg-black/50 rounded-md p-4 text-xs text-green-300 overflow-auto max-h-64 font-mono border border-gray-700">
                            {[...apiResponses].reverse().map((res, index) => (
                                <div key={index} className="border-b border-gray-600 last:border-b-0 py-2 whitespace-pre-wrap break-all">
                                    {res}
                                </div>
                            ))}
                        </pre>
                    </div>
                )}
            </div>
            </main>
        </div>
    </div>
  );
}
