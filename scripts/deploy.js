import algosdk from 'algosdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = 443;
const ALGOD_TOKEN = '';

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

async function fundAccountIfEmpty(addrStr) {
  try {
    const info = await algodClient.accountInformation(addrStr).do();
    const bal = Number(info.amount) / 1e6;
    console.log(`Current Balance for ${addrStr}: ${bal} ALGO`);
    if (info.amount < 1000000) {
      console.log("Account balance low, requesting TestNet Dispenser funding...");
      const res = await fetch(`https://dispenser.testnet.aws.algodev.network/fund/${addrStr}`);
      console.log("Dispenser response status:", res.status);
    }
  } catch (e) {
    console.warn("Could not check account balance:", e.message);
  }
}

async function deployContract() {
  const mnemonic = process.env.DEPLOYER_MNEMONIC;
  if (!mnemonic || mnemonic.trim().length === 0) {
    console.error("❌ Error: DEPLOYER_MNEMONIC is not configured in local .env file.");
    console.error("Please add DEPLOYER_MNEMONIC='your 25 word seed phrase' to .env");
    process.exit(1);
  }

  try {
    const deployerAccount = algosdk.mnemonicToSecretKey(mnemonic.trim());
    const deployerAddr = deployerAccount.addr.toString();

    console.log("--------------------------------------------------");
    console.log("Deploying AlgoPy DiffRegistry Smart Contract to Algorand TestNet...");
    console.log("Deployer Address:", deployerAddr);

    await fundAccountIfEmpty(deployerAddr);

    // Read compiled TEAL files
    const approvalPath = path.join(__dirname, '../contracts/diff_registry/DiffRegistry.approval.teal');
    const clearPath = path.join(__dirname, '../contracts/diff_registry/DiffRegistry.clear.teal');

    const approvalTeal = fs.readFileSync(approvalPath, 'utf8');
    const clearTeal = fs.readFileSync(clearPath, 'utf8');

    // Compile TEAL via Algod API
    const approvalCompiled = await algodClient.compile(approvalTeal).do();
    const clearCompiled = await algodClient.compile(clearTeal).do();

    const approvalBytes = new Uint8Array(Buffer.from(approvalCompiled.result, 'base64'));
    const clearBytes = new Uint8Array(Buffer.from(clearCompiled.result, 'base64'));

    const params = await algodClient.getTransactionParams().do();

    // Create Application Txn
    const txn = algosdk.makeApplicationCreateTxnFromObject({
      sender: deployerAddr,
      suggestedParams: params,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      approvalProgram: approvalBytes,
      clearProgram: clearBytes,
      numLocalInts: 0,
      numLocalByteSlices: 0,
      numGlobalInts: 1,
      numGlobalByteSlices: 1,
      extraPages: 1
    });

    const signedTxn = txn.signTxn(deployerAccount.sk);
    const sendRes = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = sendRes.txId || sendRes.txid || sendRes.txID || (typeof sendRes === 'string' ? sendRes : undefined);
    console.log("\nApplication Create Tx Broadcasted to TestNet! TxID:", txId);

    console.log("Waiting for Algorand TestNet block confirmation...");
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 5);
    const appId = Number(confirmedTxn['application-index'] || confirmedTxn.applicationIndex || 0);

    console.log(`\n==================================================`);
    console.log(`✅ REAL ALGORAND TESTNET APPLICATION ID: ${appId}`);
    console.log(`Transaction ID: ${txId}`);
    console.log(`Confirmed Round: #${confirmedTxn['confirmed-round']}`);
    console.log(`==================================================\n`);

    // Fund App Address with 0.5 ALGO for Box Storage Minimum Balance Requirement (MBR)
    const appAddress = algosdk.getApplicationAddress(appId).toString();
    console.log(`Funding App Address (${appAddress}) with 0.5 ALGO for Box MBR...`);

    const fundTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: deployerAddr,
      receiver: appAddress,
      amount: 500000, // 0.5 ALGO
      suggestedParams: await algodClient.getTransactionParams().do()
    });

    const signedFundTxn = fundTxn.signTxn(deployerAccount.sk);
    const fundRes = await algodClient.sendRawTransaction(signedFundTxn).do();
    await algosdk.waitForConfirmation(algodClient, fundRes.txId, 4);
    console.log(`✅ App Account Funded! Fund TxID: ${fundRes.txId}`);

    // Update .env with new VITE_ALGORAND_APP_ID
    const envPath = path.join(__dirname, '../.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    if (envContent.includes('VITE_ALGORAND_APP_ID=')) {
      envContent = envContent.replace(/VITE_ALGORAND_APP_ID=.*/, `VITE_ALGORAND_APP_ID=${appId}`);
    } else {
      envContent += `\nVITE_ALGORAND_APP_ID=${appId}\n`;
    }
    fs.writeFileSync(envPath, envContent);
    console.log(`Updated .env with VITE_ALGORAND_APP_ID=${appId}`);

    return { appId, txId, appAddress };
  } catch (error) {
    console.error("Deployment error:", error);
    process.exit(1);
  }
}

deployContract();
