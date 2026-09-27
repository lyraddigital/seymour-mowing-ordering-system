export interface EditJobFormValues {
  name: string;
  description: string;
  scheduledDate: string;
  servicePrice: string;
}

export type EditJobFormFieldErrors = Partial<
  Record<keyof EditJobFormValues, string>
>;
