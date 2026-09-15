import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type VerificationResult = { minimumIncome: bigint;
                                   requireNoDefault: boolean;
                                   incomeSatisfied: boolean;
                                   defaultRequirementSatisfied: boolean;
                                   eligible: boolean;
                                   lenderRef: string
                                 };

export type HolderPublicKey = Uint8Array;

export type AdminPublicKey = Uint8Array;

export type Schnorr_SchnorrSignature = { announcement: __compactRuntime.JubjubPoint;
                                         response: bigint
                                       };

export type Witnesses<PS> = {
  getSchnorrReduction(context: __compactRuntime.WitnessContext<Ledger, PS>,
                      challengeHash_0: bigint): [PS, [bigint, bigint]];
  getCredentialWitness(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, [bigint,
                                                                                    bigint,
                                                                                    Schnorr_SchnorrSignature,
                                                                                    bigint]];
  getUserSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  requestVerification(context: __compactRuntime.CircuitContext<PS>,
                      minimumIncome_0: bigint,
                      requireNoDefault_0: boolean,
                      lenderRef_0: string): __compactRuntime.CircuitResults<PS, []>;
  registerIssuer(context: __compactRuntime.CircuitContext<PS>,
                 issuerId_0: bigint,
                 issuerPk_0: __compactRuntime.JubjubPoint): __compactRuntime.CircuitResults<PS, []>;
  removeIssuer(context: __compactRuntime.CircuitContext<PS>, issuerId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  requestVerification(context: __compactRuntime.CircuitContext<PS>,
                      minimumIncome_0: bigint,
                      requireNoDefault_0: boolean,
                      lenderRef_0: string): __compactRuntime.CircuitResults<PS, []>;
  registerIssuer(context: __compactRuntime.CircuitContext<PS>,
                 issuerId_0: bigint,
                 issuerPk_0: __compactRuntime.JubjubPoint): __compactRuntime.CircuitResults<PS, []>;
  removeIssuer(context: __compactRuntime.CircuitContext<PS>, issuerId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  deriveHolderPublicKey(sk_0: Uint8Array): HolderPublicKey;
  deriveAdminPublicKey(sk_0: Uint8Array): AdminPublicKey;
  holderHash(pk_0: Uint8Array): bigint;
}

export type Circuits<PS> = {
  deriveHolderPublicKey(context: __compactRuntime.CircuitContext<PS>,
                        sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, HolderPublicKey>;
  deriveAdminPublicKey(context: __compactRuntime.CircuitContext<PS>,
                       sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, AdminPublicKey>;
  holderHash(context: __compactRuntime.CircuitContext<PS>, pk_0: Uint8Array): __compactRuntime.CircuitResults<PS, bigint>;
  requestVerification(context: __compactRuntime.CircuitContext<PS>,
                      minimumIncome_0: bigint,
                      requireNoDefault_0: boolean,
                      lenderRef_0: string): __compactRuntime.CircuitResults<PS, []>;
  registerIssuer(context: __compactRuntime.CircuitContext<PS>,
                 issuerId_0: bigint,
                 issuerPk_0: __compactRuntime.JubjubPoint): __compactRuntime.CircuitResults<PS, []>;
  removeIssuer(context: __compactRuntime.CircuitContext<PS>, issuerId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly contractAdmin: AdminPublicKey;
  issuers: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): __compactRuntime.JubjubPoint;
    [Symbol.iterator](): Iterator<[bigint, __compactRuntime.JubjubPoint]>
  };
  verificationResults: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): {
      isEmpty(): boolean;
      size(): bigint;
      member(key_1: bigint): boolean;
      lookup(key_1: bigint): VerificationResult;
      [Symbol.iterator](): Iterator<[bigint, VerificationResult]>
    }
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
