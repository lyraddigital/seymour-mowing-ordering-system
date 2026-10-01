import type { CreateJobItemInput } from "./create-job-item-input";

export interface CreateJobInput {
  name: string;
  customerId: string;
  scheduledDate: string;
  description: string;
  charges?: CreateJobItemInput[];
}

export type CreateJobFieldErrors = Partial<
  Record<
    | Exclude<keyof CreateJobInput, "charges">
    | `charges[${number}].${keyof CreateJobItemInput}`,
    string
  >
>;
