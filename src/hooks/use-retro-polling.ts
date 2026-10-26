"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  RetroColumnColor,
  RetroPhase,
  RetroTemplate,
} from "@/lib/retro";

export interface RetroBoardInfo {
  id: string;
  title: string;
  inviteToken: string;
  template: RetroTemplate;
  phase: RetroPhase;
  isAnonymous: boolean;
  hideCardsUntilReveal: boolean;
  cardsRevealed: boolean;
  maxVotesPerUser: number;
  hideVotesUntilDone: boolean;
  timerEndsAt: string | null;
  timerDurationSec: number | null;
  focusedItemId: string | null;
  createdAt: string;
  completedAt: string | null;
  projectId: string;
  projectName: string;
  sprintId: string | null;
}

export interface RetroCurrentUser {
  id: string;
  name: string;
  isGuest: boolean;
  isFacilitator: boolean;
  usedVotes: number;
  remainingVotes: number;
}

export interface RetroColumnItem {
  id: string;
  title: string;
  color: RetroColumnColor;
  position: number;
}

export interface RetroGroupItem {
  id: string;
  title: string;
  columnId: string;
  position: number;
  myVotes: number;
  totalVotes: number;
}

export interface RetroCardItem {
  id: string;
  content: string;
  isBlurred: boolean;
  columnId: string;
  groupId: string | null;
  position: number;
  authorName: string | null;
  isOwn: boolean;
  myVotes: number;
  totalVotes: number;
  createdAt: string;
}

export interface RetroActionItemData {
  id: string;
  title: string;
  status: "OPEN" | "DONE";
  dueDate: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  ticketId: string | null;
  ticketTitle: string | null;
  ticketSp: number | null;
}

export interface RetroCarryOverItem {
  id: string;
  title: string;
  status: "OPEN" | "DONE";
  dueDate: string | null;
  assigneeName: string | null;
  fromBoardTitle: string;
  ticketId: string | null;
}

export interface RetroParticipantItem {
  userId: string;
  name: string;
  isOnline: boolean;
  isTyping: boolean;
  hasVoted: boolean;
}

export interface RetroSprintOption {
  id: string;
  name: string;
  isActive: boolean;
}

export interface RetroSprintContext {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  ticketCount: number;
  totalSp: number;
  tickets: {
    id: string;
    externalId: string | null;
    title: string;
    storyPoints: number | null;
  }[];
}

export interface RetroBoardState {
  board: RetroBoardInfo;
  currentUser: RetroCurrentUser;
  columns: RetroColumnItem[];
  groups: RetroGroupItem[];
  cards: RetroCardItem[];
  actionItems: RetroActionItemData[];
  carryOverItems: RetroCarryOverItem[];
  participants: RetroParticipantItem[];
  assignableUsers: { id: string; name: string }[];
  sprints: RetroSprintOption[];
  sprintContext: RetroSprintContext | null;
}

export function useRetroPolling(inviteToken: string, intervalMs = 3000) {
  const [state, setState] = useState<RetroBoardState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const typingRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const typingParam = typingRef.current ? "1" : "0";
      const res = await fetch(
        `/api/retro/board?token=${encodeURIComponent(inviteToken)}&typing=${typingParam}`,
      );
      if (!res.ok) throw new Error("Failed to fetch retro board");
      const data: RetroBoardState = await res.json();
      if (mountedRef.current) {
        setState(data);
        setError(null);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  }, [inviteToken]);

  const markTyping = useCallback(() => {
    typingRef.current = true;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      typingRef.current = false;
    }, 4500);
  }, []);

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
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [fetchState, intervalMs]);

  return { state, error, refresh, markTyping };
}
