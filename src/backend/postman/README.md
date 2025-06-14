# DeGenie API Postman Collection

This directory contains the Postman collection for testing the DeGenie API endpoints.

## Importing the Collection

1. Open Postman
2. Click "Import" button in the top-left corner
3. Select the `DeGenie_API.postman_collection.json` file
4. Click "Import"

## Collection Overview

The collection is organized into the following sections:

### 1. Health
- **Health Check**: Full health check including database and Redis connectivity
- **Basic Health Check**: Quick health check without service verification

### 2. Authentication
- **Wallet Login/Register**: Authenticate with a Solana wallet address (creates new user if not exists)
- **Register with Details**: Register with email and username
- **Get Current User**: Retrieve authenticated user information
- **Refresh Token**: Refresh JWT token before expiry

### 3. AI Generation
- **Generate Asset**: Create a single AI-generated asset (logo, meme, or gif)
- **Batch Generate**: Generate multiple assets in one request (starter/viral tiers only)
- **Get Generation History**: View past AI generations
- **Get Credit Balance**: Check credit balance and transaction history
- **Earn Credits**: Earn credits through various actions

## Environment Variables

The collection uses the following variables:
- `baseUrl`: Server URL (default: `http://localhost:4000`)
- `authToken`: JWT token (automatically set after login)
- `walletAddress`: Test wallet address for authentication
- `userId`: User ID (automatically set after login)

## Authentication Flow

1. First, run the "Wallet Login/Register" request
2. The token will be automatically saved and used for subsequent requests
3. All AI Generation endpoints require authentication

## Testing Features

The collection includes:
- Automatic token extraction and storage
- Response time validation
- Content-type checking
- Response structure validation

## Quick Start

1. Import the collection
2. Run "Health Check" to verify server is running
3. Run "Wallet Login/Register" to authenticate
4. Try any of the AI Generation endpoints

## Notes

- Free tier users have limited credits and cannot use batch generation
- Rate limits apply to all endpoints
- Token expires after 30 days (use Refresh Token endpoint)