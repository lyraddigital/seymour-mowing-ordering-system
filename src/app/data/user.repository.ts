import { User } from "@/app/types";

const users = [
  {
    username: "testuser",
    hashedPassword:
      "$2b$10$OHnhK6pJ7PfSkG6rgkKJUOXMElPNz54nwMAAc3ExFqysx538hFpbC",
  } as User,
];

export default async function getUserByUsername(
  username: string
): Promise<User | undefined> {
  const existingUser = users.find((u) => u.username === username);
  return await Promise.resolve(existingUser);
}
