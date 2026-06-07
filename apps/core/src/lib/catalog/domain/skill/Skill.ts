import { z } from 'zod';

const EFFORT_VALUES = ['low', 'medium', 'high', 'xhigh', 'max'] as const;

const SHELL_VALUES = ['bash', 'powershell'] as const;

export type Skill = z.infer<typeof SkillSchema>;

export const SkillSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  description: z.string().min(1),
  license: z.string().optional(),
  compatibility: z.string().max(500).optional(),
  allowedTools: z.array(z.string()).optional(),
  whenToUse: z.string().optional(),
  argumentHint: z.string().optional(),
  arguments: z.array(z.string()).optional(),
  disableModelInvocation: z.boolean(),
  userInvocable: z.boolean(),
  disallowedTools: z.array(z.string()).optional(),
  model: z.string().optional(),
  effort: z.enum(EFFORT_VALUES).optional(),
  context: z.literal('fork').optional(),
  agent: z.string().optional(),
  hooks: z.record(z.string(), z.unknown()).optional(),
  paths: z.array(z.string()).optional(),
  shell: z.enum(SHELL_VALUES).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  tags: z.array(z.string()),
  providers: z.array(z.string()),
  content: z.string(),
  assets: z.array(z.string()),
  sourceRepository: z.string(),
  sourcePath: z.string(),
});
