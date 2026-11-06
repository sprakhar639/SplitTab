import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoute from "./features/auth/auth.route.js";
import groupRoute from "./features/groups/group.route.js";
import expenseRoute from "./features/expenses/expense.route.js";
import settlementRoute from "./features/settlements/settlement.route.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use("/api/auth", authRoute);
app.use("/api/groups", groupRoute);
app.use("/api/expense", expenseRoute);
app.use("/api/settlements", settlementRoute);
app.use(errorMiddleware);

export default app;
