export interface TextToSpeechRequest {
  text: string;
}

export interface AudioResponse {
  audio: string; // base64 encoded audio
  text: string;
  mimeType?: string; // audio mime type (e.g., 'audio/wav', 'audio/mpeg')
}

export interface TTSError {
  message: string;
  error: string;
}

export interface ServerToClientEvents {
  'audio-response': (data: AudioResponse) => void;
  'tts-error': (error: TTSError) => void;
}

export interface ClientToServerEvents {
  'text-to-speech': (data: TextToSpeechRequest) => void;
}
