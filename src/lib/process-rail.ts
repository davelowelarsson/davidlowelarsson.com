import { z } from 'astro/zod';

const processRailSystemSchema = z.enum(['job', 'slack', 'spotify', 'diff']);

const processRailSampleSchema = z.object({
  operation: z.string().min(1).optional(),
  leftLabel: z.string().min(1).optional(),
  left: z.array(z.string()).min(1).optional(),
  rightLabel: z.string().min(1).optional(),
  right: z.array(z.string()).min(1).optional(),
  resultLabel: z.string().min(1).optional(),
  result: z.array(z.string()).min(1).optional(),
});

const processRailStepSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  hint: z.string().min(1).optional(),
  system: processRailSystemSchema.default('job'),
  sample: processRailSampleSchema.optional(),
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
export type ProcessRailStep = ProcessRailConfig['steps'][number];

export function parseProcessRailConfig(input: unknown): ProcessRailConfig {
  return processRailConfigSchema.parse(input);
}
