import { addExpense, splitExpense } from "./expense.service.js";

async function addExpenseInGroup(req, res) {
  try {
    const { groupId } = req.params;
    const { amount, description } = req.body;
    const expense = await addExpense({
      groupId: Number(groupId),
      amount,
      paidBy: req.user.id,
      description,
    });
    return res
      .status(201)
      .json({ message: "Expense Added Successfully", expense });
  } catch (error) {
    console.error("Create Expense Error", error);
    return res.status(405).json({ message: "Failed to add expense" });
  }
}

async function splitExpenseController(req, res) {
  try {
    const { groupId, expenseId } = req.params;
    const { splits } = req.body;

    const result = await splitExpense({
      expenseId: Number(expenseId),
      groupId: Number(groupId),
      splits,
    });
    return res.status(201).json({
      message: "Expense split successfully",
      splits: result,
    });
  } catch (error) {
    console.error("Split Expense Error:", error);

    return res.status(404).json({
      message: error.message,
    });
  }
}

export { addExpenseInGroup, splitExpenseController };
