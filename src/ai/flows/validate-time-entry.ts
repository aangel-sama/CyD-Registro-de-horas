// The 'use server' directive is critical: it flags all code within as suitable for server-side execution.
'use server';

/**
 * @fileOverview Time entry validation flow using Genkit and Gemini.
 *
 * This file defines a Genkit flow to validate time entries for anomalies,
 * such as unusually high hours, using AI. It includes the input and output schemas,
 * the main validation function, and the Genkit flow definition.
 *
 * - validateTimeEntry - Validates a time entry and returns a confirmation request if anomalous.
 * - ValidateTimeEntryInput - The input type for the validateTimeEntry function.
 * - ValidateTimeEntryOutput - The return type for the validateTimeEntry function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

/**
 * Defines the input schema for time entry validation.
 */
const ValidateTimeEntryInputSchema = z.object({
  date: z.string().describe('The date of the time entry (YYYY-MM-DD).'),
  project: z.string().describe('The project the time was spent on.'),
  hours: z.number().describe('The number of hours worked on the project.'),
  userName: z.string().describe('The name of the user entering the time.'),
});

export type ValidateTimeEntryInput = z.infer<typeof ValidateTimeEntryInputSchema>;

/**
 * Defines the output schema for time entry validation, indicating whether confirmation is needed.
 */
const ValidateTimeEntryOutputSchema = z.object({
  confirmationNeeded: z.boolean().describe('Whether confirmation is needed due to potential anomaly.'),
  reason: z.string().optional().describe('The reason why confirmation is needed.'),
});

export type ValidateTimeEntryOutput = z.infer<typeof ValidateTimeEntryOutputSchema>;

/**
 * Validates a time entry for anomalies and returns whether confirmation is needed.
 * @param input The time entry input.
 * @returns A promise that resolves to a ValidateTimeEntryOutput object.
 */
export async function validateTimeEntry(input: ValidateTimeEntryInput): Promise<ValidateTimeEntryOutput> {
  return validateTimeEntryFlow(input);
}

/**
 * Defines the Genkit prompt for validating time entries.
 */
const validateTimeEntryPrompt = ai.definePrompt({
  name: 'validateTimeEntryPrompt',
  input: {
    schema: z.object({
      date: z.string().describe('The date of the time entry (YYYY-MM-DD).'),
      project: z.string().describe('The project the time was spent on.'),
      hours: z.number().describe('The number of hours worked on the project.'),
      userName: z.string().describe('The name of the user entering the time.'),
    }),
  },
  output: {
    schema: z.object({
      confirmationNeeded: z.boolean().describe('Whether confirmation is needed due to potential anomaly.'),
      reason: z.string().optional().describe('The reason why confirmation is needed.'),
    }),
  },
  prompt: `You are an AI assistant specializing in validating time entries for anomalies.

  Given the following time entry, determine if the hours worked are unusually high for the given project and user.

  Time Entry:
  - Date: {{{date}}}
  - Project: {{{project}}}
  - Hours: {{{hours}}}
  - User: {{{userName}}}

  Consider that a typical work day is 8 hours, and it's unusual for someone to work significantly more than that on a single project.

  Respond with JSON. The "confirmationNeeded" field should be true if the hours are unusually high, and false otherwise.
  If confirmationNeeded is true, provide a brief reason in the "reason" field.
`,
});

/**
 * Defines the Genkit flow for validating time entries.
 */
const validateTimeEntryFlow = ai.defineFlow<
  typeof ValidateTimeEntryInputSchema,
  typeof ValidateTimeEntryOutputSchema
>({
  name: 'validateTimeEntryFlow',
  inputSchema: ValidateTimeEntryInputSchema,
  outputSchema: ValidateTimeEntryOutputSchema,
},
async input => {
  const {output} = await validateTimeEntryPrompt(input);
  return output!;
});
