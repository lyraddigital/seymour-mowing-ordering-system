export interface EditJobFormValues {
  name: string;
  description: string;
  scheduledDate: string;
}

export type EditJobFormFieldErrors = Partial<
  Record<keyof EditJobFormValues, string>
>;
