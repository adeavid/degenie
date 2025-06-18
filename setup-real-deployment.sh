#!/bin/bash

# 🚀 DEGENIE - SETUP AUTOMÁTICO PARA DEPLOY REAL DE TOKENS
echo "🧞‍♂️ DEGENIE - Configurando deploy REAL de tokens SPL..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}================================================================${NC}"
echo -e "${PURPLE}🔥 DEGENIE - REAL TOKEN DEPLOYMENT SETUP${NC}"
echo -e "${PURPLE}================================================================${NC}"

# 1. Instalar dependencias del backend
echo -e "\n${BLUE}📦 Instalando dependencias Solana en backend...${NC}"
cd src/backend
npm install @solana/web3.js @solana/spl-token @metaplex-foundation/js

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencias instaladas correctamente${NC}"
else
    echo -e "${RED}❌ Error instalando dependencias${NC}"
    exit 1
fi

# 2. Verificar si Solana CLI está instalado
echo -e "\n${BLUE}🔧 Verificando Solana CLI...${NC}"
if command -v solana &> /dev/null; then
    echo -e "${GREEN}✅ Solana CLI ya está instalado${NC}"
    solana --version
else
    echo -e "${YELLOW}⚠️  Solana CLI no está instalado${NC}"
    echo -e "${BLUE}Instalando Solana CLI...${NC}"
    
    # Detectar OS y instalar
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
    else
        echo -e "${RED}❌ OS no soportado. Instala Solana CLI manualmente: https://docs.solana.com/cli/install-solana-cli-tools${NC}"
        exit 1
    fi
    
    # Agregar al PATH
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    echo -e "${GREEN}✅ Solana CLI instalado${NC}"
fi

# 3. Configurar archivo .env
echo -e "\n${BLUE}⚙️  Configurando archivo .env...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Archivo .env creado desde .env.example${NC}"
else
    echo -e "${YELLOW}⚠️  Archivo .env ya existe${NC}"
fi

# 4. Generar wallet del servidor si no existe
echo -e "\n${BLUE}🔑 Configurando wallet del servidor...${NC}"
if [ ! -f server-wallet.json ]; then
    echo -e "${BLUE}Generando nueva wallet para el servidor...${NC}"
    solana-keygen new --outfile server-wallet.json --no-bip39-passphrase --force
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Wallet del servidor generada: server-wallet.json${NC}"
        
        # Mostrar dirección pública
        WALLET_ADDRESS=$(solana-keygen pubkey server-wallet.json)
        echo -e "${PURPLE}📋 Dirección del servidor: ${WALLET_ADDRESS}${NC}"
        
        # Fondear con SOL en devnet
        echo -e "${BLUE}💰 Fondeando wallet con SOL en devnet...${NC}"
        solana config set --url devnet
        solana airdrop 5 $WALLET_ADDRESS --url devnet
        
        # Verificar balance
        BALANCE=$(solana balance $WALLET_ADDRESS --url devnet)
        echo -e "${GREEN}💎 Balance: ${BALANCE}${NC}"
        
        # Convertir private key a formato array
        echo -e "\n${YELLOW}🔧 Convirtiendo private key...${NC}"
        PRIVATE_KEY_ARRAY=$(cat server-wallet.json | jq -c '.')
        
        # Actualizar .env con la private key
        if grep -q "SERVER_WALLET_PRIVATE_KEY=" .env; then
            sed -i.bak "s/SERVER_WALLET_PRIVATE_KEY=.*/SERVER_WALLET_PRIVATE_KEY=${PRIVATE_KEY_ARRAY}/" .env
        else
            echo "SERVER_WALLET_PRIVATE_KEY=${PRIVATE_KEY_ARRAY}" >> .env
        fi
        
        echo -e "${GREEN}✅ Private key configurada en .env${NC}"
        
    else
        echo -e "${RED}❌ Error generando wallet${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Wallet del servidor ya existe${NC}"
fi

# 5. Verificar configuración
echo -e "\n${BLUE}🔍 Verificando configuración...${NC}"

# Verificar que las dependencias estén instaladas
if npm list @solana/web3.js @solana/spl-token @metaplex-foundation/js &> /dev/null; then
    echo -e "${GREEN}✅ Dependencias Solana OK${NC}"
else
    echo -e "${RED}❌ Faltan dependencias Solana${NC}"
fi

# Verificar archivo .env
if [ -f .env ]; then
    echo -e "${GREEN}✅ Archivo .env OK${NC}"
else
    echo -e "${RED}❌ Falta archivo .env${NC}"
fi

# Verificar wallet
if [ -f server-wallet.json ]; then
    echo -e "${GREEN}✅ Wallet del servidor OK${NC}"
else
    echo -e "${RED}❌ Falta wallet del servidor${NC}"
fi

echo -e "\n${PURPLE}================================================================${NC}"
echo -e "${GREEN}🎉 ¡SETUP COMPLETADO!${NC}"
echo -e "${PURPLE}================================================================${NC}"

echo -e "\n${BLUE}📋 PRÓXIMOS PASOS:${NC}"
echo -e "1. ${YELLOW}Configura tu REPLICATE_API_TOKEN en .env${NC}"
echo -e "2. ${YELLOW}Inicia el servidor: npm run dev:complete${NC}"
echo -e "3. ${YELLOW}Ve al frontend y crea tu primer token!${NC}"

echo -e "\n${BLUE}🔗 LINKS ÚTILES:${NC}"
echo -e "• Solscan Devnet: ${PURPLE}https://solscan.io/?cluster=devnet${NC}"
echo -e "• Solana Explorer: ${PURPLE}https://explorer.solana.com/?cluster=devnet${NC}"
echo -e "• Documentación: ${PURPLE}./REAL_TOKEN_DEPLOYMENT.md${NC}"

echo -e "\n${GREEN}🚀 ¡DEGENIE está listo para competir con Pump.fun!${NC}"
echo -e "${PURPLE}¡A crear tokens como los profesionales! 🧞‍♂️${NC}"