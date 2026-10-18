const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'dist-test');

try {
  console.log('Compiling verification tests...');
  execSync(
    'npx tsc src/tests/verify_core.ts --ignoreConfig --target es2020 --module commonjs --skipLibCheck --outDir dist-test',
    { stdio: 'inherit' }
  );

  console.log('Executing test suite...');
  execSync('node ./dist-test/tests/verify_core.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Test execution failed:', error.message);
  process.exit(1);
} finally {
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
}
