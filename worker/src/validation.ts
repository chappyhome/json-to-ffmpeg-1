import { z } from 'zod';

/**
 * Minimal validation schema for timeline JSON
 * Only validates required fields, plugins can add more
 */
export const TimelineSchema = z.object({
  version: z.number().int().positive(),
  inputs: z.record(z.any()),
  tracks: z.record(z.any()),
  output: z.object({
    file: z.string(),
    width: z.number().positive(),
    height: z.number().positive(),
    framerate: z.number().positive(),
  }).passthrough(),
  transitions: z.array(z.any()).optional().default([]),
}).passthrough();

export type TimelineInput = z.infer<typeof TimelineSchema>;

/**
 * Validates timeline JSON against schema
 */
export function validateTimeline(data: unknown): TimelineInput {
  return TimelineSchema.parse(data);
}
