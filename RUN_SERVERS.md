# 🚀 DeGenie - How to Run the Application

## Prerequisites
- Node.js installed
- Dependencies installed in both frontend and backend

## Quick Start

### 1. Start Backend Server
```bash
cd /Users/cash/Desktop/degenie/src/backend
npm run dev:complete
```
✅ Backend should start on **http://localhost:4000**

### 2. Start Frontend Server
```bash
cd /Users/cash/Desktop/degenie/src/frontend  
npm run dev
```
✅ Frontend should start on **http://localhost:3000**

## Verification

1. **Backend Health Check**: Visit http://localhost:4000/health
2. **Frontend**: Visit http://localhost:3000
3. **Look for green "Backend connected" status** on the homepage

## Troubleshooting

### Backend Issues:
- Check if port 4000 is available
- Verify `.env` file exists in `/src/backend/`
- Check console for error messages

### Frontend Issues:
- Clear browser cache
- Check browser console for errors
- Verify both servers are running

### Authentication Issues:
- Ensure backend is running first
- Check that wallet is properly connected
- Look for network errors in browser dev tools

## Current Status ✅

**Fixed Issues:**
- ✅ Wallet provider context errors resolved
- ✅ API endpoints connected (frontend ↔ backend)
- ✅ Mock data removed (real AI generation)
- ✅ Authentication system connected
- ✅ SSR/hydration issues fixed

**Features Working:**
- 🔗 Real wallet connection (Ethereum + Solana)
- 🤖 AI asset generation via Replicate API
- 🔐 User authentication and registration
- 📊 Credit system and tier management
- 🎨 All pages render without crashes

## Next Steps
Start both servers and test the complete token creation flow!