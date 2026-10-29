const { build } = require('esbuild');
const path = require('path');

async function main() {
  console.log('🔨 Building Electron scripts...');
  
  try {
    // Build main process
    await build({
      entryPoints: [path.join(__dirname, 'electron/main.ts')],
      outfile: path.join(__dirname, 'electron/main.js'),
      bundle: true,
      platform: 'node',
      target: 'node18',
      external: ['electron', 'child_process', 'fs', 'path', 'os', 'crypto', 'readline'],
      format: 'cjs',
      sourcemap: process.env.NODE_ENV !== 'production',
      minify: process.env.NODE_ENV === 'production',
    });

    console.log('✅ Main process built successfully');

    // Build preload script
    await build({
      entryPoints: [path.join(__dirname, 'electron/preload.ts')],
      outfile: path.join(__dirname, 'electron/preload.js'),
      bundle: true,
      platform: 'node',
      target: 'node18',
      external: ['electron'],
      format: 'cjs',
      sourcemap: process.env.NODE_ENV !== 'production',
      minify: process.env.NODE_ENV === 'production',
    });

    console.log('✅ Preload script built successfully');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };