const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('--- Rozpoczynanie budowania Nextcloud Files Enhancer ---');

// 1. Bundle JavaScript with esbuild
let esbuild;
try {
  esbuild = require('esbuild');
} catch {
  try {
    esbuild = require('B:/Projekty/talk-desktop/node_modules/esbuild');
  } catch (e) {
    console.warn('esbuild nie znaleziony, używam npx esbuild...');
  }
}

if (esbuild) {
  esbuild.buildSync({
    entryPoints: [path.join(__dirname, 'src', 'index.js')],
    bundle: true,
    outfile: path.join(__dirname, 'js', 'files_enhancer.js'),
    minify: true,
    format: 'iife'
  });
} else {
  execSync(`npx -y esbuild src/index.js --bundle --minify --format=iife --outfile=js/files_enhancer.js`, { stdio: 'inherit' });
}

const jsStat = fs.statSync(path.join(__dirname, 'js', 'files_enhancer.js'));
console.log('✓ Zbudowano js/files_enhancer.js, rozmiar:', jsStat.size, 'bajtów');

// 2. Prepare staging directory
const stagingBase = path.join(__dirname, 'dist');
const appDir = path.join(stagingBase, 'files_enhancer');

if (fs.existsSync(stagingBase)) {
  fs.rmSync(stagingBase, { recursive: true, force: true });
}
fs.mkdirSync(appDir, { recursive: true });

// Directories to copy
const dirsToCopy = ['appinfo', 'css', 'img', 'js', 'lib', 'templates'];
dirsToCopy.forEach(dir => {
  const src = path.join(__dirname, dir);
  const dest = path.join(appDir, dir);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
  }
});

console.log('✓ Przygotowano strukturę w folderze dist/files_enhancer');

// 3. Create .tar.gz and .zip archives
const tarOut = path.join(__dirname, 'files_enhancer.tar.gz');
const zipOut = path.join(__dirname, 'files_enhancer.zip');

if (fs.existsSync(tarOut)) fs.unlinkSync(tarOut);
if (fs.existsSync(zipOut)) fs.unlinkSync(zipOut);

// Create tar.gz using native bsdtar
try {
  execSync(`tar -czvf "${tarOut}" -C "${stagingBase}" files_enhancer`, { stdio: 'inherit' });
  console.log('✓ Utworzono archiwum:', tarOut, '(', fs.statSync(tarOut).size, 'bajtów)');
} catch (e) {
  console.error('Błąd tworzenia tar.gz:', e.message);
}

// Create zip using PowerShell Compress-Archive
try {
  execSync(`powershell -Command "Compress-Archive -Path '${appDir}' -DestinationPath '${zipOut}' -Force"`, { stdio: 'inherit' });
  console.log('✓ Utworzono archiwum:', zipOut, '(', fs.statSync(zipOut).size, 'bajtów)');
} catch (e) {
  console.error('Błąd tworzenia zip:', e.message);
}

console.log('--- Budowanie zakończone sukcesem! ---');
