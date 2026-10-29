export interface DesktopExportSpec {
  appName: string;
  executableName: string;
  standaloneHtmlPath: string;
  windowsLauncherPath: string;
  electronBuildCommand: string;
}

export function getDesktopExportSpec(): DesktopExportSpec {
  return {
    appName: 'Feather & Fury: Siege of Cragkeep',
    executableName: 'FeatherAndFury-Portable.exe',
    standaloneHtmlPath: './Feather-and-Fury-Standalone.html',
    windowsLauncherPath: './Feather-and-Fury-Windows.bat',
    electronBuildCommand: 'npm install && npm run dist:win',
  };
}

/**
 * Generates a lightweight Windows Desktop App launcher script (.bat)
 * that opens the game in a dedicated 1440x900 native-style app window.
 */
export function buildQuickWindowsLauncherScript(targetUrl: string): string {
  const cleanUrl = targetUrl.trim() || 'http://localhost:3000';
  return [
    '@echo off',
    'title Feather ^& Fury: Siege of Cragkeep',
    `start "" msedge --app="${cleanUrl}" --window-size=1440,900 2>nul || start "" chrome --app="${cleanUrl}" --window-size=1440,900 2>nul || start "" "${cleanUrl}"`,
    'exit /b 0',
  ].join('\r\n');
}
