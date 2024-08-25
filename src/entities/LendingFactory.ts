import { Address } from "@graphprotocol/graph-ts";
import { BIG_INT_ZERO, LENDING_FACTORY_ADDRESS } from "const";
import { LendingFactory } from "../../generated/schema";

export function getLendingFactory(
  id: Address = LENDING_FACTORY_ADDRESS
): LendingFactory {
  let factory = LendingFactory.load(id.toHexString());

  if (factory === null) {
    factory = new LendingFactory(id.toHexString());
    factory.pairCount = BIG_INT_ZERO;
    factory.save();
  }

  return factory as LendingFactory;
}
