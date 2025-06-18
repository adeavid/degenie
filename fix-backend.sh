#!/bin/bash
echo "🔧 Fixing DeGenie Backend TypeScript Issues..."

# Navigate to backend directory
cd /Users/cash/Desktop/degenie/src/backend

echo "📁 Current directory: $(pwd)"

# Generate Prisma Client (this fixes the .create() method issues)
echo "🗃️  Generating Prisma Client..."
npx prisma generate

# Run database migrations if needed
echo "🗃️  Running database migrations..."
npx prisma migrate dev --name init || echo "Migration may already exist"

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Try to start the server
echo "🚀 Starting backend server..."
npm run dev:complete