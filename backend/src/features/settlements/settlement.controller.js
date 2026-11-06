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

async function getBalanceController(req, res,next) {
  const { groupId, userId } = req.params;
  try {
    const balance = await getBalanceService({
      groupId: Number(groupId),
      userId: Number(userId),
    });
    return res.status(200).json(balance);
    next()
  } catch (error) {
   next(error)
  }
}

export { createSettlement, getBalanceController };
