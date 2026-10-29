import React, { useState } from 'react';
import { getDesktopExportSpec } from '../game/exporter';

interface DesktopExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopExportModal: React.FC<DesktopExportModalProps> = ({ isOpen, onClose }) => {
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const spec = getDesktopExportSpec();

  const handleCopyCommand = () => {
    navigator.clipboard?.writeText(spec.electronBuildCommand).catch(() => {});
    setCopiedCmd(true);
    window.setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-6 pointer-events-auto"
      style={{ backgroundColor: 'rgba(14, 10, 7, 0.78)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exe-modal-heading"
    >
      <div
        className="w-full max-w-lg rounded-2xl border-3 border-[#b45309] p-6 md:p-7 shadow-[0_24px_60px_rgba(0,0,0,0.9)] text-left"
        style={{ backgroundColor: '#271911' }}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-amber-400">
              WINDOWS DESKTOP &amp; PORTABLE PACKAGING
            </div>
            <h2
              id="exe-modal-heading"
              className="text-2xl font-display font-extrabold text-amber-100 mt-0.5"
            >
              Get Desktop / .EXE Edition
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Desktop Export Modal"
            className="w-9 h-9 rounded-lg bg-[#3b2518] hover:bg-[#4c3020] text-amber-200 border border-[#78350f] flex items-center justify-center font-bold cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Option 1: Instant Self-Contained Offline Downloads */}
        <div className="p-4 rounded-xl bg-[#1c120c] border border-[#78350f] mb-4">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
            1. Instant Offline Desktop Download (No Install Needed)
          </div>
          <p className="text-xs text-amber-200/80 leading-relaxed mb-3.5">
            Download the complete offline game packed into a single self-extracting Windows desktop
            launcher (opens in a native 1440×900 borderless app window) or portable single-file HTML.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href={spec.windowsLauncherPath}
              download="Feather-and-Fury-Windows.bat"
              className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1b1410] font-display font-extrabold text-xs text-center border-2 border-amber-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              Download Windows App (.bat)
            </a>
            <a
              href={spec.standaloneHtmlPath}
              download="Feather-and-Fury-Standalone.html"
              className="py-3 px-4 rounded-xl bg-[#3b2518] hover:bg-[#4c3020] text-amber-100 font-display font-bold text-xs text-center border-2 border-[#78350f] transition-colors cursor-pointer whitespace-nowrap"
            >
              Download Portable (.html)
            </a>
          </div>
        </div>

        {/* Option 2: Native Electron .EXE Compiler */}
        <div className="p-4 rounded-xl bg-[#1c120c] border border-[#78350f] mb-5">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
            2. Build Native {spec.executableName} (Electron)
          </div>
          <p className="text-xs text-amber-200/80 leading-relaxed mb-3">
            This project is pre-configured with <span className="text-amber-100 font-semibold">electron/main.cjs</span> and{' '}
            <span className="text-amber-100 font-semibold">electron-builder</span>. Export the project ZIP to your PC and run:
          </p>

          <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#120b07] border border-stone-800">
            <code className="text-xs font-mono-tabular text-amber-300 select-all">
              {spec.electronBuildCommand}
            </code>
            <button
              type="button"
              onClick={handleCopyCommand}
              className="px-3 py-1.5 rounded-md bg-[#3b2518] hover:bg-[#4c3020] text-amber-100 text-xs font-bold border border-[#78350f] cursor-pointer whitespace-nowrap shrink-0"
            >
              {copiedCmd ? 'Copied!' : 'Copy Command'}
            </button>
          </div>
          <div className="text-[11px] text-amber-200/60 mt-2 font-mono-tabular">
            Output binary: release/{spec.executableName}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 px-5 rounded-xl bg-[#3b2518] hover:bg-[#4c3020] text-amber-100 font-display font-bold text-sm border border-[#78350f] cursor-pointer transition-colors"
        >
          Back to Title Screen
        </button>
      </div>
    </div>
  );
};
