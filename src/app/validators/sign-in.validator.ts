import { object, string } from "zod";

import { Credentials } from "@/app/types";

import validateSchema from "./schema.validator";
import ValidationResult from "./validation-result";

const CredentialsSchema = object({
  username: string().nonempty({ error: "Username is required" }),
  password: string().nonempty({ error: "Pasword is required" }),
});

function validateSignIn(formData: FormData): ValidationResult<Credentials> {
  return validateSchema(CredentialsSchema, {
    username: formData.get("username"),
    password: formData.get("password"),
    rememberMe: formData.get("rememberMe"),
  } as Credentials);
}

export default validateSignIn;
