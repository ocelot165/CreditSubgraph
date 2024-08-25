import { log } from "@graphprotocol/graph-ts";

import {
  Borrow,
  Burn,
  Lend,
  Mint,
  Pay,
  Sync,
  Withdraw,
} from "../../generated/LendingFactory/LendingPair";
import { Transfer as CollateralizedDebtTransfer } from "../../generated/templates/CollateralizedDebt/CollateralizedDebt";
import {
  createCollateralizedDebtToken,
  getLendingPair,
  getLendingPairPool,
  updateCollateralizedDebtToken,
  updateConstantProduct,
  updatePoolReserves,
} from "../entities";

export function onSync(event: Sync): void {
  log.info(
    "lending pair sync:\n pair: {}\n maturity: {}\n x: {}\n y: {}\n z: {}\n",
    [
      event.address.toHexString(),
      event.params.maturity.toString(),
      event.params.x.toString(),
      event.params.y.toString(),
      event.params.z.toString(),
    ]
  );

  // create pair/pool before updating constant product (sync is fired before the mint event so the pool needs to be created beforehand)
  getLendingPair(event.address, event.block);
  getLendingPairPool(event.address, event.params.maturity, event.block);
  updateConstantProduct(
    event.address,
    event.params.maturity,
    event.params.x,
    event.params.y,
    event.params.z
  );
  updatePoolReserves(event.address, event.params.maturity);
}

export function onBorrow(event: Borrow): void {
  log.info(
    "onBorrow >> \n pair: {} \n maturity: {} \n sender: {} \n assetTo: {} \n dueTo: {} \n assetOut: {} \n id: {} \n debt: {} \n collateral: {} \n startBlock: {} \n feeIn: {}, protocolFeeIn: {}",
    [
      event.address.toHexString(),
      event.params.maturity.toString(),
      event.params.sender.toHexString(),
      event.params.assetTo.toHexString(),
      event.params.dueTo.toHexString(),
      event.params.assetOut.toString(),
      event.params.id.toString(),
      event.params.dueOut.debt.toString(),
      event.params.dueOut.collateral.toString(),
      event.params.dueOut.startBlock.toString(),
      event.params.feeIn.toString(),
      event.params.protocolFeeIn.toString(),
    ]
  );
  getLendingPair(event.address, event.block);
  const pool = getLendingPairPool(
    event.address,
    event.params.maturity,
    event.block
  );
  if (pool === null) return;
  createCollateralizedDebtToken(pool, event.params.id);
}

export function onBurn(event: Burn): void {
  log.info("onBurn >> \n pair: {}\nmaturity: {}", [
    event.address.toHexString(),
    event.params.maturity.toString(),
  ]);
  getLendingPair(event.address, event.block);
  getLendingPairPool(event.address, event.params.maturity, event.block);
  updatePoolReserves(event.address, event.params.maturity);
}

export function onLend(event: Lend): void {
  log.info(
    "onLend >> \n pair: {} \n maturity: {} \n sender: {} \n bondTo: {} \n insuranceTo: {} \n assetIn: {} \n bondPrincipal: {} \n bondInterest: {} \n insurancePrincipal: {} \n insuranceInterest: {} \n feeIn: {}, protocolFeeIn: {}",
    [
      event.address.toHexString(),
      event.params.maturity.toString(),
      event.params.sender.toHexString(),
      event.params.bondTo.toHexString(),
      event.params.insuranceTo.toHexString(),
      event.params.assetIn.toString(),
      event.params.claimsOut.bondPrincipal.toString(),
      event.params.claimsOut.bondInterest.toString(),
      event.params.claimsOut.insurancePrincipal.toString(),
      event.params.claimsOut.insuranceInterest.toString(),
      event.params.feeIn.toString(),
      event.params.protocolFeeIn.toString(),
    ]
  );
}
export function onPay(event: Pay): void {
  log.info("onPay >> pair: {}\n maturity: {}\n", [
    event.address.toHexString(),
    event.params.maturity.toString(),
  ]);
  updatePoolReserves(event.address, event.params.maturity);
}

export function onMint(event: Mint): void {
  log.info(
    "onMint >> \n pair: {} \n maturity: {} \n sender: {} \n liquidityTo: {} \n dueTo: {} \n assetIn: {} \n liquidityOut: {} \n id: {} \n debt: {} \n collateral: {} \n startBlock: {} \n feeIn: {}",
    [
      event.address.toHexString(),
      event.params.maturity.toString(),
      event.params.sender.toHexString(),
      event.params.liquidityTo.toHexString(),
      event.params.dueTo.toHexString(),
      event.params.liquidityOut.toHexString(),
      event.params.assetIn.toString(),
      event.params.id.toString(),
      event.params.dueOut.debt.toString(),
      event.params.dueOut.collateral.toString(),
      event.params.dueOut.startBlock.toString(),
      event.params.feeIn.toString(),
    ]
  );
  getLendingPair(event.address, event.block);
  getLendingPairPool(event.address, event.params.maturity, event.block);
}

export function onWithdraw(event: Withdraw): void {
  log.info("onWithdraw >> pair: {}\n maturity: {}\n", [
    event.address.toHexString(),
    event.params.maturity.toString(),
  ]);
  updatePoolReserves(event.address, event.params.maturity);
}

export function handleCollateralizedDebtTokenTransfer(
  event: CollateralizedDebtTransfer
): void {
  log.info("CollateralizedDebtTransfer >> from: {}\n to: {}\n tokenId: {}\n", [
    event.params.from.toHexString(),
    event.params.to.toHexString(),
    event.params.tokenId.toString(),
  ]);
  updateCollateralizedDebtToken(event);
}
