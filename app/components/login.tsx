"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./auth.module.scss";
import { IconButton } from "./button";
import { Path } from "../constant";
import Locale from "../locales";
import BotIcon from "../icons/bot.svg";
import { Input, PasswordInput, showToast } from "./ui-lib";
import clsx from "clsx";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, register: authRegister } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  // 登录处理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(loginForm.email, loginForm.password);
      
      showToast("登录成功！");
      
      // 获取用户信息并跳转
      const userInfo = localStorage.getItem("user-info");
      if (userInfo) {
        const user = JSON.parse(userInfo);
        if (user.role === "ADMIN") {
          navigate(Path.Admin);
        } else {
          navigate(Path.Home);
        }
      } else {
        navigate(Path.Home);
      }
    } catch (error: any) {
      showToast(error.message || "登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 注册处理
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerForm.password !== registerForm.confirmPassword) {
      showToast("两次密码输入不一致");
      return;
    }

    setLoading(true);

    try {
      await authRegister(
        registerForm.email,
        registerForm.username,
        registerForm.password,
      );

      showToast("注册成功！");
      navigate(Path.Home);
    } catch (error: any) {
      showToast(error.message || "注册失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles["auth-page"]}>
      <div className={clsx("no-dark", styles["auth-logo"])}>
        <BotIcon />
      </div>

      <div className={styles["auth-title"]}>
        {isLogin ? "登录" : "注册"} NextChat
      </div>

      {isLogin ? (
        <form onSubmit={handleLogin} style={{ width: "100%", maxWidth: "400px" }}>
          <Input
            type="email"
            placeholder="邮箱"
            value={loginForm.email}
            onChange={(e) => setLoginForm({ ...loginForm, email: e.currentTarget.value })}
            style={{ marginBottom: "1rem" }}
            required
          />
          
          <PasswordInput
            placeholder="密码"
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.currentTarget.value })}
            style={{ marginBottom: "1.5rem" }}
            required
          />

          <IconButton
            text={loading ? "登录中..." : "登录"}
            type="primary"
            onClick={handleLogin}
            disabled={loading}
            style={{ width: "100%", marginBottom: "1rem" }}
          />

          <div style={{ textAlign: "center", color: "var(--gray)" }}>
            还没有账号？
            <span
              style={{ color: "var(--primary)", cursor: "pointer", marginLeft: "0.5rem" }}
              onClick={() => setIsLogin(false)}
            >
              立即注册
            </span>
          </div>
        </form>
      ) : (
        <form onSubmit={handleRegister} style={{ width: "100%", maxWidth: "400px" }}>
          <Input
            type="email"
            placeholder="邮箱"
            value={registerForm.email}
            onChange={(e) => setRegisterForm({ ...registerForm, email: e.currentTarget.value })}
            style={{ marginBottom: "1rem" }}
            required
          />

          <Input
            type="text"
            placeholder="用户名"
            value={registerForm.username}
            onChange={(e) => setRegisterForm({ ...registerForm, username: e.currentTarget.value })}
            style={{ marginBottom: "1rem" }}
            required
          />
          
          <PasswordInput
            placeholder="密码（至少6位）"
            value={registerForm.password}
            onChange={(e) => setRegisterForm({ ...registerForm, password: e.currentTarget.value })}
            style={{ marginBottom: "1rem" }}
            required
          />

          <PasswordInput
            placeholder="确认密码"
            value={registerForm.confirmPassword}
            onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.currentTarget.value })}
            style={{ marginBottom: "1.5rem" }}
            required
          />

          <IconButton
            text={loading ? "注册中..." : "注册"}
            type="primary"
            onClick={handleRegister}
            disabled={loading}
            style={{ width: "100%", marginBottom: "1rem" }}
          />

          <div style={{ textAlign: "center", color: "var(--gray)" }}>
            已有账号？
            <span
              style={{ color: "var(--primary)", cursor: "pointer", marginLeft: "0.5rem" }}
              onClick={() => setIsLogin(true)}
            >
              立即登录
            </span>
          </div>
        </form>
      )}
    </div>
  );
}

