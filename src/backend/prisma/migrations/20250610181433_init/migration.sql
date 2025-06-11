-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT,
    "credits" REAL NOT NULL DEFAULT 3.0,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME,
    "referralCode" TEXT NOT NULL,
    "referredBy" TEXT,
    CONSTRAINT "User_referredBy_fkey" FOREIGN KEY ("referredBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "description" TEXT,
    "creatorId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "logoIpfsHash" TEXT,
    "totalSupply" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "marketCap" REAL DEFAULT 0,
    "liquidity" REAL DEFAULT 0,
    "holders" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "launchedAt" DATETIME,
    CONSTRAINT "Token_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Generation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenId" TEXT,
    "type" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "optimizedPrompt" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "resultUrl" TEXT NOT NULL,
    "ipfsHash" TEXT,
    "creditCost" REAL NOT NULL,
    "processingTime" INTEGER NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Generation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Generation_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" TEXT,
    "balanceBefore" REAL NOT NULL,
    "balanceAfter" REAL NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priceUSD" REAL NOT NULL,
    "priceCrypto" REAL,
    "paymentMethod" TEXT NOT NULL,
    "paymentTxHash" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "cancelledAt" DATETIME,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TokenMilestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenId" TEXT NOT NULL,
    "milestone" TEXT NOT NULL,
    "achievedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rewardCredits" REAL NOT NULL,
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "TokenMilestone_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rewardCredits" REAL NOT NULL DEFAULT 0,
    "metadata" TEXT,
    CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TokenAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "price" REAL NOT NULL,
    "volume24h" REAL NOT NULL,
    "marketCap" REAL NOT NULL,
    "liquidity" REAL NOT NULL,
    "holders" INTEGER NOT NULL,
    "socialScore" REAL,
    "twitterMentions" INTEGER,
    "telegramMembers" INTEGER,
    CONSTRAINT "TokenAnalytics_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_walletAddress_idx" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_tier_idx" ON "User"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "Token_address_key" ON "Token"("address");

-- CreateIndex
CREATE INDEX "Token_creatorId_idx" ON "Token"("creatorId");

-- CreateIndex
CREATE INDEX "Token_chain_idx" ON "Token"("chain");

-- CreateIndex
CREATE INDEX "Token_marketCap_idx" ON "Token"("marketCap");

-- CreateIndex
CREATE INDEX "Generation_userId_idx" ON "Generation"("userId");

-- CreateIndex
CREATE INDEX "Generation_tokenId_idx" ON "Generation"("tokenId");

-- CreateIndex
CREATE INDEX "Generation_type_idx" ON "Generation"("type");

-- CreateIndex
CREATE INDEX "CreditTransaction_userId_idx" ON "CreditTransaction"("userId");

-- CreateIndex
CREATE INDEX "CreditTransaction_type_idx" ON "CreditTransaction"("type");

-- CreateIndex
CREATE INDEX "CreditTransaction_timestamp_idx" ON "CreditTransaction"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_expiresAt_idx" ON "Subscription"("expiresAt");

-- CreateIndex
CREATE INDEX "TokenMilestone_tokenId_idx" ON "TokenMilestone"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "TokenMilestone_tokenId_milestone_key" ON "TokenMilestone"("tokenId", "milestone");

-- CreateIndex
CREATE INDEX "Achievement_userId_idx" ON "Achievement"("userId");

-- CreateIndex
CREATE INDEX "Achievement_category_idx" ON "Achievement"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_userId_name_key" ON "Achievement"("userId", "name");

-- CreateIndex
CREATE INDEX "TokenAnalytics_tokenId_idx" ON "TokenAnalytics"("tokenId");

-- CreateIndex
CREATE INDEX "TokenAnalytics_timestamp_idx" ON "TokenAnalytics"("timestamp");
