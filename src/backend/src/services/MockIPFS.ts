import fetch from 'node-fetch';

// Mock IPFS service for development
export class MockIPFS {
  private static hashCounter = 1000;

  static async uploadToIPFS(data: string | Buffer): Promise<string> {
    // Generate a mock IPFS hash
    const hash = `Qm${this.hashCounter.toString().padStart(44, '0')}`;
    this.hashCounter++;
    
    console.log(`📦 Mock IPFS: Generated hash ${hash} for ${typeof data === 'string' ? 'string' : 'buffer'} data`);
    
    // In a real implementation, this would upload to IPFS
    // For demo purposes, we just return a mock hash
    return hash;
  }

  static async downloadImage(url: string): Promise<Buffer> {
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
      
      const buffer = await response.buffer();
      console.log(`✅ Downloaded ${buffer.length} bytes`);
      return buffer;
    } catch (error: any) {
      console.error(`❌ Download error:`, error);
      throw new Error(`Failed to download image: ${error?.message || 'Unknown error'}`);
    }
  }

  static getIPFSUrl(hash: string): string {
    // Return a mock IPFS URL - in production this would be a real IPFS gateway
    return `https://mock-ipfs-gateway.io/ipfs/${hash}`;
  }
}