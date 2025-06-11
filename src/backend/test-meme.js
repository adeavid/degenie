const http = require('http');

function testMemeAPI() {
  const data = JSON.stringify({
    prompt: "rocket going to the moon but gets lost",
    tokenSymbol: "ROCKET"
  });

  const options = {
    hostname: process.env.DEGENIE_HOST || 'localhost',
    port: Number(process.env.DEGENIE_PORT) || 4000,
    path: '/api/generate/meme',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  console.log('🚀 Testing DeGenie Meme Generation...');
  console.log('Payload:', data);

  const req = http.request(options, (res) => {
    console.log(`📊 Response Status: ${res.statusCode}`);
    
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(responseData);
        console.log('\n✅ Meme Generated! Response:');
        console.log(JSON.stringify(result, null, 2));
        
        if (result.data?.imageUrl) {
          console.log('\n🎭 Generated Meme URL:');
          console.log(result.data.imageUrl);
        }
      } catch (error) {
        console.log('\n❌ Error parsing response:');
        console.log(responseData);
      }
    });
  });

  req.on('error', (error) => {
    console.error('\n❌ Request failed:', error.message);
  });

  req.write(data);
  req.end();
}

testMemeAPI();