import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CampusesPage } from "./pages/CampusesPage";
import { DepartmentsPage } from "./pages/DepartmentsPage";
import { MembersPage } from "./pages/MembersPage";
import { ExcelImportPage } from "./pages/ExcelImportPage";
import { AllocationEnginePage } from "./pages/AllocationEnginePage";
import { AllocationExceptionsPage } from "./pages/AllocationExceptionsPage";
import { DepartmentRostersPage } from "./pages/DepartmentRostersPage";
import { EvaluatorTasksPage } from "./pages/EvaluatorTasksPage";
import { ReportsPage } from "./pages/ReportsPage";
import { AuditLogPage } from "./pages/AuditLogPage";
import { ProfilePage } from "./pages/ProfilePage";

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/campuses"
            element={
              <ProtectedRoute requiredPermission="campus.view">
                <AppLayout>
                  <CampusesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/departments"
            element={
              <ProtectedRoute requiredPermission="department.manage">
                <AppLayout>
                  <DepartmentsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/members"
            element={
              <ProtectedRoute requiredPermission="member.view_all">
                <AppLayout>
                  <MembersPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/import"
            element={
              <ProtectedRoute requiredPermission="member.import_excel">
                <AppLayout>
                  <ExcelImportPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/allocation"
            element={
              <ProtectedRoute requiredPermission="allocation.review">
                <AppLayout>
                  <AllocationEnginePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/exceptions"
            element={
              <ProtectedRoute requiredPermission="allocation.review">
                <AppLayout>
                  <AllocationExceptionsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/eligibility"
            element={
              <ProtectedRoute requiredPermission="allocation.review">
                <AppLayout>
                  <AllocationExceptionsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/capacity"
            element={
              <ProtectedRoute requiredPermission="department.view">
                <AppLayout>
                  <DepartmentRostersPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/approval"
            element={
              <ProtectedRoute requiredPermission="allocation.review">
                <AppLayout>
                  <AllocationExceptionsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reassignment"
            element={
              <ProtectedRoute requiredPermission="allocation.review">
                <AppLayout>
                  <AllocationEnginePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rosters"
            element={
              <ProtectedRoute requiredPermission="department.view">
                <AppLayout>
                  <DepartmentRostersPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/evaluations"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <EvaluatorTasksPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute requiredPermission="reports.view">
                <AppLayout>
                  <ReportsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute requiredPermission="audit.view">
                <AppLayout>
                  <AuditLogPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
