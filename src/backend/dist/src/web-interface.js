"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const replicate_1 = __importDefault(require("replicate"));
// import path from 'path';
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Initialize Replicate client
const replicate = new replicate_1.default({
    auth: process.env['REPLICATE_API_TOKEN']
});
// Health check
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            replicate: process.env['REPLICATE_API_TOKEN'] ? 'configured' : 'missing',
        }
    });
});
// Main page - handle both direct access and URL parameters
app.get('/', (req, res) => {
    const { type, prompt, tokenSymbol } = req.query;
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DeGenie AI Generator</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #0a0a0a; color: #fff; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #00d4aa; text-align: center; }
        .form-group { margin: 20px 0; }
        label { display: block; margin-bottom: 5px; color: #00d4aa; }
        input, select { width: 100%; padding: 10px; border: 1px solid #333; background: #1a1a1a; color: #fff; border-radius: 5px; }
        button { background: #00d4aa; color: #000; padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
        button:hover { background: #00b894; }
        .result { margin-top: 20px; padding: 20px; background: #1a1a1a; border-radius: 5px; border: 1px solid #333; }
        .loading { color: #00d4aa; }
        .error { color: #ff6b6b; }
        .success { color: #51cf66; }
        img { max-width: 100%; border-radius: 10px; margin-top: 10px; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .status.healthy { background: #2d5016; color: #51cf66; }
        .status.error { background: #4a1616; color: #ff6b6b; }
        .examples { background: #1a1a1a; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .examples h3 { color: #00d4aa; margin-top: 0; }
        .examples button { margin: 5px; padding: 8px 12px; font-size: 12px; }
        .url-info { background: #2a2a2a; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧞‍♂️ DeGenie AI Generator</h1>
        
        <div id="health-status"></div>
        
        ${type && prompt ? `
        <div class="url-info">
            📝 <strong>Auto-filled from URL:</strong><br>
            Type: ${type}<br>
            Prompt: ${prompt}<br>
            ${tokenSymbol ? `Token: ${tokenSymbol}` : ''}
        </div>` : ''}
        
        <form id="generate-form" method="POST" action="/generate">
            <div class="form-group">
                <label for="type">Asset Type:</label>
                <select id="type" name="type">
                    <option value="logo" ${type === 'logo' ? 'selected' : ''}>Logo</option>
                    <option value="meme" ${type === 'meme' ? 'selected' : ''}>Meme</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="prompt">Prompt:</label>
                <input type="text" id="prompt" name="prompt" value="${prompt || ''}" placeholder="e.g., rocket going to the moon" required>
            </div>
            
            <div class="form-group">
                <label for="tokenSymbol">Token Symbol:</label>
                <input type="text" id="tokenSymbol" name="tokenSymbol" value="${tokenSymbol || ''}" placeholder="e.g., ROCKET" maxlength="10">
            </div>
            
            <button type="submit">🚀 Generate Asset</button>
        </form>
        
        <div class="examples">
            <h3>💡 Try these safe prompts:</h3>
            <button onclick="fillForm('logo', 'rocket going to mars', 'MARS')">🚀 Mars Rocket Logo</button>
            <button onclick="fillForm('meme', 'diamond hands hodling', 'DIAMOND')">💎 Diamond Hands Meme</button>
            <button onclick="fillForm('logo', 'bull market celebration', 'BULL')">🐂 Bull Market Logo</button>
            <button onclick="fillForm('meme', 'when you buy the dip', 'DIP')">📉 Buy the Dip Meme</button>
            <button onclick="fillForm('logo', 'moon landing crypto', 'MOON')">🌙 Moon Logo</button>
        </div>
        
        <div id="result"></div>
        
        <div class="url-info">
            <strong>💾 Where are images stored?</strong><br>
            Images are temporarily stored on Replicate's CDN (replicate.delivery).<br>
            URLs are valid for about 24 hours. For permanent storage, we'll implement IPFS in the next task.
        </div>
    </div>

    <script>
        checkHealth();
        
        function fillForm(type, prompt, symbol) {
            document.getElementById('type').value = type;
            document.getElementById('prompt').value = prompt;
            document.getElementById('tokenSymbol').value = symbol;
        }
        
        async function checkHealth() {
            const statusDiv = document.getElementById('health-status');
            try {
                const response = await fetch('/health');
                const data = await response.json();
                
                statusDiv.innerHTML = \`
                    <div class="status healthy">
                        ✅ Server Status: \${data.status}
                        <br>🔑 Replicate: \${data.services.replicate}
                        <br>⏰ \${new Date(data.timestamp).toLocaleString()}
                    </div>
                \`;
            } catch (error) {
                statusDiv.innerHTML = \`
                    <div class="status error">
                        ❌ Server not responding: \${error.message}
                    </div>
                \`;
            }
        }
        
        // Auto-generate if URL parameters are present
        ${type && prompt ? `
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => {
                document.getElementById('generate-form').submit();
            }, 1000);
        });` : ''}
    </script>
</body>
</html>`;
    res.send(html);
});
// Handle form submission
app.post('/generate', async (req, res) => {
    try {
        const { type, prompt, tokenSymbol } = req.body;
        if (!prompt) {
            res.send(generateErrorPage('Prompt is required'));
            return;
        }
        let result;
        const startTime = Date.now();
        if (type === 'meme') {
            const memePrompt = `${prompt}, ${tokenSymbol || 'crypto'} meme, funny crypto meme, internet meme style, viral meme potential, cryptocurrency humor, trending meme format`;
            result = await replicate.run("fofr/sdxl-emoji:dee76b5afde21b0f01ed7925f0665b7e879c50ee718c5f78a9d38e04d523cc5e", {
                input: {
                    prompt: memePrompt,
                    width: 1024,
                    height: 1024,
                    num_inference_steps: 20
                }
            });
        }
        else {
            const logoPrompt = `${prompt}, ${tokenSymbol || 'crypto'} cryptocurrency logo, clean modern design, minimalist, vector style, professional branding, circular logo badge, flat design, trending on Dribble`;
            result = await replicate.run("stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b", {
                input: {
                    prompt: logoPrompt,
                    width: 1024,
                    height: 1024,
                    num_inference_steps: 30,
                    guidance_scale: 7.5,
                    scheduler: "K_EULER",
                    negative_prompt: "blurry, low quality, pixelated, text, watermark, signature"
                }
            });
        }
        const endTime = Date.now();
        const imageUrl = Array.isArray(result) ? result[0] : result;
        res.send(generateSuccessPage({
            type,
            prompt,
            tokenSymbol,
            imageUrl,
            processingTime: endTime - startTime
        }));
    }
    catch (error) {
        console.error('Generation error:', error);
        res.send(generateErrorPage(error.message));
    }
});
function generateSuccessPage(data) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DeGenie - ${data.type} Generated!</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #0a0a0a; color: #fff; }
        .container { max-width: 800px; margin: 0 auto; text-align: center; }
        h1 { color: #00d4aa; }
        .result { background: #1a1a1a; padding: 30px; border-radius: 10px; margin: 20px 0; }
        img { max-width: 100%; border-radius: 10px; margin: 20px 0; }
        .details { text-align: left; background: #2a2a2a; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .buttons { margin: 20px 0; }
        .buttons a, .buttons button { 
            background: #00d4aa; color: #000; padding: 12px 24px; border: none; 
            border-radius: 5px; text-decoration: none; margin: 5px; display: inline-block; 
            font-weight: bold; cursor: pointer;
        }
        .buttons a:hover, .buttons button:hover { background: #00b894; }
    </style>
</head>
<body>
    <div class="container">
        <h1>✅ ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Generated!</h1>
        
        <div class="result">
            <img src="${data.imageUrl}" alt="Generated ${data.type}" />
            
            <div class="details">
                <p><strong>🎯 Original Prompt:</strong> ${data.prompt}</p>
                <p><strong>🏷️ Token Symbol:</strong> ${data.tokenSymbol || 'N/A'}</p>
                <p><strong>⏱️ Processing Time:</strong> ${Math.round(data.processingTime / 1000)}s</p>
                <p><strong>🔗 Image URL:</strong> <a href="${data.imageUrl}" target="_blank" style="color: #00d4aa;">Open in new tab</a></p>
                <p><strong>💾 Storage:</strong> Temporary (24h) on Replicate CDN</p>
            </div>
            
            <div class="buttons">
                <a href="${data.imageUrl}" target="_blank">🔗 View Full Size</a>
                <a href="/" >🔄 Generate Another</a>
                <button onclick="copyToClipboard('${data.imageUrl}')">📋 Copy URL</button>
            </div>
        </div>
    </div>
    
    <script>
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                alert('URL copied to clipboard!');
            });
        }
    </script>
</body>
</html>`;
}
function generateErrorPage(error) {
    let suggestions = '';
    if (error.includes('NSFW')) {
        suggestions = `
      <div style="background: #4a1616; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>🚫 Content Flagged as NSFW</h3>
        <p>The AI detected potentially inappropriate content in your prompt.</p>
        <p><strong>Try these safe alternatives:</strong></p>
        <ul style="text-align: left;">
          <li>"happy crypto character"</li>
          <li>"rocket going to mars"</li>
          <li>"diamond hands hodling"</li>
          <li>"bull market celebration"</li>
        </ul>
      </div>
    `;
    }
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DeGenie - Generation Failed</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #0a0a0a; color: #fff; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { color: #ff6b6b; }
        .error { background: #1a1a1a; padding: 30px; border-radius: 10px; }
        a { background: #00d4aa; color: #000; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-weight: bold; }
        a:hover { background: #00b894; }
    </style>
</head>
<body>
    <div class="container">
        <div class="error">
            <h1>❌ Generation Failed</h1>
            <p>${error}</p>
            ${suggestions}
            <p><a href="/">🔄 Try Again</a></p>
        </div>
    </div>
</body>
</html>`;
}
const PORT = process.env['PORT'] || 4000;
app.listen(PORT, () => {
    console.log(`🚀 DeGenie Web Interface running on port ${PORT}`);
    console.log(`🔑 Replicate: ${process.env['REPLICATE_API_TOKEN'] ? 'Ready ✅' : 'Not configured ❌'}`);
    console.log(`🌐 Open: http://localhost:${PORT}`);
});
//# sourceMappingURL=web-interface.js.map