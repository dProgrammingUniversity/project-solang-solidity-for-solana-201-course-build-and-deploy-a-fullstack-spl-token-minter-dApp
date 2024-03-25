import { Box, Flex, Spacer, VStack } from "@chakra-ui/react";
import WalletMultiButton from "@/components/WalletMultiButton";
import MintTokenButton from "@/components/MintTokenButton";
 
export default function Home() {
  return (
    <Box>
      <Flex px={4} py={4}>
        <Spacer />
        <WalletMultiButton />
      </Flex>
      <VStack justifyContent="center">
        <MintTokenButton />
      </VStack>
    </Box>
  );
}