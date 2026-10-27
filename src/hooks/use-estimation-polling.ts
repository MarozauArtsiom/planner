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
  meanDevEffort: number;
  meanQaEffort: number;
  meanRisk: number;
  meanUncertainty: number;
  meanTotalScore: number;
  averageSp: number;
  exactAverageSp: number;
  devProportion: number;
  voteCount: number;
}

export interface SimpleEstimationResults {
  method: "FIBONACCI_SP" | "HOURS" | "DAYS";
  medianValue: number;
  roundedValue: number;
  averageValue: number;
  averageRoundedValue: number;
  minValue: number;
  maxValue: number;
  recommendedSp: number;
  averageSp: number;
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
  /** Пользовательские оценки, добавленные для этой комнаты/проекта. */
  customValues?: number[];
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
  const requestSeqRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchState = useCallback(async () => {
    const seq = ++requestSeqRef.current;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch(
        `/api/estimation/session?projectId=${encodeURIComponent(projectId)}`,
        {
          cache: "no-store",
          signal: controller.signal,
        },
      );
      if (!res.ok) throw new Error("Failed to fetch session");
      const data = await res.json();
      if (mountedRef.current && seq === requestSeqRef.current) {
        setState(data);
        setError(null);
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        return;
      }
      if (mountedRef.current && seq === requestSeqRef.current) {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  }, [projectId]);

  const resetInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(fetchState, intervalMs);
  }, [fetchState, intervalMs]);

  const refresh = useCallback(async () => {
    resetInterval();
    await fetchState();
  }, [fetchState, resetInterval]);

  const optimisticUpdate = useCallback(
    (updater: (prev: SessionState) => SessionState) => {
      requestSeqRef.current++;
      abortControllerRef.current?.abort();
      setState((prev) => (prev ? updater(prev) : prev));
    },
    [],
  );

  const markVotedOptimistic = useCallback(() => {
    optimisticUpdate((prev) => {
      const alreadyVoted = prev.votes.currentUserVoted;
      return {
        ...prev,
        votes: {
          ...prev.votes,
          currentUserVoted: true,
          submittedCount: alreadyVoted
            ? prev.votes.submittedCount
            : prev.votes.submittedCount + 1,
        },
        voterStatus: prev.voterStatus
          ? prev.voterStatus.map((v) =>
              v.oderId === prev.currentUser.id ? { ...v, voted: true } : v,
            )
          : null,
      };
    });
  }, [optimisticUpdate]);

  useEffect(() => {
    mountedRef.current = true;
    fetchState();
    intervalRef.current = setInterval(fetchState, intervalMs);
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchState, intervalMs]);

  return { state, error, refresh, optimisticUpdate, markVotedOptimistic };
}
