import React from 'react';
import { useState, useEffect } from "react";
import Recorder from "./components/Recorder";
import namaBarang from "./nama_barang";

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const handleStart = () => {
    setStarted(true);
    setFinished(false);
    setCurrentIndex(0);
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
    window.dispatchEvent(new CustomEvent('showResetModal'));
  };

  const confirmReset = () => {
    setStarted(false);
    setFinished(false);
    setCurrentIndex(0);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('voiceRecordings');
      localStorage.removeItem('recordings');
      localStorage.clear();
    }
  };

  const handleDirectRestart = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('voiceRecordings');
      localStorage.removeItem('recordings');
      localStorage.clear();
    }
    
    setStarted(true);
    setFinished(false);
    setCurrentIndex(0);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('autoStartRecording'));
    }, 100);
  };

  useEffect(() => {
    const handleConfirmReset = () => {
      confirmReset();
    };

    const handleAutoAdvance = () => {
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
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="floating-orb floating-orb-1"></div>
        <div className="floating-orb floating-orb-2"></div>
        <div className="floating-orb floating-orb-3"></div>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="glass-card w-full max-w-2xl mx-auto relative z-10 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🎙️</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Voice Recorder
            </h1>
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto rounded-full"></div>
        </div>

        {/* Active word and progress */}
        {started && !finished && (
          <div className="mb-8">
            <div className="word-display-container mb-6">
              <div className="word-display">
                <span className="word-text">{namaBarang[currentIndex]}</span>
                <div className="word-glow"></div>
              </div>
            </div>
            
            {/* Progress indicator */}
            <div className="progress-container">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/70 text-sm font-medium">Progress</span>
                <span className="text-white/90 text-sm font-semibold">{currentIndex + 1} / {namaBarang.length}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${((currentIndex + 1) / namaBarang.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-4 justify-center mb-6 mt-8">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={`nav-button ${currentIndex === 0 ? 'nav-button-disabled' : ''}`}
                title="Previous word"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Previous</span>
              </button>
              
              <button onClick={handleNext} className="nav-button nav-button-primary">
                <span>Next</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Reset button */}
            <div className="flex justify-center">
              <button onClick={handleReset} className="reset-button" title="Reset recording">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Reset</span>
              </button>
            </div>
          </div>
        )}

        {/* Finished state */}
        {finished && (
          <div className="text-center mb-8 animate-fade-in">
            <div className="success-icon mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/25">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Recording Complete!</h2>
            <p className="text-white/70 mb-8">All words have been successfully recorded</p>
            
            <button onClick={handleDirectRestart} className="primary-button">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Start Again</span>
            </button>
          </div>
        )}

        {/* Start button */}
        {!started && !finished && (
          <div className="text-center mb-8 animate-fade-in">
            <button onClick={handleStart} className="start-button">
              <div className="start-button-icon">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>Start Recording</span>
            </button>
          </div>
        )}

        {/* Recorder component */}
        <div className="recorder-container">
          <Recorder 
            currentWord={started ? namaBarang[currentIndex] : ""} 
            currentIndex={currentIndex}
            totalWords={namaBarang.length}
            sessionStarted={started}
          />
        </div>

        {/* Footer */}
        <footer className="text-center mt-8 pt-6 border-t border-white/10">
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} Voice Recorder App
          </p>
        </footer>
      </div>
    </main>
  );
}