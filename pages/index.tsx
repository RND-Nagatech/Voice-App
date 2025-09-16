// pages/index.tsx
import Recorder from "../components/Recorder";
import namaBarang from "../nama_barang";
import { useState, useEffect } from "react";


export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const handleStart = () => {
    setStarted(true);
    setFinished(false);
    setCurrentIndex(0);
    // Trigger event untuk memulai recording otomatis
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('autoStartRecording'));
    }, 100);
  };

  const handleNext = () => {
    if (currentIndex < namaBarang.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setFinished(true);
      setStarted(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleReset = () => {
    // Trigger event untuk menampilkan modal di komponen Recorder
    window.dispatchEvent(new CustomEvent('showResetModal'));
  };

  // Function akan dipanggil dari event listener di komponen Recorder
  const confirmReset = () => {
    setStarted(false);
    setFinished(false);
    setCurrentIndex(0);
    
    // Reset semua rekaman yang tersimpan
    if (typeof window !== 'undefined') {
      // Clear semua kemungkinan localStorage keys
      localStorage.removeItem('voiceRecordings');
      localStorage.removeItem('recordings');
      localStorage.clear(); // Clear semua localStorage
    }
  };

  // Function untuk restart langsung tanpa popup konfirmasi
  const handleDirectRestart = () => {
    // Reset semua rekaman yang tersimpan terlebih dahulu
    if (typeof window !== 'undefined') {
      // Clear semua kemungkinan localStorage keys
      localStorage.removeItem('voiceRecordings');
      localStorage.removeItem('recordings');
      localStorage.clear(); // Clear semua localStorage
    }
    
    // Kemudian mulai dari awal seperti tombol "Mulai"
    setStarted(true);
    setFinished(false);
    setCurrentIndex(0);
    // Trigger event untuk memulai recording otomatis
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('autoStartRecording'));
    }, 100);
  };

  // Listen untuk event confirmReset dan autoAdvance dari komponen Recorder
  useEffect(() => {
    const handleConfirmReset = () => {
      confirmReset();
    };

    const handleAutoAdvance = () => {
      // Auto advance ke kata berikutnya setelah stop recording
      if (currentIndex < namaBarang.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setFinished(true);
        setStarted(false);
      }
    };

    window.addEventListener('confirmResetFromRecorder', handleConfirmReset);
    window.addEventListener('autoAdvanceToNext', handleAutoAdvance);
    
    return () => {
      window.removeEventListener('confirmResetFromRecorder', handleConfirmReset);
      window.removeEventListener('autoAdvanceToNext', handleAutoAdvance);
    };
  }, [currentIndex, namaBarang.length]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
  <div className="bg-blue-400 border-4 border-blue-500 rounded-2xl shadow-indigo-400/50 shadow-2xl p-10 w-full max-w-lg flex flex-col items-center transition hover:scale-105 relative">
        {/* Voice Recorder title always at the top */}
        <h1 className="text-4xl font-extrabold text-black mb-2 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-800 shadow-lg border-4 border-blue-500 w-full">
          🎙️ <span className="text-black">Voice Recorder</span>
        </h1>
        <div className="w-full border-b-2 border-blue-500 mb-4"></div>
        {/* Kata aktif, progress, Next & Reset buttons below title, above Recorder */}
        {started && !finished && (
          <>
            <div className="flex flex-col items-center mb-6">
              <span className="relative flex items-center justify-center text-2xl font-extrabold text-center text-indigo-900 px-20 py-12 mb-2 rounded-2xl bg-transparent shadow-lg border-4 border-blue-500 overflow-hidden">
                <span className="z-10 animate-zoom-in-out bg-transparent">{namaBarang[currentIndex]}</span>
                <span className="absolute inset-0 rounded-2xl border-4 border-blue-400 animate-border-move pointer-events-none bg-transparent" style={{borderStyle:'dotted'}}></span>
              </span>
              <span className="text-base text-gray-700">{currentIndex + 1} / {namaBarang.length}</span>
            </div>
            <div className="flex flex-col items-center w-full mb-6">
              <div className="flex w-full mb-2 items-center justify-center" style={{gap: '10px'}}>
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className={`min-w-[120px] px-8 py-4 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 border-indigo-300 hover:from-indigo-600 hover:to-blue-600 text-white text-lg font-extrabold shadow-2xl border-4 transform transition-all duration-200 flex items-center gap-3 justify-center whitespace-nowrap relative overflow-hidden ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                  style={{boxShadow:'0 2px 8px 0 rgba(0,0,0,0.15)'}}
                  title="Previous"
                >
                  <span className='absolute left-0 top-0 w-full h-2/5 bg-white/30 rounded-t-full pointer-events-none' style={{filter:'blur(2px)'}}></span>
                  <span className='drop-shadow font-bold text-white relative z-10'>⏮️</span>
                  <span className='font-bold relative z-10'>Prev</span>
                </button>
                <button onClick={handleNext} className="min-w-[120px] px-8 py-4 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 border-indigo-300 hover:from-indigo-600 hover:to-blue-600 text-white text-lg font-extrabold shadow-2xl border-4 hover:scale-105 transform transition-all duration-200 flex items-center gap-3 justify-center whitespace-nowrap relative overflow-hidden">
                  <span className='absolute left-0 top-0 w-full h-2/5 bg-white/30 rounded-t-full pointer-events-none' style={{filter:'blur(2px)'}}></span>
                  ⏭️ <span className='drop-shadow font-bold text-white relative z-10'>Next</span>
                </button>
              </div>
              <div className="flex w-full items-center justify-center">
                <button
                  onClick={handleReset}
                  className="flex items-center px-4 py-2 rounded-full text-base font-extrabold shadow-2xl border-4 hover:scale-105 transition-all duration-200 relative overflow-hidden"
                  title="Reset"
                  style={{backgroundColor: '#dc2626', borderColor: '#b91c1c', color: 'white', boxShadow:'0 2px 8px 0 rgba(0,0,0,0.15)'}}>
                  <span className="w-5 h-5 flex items-center justify-center relative z-10">
                    <svg width="14" height="14" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 7L15 15M15 7L7 15" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <span className="font-extrabold text-sm select-none ml-2 pr-2 relative z-10" style={{color: 'white'}}>Reset</span>
                </button>
              </div>
            </div>
          </>
        )}
        {/* Pesan selesai */}
        {finished && (
          <>
            <div className="text-center mb-4">
              <span className="text-3xl font-bold text-green-700">🎉 Semua kata sudah selesai direkam!</span>
            </div>
            <button onClick={handleDirectRestart} className="overflow-visible min-w-[140px] px-8 py-6 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 border-indigo-300 hover:from-indigo-600 hover:to-blue-600 text-white text-base font-extrabold shadow-2xl border-4 hover:scale-105 transform transition-all duration-200 mb-6 flex items-center gap-2 justify-center whitespace-nowrap relative overflow-hidden">
              <span className='absolute left-0 top-0 w-full h-2/5 bg-white/30 rounded-t-full pointer-events-none' style={{filter:'blur(2px)'}}></span>
              🔄 <span className='drop-shadow font-bold text-white relative z-10'>Ulangi</span>
            </button>
          </>
        )}
        {/* Tombol mulai/next/reset */}
        {!started && !finished && (
          <button onClick={handleStart} className="overflow-visible min-w-[160px] px-12 py-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 border-indigo-300 hover:from-indigo-600 hover:to-blue-600 text-white text-2xl font-extrabold shadow-2xl border-4 hover:scale-105 transform transition-all duration-200 mb-6 flex items-center gap-4 justify-center whitespace-nowrap relative overflow-hidden">
            <span className='absolute left-0 top-0 w-full h-2/5 bg-white/30 rounded-t-full pointer-events-none' style={{filter:'blur(2px)'}}></span>
            🚀 <span className='drop-shadow font-bold text-white relative z-10'>Mulai</span>
          </button>
        )}
        {/* Next & Reset button digabung di atas */}

        {/* Komponen Recorder */}
        <Recorder 
          currentWord={started ? namaBarang[currentIndex] : ""} 
          currentIndex={currentIndex}
          totalWords={namaBarang.length}
          sessionStarted={started}
        />

        <footer className="mt-8 text-gray-400 text-sm text-center">
          © {new Date().getFullYear()} My Voice App
        </footer>
      </div>

      {/* Custom Reset Modal */}
      
    </main>
  );
}
