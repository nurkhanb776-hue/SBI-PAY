const fs = require('fs');
(async () => {
  try {
    const res = await fetch('http://localhost:10000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '8837022561', password: 'Riya12340' })
    });
    const text = await res.text();
    const payload = { status: res.status, ok: res.ok, body: text };
    fs.writeFileSync('c:/Users/NR/Desktop/SBI PAY/debug-login-result.json', JSON.stringify(payload, null, 2));
    console.log('WROTE', payload.status, payload.body);
  } catch (err) {
    fs.writeFileSync('c:/Users/NR/Desktop/SBI PAY/debug-login-result.json', JSON.stringify({ error: String(err) }, null, 2));
    console.error(err);
    process.exitCode = 1;
  }
})();
