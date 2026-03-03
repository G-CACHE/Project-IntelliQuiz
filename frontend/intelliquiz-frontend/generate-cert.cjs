/**
 * generate-cert.cjs
 *
 * Auto-generates a self-signed TLS certificate for local HTTPS development.
 * Runs cross-platform (Windows, macOS, Linux) — requires OpenSSL in PATH.
 *
 * On Windows, OpenSSL is bundled with Git for Windows (Git Bash).
 * Ensure "C:\Program Files\Git\usr\bin" is in your system PATH,
 * or run from Git Bash / VS Code terminal that inherits Git's PATH.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const certDir = path.join(__dirname, 'certs');
const keyPath = path.join(certDir, 'localhost-key.pem');
const certPath = path.join(certDir, 'localhost-cert.pem');
const isWindows = os.platform() === 'win32';

if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  // Create a temporary OpenSSL config to avoid -addext quoting issues on Windows
  const opensslConf = path.join(certDir, '_openssl.cnf');
  const confContent = [
    '[req]',
    'default_bits = 2048',
    'prompt = no',
    'default_md = sha256',
    'distinguished_name = dn',
    'req_extensions = v3_req',
    '',
    '[dn]',
    'CN = localhost',
    '',
    '[v3_req]',
    'subjectAltName = DNS:localhost,IP:127.0.0.1',
  ].join('\n');

  fs.writeFileSync(opensslConf, confContent);

  const cmd = [
    'openssl', 'req', '-x509',
    '-newkey', 'rsa:2048',
    '-keyout', `"${keyPath}"`,
    '-out', `"${certPath}"`,
    '-days', '365',
    '-nodes',
    '-config', `"${opensslConf}"`,
    '-extensions', 'v3_req',
  ].join(' ');

  try {
    execSync(cmd, {
      stdio: 'inherit',
      // On Windows, use cmd.exe so openssl from Git is found via PATH
      shell: isWindows ? 'cmd.exe' : '/bin/sh',
    });
    console.log('\n✅ Self-signed HTTPS certificate generated in certs/');
  } catch (e) {
    console.error('\n❌ Failed to generate certificate.');
    console.error('   Make sure OpenSSL is installed and available in your PATH.');
    if (isWindows) {
      console.error('   Tip: Install Git for Windows — it bundles OpenSSL.');
      console.error('   Add "C:\\Program Files\\Git\\usr\\bin" to your system PATH.');
    }
    process.exit(1);
  } finally {
    // Clean up temp config
    try { fs.unlinkSync(opensslConf); } catch (_) { /* ignore */ }
  }
} else {
  console.log('✅ HTTPS certificate already exists — skipping generation.');
}
