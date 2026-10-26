"use client";

import { useState, useEffect } from "react";

interface RetroNotificationState {
  active: boolean;
  boardTitle: string | null;
  inviteToken: string | null;
  phase: string | null;
}

export function useRetroNotification(projectId: string, intervalMs = 5000) {
  const [state, setState] = useState<RetroNotificationState>({
    active: false,
    boardTitle: null,
    inviteToken: null,
    phase: null,
  });

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        const res = await fetch(
          `/api/retro/active?projectId=${encodeURIComponent(projectId)}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) {
          setState({
            active: Boolean(data.active),
            boardTitle: data.boardTitle ?? null,
            inviteToken: data.inviteToken ?? null,
            phase: data.phase ?? null,
          });
        }
      } catch {
        // ignore transient network errors
      }
    }

    check();
    const id = setInterval(check, intervalMs);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [projectId, intervalMs]);

  return state;
}
