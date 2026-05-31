"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { EstimationMethod } from "@/lib/estimation-engine";

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

/**
 * Голос участника в любом методе.
 * - COMPOSITE_SP: заполнены 4 поля, singleValue=null
 * - FIBONACCI_SP / HOURS / DAYS: заполнено singleValue, остальные null
 */
export interface IndividualVote {
  oderId: string;
  name: string;
  devEffort: number | null;
  qaEffort: number | null;
  risk: number | null;
  uncertainty: number | null;
  singleValue: number | null;
  totalScore: number;
}

export interface CompositeEstimationResults {
  method: "COMPOSITE_SP";
  avgDevEffort: number;
  avgQaEffort: number;
  avgRisk: number;
  avgUncertainty: number;
  totalScore: number;
  recommendedSp: number;
  devProportion: number;
  voteCount: number;
}

export interface SimpleEstimationResults {
  method: "FIBONACCI_SP" | "HOURS" | "DAYS";
  medianValue: number;
  roundedValue: number;
  minValue: number;
  maxValue: number;
  recommendedSp: number;
  durationDays: number;
  voteCount: number;
}

export type EstimationResults = CompositeEstimationResults | SimpleEstimationResults;

export interface VoterStatus {
  oderId: string;
  name: string;
  voted: boolean;
}

export interface SpScaleOption {
  value: number;
  label: string;
}

export interface EstimationConfig {
  method: EstimationMethod;
  workingHoursPerDay: number;
  shape: number[];
  /** Показывать ли гистограмму распределения всем участникам (по умолчанию false — только SM/host). */
  showDistributionToAll: boolean;
}

export interface QuickRoomInfo {
  accessCode: string | null;
  isHost: boolean;
}

export interface SessionState {
  sessionId: string | null;
  status: "IDLE" | "VOTING" | "REVEALED";
  activeTicket: SessionTicket | null;
  votes: VoteProgress;
  results: EstimationResults | null;
  individualVotes: IndividualVote[] | null;
  voterStatus: VoterStatus[] | null;
  tickets: TicketListItem[];
  spScale: SpScaleOption[];
  estimationConfig: EstimationConfig;
  /** Если проект — Quick-комната, тут код и флаг хоста. Иначе null. */
  quickRoom: QuickRoomInfo | null;
  currentUser: {
    id: string;
    name: string;
    role: string | null;
    isScrumMaster: boolean;
    isGuest: boolean;
  };
}

export function useEstimationPolling(projectId: string, intervalMs = 5000) {
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
