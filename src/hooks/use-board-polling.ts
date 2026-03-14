"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface BoardSprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface BoardMember {
  id: string;
  name: string;
  role: "DEV" | "QA";
}

export interface BoardState {
  sprints: BoardSprint[];
  members: BoardMember[];
  currentUser: { id: string; role: string };
}

export function useBoardPolling(projectId: string, intervalMs = 2000) {
  const [state, setState] = useState<BoardState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/board/state?projectId=${encodeURIComponent(projectId)}`,
      );
      if (!res.ok) throw new Error("Failed to fetch board state");
      const data = await res.json();
      if (mountedRef.current) {
        setState(data);
        setError(null);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  }, [projectId]);

  const refresh = useCallback(() => {
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    mountedRef.current = true;
    fetchState();
    const interval = setInterval(fetchState, intervalMs);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchState, intervalMs]);

  return { state, error, refresh };
}
