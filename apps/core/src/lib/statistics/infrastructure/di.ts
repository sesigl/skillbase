import { StatisticsUseCases } from '../application/StatisticsUseCases';
import { PostgresSkillInvocationRepository } from './persistence/PostgresSkillInvocationRepository';

export function createStatisticsUseCases(): StatisticsUseCases {
  const repository = new PostgresSkillInvocationRepository();
  return new StatisticsUseCases(repository);
}
