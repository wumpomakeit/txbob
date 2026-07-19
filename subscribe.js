/**
 * Subscribe to TxLINE Free Tier on Devnet
 *
 * Flow:
 * 1. Load wallet from ./wallet-devnet.json
 * 2. Connect to Solana Devnet
 * 3. Get guest JWT from TxLINE API
 * 4. Subscribe on-chain (service level 1, 4 weeks)
 * 5. Activate API token via off-chain API
 * 6. Print txSig, jwt, and apiToken
 */

const anchor = require("@coral-xyz/anchor");
const {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
} = require("@solana/spl-token");
const fs = require("fs");
const axios = require("axios");
const nacl = require("tweetnacl");
const { PublicKey } = require("@solana/web3.js");

// ============================================================
// CONFIGURATION
// ============================================================

const PROGRAM_ID = new PublicKey(
  "6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J"
);
const API_BASE_URL = "https://txline-dev.txodds.com/api";
const JWT_URL = "https://txline-dev.txodds.com/auth/guest/start";
const TOKEN_MINT = new PublicKey(
  "4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG"
);
const DEVNET_RPC = "https://api.devnet.solana.com";

// Subscription parameters
const SERVICE_LEVEL_ID = 1; // Free tier (World Cup 2026)
const WEEKS = 4; // Must be multiple of 4
const SELECTED_LEAGUES = []; // Empty for free tier / standard matrix

// ============================================================
// HELPERS
// ============================================================

function loadWallet(filePath) {
  const secretKeyString = fs.readFileSync(filePath, "utf8");
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  return anchor.web3.Keypair.fromSecretKey(secretKey);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   TxLINE Devnet Free Tier Subscription      ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  // ----------------------------------------------------------
  // Step 1: Load wallet
  // ----------------------------------------------------------
  console.log("[1/6] Loading wallet from ./wallet-devnet.json...");
  const user = loadWallet("./wallet-devnet.json");
  console.log("  Public Key:", user.publicKey.toBase58());

  // ----------------------------------------------------------
  // Step 2: Set up Anchor connection & provider
  // ----------------------------------------------------------
  console.log("\n[2/6] Connecting to Solana Devnet...");
  const connection = new anchor.web3.Connection(DEVNET_RPC, "confirmed");

  const wallet = {
    publicKey: user.publicKey,
    signTransaction: async (tx) => {
      tx.sign(user);
      return tx;
    },
    signAllTransactions: async (txs) => {
      txs.forEach((tx) => tx.sign(user));
      return txs;
    },
  };

  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const idl = await anchor.Program.fetchIdl(PROGRAM_ID, { connection });
  if (!idl) throw new Error("Failed to fetch program IDL from chain");
  const program = new anchor.Program(idl, provider);

  console.log("  Program ID:", PROGRAM_ID.toBase58());
  console.log("  Token Mint:", TOKEN_MINT.toBase58());

  // ----------------------------------------------------------
  // Step 3: Get guest JWT
  // ----------------------------------------------------------
  console.log("\n[3/6] Acquiring guest JWT...");
  const jwtResponse = await axios.post(JWT_URL);
  const jwt = jwtResponse.data.token;
  console.log("  JWT acquired (first 60 chars):", jwt.substring(0, 60) + "...");

  // ----------------------------------------------------------
  // Step 4: Derive PDAs and check accounts
  // ----------------------------------------------------------
  console.log("\n[4/6] Deriving PDAs...");

  const [pricingMatrixPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pricing_matrix")],
    PROGRAM_ID
  );

  const [tokenTreasuryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("token_treasury_v2")],
    PROGRAM_ID
  );

  const userTokenAccountAddress = getAssociatedTokenAddressSync(
    TOKEN_MINT,
    user.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  const tokenTreasuryVault = getAssociatedTokenAddressSync(
    TOKEN_MINT,
    tokenTreasuryPda,
    true,
    TOKEN_2022_PROGRAM_ID
  );

  console.log("  Pricing Matrix:", pricingMatrixPda.toBase58());
  console.log("  Treasury PDA:", tokenTreasuryPda.toBase58());
  console.log("  Treasury Vault:", tokenTreasuryVault.toBase58());
  console.log("  User Token Account:", userTokenAccountAddress.toBase58());

  // Display pricing matrix
  console.log("\n  --- Pricing Matrix ---");
  try {
    const matrix = await program.account.pricingMatrix.fetch(pricingMatrixPda);
    console.log(
      "  Lvl | Tokens/wk | Samp(s) | League | Market"
    );
    console.log(
      "  ----|-----------|---------|--------|-------"
    );
    matrix.rows.forEach((row) => {
      console.log(
        `  ${String(row.rowId).padStart(3)} | ${String(
          row.pricePerWeekToken
        ).padStart(9)} | ${String(row.samplingIntervalSec).padStart(7)} | ${String(
          row.leagueBundleId
        ).padStart(6)} | ${String(row.marketBundleId).padStart(5)}`
      );
    });
    console.log(
      `\n  → Using service level ${SERVICE_LEVEL_ID} (FREE tier, 0 tokens/week)`
    );
  } catch (err) {
    console.log("  Could not fetch pricing matrix:", err.message);
  }

  // ----------------------------------------------------------
  // Step 5: Create user token account if needed
  // ----------------------------------------------------------
  console.log("\n[5/6] Checking user Token-2022 account...");
  const accountInfo = await connection.getAccountInfo(userTokenAccountAddress);

  if (!accountInfo) {
    console.log("  Account not found. Creating...");
    const createTx = new anchor.web3.Transaction().add(
      createAssociatedTokenAccountInstruction(
        user.publicKey,
        userTokenAccountAddress,
        user.publicKey,
        TOKEN_MINT,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );

    const bh = await connection.getLatestBlockhash("confirmed");
    createTx.recentBlockhash = bh.blockhash;
    createTx.feePayer = user.publicKey;
    createTx.sign(user);

    const sig = await connection.sendRawTransaction(createTx.serialize());
    await connection.confirmTransaction(
      { signature: sig, blockhash: bh.blockhash, lastValidBlockHeight: bh.lastValidBlockHeight },
      "confirmed"
    );
    console.log("  Token account created:", sig);
    await delay(3000);

    let attempts = 0;
    while (attempts < 5) {
      try {
        await getAccount(connection, userTokenAccountAddress, "confirmed", TOKEN_2022_PROGRAM_ID);
        break;
      } catch (err) {
        attempts++;
        console.log(`  RPC syncing... retry ${attempts}/5`);
        await delay(2000);
      }
    }
  } else {
    console.log("  Token account already exists.");
  }

  // ----------------------------------------------------------
  // Step 6: Subscribe on-chain
  // ----------------------------------------------------------
  console.log("\n[6/6] Subscribing on-chain (Level " + SERVICE_LEVEL_ID + ", " + WEEKS + " weeks)...");

  const tx = await program.methods
    .subscribe(SERVICE_LEVEL_ID, WEEKS)
    .accounts({
      user: user.publicKey,
      pricingMatrix: pricingMatrixPda,
      tokenMint: TOKEN_MINT,
      userTokenAccount: userTokenAccountAddress,
      tokenTreasuryVault: tokenTreasuryVault,
      tokenTreasuryPda: tokenTreasuryPda,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .transaction();

  const bh = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = bh.blockhash;
  tx.feePayer = user.publicKey;
  tx.sign(user);

  const txSig = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction(
    { signature: txSig, blockhash: bh.blockhash, lastValidBlockHeight: bh.lastValidBlockHeight },
    "confirmed"
  );
  console.log("  ✅ Transaction confirmed!");

  // ----------------------------------------------------------
  // Step 7: Activate API token
  // ----------------------------------------------------------
  console.log("\n[7/7] Activating API token...");

  // Build message: txSig:leagues_csv:jwt
  const messageString = `${txSig}:${SELECTED_LEAGUES.join(",")}:${jwt}`;
  const messageBytes = new TextEncoder().encode(messageString);
  const signatureBytes = nacl.sign.detached(messageBytes, user.secretKey);
  const signatureBase64 = Buffer.from(signatureBytes).toString("base64");

  const activationResponse = await axios.post(
    `${API_BASE_URL}/token/activate`,
    {
      txSig: txSig,
      walletSignature: signatureBase64,
      leagues: SELECTED_LEAGUES,
    },
    { headers: { Authorization: `Bearer ${jwt}` } }
  );

  const apiToken = activationResponse.data.token || activationResponse.data;
  console.log("  ✅ API token activated!");

  // ----------------------------------------------------------
  // FINAL OUTPUT
  // ----------------------------------------------------------
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║              SUBSCRIPTION RESULT             ║");
  console.log("╠══════════════════════════════════════════════╣");
  console.log("║ txSig:");
  console.log(`║   ${txSig}`);
  console.log("║");
  console.log("║ jwt:");
  console.log(`║   ${jwt}`);
  console.log("║");
  console.log("║ apiToken:");
  console.log(`║   ${apiToken}`);
  console.log("╚══════════════════════════════════════════════╝");

  return { txSig, jwt, apiToken };
}

// ============================================================
// RUN
// ============================================================

main()
  .then((result) => {
    console.log("\n✅ All done! Use these credentials to access TxLINE data.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Error:", err.message);
    if (err.response && err.response.data) {
      console.error("  API response:", JSON.stringify(err.response.data));
    }
    if (err.logs) {
      console.error("  Program logs:", err.logs);
    }
    process.exit(1);
  });