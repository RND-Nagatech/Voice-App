"use client";
import { useState, useRef, useEffect } from "react";
import Waveform from "./Waveform";

interface Recording {
  id: number;
  url: string;
  transcript: string;
  word: string; // Kata yang sedang ditampilkan saat perekaman
}

interface RecorderProps {
  currentWord: string;
  currentIndex: number;
  totalWords: number;
  sessionStarted: boolean;
}

export default function Recorder({ currentWord, currentIndex, totalWords, sessionStarted }: RecorderProps) {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [showResetModal, setShowResetModal] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const counterRef = useRef(1);
  const audioChunksRef = useRef<Blob[]>([]);

  // Listen untuk event reset, modal, dan auto-start dari komponen utama
  useEffect(() => {
    const handleShowResetModal = () => {
      setShowResetModal(true);
    };

    const handleAutoStartRecording = () => {
      // Mulai recording otomatis ketika tombol "Mulai" ditekan
      if (!recording) {
        startRecording();
      }
    };

    const handleReset = () => {
      // Clean up existing blob URLs to prevent memory leaks
      recordings.forEach(rec => {
        if (rec.url && rec.url.startsWith('blob:')) {
          URL.revokeObjectURL(rec.url);
        }
      });
      // Reset all states
      setRecordings([]);
      setTranscript("");
      counterRef.current = 1;
      setShowResetModal(false);
      // Stop recording jika sedang berjalan
      if (recording || paused) {
        recognitionRef.current?.stop();
        streamRef.current?.getTracks().forEach((track) => track.stop());
        setRecording(false);
        setPaused(false);
      }
      // Force re-render
      setTimeout(() => {
        setRecordings([]);
      }, 100);
    };

    window.addEventListener('showResetModal', handleShowResetModal);
    window.addEventListener('resetApp', handleReset);
    window.addEventListener('autoStartRecording', handleAutoStartRecording);
    return () => {
      window.removeEventListener('showResetModal', handleShowResetModal);
      window.removeEventListener('resetApp', handleReset);
      window.removeEventListener('autoStartRecording', handleAutoStartRecording);
    };
  }, [recording, recordings]);

  const confirmReset = () => {
    // Trigger reset di komponen utama
    window.dispatchEvent(new CustomEvent('confirmResetFromRecorder'));
    // Trigger reset di komponen ini
    window.dispatchEvent(new CustomEvent('resetApp'));
  };

  const cancelReset = () => {
    setShowResetModal(false);
  };

  const setupSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    // Set properties untuk respons yang lebih cepat
    if ('webkitSpeechRecognition' in window) {
      (recognition as any).serviceURI = 'wss://www.google.com/speech-api/v2/recognize';
    }
    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";
      // Proses semua hasil, mulai dari index terakhir yang diproses
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }
      // Update transcript segera, bahkan untuk hasil interim
      const currentTranscript = (finalTranscript + interimTranscript).trim();
      if (currentTranscript) {
        setTranscript(currentTranscript);
      }
    };
    recognition.onaudiostart = () => {
      setTranscript("Mendengarkan...");
    };
    recognition.onsoundstart = () => {};
    recognition.onspeechstart = () => {
      setTranscript("Berbicara...");
    };
    recognition.onspeechend = () => {};
    recognition.onstart = () => {
      setTranscript("Siap merekam...");
    };
    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        setTranscript("Tidak ada suara terdeteksi...");
      }
    };
    return recognition;
  };

  const startRecording = async () => {
    // Setup speech recognition
    const recognition = setupSpeechRecognition();
    recognition.start();
    recognitionRef.current = recognition;
    // Setup MediaRecorder
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };
    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = async () => {
    recognitionRef.current?.stop();
    if (mediaRecorderRef.current) {
      return new Promise<void>((resolve) => {
        mediaRecorderRef.current!.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const url = URL.createObjectURL(blob);
          // Buat nama file berdasarkan kata yang sedang ditampilkan
          const cleanCurrentWord = currentWord
            .trim()
            .replace(/[^a-zA-Z0-9\s]/g, "")
            .replace(/\s+/g, "_") || `rekaman_${counterRef.current}`;
          const filename = `${cleanCurrentWord}.wav`;
          setRecordings((prev) => [
            ...prev,
            {
              id: counterRef.current++,
              url,
              transcript,
              word: currentWord, // Simpan kata yang sedang ditampilkan
            },
          ]);
          setTranscript("");
          // otomatis download
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          a.click();
          // Bersihkan stream
          streamRef.current?.getTracks().forEach((track) => track.stop());
          setRecording(false);
          // Trigger event untuk auto-advance ke kata berikutnya
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('autoAdvanceToNext'));
            // Setelah advance, otomatis mulai recording lagi hanya jika belum kata terakhir
            if (currentIndex < totalWords - 1) {
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('autoStartRecording'));
              }, 200);
            }
          }, 100);
          resolve();
        };
        mediaRecorderRef.current!.stop();
      });
    } else {
      setRecording(false);
    }
  };

  const pauseRecording = () => {
    if (recognitionRef.current && recording && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      recognitionRef.current.stop();
      mediaRecorderRef.current.pause();
      setPaused(true);
      setRecording(false);
    }
  };

  const resumeRecording = async () => {
    if (paused && mediaRecorderRef.current && streamRef.current) {
      setPaused(false);
      setRecording(true);
      // Restart speech recognition
      const recognition = setupSpeechRecognition();
      recognitionRef.current = recognition;
      recognition.start();
      // Resume audio recording
      mediaRecorderRef.current.resume();
    }
  };

  const deleteRecording = (id: number) => {
    setRecordings(prev => {
      const updatedRecordings = prev.filter(rec => rec.id !== id);
      // Clean up blob URL to prevent memory leaks
      const recordingToDelete = prev.find(rec => rec.id === id);
      if (recordingToDelete && recordingToDelete.url && recordingToDelete.url.startsWith('blob:')) {
        URL.revokeObjectURL(recordingToDelete.url);
      }
      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('voiceRecordings', JSON.stringify(updatedRecordings));
      }
      return updatedRecordings;
    });
  };

  return (
    <div className="w-full flex justify-center items-center">
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 w-full max-w-lg flex flex-col items-center border border-indigo-100 relative">
        {/* Reset Modal - positioned over the recorder component */}
        {showResetModal && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 rounded-3xl">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-2xl border border-gray-400" style={{backgroundColor: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'}}>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center justify-center gap-1">
                  <span className="text-red-500 text-xs">⚠️</span>
                  Reset Semua?
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Progress dan rekaman akan terhapus
                </p>
                <div className="flex justify-center items-center" style={{ gap: '32px' }}>
                  <button
                    onClick={cancelReset}
                    className="flex items-center px-4 py-2 rounded-full text-sm font-extrabold shadow-2xl border-4 hover:scale-105 transition-all duration-200 relative overflow-hidden mr-4"
                    style={{backgroundColor: '#6b7280', borderColor: '#4b5563', color: 'white', boxShadow:'0 2px 8px 0 rgba(0,0,0,0.15)'}}
                  >
                    <span className="font-extrabold text-sm select-none px-2 relative z-10" style={{color: 'white'}}>Batal</span>
                  </button>
                  <button
                    onClick={confirmReset}
                    className="flex items-center px-4 py-2 rounded-full text-sm font-extrabold shadow-2xl border-4 hover:scale-105 transition-all duration-200 relative overflow-hidden ml-4"
                    style={{backgroundColor: '#dc2626', borderColor: '#b91c1c', color: 'white', boxShadow:'0 2px 8px 0 rgba(0,0,0,0.15)'}}
                  >
                    <span className="font-extrabold text-sm select-none px-2 relative z-10" style={{color: 'white'}}>Reset</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Waveform muncul saat recording aktif (tidak saat paused) */}
        {recording && !paused && <Waveform />}

        {/* Tombol record/pause/resume - hanya muncul setelah session dimulai */}
        {sessionStarted && !recording && !paused && (
          <button
            onClick={startRecording}
            className="w-32 h-32 rounded-full flex items-center justify-center text-white text-2xl font-extrabold shadow-lg transition-all mb-6 border-4 bg-gradient-to-br from-indigo-500 to-blue-500 border-indigo-300 hover:from-indigo-600 hover:to-blue-600"
          >
            🎙️ Record
          </button>
        )}
        {/* Pesan jika belum mulai session */}
        {!sessionStarted && (
          <div className="w-36 h-36 rounded-full flex flex-col items-center justify-center text-white font-medium bg-gradient-to-br from-indigo-500 to-blue-500 border-4 border-indigo-300 mb-6 shadow-lg overflow-hidden">
            <span className="text-6xl mb-1">🎙️</span>
            <span className="text-center text-[11px] px-2 text-white font-semibold break-words leading-tight max-w-[8.5rem] whitespace-normal">Klik "Start Recording"</span>
          </div>
        )}

        {(recording || paused) && (
          <div className="flex gap-32 mb-6">
            {recording && (
              <button
                onClick={pauseRecording}
                className="w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-lg transition-all border-4 bg-gradient-to-br from-yellow-500 to-orange-500 border-yellow-300 hover:from-yellow-600 hover:to-orange-600"
              >
                <span className="text-2xl mb-1">⏸️</span>
                <span className="text-xs font-bold text-white drop-shadow-lg" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>Pause</span>
              </button>
            )}

            {paused && (
              <button
                onClick={resumeRecording}
                className="w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-lg transition-all border-4 bg-gradient-to-br from-green-500 to-emerald-500 border-green-300 hover:from-green-600 hover:to-emerald-600 animate-pulse"
              >
                <span className="text-2xl mb-1">▶️</span>
                <span className="text-xs font-bold text-white drop-shadow-lg" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>Resume</span>
              </button>
            )}

            <button
              onClick={stopRecording}
              className={`w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-lg transition-all border-4 bg-gradient-to-br from-pink-500 to-red-500 border-pink-300 hover:from-pink-600 hover:to-red-600 ${recording ? 'animate-pulse' : ''}`}
            >
              <span className="text-2xl mb-1">⏹️</span>
              <span className="text-xs font-bold text-white drop-shadow-lg" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>Stop</span>
            </button>
          </div>
        )}

        {/* Live transcript */}
        <div className="w-full mb-4">
          <p className={`text-lg text-center font-medium rounded-xl py-3 px-4 shadow-inner ${
            paused 
              ? "text-orange-700 bg-gradient-to-r from-orange-100 via-yellow-100 to-orange-100" 
              : "text-gray-700 bg-gradient-to-r from-blue-100 via-indigo-100 to-pink-100"
          }`}>
            {paused 
              ? "⏸️ Recording dijeda - Klik Resume untuk melanjutkan" 
              : (transcript || (recording ? "🎙️ Mendengarkan..." : "Transkrip akan muncul di sini..."))}
          </p>
        </div>

        {/* Daftar rekaman */}
        {recordings.length > 0 && (
          <div className="mt-4 w-full space-y-4">
            <h3 className="text-lg font-bold text-indigo-600 mb-2">🎧 Rekaman Saya</h3>
            {recordings.map((rec) => (
              <div
                key={rec.id}
                className="p-4 border rounded-xl shadow-md flex flex-col gap-2 bg-gradient-to-r from-white via-indigo-50 to-blue-50"
              >
                <audio controls src={rec.url} className="w-full" />
                <p className="text-sm text-gray-700 font-semibold">
                  <span className="text-blue-600">📝 {rec.word}</span> - {rec.transcript || "Tanpa teks"}
                </p>
                <div className="flex items-center" style={{ gap: '28px' }}>
                  <a
                    href={rec.url}
                    download={`${rec.word
                      .trim()
                      .replace(/[^a-zA-Z0-9\s]/g, "")
                      .replace(/\s+/g, "_") || `rekaman_${rec.id}`}.wav`}
                    className="text-blue-600 text-sm font-bold hover:underline"
                  >
                    ⬇️ Download
                  </a>
                  <button
                    onClick={() => deleteRecording(rec.id)}
                    className="text-red-600 text-sm font-bold hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-all duration-200"
                    title="Hapus rekaman"
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}