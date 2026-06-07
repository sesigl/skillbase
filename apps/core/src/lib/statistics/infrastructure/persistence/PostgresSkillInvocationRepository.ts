import { getTransactionClient } from '../../../shared/infrastructure/persistence/TransactionContext';
import { SkillInvocation } from '../../domain/skill-invocation/SkillInvocation';
import type {
  SkillInvocationRepository,
  SkillUsage,
  SkillUsageOverview,
  UsageSummary,
} from '../../domain/skill-invocation/SkillInvocationRepository';

export class PostgresSkillInvocationRepository implements SkillInvocationRepository {
  async insert(invocation: SkillInvocation): Promise<boolean> {
    const client = getTransactionClient();
    const record = invocation.toInsertRecord();
    const result = await client.query(
      `INSERT INTO skill_invocations (skill_name, source, tool_name, file_path, timestamp, session_id, user_id, idempotency_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [
        record.skillName,
        record.source,
        record.toolName,
        record.filePath,
        record.timestamp,
        record.sessionId,
        record.userId,
        record.idempotencyKey,
      ]
    );

    return result.rowCount === 1;
  }

  async getUsageSummary(): Promise<UsageSummary> {
    const client = getTransactionClient();
    const totalsResult = await client.query(`SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE source = 'native') AS native,
      COUNT(*) FILTER (WHERE source = 'file_read') AS file_read,
      COUNT(DISTINCT skill_name) AS distinct_skills
    FROM skill_invocations`);
    const perSkillResult =
      await client.query(`SELECT skill_name, COUNT(*) AS count, MAX(timestamp) AS last_used_at
      FROM skill_invocations
      GROUP BY skill_name
      ORDER BY count DESC
      LIMIT 10`);
    const dailyResult =
      await client.query(`SELECT TO_CHAR(DATE(timestamp), 'YYYY-MM-DD') AS date, COUNT(*) AS count
      FROM skill_invocations
      WHERE timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(timestamp)
      ORDER BY DATE(timestamp) DESC`);
    const recentResult =
      await client.query(`SELECT id, skill_name, source, tool_name, file_path, timestamp, session_id, user_id, idempotency_key
      FROM skill_invocations
      ORDER BY timestamp DESC
      LIMIT 20`);

    const totals = totalsResult.rows[0] as Record<string, string>;

    return {
      totalInvocations: Number(totals.total),
      nativeInvocations: Number(totals.native),
      fileReadInvocations: Number(totals.file_read),
      distinctSkills: Number(totals.distinct_skills),
      perSkillCounts: perSkillResult.rows.map((row: Record<string, unknown>) => ({
        skillName: row.skill_name as string,
        count: Number(row.count),
        lastUsedAt: row.last_used_at as Date,
      })),
      dailyCounts: dailyResult.rows.map((row: Record<string, unknown>) => ({
        date: row.date as string,
        count: Number(row.count),
      })),
      recentInvocations: recentResult.rows.map(rehydrateSkillInvocation),
    };
  }

  async getSkillUsage(skillName: string): Promise<SkillUsage> {
    const client = getTransactionClient();
    const totalsResult = await client.query(
      `SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE source = 'native') AS native,
        COUNT(*) FILTER (WHERE source = 'file_read') AS file_read,
        COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) AS known_users,
        COUNT(DISTINCT session_id) FILTER (WHERE session_id IS NOT NULL) AS sessions,
        COUNT(*) FILTER (WHERE user_id IS NULL) AS unassigned,
        MAX(timestamp) AS last_used_at
      FROM skill_invocations
      WHERE skill_name = $1`,
      [skillName]
    );
    const dailyResult = await client.query(
      `WITH days AS (
        SELECT generate_series(
          (NOW() AT TIME ZONE 'UTC')::date - INTERVAL '29 days',
          (NOW() AT TIME ZONE 'UTC')::date,
          INTERVAL '1 day'
        )::date AS date
      )
      SELECT TO_CHAR(days.date, 'YYYY-MM-DD') AS date, COUNT(skill_invocations.id) AS count
      FROM days
      LEFT JOIN skill_invocations
        ON skill_invocations.skill_name = $1
        AND DATE(skill_invocations.timestamp AT TIME ZONE 'UTC') = days.date
      GROUP BY days.date
      ORDER BY days.date ASC`,
      [skillName]
    );
    const perUserResult = await client.query(
      `SELECT
        user_id,
        COUNT(*) AS total_invocations,
        COUNT(*) FILTER (WHERE source = 'native') AS native_invocations,
        COUNT(*) FILTER (WHERE source = 'file_read') AS file_read_invocations,
        COUNT(DISTINCT session_id) FILTER (WHERE session_id IS NOT NULL) AS sessions,
        MAX(timestamp) AS last_used_at
      FROM skill_invocations
      WHERE skill_name = $1 AND user_id IS NOT NULL
      GROUP BY user_id
      ORDER BY total_invocations DESC, last_used_at DESC, user_id ASC
      LIMIT 10`,
      [skillName]
    );

    const totals = totalsResult.rows[0] as Record<string, unknown>;

    return {
      skillName,
      totalInvocations: Number(totals.total),
      nativeInvocations: Number(totals.native),
      fileReadInvocations: Number(totals.file_read),
      knownUsers: Number(totals.known_users),
      sessions: Number(totals.sessions),
      unassignedInvocations: Number(totals.unassigned),
      lastUsedAt: (totals.last_used_at as Date | null) ?? null,
      dailyCounts: dailyResult.rows.map((row: Record<string, unknown>) => ({
        date: row.date as string,
        count: Number(row.count),
      })),
      perUserCounts: perUserResult.rows.map((row: Record<string, unknown>) => ({
        userId: row.user_id as string,
        totalInvocations: Number(row.total_invocations),
        nativeInvocations: Number(row.native_invocations),
        fileReadInvocations: Number(row.file_read_invocations),
        sessions: Number(row.sessions),
        lastUsedAt: row.last_used_at as Date,
      })),
    };
  }

  async getSkillUsageOverview(): Promise<SkillUsageOverview[]> {
    const client = getTransactionClient();
    const result = await client.query(`SELECT
      skill_name,
      COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) AS unique_users,
      COUNT(*) AS invocations,
      MAX(timestamp) AS last_used_at
    FROM skill_invocations
    WHERE timestamp >= NOW() - INTERVAL '30 days'
    GROUP BY skill_name
    ORDER BY unique_users DESC, invocations DESC, skill_name ASC`);

    return result.rows.map((row: Record<string, unknown>) => ({
      skillName: row.skill_name as string,
      uniqueUsersLast30Days: Number(row.unique_users),
      invocationsLast30Days: Number(row.invocations),
      lastUsedAt: (row.last_used_at as Date | null) ?? null,
    }));
  }
}

function rehydrateSkillInvocation(row: Record<string, unknown>): SkillInvocation {
  const baseRecord = {
    id: row.id as string,
    skillName: row.skill_name as string,
    timestamp: row.timestamp as Date,
    sessionId: (row.session_id as string) ?? null,
    userId: (row.user_id as string) ?? null,
    idempotencyKey: row.idempotency_key as string,
  };

  if (row.source === 'native') {
    return SkillInvocation.rehydrate({
      ...baseRecord,
      source: 'native',
      toolName: 'Skill',
      filePath: null,
    });
  }

  return SkillInvocation.rehydrate({
    ...baseRecord,
    source: 'file_read',
    toolName: row.tool_name as 'Read' | 'Edit' | 'Write',
    filePath: row.file_path as string,
  });
}
