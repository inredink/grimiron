const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'dist-test');

try {
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  console.log('Compiling verification tests...');
  execSync(
    'npx tsc src/tests/verify_core.ts --ignoreConfig --target es2020 --module commonjs --skipLibCheck --outDir dist-test',
    { stdio: 'inherit' }
  );

  console.log('Executing test suite...');
  const testFile = fs.existsSync(path.join(outDir, 'src', 'tests', 'verify_core.js'))
    ? './dist-test/src/tests/verify_core.js'
    : './dist-test/tests/verify_core.js';
  execSync(`node ${testFile}`, { stdio: 'inherit' });
} catch (error) {
  console.error('Test execution failed:', error.message);
  process.exit(1);
} finally {
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
}
