// ---------------------------------------------------------------------------
// CrediFiWalletProvider — a single adapter that fills BOTH the WalletProvider
// and MidnightProvider slots of a MidnightProviders object, backed by the
// Wallet SDK's WalletFacade. Mirrors the official Midnight deploy guide.
// ---------------------------------------------------------------------------
import {
  type CoinPublicKey,
  type EncPublicKey,
  type FinalizedTransaction,
  ZswapSecretKeys,
  DustSecretKey,
} from "@midnight-ntwrk/midnight-js-protocol/ledger";
import {
  type WalletProvider,
  type MidnightProvider,
  type UnboundTransaction,
} from "@midnight-ntwrk/midnight-js-types";
import { ttlOneHour } from "@midnight-ntwrk/midnight-js-utils";
import { type WalletFacade } from "@midnight-ntwrk/wallet-sdk";

export class CrediFiWalletProvider implements WalletProvider, MidnightProvider {
  constructor(
    private readonly wallet: WalletFacade,
    private readonly zswapSecretKeys: ZswapSecretKeys,
    private readonly dustSecretKey: DustSecretKey,
  ) {}

  getCoinPublicKey(): CoinPublicKey {
    return this.zswapSecretKeys.coinPublicKey;
  }

  getEncryptionPublicKey(): EncPublicKey {
    return this.zswapSecretKeys.encryptionPublicKey;
  }

  async balanceTx(tx: UnboundTransaction, ttl: Date = ttlOneHour()): Promise<FinalizedTransaction> {
    const recipe = await this.wallet.balanceUnboundTransaction(
      tx,
      { shieldedSecretKeys: this.zswapSecretKeys, dustSecretKey: this.dustSecretKey },
      { ttl },
    );
    return await this.wallet.finalizeRecipe(recipe);
  }

  submitTx(tx: FinalizedTransaction): Promise<string> {
    return this.wallet.submitTransaction(tx);
  }
}
