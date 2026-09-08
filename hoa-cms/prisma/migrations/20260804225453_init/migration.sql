-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ATTORNEY', 'PARALEGAL', 'BILLING', 'READONLY');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('HOA', 'CONDOMINIUM', 'COOPERATIVE');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'FORMER');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('BOARD_MEMBER', 'PROPERTY_MANAGER', 'UNIT_OWNER', 'OPPOSING_COUNSEL', 'JUDGE', 'VENDOR', 'OTHER');

-- CreateEnum
CREATE TYPE "PracticeArea" AS ENUM ('COLLECTIONS', 'COVENANT_ENFORCEMENT', 'GENERAL_CORPORATE', 'GENERAL_LITIGATION', 'CLAIMS_MONITORING');

-- CreateEnum
CREATE TYPE "MatterType" AS ENUM ('STANDARD', 'BANKRUPTCY_ANCILLARY', 'EVICTION_ANCILLARY');

-- CreateEnum
CREATE TYPE "MatterStatus" AS ENUM ('OPEN', 'ON_HOLD', 'CLOSED');

-- CreateEnum
CREATE TYPE "CollectionsStatus" AS ENUM ('NEW_REFERRAL', 'DEMAND_LETTER_SENT', 'LIEN_RECORDED', 'REFERRED_TO_SUIT', 'SUIT_FILED', 'ANSWER_PERIOD', 'JUDGMENT', 'SALE_SCHEDULED', 'SALE_HELD', 'CLOSED');

-- CreateEnum
CREATE TYPE "ClosedReason" AS ENUM ('PAID_IN_FULL', 'WRITTEN_OFF', 'SETTLED', 'TRANSFERRED_OUT', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentPlanStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DEFAULTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OwnerLedgerEntryType" AS ENUM ('ASSESSMENT', 'LATE_FEE', 'INTEREST', 'ATTORNEY_FEE', 'COST', 'PAYMENT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "BankruptcyChapter" AS ENUM ('CHAPTER_7', 'CHAPTER_11', 'CHAPTER_13');

-- CreateEnum
CREATE TYPE "BankruptcyStayStatus" AS ENUM ('ACTIVE', 'LIFTED', 'DISCHARGED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "EvictionStatus" AS ENUM ('FILED', 'HEARING_SET', 'JUDGMENT_ENTERED', 'WRIT_ISSUED', 'COMPLETED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "CertifiedMailStatus" AS ENUM ('CREATED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED_UNCLAIMED', 'FAILED');

-- CreateEnum
CREATE TYPE "DeadlineType" AS ENUM ('STATUTE_OF_LIMITATIONS', 'HEARING', 'FILING', 'FOLLOW_UP', 'OTHER');

-- CreateEnum
CREATE TYPE "DeadlineStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NoteCategory" AS ENUM ('GENERAL', 'CALL', 'EMAIL', 'COURT_APPEARANCE', 'INTERNAL');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('DEMAND_LETTER', 'LIEN', 'PLEADING', 'CORRESPONDENCE', 'LEDGER_EXPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('FEE', 'COST', 'PAYMENT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "QbSyncStatus" AS ENUM ('NOT_SYNCED', 'SYNCED', 'ERROR');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Office" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'FL',
    "postalCode" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Office_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "barNumber" TEXT,
    "officeId" TEXT,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecretEnc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientType" "ClientType" NOT NULL,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT DEFAULT 'FL',
    "postalCode" TEXT,
    "county" TEXT,
    "federalEin" TEXT,
    "officeId" TEXT,
    "relationshipAttorneyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "contactType" "ContactType" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "mailingAddressLine1" TEXT,
    "mailingAddressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientContact" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatterContact" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatterContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Matter" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "matterNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "practiceArea" "PracticeArea" NOT NULL,
    "matterType" "MatterType" NOT NULL DEFAULT 'STANDARD',
    "parentMatterId" TEXT,
    "title" TEXT NOT NULL,
    "status" "MatterStatus" NOT NULL DEFAULT 'OPEN',
    "openedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedDate" TIMESTAMP(3),
    "description" TEXT,
    "responsibleAttorneyId" TEXT NOT NULL,
    "assignedParalegalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Matter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionsMatterDetail" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "unitAddressLine1" TEXT NOT NULL,
    "unitAddressLine2" TEXT,
    "unitCity" TEXT NOT NULL,
    "unitState" TEXT NOT NULL DEFAULT 'FL',
    "unitPostalCode" TEXT NOT NULL,
    "status" "CollectionsStatus" NOT NULL DEFAULT 'NEW_REFERRAL',
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referralDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentBalanceCents" INTEGER NOT NULL DEFAULT 0,
    "paymentPlanActive" BOOLEAN NOT NULL DEFAULT false,
    "paidInFull" BOOLEAN NOT NULL DEFAULT false,
    "bankruptcyStayActive" BOOLEAN NOT NULL DEFAULT false,
    "closedReason" "ClosedReason",
    "closedAt" TIMESTAMP(3),
    "caseNumber" TEXT,
    "court" TEXT,
    "judgeName" TEXT,
    "suitFiledDate" TIMESTAMP(3),
    "judgmentDate" TIMESTAMP(3),
    "judgmentAmountCents" INTEGER,
    "saleScheduledDate" TIMESTAMP(3),
    "saleHeldDate" TIMESTAMP(3),
    "salePriceCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionsMatterDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LienRecord" (
    "id" TEXT NOT NULL,
    "collectionsMatterDetailId" TEXT NOT NULL,
    "recordedDate" TIMESTAMP(3) NOT NULL,
    "orBook" TEXT NOT NULL,
    "orPage" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "releasedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LienRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentPlan" (
    "id" TEXT NOT NULL,
    "collectionsMatterDetailId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "monthlyAmountCents" INTEGER NOT NULL,
    "status" "PaymentPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnerLedgerEntry" (
    "id" TEXT NOT NULL,
    "collectionsMatterDetailId" TEXT NOT NULL,
    "entryType" "OwnerLedgerEntryType" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "description" TEXT,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnerLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankruptcyMatterDetail" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "chapter" "BankruptcyChapter" NOT NULL,
    "trusteeName" TEXT,
    "court" TEXT,
    "filedDate" TIMESTAMP(3) NOT NULL,
    "stayStatus" "BankruptcyStayStatus" NOT NULL DEFAULT 'ACTIVE',
    "stayLiftedDate" TIMESTAMP(3),
    "dischargeDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankruptcyMatterDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvictionMatterDetail" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "court" TEXT,
    "filedDate" TIMESTAMP(3) NOT NULL,
    "hearingDate" TIMESTAMP(3),
    "writOfPossessionDate" TIMESTAMP(3),
    "status" "EvictionStatus" NOT NULL DEFAULT 'FILED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvictionMatterDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertifiedMailing" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "documentId" TEXT,
    "recipientName" TEXT NOT NULL,
    "recipientAddress" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "trackingNumber" TEXT NOT NULL,
    "mailedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "CertifiedMailStatus" NOT NULL DEFAULT 'CREATED',
    "deliveredDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertifiedMailing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deadline" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "DeadlineType" NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "DeadlineStatus" NOT NULL DEFAULT 'OPEN',
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "assignedToId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "matterId" TEXT,
    "category" "NoteCategory" NOT NULL DEFAULT 'GENERAL',
    "body" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT,
    "matterId" TEXT,
    "category" "DocumentCategory" NOT NULL DEFAULT 'OTHER',
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "entryType" "LedgerEntryType" NOT NULL,
    "description" TEXT,
    "amountCents" INTEGER NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qbSyncStatus" "QbSyncStatus" NOT NULL DEFAULT 'NOT_SYNCED',
    "qbReferenceId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Office_organizationId_idx" ON "Office"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "User_officeId_idx" ON "User"("officeId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_clientNumber_key" ON "Client"("clientNumber");

-- CreateIndex
CREATE INDEX "Client_organizationId_idx" ON "Client"("organizationId");

-- CreateIndex
CREATE INDEX "Client_status_idx" ON "Client"("status");

-- CreateIndex
CREATE INDEX "Client_relationshipAttorneyId_idx" ON "Client"("relationshipAttorneyId");

-- CreateIndex
CREATE INDEX "Contact_organizationId_idx" ON "Contact"("organizationId");

-- CreateIndex
CREATE INDEX "Contact_contactType_idx" ON "Contact"("contactType");

-- CreateIndex
CREATE INDEX "Contact_lastName_firstName_idx" ON "Contact"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "ClientContact_clientId_idx" ON "ClientContact"("clientId");

-- CreateIndex
CREATE INDEX "ClientContact_contactId_idx" ON "ClientContact"("contactId");

-- CreateIndex
CREATE INDEX "MatterContact_matterId_idx" ON "MatterContact"("matterId");

-- CreateIndex
CREATE INDEX "MatterContact_contactId_idx" ON "MatterContact"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "Matter_matterNumber_key" ON "Matter"("matterNumber");

-- CreateIndex
CREATE INDEX "Matter_organizationId_idx" ON "Matter"("organizationId");

-- CreateIndex
CREATE INDEX "Matter_clientId_idx" ON "Matter"("clientId");

-- CreateIndex
CREATE INDEX "Matter_practiceArea_status_idx" ON "Matter"("practiceArea", "status");

-- CreateIndex
CREATE INDEX "Matter_responsibleAttorneyId_idx" ON "Matter"("responsibleAttorneyId");

-- CreateIndex
CREATE INDEX "Matter_parentMatterId_idx" ON "Matter"("parentMatterId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionsMatterDetail_matterId_key" ON "CollectionsMatterDetail"("matterId");

-- CreateIndex
CREATE INDEX "CollectionsMatterDetail_status_idx" ON "CollectionsMatterDetail"("status");

-- CreateIndex
CREATE INDEX "LienRecord_collectionsMatterDetailId_idx" ON "LienRecord"("collectionsMatterDetailId");

-- CreateIndex
CREATE INDEX "PaymentPlan_collectionsMatterDetailId_idx" ON "PaymentPlan"("collectionsMatterDetailId");

-- CreateIndex
CREATE INDEX "OwnerLedgerEntry_collectionsMatterDetailId_entryDate_idx" ON "OwnerLedgerEntry"("collectionsMatterDetailId", "entryDate");

-- CreateIndex
CREATE UNIQUE INDEX "BankruptcyMatterDetail_matterId_key" ON "BankruptcyMatterDetail"("matterId");

-- CreateIndex
CREATE UNIQUE INDEX "EvictionMatterDetail_matterId_key" ON "EvictionMatterDetail"("matterId");

-- CreateIndex
CREATE INDEX "CertifiedMailing_matterId_idx" ON "CertifiedMailing"("matterId");

-- CreateIndex
CREATE INDEX "CertifiedMailing_trackingNumber_idx" ON "CertifiedMailing"("trackingNumber");

-- CreateIndex
CREATE INDEX "Deadline_assignedToId_status_dueDate_idx" ON "Deadline"("assignedToId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "Deadline_matterId_idx" ON "Deadline"("matterId");

-- CreateIndex
CREATE INDEX "Note_matterId_createdAt_idx" ON "Note"("matterId", "createdAt");

-- CreateIndex
CREATE INDEX "Note_clientId_createdAt_idx" ON "Note"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "Document_organizationId_idx" ON "Document"("organizationId");

-- CreateIndex
CREATE INDEX "Document_matterId_idx" ON "Document"("matterId");

-- CreateIndex
CREATE INDEX "Document_clientId_idx" ON "Document"("clientId");

-- CreateIndex
CREATE INDEX "LedgerEntry_matterId_entryDate_idx" ON "LedgerEntry"("matterId", "entryDate");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Office" ADD CONSTRAINT "Office_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_relationshipAttorneyId_fkey" FOREIGN KEY ("relationshipAttorneyId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientContact" ADD CONSTRAINT "ClientContact_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientContact" ADD CONSTRAINT "ClientContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterContact" ADD CONSTRAINT "MatterContact_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterContact" ADD CONSTRAINT "MatterContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matter" ADD CONSTRAINT "Matter_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matter" ADD CONSTRAINT "Matter_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matter" ADD CONSTRAINT "Matter_parentMatterId_fkey" FOREIGN KEY ("parentMatterId") REFERENCES "Matter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matter" ADD CONSTRAINT "Matter_responsibleAttorneyId_fkey" FOREIGN KEY ("responsibleAttorneyId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matter" ADD CONSTRAINT "Matter_assignedParalegalId_fkey" FOREIGN KEY ("assignedParalegalId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionsMatterDetail" ADD CONSTRAINT "CollectionsMatterDetail_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LienRecord" ADD CONSTRAINT "LienRecord_collectionsMatterDetailId_fkey" FOREIGN KEY ("collectionsMatterDetailId") REFERENCES "CollectionsMatterDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentPlan" ADD CONSTRAINT "PaymentPlan_collectionsMatterDetailId_fkey" FOREIGN KEY ("collectionsMatterDetailId") REFERENCES "CollectionsMatterDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerLedgerEntry" ADD CONSTRAINT "OwnerLedgerEntry_collectionsMatterDetailId_fkey" FOREIGN KEY ("collectionsMatterDetailId") REFERENCES "CollectionsMatterDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerLedgerEntry" ADD CONSTRAINT "OwnerLedgerEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankruptcyMatterDetail" ADD CONSTRAINT "BankruptcyMatterDetail_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvictionMatterDetail" ADD CONSTRAINT "EvictionMatterDetail_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertifiedMailing" ADD CONSTRAINT "CertifiedMailing_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertifiedMailing" ADD CONSTRAINT "CertifiedMailing_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deadline" ADD CONSTRAINT "Deadline_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deadline" ADD CONSTRAINT "Deadline_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
