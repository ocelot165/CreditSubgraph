import { BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { StakingData } from "../../generated/schema";
import { BIG_INT_ZERO, STAKING_ADDRESS } from "const";
import { CreditStaking } from "../../generated/CreditStaking/CreditStaking";

export function getCreditStakingData(
  event: ethereum.Event,
  entityId: string
): StakingData {
  let stakingData = StakingData.load(entityId);
  if (stakingData === null) {
    stakingData = new StakingData(entityId);
    if (entityId === "global") {
      //we update the current epoch details here
      const contract = CreditStaking.bind(STAKING_ADDRESS);
      stakingData.creditToken = Bytes.fromHexString(
        contract.creditToken().toHexString()
      );
      stakingData.currentCycleStartTime = contract.currentCycleStartTime();
      stakingData.cycleDurationSeconds = contract.cycleDurationSeconds();
      stakingData.distributedTokens = [];
      stakingData.totalAllocation = BIG_INT_ZERO;
      stakingData.unstakingPenalties = [
        contract.unstakingPenalties(BigInt.fromI32(0)),
        contract.unstakingPenalties(BigInt.fromI32(1)),
        contract.unstakingPenalties(BigInt.fromI32(2)),
        contract.unstakingPenalties(BigInt.fromI32(3)),
      ];
      stakingData.cycleStartBlocks = [event.block.timestamp];
      stakingData.lastDividendsUpdatedCycleStartBlock = event.block.number;
      stakingData.epochNumber = BIG_INT_ZERO;
    } else {
      //we snapshot a previous epoch here
      const oldStakingData = StakingData.load("global") as StakingData;
      stakingData.creditToken = oldStakingData.creditToken;
      stakingData.currentCycleStartTime = oldStakingData.currentCycleStartTime;
      stakingData.cycleDurationSeconds = oldStakingData.cycleDurationSeconds;
      stakingData.distributedTokens = oldStakingData.distributedTokens;
      stakingData.totalAllocation = oldStakingData.totalAllocation;
      stakingData.unstakingPenalties = oldStakingData.unstakingPenalties;
      stakingData.cycleStartBlocks = oldStakingData.cycleStartBlocks;
      stakingData.lastDividendsUpdatedCycleStartBlock =
        oldStakingData.lastDividendsUpdatedCycleStartBlock;
      const currentStakingEpoch = oldStakingData.epochNumber;
      stakingData.epochNumber = currentStakingEpoch;
      oldStakingData.epochNumber = currentStakingEpoch.plus(BigInt.fromI32(1));
      oldStakingData.save();
    }
    stakingData.save();
  }
  return stakingData;
}
