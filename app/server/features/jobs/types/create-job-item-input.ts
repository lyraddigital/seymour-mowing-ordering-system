export interface CreateJobItemInput {
  description: string;
  amountCents: number;
}

export type CreateJobItemFieldErrors = Partial<
  Record<keyof CreateJobItemInput, string>
>;