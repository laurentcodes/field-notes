import { z } from 'zod';

export const noteFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or less'),
  body: z.string().min(1, 'Note content is required'),
  tags: z.array(z.string()).default([]),
});

export type NoteFormSchema = z.infer<typeof noteFormSchema>;
