import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const tempOutDir = path.resolve(rootDir, '.standalone-temp');
const publicDir = path.resolve(rootDir, 'public');

async function generateStandaloneBundles() {
  await build({
    root: rootDir,
    configFile: false,
    base: './',
    logLevel: 'silent',
    plugins: [react(), tailwindcss()],
    build: {
      outDir: tempOutDir,
      emptyOutDir: true,
      assetsInlineLimit: 1000000,
      cssCodeSplit: false,
    },
  });

  const assetsDir = path.join(tempOutDir, 'assets');
  const assetFiles = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];

  let cssContent = '';
  let jsContent = '';

  for (const file of assetFiles) {
    const fullPath = path.join(assetsDir, file);
    if (file.endsWith('.css')) {
      cssContent += fs.readFileSync(fullPath, 'utf8') + '\n';
    } else if (file.endsWith('.js')) {
      jsContent += fs.readFileSync(fullPath, 'utf8') + '\n';
    }
  }

  // Escape any closing script tags inside the minified bundle
  const safeJsContent = jsContent.replace(/<\/script>/gi, '<\\/script>');

  const standaloneHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Feather &amp; Fury: Siege of Cragkeep</title>
    <style>${cssContent}</style>
  </head>
  <body>
    <div id="root"></div>
    <script>${safeJsContent}</script>
  </body>
</html>`;

  fs.mkdirSync(publicDir, { recursive: true });
  const htmlOutPath = path.join(publicDir, 'Feather-and-Fury-Standalone.html');
  fs.writeFileSync(htmlOutPath, standaloneHtml, 'utf8');

  // Create a self-extracting Windows Desktop App Launcher (.bat) containing the base64-encoded offline HTML
  const base64Html = Buffer.from(standaloneHtml, 'utf8').toString('base64');
  const wrappedBase64 = base64Html.match(/.{1,76}/g)?.join('\r\n') ?? base64Html;

  const windowsBat = [
    '@echo off',
    'title Feather ^& Fury: Siege of Cragkeep Launcher',
    'set "APP_HTML=%TEMP%\\FeatherAndFury_Cragkeep.html"',
    'set "B64_FILE=%TEMP%\\FeatherAndFury_Cragkeep.b64"',
    'findstr /v "^@echo ^title ^set ^findstr ^certutil ^del ^start ^exit ^::" "%~f0" > "%B64_FILE%"',
    'certutil -decode -f "%B64_FILE%" "%APP_HTML%" >nul 2>&1',
    'del "%B64_FILE%" >nul 2>&1',
    'start "" msedge --app="file:///%APP_HTML%" --window-size=1440,900 2>nul || start "" chrome --app="file:///%APP_HTML%" --window-size=1440,900 2>nul || start "" "%APP_HTML%"',
    'exit /b 0',
    ':: PAYLOAD_BEGIN',
    wrappedBase64,
  ].join('\r\n');

  const batOutPath = path.join(publicDir, 'Feather-and-Fury-Windows.bat');
  fs.writeFileSync(batOutPath, windowsBat, 'utf8');

  fs.rmSync(tempOutDir, { recursive: true, force: true });
  console.log('Generated standalone offline HTML and self-contained Windows .bat desktop app.');
}

generateStandaloneBundles().catch((err) => {
  console.error(err);
  process.exit(1);
});
