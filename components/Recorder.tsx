"use client";
import React, { useState, useRef } from "react";
import Waveform from "./Waveform";
import RecorderJS from "recorder-js";

interface Recording {
  id: number;
  url: string;
  transcript: string;
}

export default function Recorder() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recordings, setRecordings] = useState<Recording[]>([]);

  const recorderRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const counterRef = useRef(1);

  const startRecording = async () => {
    // Setup speech recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript + " ";
      }
      setTranscript(text.trim());
    };
    recognition.start();
    recognitionRef.current = recognition;

    // Setup recorder-js
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    const recorder = new RecorderJS(audioContext, {});
    recorder.init(stream);
    recorderRef.current = recorder;
    await recorder.start();
    setRecording(true);
  };

  const stopRecording = async () => {
    recognitionRef.current?.stop();
    if (recorderRef.current) {
      const { buffer, blob } = await recorderRef.current.stop();
      const url = URL.createObjectURL(blob);

      // Buat nama file dari transkrip (maksimal 30 karakter, tanpa karakter aneh)
      const cleanTranscript = transcript
        .trim()
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, "_")
        .slice(0, 30) || `rekaman_${counterRef.current}`;
      const filename = `${cleanTranscript}.wav`;

      setRecordings((prev) => [
        ...prev,
        {
          id: counterRef.current++,
          url,
          transcript,
        },
      ]);

      setTranscript("");

      // otomatis download
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();

      // Bersihkan stream dan audio context
      streamRef.current?.getTracks().forEach((track) => track.stop());
      audioContextRef.current?.close();
    }
    setRecording(false);
  };

  return (
    <div className="w-full flex justify-center items-center">
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 w-full max-w-lg flex flex-col items-center border border-indigo-100">
        {/* Waveform muncul saat recording */}
        {recording && <Waveform />}

        {/* Tombol record */}
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`w-32 h-32 rounded-full flex items-center justify-center text-white text-2xl font-extrabold shadow-lg transition-all mb-6 border-4 ${
            recording
              ? "bg-gradient-to-br from-pink-500 to-red-500 border-pink-300 animate-pulse"
              : "bg-gradient-to-br from-indigo-500 to-blue-500 border-indigo-300 hover:from-indigo-600 hover:to-blue-600"
          }`}
        >
          {recording ? "⏹ Stop" : "🎙 Mulai"}
        </button>

        {/* Live transcript */}
        <div className="w-full mb-4">
          <p className="text-lg text-gray-700 text-center font-medium bg-gradient-to-r from-blue-100 via-indigo-100 to-pink-100 rounded-xl py-3 px-4 shadow-inner">
            {transcript || (recording ? "Mendengarkan..." : "Transkrip akan muncul di sini...")}
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
                <p className="text-sm text-gray-700 font-semibold">{rec.transcript || "Tanpa teks"}</p>
                <a
                  href={rec.url}
                  download={`${rec.transcript
                    .trim()
                    .replace(/[^a-zA-Z0-9\s]/g, "")
                    .replace(/\s+/g, "_")
                    .slice(0, 30) || `rekaman_${rec.id}`}.wav`}
                  className="text-blue-600 text-sm font-bold hover:underline self-start"
                >
                  ⬇️ Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
