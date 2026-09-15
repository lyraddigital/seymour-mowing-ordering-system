export interface CreateJobInput {
  name: string;
  customerId: string;
  scheduledDate: string;
  description: string;
}

export type CreateJobFieldErrors = Partial<
  Record<keyof CreateJobInput, string>
>;
