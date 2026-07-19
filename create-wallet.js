const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');
const fs = require('fs');

// Ganti dengan private key lo (format Base58)
const privateKeyBase58 = 'yEJ9HfxxxUCSfmLjNhN84iQpqznMRhRpn1GtYTBvceW7TS71V9KzwasbrzJ7n2DT1SoQcNJisuHtZ4G73bHaET2';

try {
    const secretKey = bs58.default.decode(privateKeyBase58);
    const keypair = Keypair.fromSecretKey(secretKey);
    
    fs.writeFileSync('wallet-devnet.json', JSON.stringify(Array.from(keypair.secretKey)));
    console.log('✅ wallet-devnet.json berhasil dibuat!');
    console.log('📌 Public Key:', keypair.publicKey.toBase58());
    console.log('📁 File: wallet-devnet.json');
} catch (error) {
    console.error('❌ Error:', error.message);
}
