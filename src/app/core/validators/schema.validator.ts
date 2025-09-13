import { treeifyError, ZodObject } from "zod";

import { ValidationResponse } from "@/app/core/types";

function validateSchema<T>(schema: ZodObject, data: T): ValidationResponse<T> {
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
      data,
      validationResult: {
        success: validationResult.success,      
        errors: { fields, messages },
      }
    };
  }

  return {
    data,
    validationResult: {
      success: validationResult.success    
    }
  };
}

export default validateSchema;
