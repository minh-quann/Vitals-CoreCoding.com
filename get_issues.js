const https = require('https');
https.get({
  hostname: 'api.github.com',
  path: '/repos/corecoding/Vitals/issues?state=all&per_page=100',
  headers: { 'User-Agent': 'Node.js' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    let issues = JSON.parse(data);
    issues.forEach(i => {
      if (i.title.toLowerCase().includes('group') || (i.body && i.body.toLowerCase().includes('group'))) {
        console.log(`${i.number} - ${i.title}`);
      }
    });
  });
});
