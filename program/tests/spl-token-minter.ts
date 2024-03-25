
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SplTokenMinter } from "../target/types/spl_token_minter";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { Metaplex } from "@metaplex-foundation/js";
import { assert } from "chai";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
  getAccount
} from "@solana/spl-token";
import { WalletConfigError } from "@solana/wallet-adapter-base";

describe("spl-token-minter", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Generate a new keypair for the data account for the program
  const dataAccount = anchor.web3.Keypair.generate();

  // Generate a mint keypair
  const mintKeypair = anchor.web3.Keypair.generate();
  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;

  const program = anchor.workspace.SplTokenMinter as Program<SplTokenMinter>;

  // Metadata for the Token
  const tokenTitle = "TULYNE TOKEN";
  const tokenSymbol = "TULY";
  const tokenUri =
    "https://raw.githubusercontent.com/dProgrammingUniversity/solidity-spl-fungible-token/main/spl-token.json";

  let tokenAccount;
  let recipientTokenAmount;


  it("Is initialized!", async () => {
    // Initialize data account for the program, which is required by Solang
    const tx = await program.methods
      .new()
      .accounts({ dataAccount: dataAccount.publicKey })
      .signers([dataAccount])
      .rpc();
    console.log("Your transaction signature", tx);
  });

  it("Create an SPL Token!", async () => {

  	// Get the metadata address for the mint
    const metaplex = Metaplex.make(connection);
    const metadataAddress = await metaplex
      .nfts()
      .pdas()
      .metadata({ mint: mintKeypair.publicKey });

    // Create the token mint
    const tx = await program.methods
      .createTokenMint(
        wallet.publicKey, // freeze authority
        9, // decimals
        tokenTitle, // token name
        tokenSymbol, // token symbol
        tokenUri // token uri
      )
      .accounts({
        payer: wallet.publicKey,
        mint: mintKeypair.publicKey,
        metadata: metadataAddress,
        mintAuthority: wallet.publicKey,
        rentAddress: SYSVAR_RENT_PUBKEY,
        metadataProgramId: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
      })
      .signers([mintKeypair])
      .rpc({ skipPreflight: true });
    console.log("Your transaction signature", tx);
  });


  it("Mint some tokens to your wallet!", async () => {
    // Wallet's associated token account address for mint
    //console.log("wallet",wallet)
      tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer, // payer
      mintKeypair.publicKey, // mint
      wallet.publicKey // owner
    );

    //console.log("associated token account:", tokenAccount)

    const tx = await program.methods
      .mintTo(
        new anchor.BN(2125000000000) // amount to mint with zeros same as the number of token decimals
      )
      .accounts({
        mintAuthority: wallet.publicKey,
        tokenAccount: tokenAccount.address,
        mint: mintKeypair.publicKey,
      })
      .rpc({ skipPreflight: true });
    console.log("Your transaction signature", tx);

    // console.log("Your transaction signature", tx);
     /*recepienttokenAmount = (await getAccount(connection, tokenAccount.address)).amount;
   console.log("recipienttokenAmount", recepienttokenAmount);
    let tokens = Number(recepienttokenAmount);
    console.log("Tokens", tokens)*/
  });



async function getRecipientTokenAmount() {
  // Assuming getAccount and recipientTokenAccount are defined elsewhere
  const recipientTokenAccount = await getAccount(connection, recipientTokenAmount.address);
  const amount = recipientTokenAccount.amount;
  return amount;
}



  it("Transfer some tokens to another wallet!", async () => {

    const recipient = anchor.web3.Keypair.generate();
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer, // payer
      mintKeypair.publicKey, // mint account
      recipient.publicKey // owner account
    );

    const tx = await program.methods
      .transferTokens(
        new anchor.BN(1062.500000000)
      )
      .accounts({
        from: tokenAccount.address,
        to: recipientTokenAccount.address,
        owner: wallet.publicKey,
      })
      .rpc();
    console.log("Your transaction signature", tx);
    const recipientTokenAmount = (await getAccount(connection, recipientTokenAccount.address)).amount;
    //console.log("RecipientTokenAmount", recepienttokenAmount);
    let tokens = Number(recipientTokenAmount);
    //console.log("Recipient token:", tokens);


    /*const lolaToken = (await getAccount(connection, tokenAccount.address)).amount;
    console.log("lolaToken", lolaToken);
    let tokenzz = Number(lolaToken);
    console.log("Tokens", tokenzz)*/
  });

})
