export {};

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}
