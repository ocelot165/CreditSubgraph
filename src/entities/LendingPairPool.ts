import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  ADDRESS_ZERO,
  BIG_INT_ONE,
  BIG_INT_ZERO,
  CONVENIENCE_ADDRESS,
} from "const";

import {
  CollateralizedDebtToken,
  LendingPair,
  LendingPairPool,
} from "../../generated/schema";
import { CollateralizedDebt as CollateralizedDebtTemplate } from "../../generated/templates";
import {
  CollateralizedDebt,
  Transfer as CollateralizedDebtTransfer,
} from "../../generated/templates/CollateralizedDebt/CollateralizedDebt";
import { Convenience as ConvenienceContract } from "../../generated/templates/LendingPair/Convenience";
import { LendingPair as LendingPairContract } from "../../generated/templates/LendingPair/LendingPair";
import { getOrCreateUser } from "../utils/helpers";

export function getLendingPairPool(
  pairAddress: Address,
  maturity: BigInt,
  block: ethereum.Block
): LendingPairPool | null {
  const poolId = pairAddress
    .toHexString()
    .concat("-")
    .concat(maturity.toString());
  let lendingPairPool = LendingPairPool.load(poolId);

  if (lendingPairPool === null) {
    const lendingPair = LendingPair.load(pairAddress.toHexString());
    const convenienceContract = ConvenienceContract.bind(CONVENIENCE_ADDRESS);
    if (!lendingPair) {
      return null;
    }
    lendingPair.poolCount = lendingPair.poolCount.plus(BIG_INT_ONE);

    lendingPairPool = new LendingPairPool(poolId);
    lendingPairPool.pair = pairAddress.toHexString();
    lendingPairPool.maturity = maturity;

    const natives = convenienceContract.getNative(
      Address.fromString(lendingPair.asset),
      Address.fromString(lendingPair.collateral),
      maturity
    );
    lendingPairPool.liquidityAddress = natives.liquidity;
    lendingPairPool.bondInterestAddress = natives.bondInterest;
    lendingPairPool.bondPrincipalAddress = natives.bondPrincipal;
    lendingPairPool.insuranceInterestAddress = natives.insuranceInterest;
    lendingPairPool.insurancePrincipalAddress = natives.insurancePrincipal;
    lendingPairPool.collateralizedDebtAddress = natives.collateralizedDebt;

    lendingPairPool.timestamp = block.timestamp;
    lendingPairPool.block = block.number;

    lendingPairPool.X = BIG_INT_ZERO;
    lendingPairPool.Y = BIG_INT_ZERO;
    lendingPairPool.Z = BIG_INT_ZERO;
    lendingPairPool.assetReserve = BIG_INT_ZERO;
    lendingPairPool.collateralReserve = BIG_INT_ZERO;

    lendingPairPool.farm = null;

    lendingPair.save();
    lendingPairPool.save();

    // create collateralizedDebt template to track transfers
    CollateralizedDebtTemplate.create(natives.collateralizedDebt);
  }

  return lendingPairPool as LendingPairPool;
}

export function createCollateralizedDebtToken(
  pool: LendingPairPool,
  tokenId: BigInt
): void {
  const collateralizedDebtContract = CollateralizedDebt.bind(
    Address.fromString(pool.collateralizedDebtAddress.toHexString())
  );
  const owner = collateralizedDebtContract.ownerOf(tokenId);
  const user = getOrCreateUser(owner);
  const borrowPosition = new CollateralizedDebtToken(
    pool.collateralizedDebtAddress
      .toHexString()
      .concat("-")
      .concat(tokenId.toString())
  );
  borrowPosition.user = user.id;
  borrowPosition.pool = pool.id;
  borrowPosition.collateralizedDebtAddress = pool.collateralizedDebtAddress;
  borrowPosition.tokenId = tokenId;
  borrowPosition.save();
}

export function updateCollateralizedDebtToken(
  event: CollateralizedDebtTransfer
): void {
  // ignore token mints, token gets created in the borrow handler
  if (event.params.from == ADDRESS_ZERO) return;
  const id = event.address
    .toHexString()
    .concat("-")
    .concat(event.params.tokenId.toString());
  const collateralizedDebtToken = CollateralizedDebtToken.load(id);
  if (collateralizedDebtToken === null) {
    // ignore liquidity cdt transfer, only borrow CDTs are persisted
    return;
  }
  const user = getOrCreateUser(event.params.to);
  collateralizedDebtToken.user = user.id;
  collateralizedDebtToken.save();
}

export function updateConstantProduct(
  pairAddress: Address,
  maturity: BigInt,
  X: BigInt,
  Y: BigInt,
  Z: BigInt
): void {
  const poolId = pairAddress
    .toHexString()
    .concat("-")
    .concat(maturity.toString());
  const pool = LendingPairPool.load(poolId);
  if (pool === null) return;
  pool.X = X;
  pool.Y = Y;
  pool.Z = Z;
  pool.save();
}

export function updatePoolReserves(
  pairAddress: Address,
  maturity: BigInt
): void {
  const pairContract = LendingPairContract.bind(pairAddress);
  const poolId = pairAddress
    .toHexString()
    .concat("-")
    .concat(maturity.toString());
  const pool = LendingPairPool.load(poolId);
  if (pool === null) return;

  const reserves = pairContract.totalReserves(maturity);
  pool.assetReserve = reserves.asset;
  pool.collateralReserve = reserves.collateral;
  pool.save();
}
