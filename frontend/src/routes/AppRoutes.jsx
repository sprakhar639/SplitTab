import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import FeatureGate from "../shared/components/FeatureGate";
import AppLayout from "../layouts/AppLayout";
import AuthLayout from "../layouts/AuthLayout";

import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import ForgotPassword from "../features/auth/pages/ForgotPassword";

import Dashboard from "../features/dashboard/pages/Dashboard";
import Groups from "../features/groups/pages/Groups";
import GroupDetails from "../features/groups/pages/GroupDetails";
import Expenses from "../features/expenses/pages/Expenses";
import AddExpense from "../features/expenses/pages/AddExpense";
import ExpenseDetails from "../features/expenses/pages/ExpenseDetails";
import Balances from "../features/balances/pages/Balances";
import Settlements from "../features/settlements/pages/Settlements";
import SettlementsOverview from "../features/settlements/pages/SettlementsOverview";
import Assistant from "../features/assistant/pages/Assistant";
import Reminders from "../features/reminders/pages/Reminders";
import Integrations from "../features/integrations/pages/Integrations";
import Profile from "../features/profile/pages/Profile";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/groups" element={<Groups />} />

          <Route
            path="/expenses"
            element={
              <FeatureGate feature="expenseHistory" variant="page">
                <Expenses />
              </FeatureGate>
            }
          />

          <Route
            path="/settlements"
            element={
              <FeatureGate feature="peopleBalances" variant="page">
                <SettlementsOverview />
              </FeatureGate>
            }
          />

          <Route
            path="/munshi-ai"
            element={
              <FeatureGate feature="assistant" variant="page">
                <Assistant />
              </FeatureGate>
            }
          />

          <Route
            path="/assistant"
            element={<Navigate to="/munshi-ai" replace />}
          />

          <Route
            path="/reminders"
            element={
              <FeatureGate feature="reminders" variant="page">
                <Reminders />
              </FeatureGate>
            }
          />

          <Route
            path="/integrations"
            element={
              <FeatureGate feature="integrations" variant="page">
                <Integrations />
              </FeatureGate>
            }
          />

          <Route path="/profile" element={<Profile />} />
          <Route path="/groups/:groupId" element={<GroupDetails />} />
          <Route
            path="/groups/:groupId/members"
            element={<GroupDetails tab="members" />}
          />
          <Route
            path="/groups/:groupId/expenses/new"
            element={<AddExpense />}
          />

          <Route
            path="/groups/:groupId/expenses/:expenseId"
            element={
              <FeatureGate feature="expenseHistory" variant="page">
                <ExpenseDetails />
              </FeatureGate>
            }
          />

          <Route path="/groups/:groupId/balances" element={<Balances />} />
          <Route path="/groups/:groupId/settle" element={<Settlements />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
