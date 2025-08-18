import { compare } from "bcrypt";

export async function checkPassword(
  plainTextPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return await compare(plainTextPassword, hashedPassword);
}
