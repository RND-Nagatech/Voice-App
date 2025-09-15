import React from "react";

export default function Waveform() {
  return (
    <div className="flex space-x-1 h-8 items-end">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="w-1 bg-blue-500 animate-pulse"
          style={{ animationDelay: `${i * 0.15}s`, height: `${Math.random() * 24 + 8}px` }}
        />
      ))}
    </div>
  );
}
