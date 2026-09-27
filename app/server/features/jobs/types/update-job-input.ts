export interface UpdateJobInput {
  name: string;
  description: string;
  scheduledDate: string;
  servicePriceCents: number | null;
}

export type UpdateJobFieldErrors = Partial<
  Record<keyof UpdateJobInput, string>
>;
