"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Path } from "../constant";
import { Loading } from "./home";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // 未登录，跳转到登录页
        navigate(Path.Login);
      } else if (requireAdmin && user?.role !== "ADMIN") {
        // 需要管理员权限但不是管理员
        navigate(Path.Home);
      }
    }
  }, [isAuthenticated, isLoading, user, requireAdmin, navigate]);

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireAdmin && user?.role !== "ADMIN") {
    return null;
  }

  return <>{children}</>;
}

