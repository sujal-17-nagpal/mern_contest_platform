const https = require('https');

function post(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => resolve(JSON.parse(raw)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => resolve(JSON.parse(raw)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function check() {
  try {
    console.log('Logging into Live Backend...');
    const loginRes = await post('https://mern-contest-platform.onrender.com/api/auth/login', {
      email: 'mystery0419',
      password: '0419'
    });
    
    if (!loginRes.token) {
      console.error('Login failed:', loginRes);
      return;
    }

    console.log('✅ Login successful! Fetching live contests...');
    const contests = await get('https://mern-contest-platform.onrender.com/api/contests', loginRes.token);
    
    console.log('=== LIVE CONTESTS ===');
    contests.forEach(c => {
      console.log(`- ${c.title} (${c.questions?.length || 0} Questions)`);
      c.questions?.forEach((q, i) => {
        console.log(`   Q${i+1}: ${q.title} [${q.type}] - ${q.marks} Marks`);
      });
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
