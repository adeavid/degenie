"use strict";
// Node 18+ has fetch built-in; no import required
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToIPFS = uploadToIPFS;
exports.downloadImage = downloadImage;
exports.getIPFSUrl = getIPFSUrl;
// Mock IPFS service for development - using functions instead of static class for better tree-shaking
let hashCounter = 1000;
async function uploadToIPFS(data) {
    // Generate a mock IPFS hash
    const hash = `Qm${hashCounter.toString().padStart(44, '0')}`;
    hashCounter++;
    console.log(`📦 Mock IPFS: Generated hash ${hash} for ${typeof data === 'string' ? 'string' : 'buffer'} data`);
    // In a real implementation, this would upload to IPFS
    // For demo purposes, we just return a mock hash
    return hash;
}
async function downloadImage(url) {
    // In demo mode, just create a mock buffer instead of downloading
    if (url.includes('via.placeholder.com') || url.includes('mock')) {
        console.log(`🎭 Demo mode: Creating mock image buffer for ${url}`);
        const mockBuffer = Buffer.from('MOCK_IMAGE_DATA_FOR_DEMO_PURPOSES', 'utf8');
        console.log(`✅ Created mock buffer with ${mockBuffer.length} bytes`);
        return mockBuffer;
    }
    try {
        console.log(`⬇️  Downloading image from: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
        }
        // Use arrayBuffer for memory efficiency with native fetch
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log(`✅ Downloaded ${buffer.length} bytes`);
        return buffer;
    }
    catch (error) {
        console.error(`❌ Download error:`, error);
        throw new Error(`Failed to download image: ${error?.message || 'Unknown error'}`);
    }
}
function getIPFSUrl(hash) {
    // Return a mock IPFS URL - in production this would be a real IPFS gateway
    return `https://mock-ipfs-gateway.io/ipfs/${hash}`;
}
//# sourceMappingURL=MockIPFS.js.map