import {
  createSettlementService,
  getBalanceService,
} from "./settlement.service.js";

async function createSettlement(req, res,next) {
  try {
    const groupId = Number(req.params.groupId);
    const fromUserId = Number(req.user.id);
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
   next(error)
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
  } catch (error) {
   next(error)
  }
}

export { createSettlement, getBalanceController };
