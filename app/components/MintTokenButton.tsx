import { useState } from 'react';
import { Button, Input, VStack, Text, Box } from '@chakra-ui/react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SYSVAR_RENT_PUBKEY, Keypair, Transaction} from '@solana/web3.js';
import { Metaplex } from "@metaplex-foundation/js";
import { 
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction
} from "@solana/spl-token";
import { useMinterProgram } from '@/contexts/MinterProgramContextProvider';
import { BN } from '@coral-xyz/anchor';
 
 
export default function MintTokenButton() {
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();
    const { minterProgram } = useMinterProgram();
 
    //dynamically populated via form
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [uri, setUri] = useState('');
    const [decimals, setDecimals] = useState(0);
    const [amount, setAmount] = useState(0);
 
    const onMint = async () => {
        if (!publicKey || !minterProgram) return;
 
        console.log('Minting token:', name, symbol, uri, decimals, amount);
 
        // Generate a new keypair for the data account for the program
        const dataAccount = Keypair.generate();
        console.log('Data Account Keypair:', '1. SolExplorer: ',`https://explorer.solana.com/address/${dataAccount.publicKey.toBase58()}?cluster=devnet`, '2. SolScan: ', `https://solscan.io/address/${dataAccount.publicKey.toBase58()}?cluster=devnet`);
 
 
        // Generate a new keypair for the mint
        const mintKeypair = Keypair.generate();
        console.log('Mint Account Keypair:', '1. SolExplorer: ',`https://explorer.solana.com/address/${mintKeypair.publicKey.toBase58()}?cluster=devnet`, '2. SolScan: ', `https://solscan.io/address/${mintKeypair.publicKey.toBase58()}?cluster=devnet`);
 
 
        // Metadata for the Token
        const tokenTitle = name;
        const tokenSymbol = symbol;
        const tokenUri = uri;
        console.log ('Metadata for the Token: ', tokenTitle, tokenSymbol, tokenUri);
 
        try {
             
            /*
                Stage 1: Is initialized - Initialize data account for the program, which is required by Solang
            */            
            
            await minterProgram.methods
                .new()
                .accounts({ dataAccount: dataAccount.publicKey })
                .signers([dataAccount])
                .rpc();
            console.log('Data account initialized successfully: ', '1. SolExplorer: ',`https://explorer.solana.com/address/${dataAccount.publicKey.toBase58()}?cluster=devnet`, '2. SolScan: ', `https://solscan.io/address/${dataAccount.publicKey.toBase58()}?cluster=devnet`);
 
 
            /*
                Stage 2: Create an SPL Token
            */ 
 
            // Get the metadata address for the mint
            const metaplex = Metaplex.make(connection);
            const metadataAddress = await metaplex
            .nfts()
            .pdas()
            .metadata({ mint: mintKeypair.publicKey });
            console.log('Metadata address:', metadataAddress.toBase58());
 
 
            // Create the token mint
            const tx = await minterProgram.methods
                .createTokenMint(
                    publicKey, // freezeAuthority
                    decimals, // decimals
                    tokenTitle, // token Name
                    tokenSymbol, // token Symbol
                    tokenUri // token Uri
                ).accounts({
                    payer: publicKey,
                    mint: mintKeypair.publicKey,
                    metadata: metadataAddress,
                    mintAuthority: publicKey,
                    rentAddress: SYSVAR_RENT_PUBKEY,
                    metadataProgramId: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
                    // systemProgram: SystemProgram.programId,
                    // tokenProgram: TOKEN_PROGRAM_ID,
                })
                .signers([mintKeypair])
                .rpc({ skipPreflight: true });
                console.log("Token Mint Created: ", '1. SolExplorer: ',`https://explorer.solana.com/tx/${tx}?cluster=devnet`, '2. SolScan: ', `https://solscan.io/tx/${tx}?cluster=devnet`);
 
             
 
            /*
                Stage 3: Mint some tokens to your wallet
            */
             
            // Check if the wallet's associated token account exists
            const tokenAccountInfo = await connection.getParsedAccountInfo(
                await getAssociatedTokenAddress(mintKeypair.publicKey, publicKey)
            );
            console.log('Token Account Info:', tokenAccountInfo.context.slot, tokenAccountInfo.value);
             
            if (!tokenAccountInfo.value) {
                // If the associated token account does not exist, create it
                const createATAInstruction = createAssociatedTokenAccountInstruction(
                    publicKey, // payer and owner of the new account
                    await getAssociatedTokenAddress(mintKeypair.publicKey, publicKey), // address of the new account
                    publicKey, // owner of the new account
                    mintKeypair.publicKey // mint
                );
 
                // Construct a transaction to create the associated token account
                const createATATransaction = new Transaction().add(createATAInstruction);
                // Ask the user's wallet to sign the transaction
                const createATASignature = await sendTransaction(createATATransaction, connection);
                // Confirm the transaction
                await connection.confirmTransaction(createATASignature, 'confirmed');
                console.log('Associated Token Account created:', '1. SolExplorer: ',`https://explorer.solana.com/tx/${createATASignature}?cluster=devnet`, '2. SolScan: ', `https://solscan.io/tx/${createATASignature}?cluster=devnet`);
            }
 
            // Mint tokens to the wallet's associated token account
            const mintToInstruction = await minterProgram.methods
            .mintTo(
                // Adjusting the amount according to decimals using web3js not anchor rewrite above code
                new BN(amount).mul(new BN(10).pow(new BN(decimals)))
            ).accounts({
                mintAuthority: publicKey,
                tokenAccount: await getAssociatedTokenAddress(mintKeypair.publicKey, publicKey),
                mint: mintKeypair.publicKey,
            }).instruction();
 
            // Construct a transaction to mint the tokens
            const mintTransaction = new Transaction().add(mintToInstruction);
            // Ask the user's wallet to sign the transaction
            const mintSignature = await sendTransaction(mintTransaction, connection);
            // Confirm the transaction
            await connection.confirmTransaction(mintSignature, 'confirmed');
            console.log(`${amount}${tokenSymbol} Tokens Successfully Minted:`,   '1. SolExplorer: ', `https://explorer.solana.com/tx/${mintSignature}?cluster=devnet`, '2. SolScan: ', `https://solscan.io/tx/${mintSignature}?cluster=devnet`);
 
 
 
 
        } catch (error) {
            console.error('Minting failed:', error);
        }
 
         
 
    };
 
    return (
        <VStack>
            <Text fontSize="lg">Mint New SPL Token</Text>
            <Box>
                <Input id="tokenName" name="tokenName" placeholder="Token Name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input id="symbol" name="symbol" placeholder="Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
                <Input id="uri" name="uri" placeholder="URI" value={uri} onChange={(e) => setUri(e.target.value)} />
                <Input id="decimals" name="decimals" placeholder="Decimals" type="number" value={decimals.toString()} onChange={(e) => setDecimals(parseInt(e.target.value))} />
                <Input id="amountToMint" name="amountToMint" placeholder="Amount to Mint" type="number" value={amount.toString()} onChange={(e) => setAmount(parseInt(e.target.value))} />
            </Box>
            <Button colorScheme="blue" onClick={onMint}>Mint Token</Button>
        </VStack>
    );
};