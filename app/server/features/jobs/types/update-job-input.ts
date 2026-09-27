export interface UpdateJobInput {
  name: string;
  description: string;
  scheduledDate: string;
}

export type UpdateJobFieldErrors = Partial<
  Record<keyof UpdateJobInput, string>
>;
