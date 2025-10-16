// 自动同步 hook - 监听 chat store 变化并同步到服务器

import { useEffect, useRef, useCallback } from "react";
import { useChatStore } from "../store/chat";
import { chatSyncService } from "../store/chat-sync";
import { useAuth } from "../contexts/AuthContext";

export function useChatSync() {
  const { isAuthenticated } = useAuth();
  const sessions = useChatStore((state) => state.sessions);
  const hasLoadedFromServer = useRef(false);
  const lastSyncTime = useRef(0);

  const loadFromServer = useCallback(async () => {
    try {
      console.log("[ChatSync] Loading sessions from server...");
      const serverSessions = await chatSyncService.loadSessionsFromServer();
      
      if (serverSessions.length > 0) {
        // 合并服务器数据和本地数据
        const localSessions = useChatStore.getState().sessions;
        const sessionMap = new Map();

        // 优先使用服务器数据
        serverSessions.forEach((s) => sessionMap.set(s.id, s));
        
        // 保留本地未同步的会话
        localSessions.forEach((s) => {
          if (!sessionMap.has(s.id)) {
            sessionMap.set(s.id, s);
          }
        });

        const mergedSessions = Array.from(sessionMap.values());
        
        // 更新 store
        useChatStore.setState({
          sessions: mergedSessions,
          currentSessionIndex: 0,
        });

        console.log(
          `[ChatSync] Loaded ${serverSessions.length} sessions from server`,
        );
      }
    } catch (error) {
      console.error("[ChatSync] Failed to load from server:", error);
    }
  }, []);

  const syncToServer = useCallback(async () => {
    try {
      const currentSessions = useChatStore.getState().sessions;
      await chatSyncService.syncAll(currentSessions);
    } catch (error) {
      console.error("[ChatSync] Failed to sync to server:", error);
    }
  }, []);

  // 初始加载：从服务器加载数据
  useEffect(() => {
    if (isAuthenticated && !hasLoadedFromServer.current) {
      loadFromServer();
      hasLoadedFromServer.current = true;
    }
  }, [isAuthenticated, loadFromServer]);

  // 监听会话变化，自动同步
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // 防抖：避免频繁同步
    const now = Date.now();
    if (now - lastSyncTime.current < 2000) {
      return;
    }

    lastSyncTime.current = now;

    // 延迟同步以批量处理
    const timer = setTimeout(() => {
      syncToServer();
    }, 1000);

    return () => clearTimeout(timer);
  }, [sessions, isAuthenticated, syncToServer]);

  return {
    loadFromServer,
    syncToServer,
  };
}

