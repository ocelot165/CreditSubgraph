import { Address, ethereum } from "@graphprotocol/graph-ts";
import { BIG_INT_ZERO, LENDING_FACTORY_ADDRESS } from "const";
import { LendingPair } from "../../generated/schema";
import { LendingPair as LendingPairContract } from "../../generated/templates/LendingPair/LendingPair";
import { getToken } from "./Token";

export function getLendingPair(
  address: Address,
  block: ethereum.Block
): LendingPair {
  let pair = LendingPair.load(address.toHexString());
  if (pair === null) {
    const pairContract = LendingPairContract.bind(address);
    // asset token
    const assetTokenAddress = pairContract.asset();
    const assetToken = getToken(assetTokenAddress);
    assetToken.save();
    // collateral token
    const collateralTokenAddress = pairContract.collateral();
    const collateralToken = getToken(collateralTokenAddress);
    collateralToken.save();
    pair = new LendingPair(address.toHexString());
    pair.factory = LENDING_FACTORY_ADDRESS.toHexString();
    pair.name = assetToken.symbol.concat("-").concat(collateralToken.symbol);
    pair.asset = assetToken.id;
    pair.collateral = collateralToken.id;
    pair.poolCount = BIG_INT_ZERO;
    pair.timestamp = block.timestamp;
    pair.block = block.number;
    // pair fees
    pair.fee = pairContract.fee();
    pair.protocolFee = pairContract.protocolFee();
    pair.save();
  }
  return pair as LendingPair;
}
