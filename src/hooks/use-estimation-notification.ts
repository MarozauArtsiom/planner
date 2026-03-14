"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface NotificationState {
  active: boolean;
  ticketTitle: string | null;
}

export function useEstimationNotification(projectId: string) {
  const [state, setState] = useState<NotificationState>({
    active: false,
    ticketTitle: null,
  });
  const mountedRef = useRef(true);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/estimation/active?projectId=${encodeURIComponent(projectId)}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      if (mountedRef.current) {
        setState(data);
      }
    } catch {
      // ignore
    }
  }, [projectId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchState]);

  return state;
}
