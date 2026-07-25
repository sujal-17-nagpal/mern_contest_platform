const http = require('http');
const https = require('https');

/**
 * Execute C++ code against stdin using Wandbox API
 */
const runCodeWandbox = (code, stdin) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      compiler: 'gcc-head',
      code: code,
      stdin: stdin,
      options: 'warning,gnu++17'
    });

    const options = {
      hostname: 'wandbox.org',
      path: '/api/compile.json',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const isSuccess = String(parsed.status) === '0';
          const compileErr = (parsed.compiler_error || parsed.compiler_output || '').trim();
          
          if (!isSuccess && compileErr) {
            resolve({ output: '', compileError: compileErr });
          } else {
            resolve({ output: (parsed.program_output || '').trim(), compileError: '' });
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

module.exports = { runCodeWandbox };
