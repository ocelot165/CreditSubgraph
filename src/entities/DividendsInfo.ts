import { Bytes, log } from "@graphprotocol/graph-ts";
import { StakingData } from "../../generated/schema";
import { StakingDividendsInfo } from "../../generated/schema";
import { BIG_INT_ZERO } from "const";

export function getDividendsInfo(
  token: Bytes,
  creditStakingData: StakingData
): StakingDividendsInfo {
  const id = token.toHexString().concat("-").concat(creditStakingData.id);
  let dividendsInfo = StakingDividendsInfo.load(id);
  if (dividendsInfo === null) {
    dividendsInfo = new StakingDividendsInfo(id);
    if (id.includes("-global")) {
      //we update the current epoch details here
      dividendsInfo.currentDistributionAmount = BIG_INT_ZERO;
      dividendsInfo.currentCycleDistributedAmount = BIG_INT_ZERO;
      dividendsInfo.pendingAmount = BIG_INT_ZERO;
      dividendsInfo.distributedAmount = BIG_INT_ZERO;
      dividendsInfo.accDividendsPerShare = BIG_INT_ZERO;
      dividendsInfo.lastUpdateTime = BIG_INT_ZERO;
      dividendsInfo.lastUpdatedCycle = creditStakingData.currentCycleStartTime;
      dividendsInfo.distributionDisabled = false;
      dividendsInfo.token = token;
      dividendsInfo.creditStaking = creditStakingData.id;
    } else {
      //we snapshot a previous epoch here
      const oldDividendsInfo = StakingDividendsInfo.load(
        token.toHexString().concat("-").concat("global")
      ) as StakingDividendsInfo;
      dividendsInfo.currentDistributionAmount =
        oldDividendsInfo.currentDistributionAmount;
      dividendsInfo.currentCycleDistributedAmount =
        oldDividendsInfo.currentCycleDistributedAmount;
      dividendsInfo.pendingAmount = oldDividendsInfo.pendingAmount;
      dividendsInfo.distributedAmount = oldDividendsInfo.distributedAmount;
      dividendsInfo.accDividendsPerShare =
        oldDividendsInfo.accDividendsPerShare;
      dividendsInfo.lastUpdateTime = oldDividendsInfo.lastUpdateTime;
      dividendsInfo.distributionDisabled =
        oldDividendsInfo.distributionDisabled;
      dividendsInfo.token = oldDividendsInfo.token;
      dividendsInfo.creditStaking = creditStakingData.id;
      dividendsInfo.lastUpdatedCycle = oldDividendsInfo.lastUpdatedCycle;
    }
    dividendsInfo.save();
  }
  return dividendsInfo;
}
