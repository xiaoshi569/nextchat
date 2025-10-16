"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./settings.module.scss";
import { IconButton } from "./button";
import { Path } from "../constant";
import Locale from "../locales";
import { List, ListItem, Modal, showToast, Input, PasswordInput, Select } from "./ui-lib";
import CloseIcon from "../icons/close.svg";
import DeleteIcon from "../icons/clear.svg";
import AddIcon from "../icons/add.svg";
import EyeIcon from "../icons/eye.svg";
import { apiClient } from "../utils/api-client";
import { useAuth } from "../contexts/AuthContext";

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    sessions: number;
  };
}

interface ApiKey {
  id: string;
  provider: string;
  name: string;
  apiKey: string;
  baseUrl?: string;
  isActive: boolean;
  priority: number;
  usageCount: number;
  createdAt: string;
}

export function AdminPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"users" | "apikeys">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);

  const [newKeyForm, setNewKeyForm] = useState({
    provider: "openai",
    name: "",
    apiKey: "",
    baseUrl: "",
    priority: 0,
  });

  // 获取认证header
  const getAuthHeader = () => {
    const token = localStorage.getItem("auth-token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // 加载用户列表
  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users", {
        headers: getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error("获取用户列表失败");
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (error: any) {
      showToast(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 加载API密钥列表
  const loadApiKeys = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/apikeys", {
        headers: getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error("获取API密钥失败");
      }

      const data = await response.json();
      setApiKeys(data.apiKeys);
    } catch (error: any) {
      showToast(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 切换用户状态
  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: getAuthHeader(),
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) {
        throw new Error("更新用户状态失败");
      }

      showToast("用户状态已更新");
      loadUsers();
    } catch (error: any) {
      showToast(error.message);
    }
  };

  // 删除用户
  const deleteUser = async (userId: string) => {
    if (!confirm("确定要删除这个用户吗？此操作不可恢复！")) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error("删除用户失败");
      }

      showToast("用户已删除");
      loadUsers();
    } catch (error: any) {
      showToast(error.message);
    }
  };

  // 添加API密钥
  const addApiKey = async () => {
    try {
      const response = await fetch("/api/admin/apikeys", {
        method: "POST",
        headers: getAuthHeader(),
        body: JSON.stringify(newKeyForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "添加API密钥失败");
      }

      showToast("API密钥已添加");
      setShowAddKeyModal(false);
      setNewKeyForm({
        provider: "openai",
        name: "",
        apiKey: "",
        baseUrl: "",
        priority: 0,
      });
      loadApiKeys();
    } catch (error: any) {
      showToast(error.message);
    }
  };

  // 删除API密钥
  const deleteApiKey = async (keyId: string) => {
    if (!confirm("确定要删除这个API密钥吗？")) return;

    try {
      const response = await fetch(`/api/admin/apikeys/${keyId}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error("删除API密钥失败");
      }

      showToast("API密钥已删除");
      loadApiKeys();
    } catch (error: any) {
      showToast(error.message);
    }
  };

  // 切换API密钥状态
  const toggleApiKeyStatus = async (keyId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/apikeys/${keyId}`, {
        method: "PATCH",
        headers: getAuthHeader(),
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) {
        throw new Error("更新API密钥状态失败");
      }

      showToast("API密钥状态已更新");
      loadApiKeys();
    } catch (error: any) {
      showToast(error.message);
    }
  };

  useEffect(() => {
    // 检查是否为管理员
    const userInfo = localStorage.getItem("user-info");
    if (!userInfo) {
      navigate(Path.Login);
      return;
    }

    const user = JSON.parse(userInfo);
    if (user.role !== "ADMIN") {
      showToast("权限不足");
      navigate(Path.Home);
      return;
    }

    loadUsers();
    loadApiKeys();
  }, []);

  return (
    <div className={styles["settings"]}>
      <div className={styles["settings-header"]}>
        <IconButton
          icon={<CloseIcon />}
          onClick={() => navigate(Path.Home)}
          bordered
        />
        <div>管理后台</div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <IconButton
          text="用户管理"
          type={activeTab === "users" ? "primary" : undefined}
          onClick={() => setActiveTab("users")}
        />
        <IconButton
          text="API密钥管理"
          type={activeTab === "apikeys" ? "primary" : undefined}
          onClick={() => setActiveTab("apikeys")}
        />
      </div>

      {activeTab === "users" ? (
        <div>
          <h3>用户列表 ({users.length})</h3>
          <List>
            {users.map((user) => (
              <ListItem key={user.id} title={user.username}>
                <div style={{ fontSize: "12px", color: "var(--gray)" }}>
                  <div>邮箱: {user.email}</div>
                  <div>角色: {user.role === "ADMIN" ? "管理员" : "普通用户"}</div>
                  <div>会话数: {user._count?.sessions || 0}</div>
                  <div>状态: {user.isActive ? "✅ 启用" : "❌ 禁用"}</div>
                  <div>注册时间: {new Date(user.createdAt).toLocaleString()}</div>
                </div>
                <div style={{ display: "flex", gap: "5px", marginTop: "10px" }}>
                  <IconButton
                    text={user.isActive ? "禁用" : "启用"}
                    onClick={() => toggleUserStatus(user.id, user.isActive)}
                  />
                  <IconButton
                    icon={<DeleteIcon />}
                    text="删除"
                    onClick={() => deleteUser(user.id)}
                  />
                </div>
              </ListItem>
            ))}
          </List>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>API密钥列表 ({apiKeys.length})</h3>
            <IconButton
              icon={<AddIcon />}
              text="添加密钥"
              onClick={() => setShowAddKeyModal(true)}
            />
          </div>
          
          <List>
            {apiKeys.map((key) => (
              <ListItem key={key.id} title={key.name}>
                <div style={{ fontSize: "12px", color: "var(--gray)" }}>
                  <div>提供商: {key.provider}</div>
                  <div>密钥: {key.apiKey}</div>
                  {key.baseUrl && <div>Base URL: {key.baseUrl}</div>}
                  <div>优先级: {key.priority}</div>
                  <div>使用次数: {key.usageCount}</div>
                  <div>状态: {key.isActive ? "✅ 启用" : "❌ 禁用"}</div>
                </div>
                <div style={{ display: "flex", gap: "5px", marginTop: "10px" }}>
                  <IconButton
                    text={key.isActive ? "禁用" : "启用"}
                    onClick={() => toggleApiKeyStatus(key.id, key.isActive)}
                  />
                  <IconButton
                    icon={<DeleteIcon />}
                    text="删除"
                    onClick={() => deleteApiKey(key.id)}
                  />
                </div>
              </ListItem>
            ))}
          </List>
        </div>
      )}

      {showAddKeyModal && (
        <div className="modal-mask">
          <Modal
            title="添加API密钥"
            onClose={() => setShowAddKeyModal(false)}
            actions={[
              <IconButton key="cancel" text="取消" onClick={() => setShowAddKeyModal(false)} />,
              <IconButton key="ok" text="添加" type="primary" onClick={addApiKey} />,
            ]}
          >
            <List>
              <ListItem title="提供商">
                <Select
                  value={newKeyForm.provider}
                  onChange={(e) => setNewKeyForm({ ...newKeyForm, provider: e.currentTarget.value })}
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google</option>
                  <option value="deepseek">DeepSeek</option>
                </Select>
              </ListItem>
              
              <ListItem title="名称">
                <Input
                  value={newKeyForm.name}
                  placeholder="密钥备注名称"
                  onChange={(e) => setNewKeyForm({ ...newKeyForm, name: e.currentTarget.value })}
                />
              </ListItem>

              <ListItem title="API密钥">
                <PasswordInput
                  value={newKeyForm.apiKey}
                  placeholder="sk-..."
                  onChange={(e) => setNewKeyForm({ ...newKeyForm, apiKey: e.currentTarget.value })}
                />
              </ListItem>

              <ListItem title="Base URL（可选）">
                <Input
                  value={newKeyForm.baseUrl}
                  placeholder="https://api.openai.com"
                  onChange={(e) => setNewKeyForm({ ...newKeyForm, baseUrl: e.currentTarget.value })}
                />
              </ListItem>

              <ListItem title="优先级">
                <Input
                  type="number"
                  value={newKeyForm.priority.toString()}
                  onChange={(e) => setNewKeyForm({ ...newKeyForm, priority: parseInt(e.currentTarget.value) || 0 })}
                />
              </ListItem>
            </List>
          </Modal>
        </div>
      )}
    </div>
  );
}

