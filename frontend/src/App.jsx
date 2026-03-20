import './App.css';
import ChaosGallery from './components/ChaosGallery';
import StatusMonitor from './components/StatusMonitor';
import SafetySwitch from './components/SafetySwitch';
import { useState } from 'react';

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleExperimentTriggered = () => {
    // Bump key to re-mount StatusMonitor so it refreshes immediately
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-purple-400">⚡ Chaosctrl</span>
          <span className="text-gray-500 text-sm hidden sm:block">
            LitmusChaos Control Room
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
          <span className="text-green-400 text-xs font-medium">Connected</span>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-10">
        {/* Safety Switch — always visible at top */}
        <SafetySwitch onAborted={() => setRefreshKey((k) => k + 1)} />

        {/* One-Click Chaos Gallery */}
        <ChaosGallery onExperimentTriggered={handleExperimentTriggered} />

        {/* Real-Time Status Monitor */}
        <StatusMonitor key={refreshKey} />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 text-center text-gray-600 text-xs py-4 mt-8">
        Chaosctrl — powered by{' '}
        <a
          href="https://litmuschaos.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-500 hover:text-purple-400"
        >
          LitmusChaos
        </a>
      </footer>
    </div>
  );
}
