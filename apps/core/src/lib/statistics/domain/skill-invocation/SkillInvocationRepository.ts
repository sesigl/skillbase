import type { SkillInvocation } from './SkillInvocation';

export interface UsageSummary {
  totalInvocations: number;
  nativeInvocations: number;
  fileReadInvocations: number;
  distinctSkills: number;
  perSkillCounts: Array<{ skillName: string; count: number; lastUsedAt: Date }>;
  dailyCounts: Array<{ date: string; count: number }>;
  recentInvocations: SkillInvocation[];
}

export interface SkillUsage {
  skillName: string;
  totalInvocations: number;
  nativeInvocations: number;
  fileReadInvocations: number;
  knownUsers: number;
  sessions: number;
  unassignedInvocations: number;
  lastUsedAt: Date | null;
  dailyCounts: Array<{ date: string; count: number }>;
  perUserCounts: Array<{
    userId: string;
    totalInvocations: number;
    nativeInvocations: number;
    fileReadInvocations: number;
    sessions: number;
    lastUsedAt: Date;
  }>;
}

export interface SkillUsageOverview {
  skillName: string;
  uniqueUsersLast30Days: number;
  invocationsLast30Days: number;
  lastUsedAt: Date | null;
}

export interface SkillInvocationRepository {
  insert(invocation: SkillInvocation): Promise<boolean>;
  getUsageSummary(): Promise<UsageSummary>;
  getSkillUsage(skillName: string): Promise<SkillUsage>;
  getSkillUsageOverview(): Promise<SkillUsageOverview[]>;
}
