// 聊天数据同步模块 - 在本地存储和后端API之间同步

import { apiClient } from "../utils/api-client";
import type { ChatSession, ChatMessage } from "./chat";

export interface ServerSession {
  id: string;
  topic: string;
  memoryPrompt: string;
  lastUpdate: string;
  maskConfig: string;
  messages: ServerMessage[];
}

export interface ServerMessage {
  id: string;
  role: string;
  content: string;
  date: string;
}

export class ChatSyncService {
  private isAuthenticated(): boolean {
    return !!localStorage.getItem("auth-token");
  }

  // 从服务器加载所有会话
  async loadSessionsFromServer(): Promise<ChatSession[]> {
    if (!this.isAuthenticated()) {
      console.log("[ChatSync] Not authenticated, skip loading from server");
      return [];
    }

    try {
      const response = await apiClient.get<{
        success: boolean;
        sessions: ServerSession[];
      }>("/api/chat/sessions");

      if (!response.success) {
        throw new Error("Failed to load sessions");
      }

      // 转换服务器数据格式到本地格式
      return response.sessions.map(this.serverSessionToLocal);
    } catch (error) {
      console.error("[ChatSync] Failed to load sessions:", error);
      return [];
    }
  }

  // 保存会话到服务器
  async saveSessionToServer(session: ChatSession): Promise<void> {
    if (!this.isAuthenticated()) {
      return;
    }

    try {
      const serverSession = this.localSessionToServer(session);
      
      // 检查会话是否已存在
      const existingSessions = await apiClient.get<{
        success: boolean;
        sessions: ServerSession[];
      }>("/api/chat/sessions");

      const exists = existingSessions.sessions.some((s) => s.id === session.id);

      if (exists) {
        // 更新现有会话
        await apiClient.patch(`/api/chat/sessions/${session.id}`, {
          topic: serverSession.topic,
          memoryPrompt: serverSession.memoryPrompt,
          maskConfig: serverSession.maskConfig,
        });
      } else {
        // 创建新会话
        await apiClient.post("/api/chat/sessions", serverSession);
      }
    } catch (error) {
      console.error("[ChatSync] Failed to save session:", error);
    }
  }

  // 删除服务器上的会话
  async deleteSessionFromServer(sessionId: string): Promise<void> {
    if (!this.isAuthenticated()) {
      return;
    }

    try {
      await apiClient.delete(`/api/chat/sessions/${sessionId}`);
    } catch (error) {
      console.error("[ChatSync] Failed to delete session:", error);
    }
  }

  // 保存消息到服务器
  async saveMessageToServer(
    sessionId: string,
    message: ChatMessage,
  ): Promise<void> {
    if (!this.isAuthenticated()) {
      return;
    }

    try {
      await apiClient.post("/api/chat/messages", {
        sessionId,
        role: message.role,
        content: message.content,
        date: message.date,
      });
    } catch (error) {
      console.error("[ChatSync] Failed to save message:", error);
    }
  }

  // 批量同步所有会话
  async syncAll(sessions: ChatSession[]): Promise<void> {
    if (!this.isAuthenticated()) {
      return;
    }

    console.log("[ChatSync] Syncing all sessions...");
    
    for (const session of sessions) {
      await this.saveSessionToServer(session);
    }
    
    console.log("[ChatSync] Sync completed");
  }

  // 转换：服务器格式 -> 本地格式
  private serverSessionToLocal(serverSession: ServerSession): ChatSession {
    return {
      id: serverSession.id,
      topic: serverSession.topic,
      memoryPrompt: serverSession.memoryPrompt,
      messages: serverSession.messages.map((msg) => ({
        id: msg.id,
        role: msg.role as any,
        content: msg.content,
        date: msg.date,
      })),
      stat: {
        tokenCount: 0,
        wordCount: 0,
        charCount: 0,
      },
      lastUpdate: new Date(serverSession.lastUpdate).getTime(),
      lastSummarizeIndex: 0,
      mask: JSON.parse(serverSession.maskConfig || "{}"),
    };
  }

  // 转换：本地格式 -> 服务器格式
  private localSessionToServer(session: ChatSession) {
    return {
      topic: session.topic,
      memoryPrompt: session.memoryPrompt,
      maskConfig: JSON.stringify(session.mask),
    };
  }
}

export const chatSyncService = new ChatSyncService();

