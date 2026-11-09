import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
}) => {
  const { user, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-red-200 text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
            <span className="font-bold text-lg">!</span>
          </div>
          <h3 className="font-bold text-base text-slate-900">Access Denied</h3>
          <p className="text-xs text-slate-500 mt-1">
            Your role (<strong className="text-slate-800">{user.role}</strong>) does not have the required capability permission:
            <code className="block mt-1 p-1 bg-slate-100 text-red-600 rounded text-[11px] font-mono">
              {requiredPermission}
            </code>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

