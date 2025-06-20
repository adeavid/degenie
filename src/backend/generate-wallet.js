#!/usr/bin/env node

// 🚀 DEGENIE - Generador de wallet para deploy real
const { Keypair } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

console.log('🧞‍♂️ DEGENIE - Generando wallet para deploy real...\n');

try {
  // Generar nuevo keypair
  const keypair = Keypair.generate();
  
  // Obtener la private key como array
  const privateKeyArray = Array.from(keypair.secretKey);
  
  // Obtener la dirección pública
  const publicKey = keypair.publicKey.toBase58();
  
  console.log('✅ Wallet generada exitosamente!');
  console.log(`📋 Dirección pública: ${publicKey}`);
  console.log(`🔑 Private key array: [${privateKeyArray.join(',')}]\n`);
  
  // Guardar en archivo para backup
  const walletData = {
    publicKey: publicKey,
    privateKey: privateKeyArray,
    created: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'server-wallet.json'), 
    JSON.stringify(walletData, null, 2)
  );
  
  console.log('💾 Wallet guardada en: server-wallet.json');
  
  // Actualizar .env automáticamente
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Actualizar SERVER_WALLET_PRIVATE_KEY
    const privateKeyString = `[${privateKeyArray.join(',')}]`;
    
    if (envContent.includes('SERVER_WALLET_PRIVATE_KEY=')) {
      envContent = envContent.replace(
        /SERVER_WALLET_PRIVATE_KEY=.*/,
        `SERVER_WALLET_PRIVATE_KEY=${privateKeyString}`
      );
    } else {
      envContent += `\nSERVER_WALLET_PRIVATE_KEY=${privateKeyString}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('⚙️ Archivo .env actualizado automáticamente');
  }
  
  console.log('\n🎯 PRÓXIMOS PASOS:');
  console.log('1. 💰 Fondear wallet con SOL:');
  console.log(`   solana airdrop 5 ${publicKey} --url devnet`);
  console.log('2. 🚀 Iniciar servidor:');
  console.log('   npm run dev:complete');
  console.log('3. 🎨 Crear tu primer token en el frontend!');
  
  console.log('\n🔗 LINKS ÚTILES:');
  console.log(`• Solscan: https://solscan.io/account/${publicKey}?cluster=devnet`);
  console.log(`• Explorer: https://explorer.solana.com/address/${publicKey}?cluster=devnet`);
  
  console.log('\n🔥 ¡DEGENIE está listo para crear tokens REALES! 🧞‍♂️');
  
} catch (error) {
  console.error('❌ Error generando wallet:', error);
  process.exit(1);
}