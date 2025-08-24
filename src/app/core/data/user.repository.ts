import { GetCommand } from "@aws-sdk/lib-dynamodb";

import { DYNAMO_DB_TABLE_NAME } from "@/app/core/configuration";
import { dbClient } from "@/app/core/data/client";
import { User } from "@/app/core/data/models";

export default async function getUserByUsername(
  username: string
): Promise<User | undefined> {
  const result = await dbClient.send(
    new GetCommand({
      TableName: DYNAMO_DB_TABLE_NAME,
      Key: {
        pk: `USER#${username}`,
        sk: "PROFILE",
      },
    })
  );

  return result.Item as User | undefined;
}
