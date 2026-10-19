import {
  createSettlementService,
  getBalanceService,
} from "./settlement.service.js";

async function createSettlement(req, res) {
  try {
    const groupId = Number(req.params.groupId);
    const fromUserId = req.user.id;
    const { toUserId, amount } = req.body;

 
    const settlement = await createSettlementService({
      groupId,
      fromUserId,
      toUserId: Number(toUserId),
      amount: Number(amount),
    });

    return res.status(201).json({
      message: "Settlement created Successfully",
      settlement,
    });
  } catch (error) {
    console.error("Settlement Error:", error);

    return res.status(500).json({
      message: "Failed to create settlement",
    });
  }
}

async function getBalanceController(req, res) {
  const { groupId, userId } = req.params;
  try {
    const balance = await getBalanceService({
      groupId: Number(groupId),
      userId: Number(userId),
    });
    return res.status(200).json(balance);
  } catch (error) {
    console.error("Balance Error", error);
    return res.status(500).json({
      message: "Failed to get Balance",
    });
  }
}

export { createSettlement, getBalanceController };
