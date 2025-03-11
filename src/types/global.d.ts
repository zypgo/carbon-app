interface Window {
  ethereum: any;
}

interface ImportMeta {
  env: {
    VITE_CONTRACT_ADDRESS?: string;
    VITE_CHAIN_ID?: string;
    [key: string]: string | undefined;
  };
} 