import { useEffect, useState, useRef } from "react";

export default function Waveform() {
  const [audioData, setAudioData] = useState<number[]>(Array(32).fill(10));
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let stream: MediaStream;

    const setupAudioVisualization = async () => {
      try {
        // Request microphone access
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          } 
        });
        
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        
        // Settings untuk visualisasi yang lebih responsif
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.3;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        
        source.connect(analyser);
        analyserRef.current = analyser;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const updateWaveform = () => {
          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            
            // Buat 32 bar untuk visualisasi seperti equalizer Mac
            const newAudioData = [];
            const barsCount = 32;
            const step = Math.floor(bufferLength / barsCount);
            
            for (let i = 0; i < barsCount; i++) {
              let sum = 0;
              const startIndex = i * step;
              const endIndex = Math.min((i + 1) * step, bufferLength);
              
              // Average beberapa frekuensi untuk smooth visualization
              for (let j = startIndex; j < endIndex; j++) {
                sum += dataArray[j];
              }
              
              const average = sum / (endIndex - startIndex);
              // Convert ke percentage dengan range yang lebih sensitif
              const height = Math.max(5, Math.min(95, (average / 128) * 100));
              newAudioData.push(height);
            }
            
            setAudioData(newAudioData);
          }
          
          animationRef.current = requestAnimationFrame(updateWaveform);
        };
        
        updateWaveform();
        
      } catch (error) {
        // Fallback ke animasi simulasi jika audio access ditolak
        const interval = setInterval(() => {
          setAudioData(prev => 
            prev.map(() => Math.random() * 80 + 20)
          );
        }, 100);
        
        return () => clearInterval(interval);
      }
    };

    setupAudioVisualization();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-20 mb-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl px-6 py-4 shadow-lg border border-slate-700">
      {/* Equalizer Bars */}
      <div className="flex space-x-1 h-12 items-end mb-2">
        {audioData.map((height, i) => {
          // Create color gradient based on height like Mac equalizer
          const getBarColor = (height: number) => {
            if (height > 70) return 'bg-gradient-to-t from-red-500 to-red-300';
            if (height > 50) return 'bg-gradient-to-t from-yellow-500 to-yellow-300';
            if (height > 30) return 'bg-gradient-to-t from-green-500 to-green-300';
            return 'bg-gradient-to-t from-blue-500 to-blue-300';
          };

          return (
            <div
              key={i}
              className={`w-1.5 rounded-sm transition-all duration-75 ease-out shadow-sm ${getBarColor(height)}`}
              style={{ 
                height: `${Math.max(8, height)}%`,
                filter: 'drop-shadow(0 0 2px rgba(59, 130, 246, 0.5))',
              }}
            />
          );
        })}
      </div>
      {/* Recording Indicator */}
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-red-500/50 shadow-md"></div>
        <span className="text-xs font-medium text-slate-300 tracking-wider uppercase">Live Recording</span>
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
          <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
          <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
        </div>
      </div>
    </div>
  );
}
