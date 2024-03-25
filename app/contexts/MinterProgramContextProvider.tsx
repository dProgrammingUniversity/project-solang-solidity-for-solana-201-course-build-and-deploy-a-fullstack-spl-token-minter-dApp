import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, setProvider } from "@coral-xyz/anchor";
import { SplTokenMinter, IDL as MinterIDL } from "../idl/spl_token_minter";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
 
// Define the type for the context
type MinterProgramContextType = {
    minterProgram: Program<SplTokenMinter> | null;
}
 
// Create the context with a default null value
const MinterProgramContext = createContext<MinterProgramContextType>({
    minterProgram: null,
});
 
// Custom hook to use the MinterProgram context
export const useMinterProgram = () => useContext(MinterProgramContext);
 
// Provider component to wrap around components to access the `minterProgram` instance
export const MinterProgramProvider = ({
    children,
  }: {
    children: React.ReactNode
  }) => {
    // Use the wallet and connection from the Solana wallet adapter
    const wallet = useAnchorWallet();
    const { connection } = useConnection();
 
    // State variable to hold the minter program instance
    const [minterProgram, setMinterProgram] = useState<Program<SplTokenMinter> | null>(null);
 
    // Setup function for the minter program
    const anchorSetupMinterProgram = useCallback(async () => {
        // If there's no wallet or connection, return early
        if (!wallet || !connection) return;
 
        // Set up AnchorProvider using the connected wallet
        const provider = new AnchorProvider(connection, wallet, {});
        setProvider(provider);
 
        // Program Id from MinterIDL
        const programId = MinterIDL.metadata.address as unknown as PublicKey;
 
        // Create the minter program instance using the MinterIDL, program ID, and provider
        const minterProgram = new Program<SplTokenMinter>(MinterIDL, programId, provider);
 
        // Set the minter program instance in state
        setMinterProgram(minterProgram);
    }, [connection, wallet]);
 
    // Run the setup function when the wallet or connection changes
    useEffect(() => {
        anchorSetupMinterProgram();
    }, [anchorSetupMinterProgram]);
 
    // Provide the minter program instance to child components
    return (
        <MinterProgramContext.Provider value={{ minterProgram }}>
            {children}
        </MinterProgramContext.Provider>
    );
};