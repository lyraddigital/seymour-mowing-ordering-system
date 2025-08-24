import { treeifyError, ZodObject } from "zod";

import { ValidationResult } from "@/app/core/types";

function validateSchema<T>(schema: ZodObject, data: T): ValidationResult<T> {
  const validationResult = schema.safeParse(data);

  if (!validationResult.success) {
    const vodErrors = treeifyError(validationResult.error);
    const fields = !!vodErrors.properties
      ? Object.keys(vodErrors.properties)
      : [];
    const messages = !!vodErrors.properties
      ? Object.values(vodErrors.properties)
          .filter((p) => !!p)
          .flatMap((p) => p.errors)
      : [];

    return {
      success: validationResult.success,
      data,
      errors: { fields, messages },
    } as ValidationResult<T>;
  }

  return {
    success: validationResult.success,
    data,
  };
}

export default validateSchema;
