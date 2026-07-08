import { z } from 'astro/zod';

const processRailStepSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  hint: z.string().min(1).optional(),
});

export const processRailConfigSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1).optional(),
    steps: z.array(processRailStepSchema).min(1),
  })
  .superRefine((config, ctx) => {
    const ids = new Set<string>();
    for (const step of config.steps) {
      if (ids.has(step.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['steps'],
          message: `duplicate step id: ${step.id}`,
        });
      }
      ids.add(step.id);
    }
  });

export type ProcessRailConfig = z.infer<typeof processRailConfigSchema>;

export function parseProcessRailConfig(input: unknown): ProcessRailConfig {
  return processRailConfigSchema.parse(input);
}
