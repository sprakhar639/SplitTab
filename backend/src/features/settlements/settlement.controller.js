import {
  createSettlementService,
  getGroupBalanceByUserId,
  getGroupSettlements,
  deleteSettlementById,
} from "./settlement.service.js";
import AppError from "../../utils/AppError.js";

async function createSettlement(req, res, next) {
  try {
    const groupId = Number(req.params.groupId);
    const fromUserId = Number(req.user.id);
    const { toUserId, amount } = req.body;

    const amountInRupees = Number(amount);

    if (!Number.isFinite(amountInRupees) || amountInRupees <= 0) {
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

async function getBalanceController(req, res, next) {
  try {
    const groupId = Number(req.params.groupId);
    const userId = req.user.id;

    const balance = await getGroupBalanceByUserId({
      groupId,
      userId,
    });

    return res.status(200).json(balance);
  } catch (error) {
    next(error);
  }
}

async function getGroupSettlementsController(req, res, next) {
  try {
    const groupId = Number(req.params.groupId);

    const settlements = await getGroupSettlements({ groupId });

    return res.status(200).json(settlements);
  } catch (error) {
    next(error);
  }
}

async function deleteSettlementByIdController(req, res, next) {
  try {
    const userId = Number(req.user.id);
    const settlementId = Number(req.params.settlementId);
    const result = await deleteSettlementById({ userId, settlementId });
    return res.status(200).json({ message: "Settlement deleted Successfully" });
  } catch (error) {
    next(error);
  }
}

export {
  createSettlement,
  getBalanceController,
  getGroupSettlementsController,
  deleteSettlementByIdController,
};
