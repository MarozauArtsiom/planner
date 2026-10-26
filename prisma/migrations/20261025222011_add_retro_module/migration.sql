-- CreateTable
CREATE TABLE "RetroBoard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "inviteToken" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT 'WENT_WELL_TO_IMPROVE',
    "phase" TEXT NOT NULL DEFAULT 'COLLECT',
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "hideCardsUntilReveal" BOOLEAN NOT NULL DEFAULT true,
    "cardsRevealed" BOOLEAN NOT NULL DEFAULT false,
    "maxVotesPerUser" INTEGER NOT NULL DEFAULT 5,
    "hideVotesUntilDone" BOOLEAN NOT NULL DEFAULT true,
    "timerEndsAt" DATETIME,
    "timerDurationSec" INTEGER,
    "focusedItemId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "projectId" TEXT NOT NULL,
    "sprintId" TEXT,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "RetroBoard_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RetroBoard_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RetroBoard_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RetroColumn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'emerald',
    "position" INTEGER NOT NULL,
    "boardId" TEXT NOT NULL,
    CONSTRAINT "RetroColumn_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "RetroBoard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RetroCardGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "boardId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    CONSTRAINT "RetroCardGroup_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "RetroBoard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RetroCardGroup_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "RetroColumn" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RetroCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "boardId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "groupId" TEXT,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "RetroCard_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "RetroBoard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RetroCard_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "RetroColumn" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RetroCard_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "RetroCardGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RetroCard_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RetroVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "cardId" TEXT,
    "groupId" TEXT,
    CONSTRAINT "RetroVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RetroVote_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "RetroCard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RetroVote_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "RetroCardGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RetroActionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "boardId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "ticketId" TEXT,
    CONSTRAINT "RetroActionItem_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "RetroBoard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RetroActionItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RetroActionItem_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RetroActionItem_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RetroParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isTyping" BOOLEAN NOT NULL DEFAULT false,
    "boardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "RetroParticipant_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "RetroBoard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RetroParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RetroBoard_inviteToken_key" ON "RetroBoard"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "RetroVote_userId_cardId_key" ON "RetroVote"("userId", "cardId");

-- CreateIndex
CREATE UNIQUE INDEX "RetroVote_userId_groupId_key" ON "RetroVote"("userId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "RetroActionItem_ticketId_key" ON "RetroActionItem"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "RetroParticipant_boardId_userId_key" ON "RetroParticipant"("boardId", "userId");
