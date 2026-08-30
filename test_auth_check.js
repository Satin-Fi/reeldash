const https = require('https');

const authUrl = 'https://knlcmaoazqadlwrqypbo.supabase.co/auth/v1/authorize?provider=google&redirect_to=https%3A%2F%2Freeldash-nine.vercel.app%2Fapi%2Fauth%2Fcallback%3Fnext%3D%2Fdashboard';

https.get(authUrl, (res) => {
  console.log('Status code:', res.statusCode);
  console.log('Location header:', res.headers.location);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (data) console.log('Response body:', data);
  });
}).on('error', console.error);
