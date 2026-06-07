import { z } from 'zod';

export const SkillSchema = z.object({
  name: z.string().min(1).max(100),
  author: z.string().min(1).max(255),
  description: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  tags: z.array(z.string().min(1)).min(1),
  providers: z.array(z.string().min(1)).min(1),
  license: z.string().min(1),
  homepage: z.string().url().optional(),
});

export type Skill = z.infer<typeof SkillSchema>;
