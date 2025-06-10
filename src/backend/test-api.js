const https = require('https');
const http = require('http');

function testAPI() {
  const data = JSON.stringify({
    prompt: "rocket going to the moon",
    tokenSymbol: "ROCKET"
  });

  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/generate/logo',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  console.log('🚀 Testing DeGenie AI API...');
  console.log('Endpoint:', `http://localhost:4000${options.path}`);
  console.log('Payload:', data);

  const req = http.request(options, (res) => {
    console.log(`\n📊 Response Status: ${res.statusCode}`);
    
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(responseData);
        console.log('\n✅ Success! API Response:');
        console.log(JSON.stringify(result, null, 2));
        
        if (result.data && result.data.imageUrl) {
          console.log('\n🎨 Generated Image URL:');
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

// Test health endpoint first
function testHealth() {
  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/health',
    method: 'GET'
  };

  console.log('🏥 Testing health endpoint...');

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Health check response:', JSON.parse(data));
      
      // If health check passes, test the API
      if (res.statusCode === 200) {
        console.log('\n');
        testAPI();
      }
    });
  });

  req.on('error', (error) => {
    console.error('Health check failed:', error.message);
  });

  req.end();
}

// Start with health check
testHealth();