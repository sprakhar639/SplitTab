import {
  createSettlementService,
  getBalanceService,
} from "./settlement.service.js";
import AppError from "../../utils/AppError.js";

async function createSettlement(req, res, next) {
  try {
    const groupId = Number(req.params.groupId);
    const fromUserId = Number(req.user.id);
    const { toUserId, amount } = req.body;

    const amountInRupees = Number(amount);

    if (
      !Number.isFinite(amountInRupees) ||
      amountInRupees <= 0
    ) {
      throw new AppError("Invalid settlement amount", 400);
    }

    const amountInPaise = Math.round(amountInRupees * 100);

    const settlement = await createSettlementService({
      groupId,
      fromUserId,
      toUserId: Number(toUserId),
      amount: amountInPaise,
    });

    return res.status(201).json({
      message: "Settlement created successfully",
      settlement,
    });
  } catch (error) {
    next(error);
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
