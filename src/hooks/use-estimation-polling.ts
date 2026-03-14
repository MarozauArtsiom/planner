"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface SessionTicket {
  id: string;
  externalId: string | null;
  externalUrl: string | null;
  title: string;
  description: string | null;
  acceptanceCriteria: string | null;
}

export interface TicketListItem {
  id: string;
  externalId: string | null;
  title: string;
  storyPoints: number | null;
  isActive: boolean;
}

export interface VoteProgress {
  totalVoters: number;
  submittedCount: number;
  currentUserVoted: boolean;
}

export interface EstimationResults {
  avgDevEffort: number;
  avgQaEffort: number;
  avgRisk: number;
  avgUncertainty: number;
  totalScore: number;
  recommendedSp: number;
  devProportion: number;
  voteCount: number;
}

export interface SessionState {
  sessionId: string | null;
  status: "IDLE" | "VOTING" | "REVEALED";
  activeTicket: SessionTicket | null;
  votes: VoteProgress;
  results: EstimationResults | null;
  tickets: TicketListItem[];
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
}

export function useEstimationPolling(projectId: string, intervalMs = 2000) {
  const [state, setState] = useState<SessionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/estimation/session?projectId=${encodeURIComponent(projectId)}`,
      );
      if (!res.ok) throw new Error("Failed to fetch session");
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
