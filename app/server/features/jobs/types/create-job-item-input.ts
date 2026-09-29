export interface CreateJobItemInput {
  description: string;
  quantity: number;
  unitPriceCents: number;
}

export type CreateJobItemFieldErrors = Partial<
  Record<keyof CreateJobItemInput, string>
>;
