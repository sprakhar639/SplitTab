import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoute from "./features/auth/auth.route.js";
import groupRoute from "./features/groups/group.route.js";
import expenseRoute from "./features/expenses/expense.route.js";
import settlementRoute from "./features/settlements/settlement.route.js";
import userRoute from "./features/users/user.route.js";
import aiRoute from "./ai/ai.route.js";
import convoRoute from "./features/messaging/conversation/conversation.route.js";
import messageRoute from "./features/messaging/messages/message.route.js";

import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header, such as server-to-server requests.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use("/api/auth", authRoute);
app.use("/api/groups", groupRoute);
app.use("/api/expense", expenseRoute);
app.use("/api/settlements", settlementRoute);
app.use("/api/users", userRoute);
app.use("/api/ai", aiRoute);
app.use("/api/conversations", convoRoute);
app.use("/api/messages", messageRoute);

app.use(errorMiddleware);

export default app;
