export interface ReportSprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface ReportMember {
  id: string;
  name: string;
  role: "DEV" | "QA";
}

export interface ReportAssignment {
  id: string;
  ticketId: string;
  ticketTitle: string;
  ticketExternalId: string | null;
  ticketExternalUrl: string | null;
  storyPoints: number;
  userId: string;
  startDate: string;
  durationDays: number;
  type: "DEV" | "QA";
  parentAssignmentId: string | null;
}

export interface ReportTimeOff {
  userId: string;
  date: string;
}

export interface ReportBacklogTicket {
  id: string;
  title: string;
  externalId: string | null;
  externalUrl: string | null;
  storyPoints: number;
  hasDevAssignment: boolean;
  hasQaAssignment: boolean;
}

export interface ReportData {
  projectName: string;
  generatedAt: string;
  sprints: ReportSprint[];
  members: ReportMember[];
  assignments: ReportAssignment[];
  timeOffs: ReportTimeOff[];
  backlog: ReportBacklogTicket[];
}

export interface ReportOptions {
  includeBacklog: boolean;
  backlogTicketIds: string[];
}
