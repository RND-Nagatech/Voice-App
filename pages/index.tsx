// pages/index.tsx
import Recorder from "../components/Recorder";

export default function Home() {
  return (
  <main className="min-h-screen flex items-center justify-center bg-gray-100">
  <div className="bg-blue-400 border-4 border-blue-500 rounded-2xl shadow-indigo-400/50 shadow-2xl p-10 w-full max-w-lg flex flex-col items-center transition hover:scale-105">
  <h1 className="text-4xl font-extrabold text-black mb-2 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-800 shadow-lg border-4 border-blue-500 w-full">
          🎙️ <span className="text-black">Voice Recorder</span>
        </h1>
  <div className="w-full border-b-2 border-blue-500 mb-4"></div>
        <p className="mb-6 text-gray-600 text-center text-lg">
          Hallo, selamat datang.<br />
          Klik <span className="font-semibold text-indigo-600">Mulai</span> untuk
          merekam suara Anda.
        </p>

        {/* Komponen Recorder */}
        <Recorder />

        <footer className="mt-8 text-gray-400 text-sm text-center">
          © {new Date().getFullYear()} My Voice App
        </footer>
      </div>
    </main>
  );
}
