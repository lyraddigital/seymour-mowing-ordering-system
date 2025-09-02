import { getDbClient } from "@/app/core/data/client";

import { User } from "@/app/core/data/models";

export async function getUserByUsername(
  username: string
): Promise<User | undefined> {
  const dbClient = await getDbClient();
  const user = await dbClient.user.findUnique({ where: { username }});

  if (!user) {
    return undefined;
  }

  return {
    username: user.username,
    hashedPassword: user.hashedPassword
  };
}
