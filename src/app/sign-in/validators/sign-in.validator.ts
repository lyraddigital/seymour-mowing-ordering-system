import { object, string } from "zod";

import { ValidationResponse } from "@/app/core/types";
import { validateSchema } from "@/app/core/validators";

import { formFields } from "@/app/sign-in/constants";
import { Credentials } from "@/app/sign-in/types";

const CredentialsSchema = object({
  username: string().nonempty({ error: "Username is required" }),
  password: string().nonempty({ error: "Pasword is required" }),
});

function validateSignIn(formData: FormData): ValidationResponse<Credentials> {
  return validateSchema(CredentialsSchema, {
    username: formData.get(formFields.username),
    password: formData.get(formFields.password),
    rememberMe: formData.get(formFields.rememberMe),
  } as Credentials);
}

export default validateSignIn;
