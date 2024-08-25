import { log } from "@graphprotocol/graph-ts";

import { CreatePair } from "../../generated/LendingFactory/LendingFactory";
import { LendingPair as LendingPairTemplate } from "../../generated/templates";
import { getLendingFactory } from "../entities/LendingFactory";

import { BIG_INT_ONE } from "const";
import { getLendingPair } from "../entities/LendingPair";

export function onLendingPairCreated(event: CreatePair): void {
  log.info("lending pair created:\n asset: {}\ncollateral: {}\npair: {}", [
    event.params.asset.toHexString(),
    event.params.collateral.toHexString(),
    event.params.pair.toHexString(),
  ]);

  const factory = getLendingFactory();
  const pair = getLendingPair(event.params.pair, event.block);
  // Now it's safe to save
  pair.save();

  // create the tracked contract based on the template
  LendingPairTemplate.create(event.params.pair);

  // Update pair count once we've sucessesfully created a pair
  factory.pairCount = factory.pairCount.plus(BIG_INT_ONE);
  factory.save();
}
