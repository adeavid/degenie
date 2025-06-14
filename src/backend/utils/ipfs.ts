// Mock IPFS client for **development only**.
// WARNING: Guard with an environment flag so this code is never loaded in production.
if (process.env['NODE_ENV'] === 'production') {
  throw new Error('Mock IPFS client should not be bundled in production builds');
}

const ipfsClient = {
  add: async (data: any, _options?: any) => {
    // Mock implementation - returns a fake CID
    const mockCid = 'Qm' + Buffer.from(data).toString('hex').substring(0, 44);
    return {
      cid: {
        toString: () => mockCid
      }
    };
  },
  pin: {
    add: async (_hash: string) => {
      // Mock pin operation
      return true;
    }
  }
};

export async function uploadToIPFS(data: string | Buffer | Uint8Array): Promise<string> {
  try {
    let buffer: Buffer;
    
    if (typeof data === 'string') {
      // Handle base64 encoded images
      if (data.startsWith('data:image')) {
        const base64Data = data.split(',')[1];
        if (!base64Data) {
          throw new Error('Invalid base64 data');
        }
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        buffer = Buffer.from(data);
      }
    } else if (data instanceof Uint8Array) {
      buffer = Buffer.from(data);
    } else {
      buffer = data;
    }

    const result = await ipfsClient.add(buffer, {
      pin: true,
      wrapWithDirectory: false,
    });

    return result.cid.toString();
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw new Error('Failed to upload to IPFS');
  }
}

export async function uploadJSONToIPFS(jsonData: any): Promise<string> {
  try {
    const buffer = Buffer.from(JSON.stringify(jsonData));
    const result = await ipfsClient.add(buffer, {
      pin: true,
      wrapWithDirectory: false,
    });

    return result.cid.toString();
  } catch (error) {
    console.error('IPFS JSON upload error:', error);
    throw new Error('Failed to upload JSON to IPFS');
  }
}

export function getIPFSUrl(hash: string): string {
  const gateway = process.env['IPFS_GATEWAY'] || 'https://ipfs.io/ipfs/';
  return `${gateway}${hash}`;
}

export async function pinToIPFS(hash: string): Promise<void> {
  try {
    await ipfsClient.pin.add(hash);
  } catch (error) {
    console.error('IPFS pin error:', error);
    throw new Error('Failed to pin to IPFS');
  }
}