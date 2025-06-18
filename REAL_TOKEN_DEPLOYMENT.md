# 🚀 DEGENIE - REAL TOKEN DEPLOYMENT SETUP

¡Tu plataforma como **Pump.fun** está lista para desplegar tokens SPL REALES en Solana!

## 🔥 CARACTERÍSTICAS IMPLEMENTADAS

✅ **Deploy REAL de tokens SPL** en Solana Devnet/Mainnet  
✅ **Metadata en Arweave** via Metaplex  
✅ **Mint authority revocada** (no más minting)  
✅ **Tokens verificables** en Solscan  
✅ **Dashboard profesional** con live feed  
✅ **UI como exchanges crypto** reales  

## 📋 SETUP RÁPIDO

### 1. Instalar Dependencias Solana

```bash
cd src/backend
npm install @solana/web3.js @solana/spl-token @metaplex-foundation/js
```

### 2. Instalar Solana CLI

```bash
# macOS/Linux
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# Windows
curl https://release.solana.com/v1.17.0/solana-install-init-x86_64-pc-windows-msvc.exe --output C:\solana-install-tmp\solana-install-init.exe --create-dirs
```

### 3. Generar Wallet del Servidor

```bash
# Generar nueva wallet
solana-keygen new --outfile server-wallet.json --no-bip39-passphrase

# Ver la dirección pública
solana-keygen pubkey server-wallet.json

# Fondear con SOL (DEVNET)
solana airdrop 5 --url devnet

# Verificar balance
solana balance --url devnet
```

### 4. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tu configuración
```

En tu `.env`:
```env
SOLANA_RPC_URL=https://api.devnet.solana.com
SERVER_WALLET_PRIVATE_KEY=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64]
REPLICATE_API_TOKEN=r8_your_token_here
```

### 5. Convertir Private Key a Array

```bash
# Ver el contenido del archivo de wallet
cat server-wallet.json

# Copiar el array de números y pegarlo en SERVER_WALLET_PRIVATE_KEY
```

### 6. Iniciar Servidor

```bash
npm run dev
```

## 🎯 CÓMO FUNCIONA EL DEPLOY REAL

### Proceso Automatizado:

1. **Usuario conecta wallet** → Phantom/Solflare
2. **Usuario crea token** → Nombre, símbolo, descripción, logo AI
3. **Servidor despliega token** → Crea SPL token REAL
4. **Metaplex metadata** → Logo en Arweave/IPFS
5. **Mint inicial** → Todo el supply al usuario
6. **Revoca mint authority** → No más tokens
7. **Usuario ve en dashboard** → Con dirección REAL verificable

### Lo que se crea REALMENTE:

- ✅ **Token SPL real** en Solana
- ✅ **Dirección verificable** en Solscan
- ✅ **Metadata en Arweave** con logo
- ✅ **Supply fijo** (no inflacionario)
- ✅ **Listo para trading** en DEXs

## 🔍 VERIFICACIÓN

Después de desplegar, puedes verificar en:

- **Solscan**: `https://solscan.io/token/[TOKEN_ADDRESS]?cluster=devnet`
- **Solana Explorer**: `https://explorer.solana.com/address/[TOKEN_ADDRESS]?cluster=devnet`
- **Jupiter**: Agregar para trading
- **Raydium**: Crear pool de liquidez

## 💰 COSTOS DE DEPLOYMENT

### Devnet (Testing):
- **GRATIS** - Usa `solana airdrop`

### Mainnet (Producción):
- **~0.015-0.025 SOL** por token (~$0.5-1.0 USD)
- **Breakdown**:
  - Mint account: ~0.00144 SOL
  - Metadata upload: ~0.01-0.02 SOL
  - Transaction fees: ~0.001 SOL

## 🚀 PASAR A MAINNET

### 1. Cambiar RPC:
```env
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### 2. Fondear wallet de servidor:
```bash
# Envía SOL real a la dirección del servidor
solana balance --url mainnet-beta
```

### 3. ¡Listo! Los tokens se despliegan en mainnet real.

## ⚡ FEATURES AVANZADAS (PRÓXIMAS)

- [ ] **Bonding Curve Contract** - Trading automático
- [ ] **Graduation a Raydium** - A los 500 SOL
- [ ] **LP Token Burn** - Liquidez permanente
- [ ] **Anti-bot protection** - Límites por wallet
- [ ] **Fee distribution** - 1% plataforma, 1% creador

## 🔒 SEGURIDAD

- ✅ **Private key segura** - Solo servidor accede
- ✅ **Mint authority revocada** - No inflación
- ✅ **Metadata inmutable** - En Arweave
- ✅ **Audit trail completo** - Todas las transacciones públicas

## 🆘 TROUBLESHOOTING

### Error: "Insufficient funds"
```bash
# Verificar balance
solana balance --url devnet

# Pedir más SOL
solana airdrop 2 --url devnet
```

### Error: "Invalid private key"
- Verificar que el array tenga exactamente 64 números
- Copiar el contenido completo del archivo .json

### Error: "RPC endpoint not responding"
- Cambiar a otro RPC endpoint
- Verificar conexión a internet

## 🎉 ¡CONGRATULATIONS!

¡Ya tienes una plataforma como **Pump.fun** funcionando! Tus usuarios pueden:

- 🚀 **Desplegar tokens SPL reales**
- 📊 **Verificar en Solscan**
- 💹 **Trading en DEXs**
- 🎨 **Logos AI generados**
- 📈 **Dashboard profesional**

¡**DEGENIE está listo para competir con las grandes plataformas!** 🧞‍♂️

---

## 📞 SOPORTE

Si necesitas ayuda:
1. Revisa los logs del servidor
2. Verifica balance del wallet servidor
3. Confirma que las dependencias estén instaladas
4. Testea en devnet primero

**¡A crear tokens como los profesionales!** 🔥