import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { PrismaClient } from "@prisma/client";

import {
  DATABASE_REGION,
  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_NAME,
  DATABASE_SECRET_ID,
} from "@/app/core/configuration";

let dbClient: PrismaClient | null = null;

async function getDbCredentials() {
  const client = new SecretsManagerClient({ region: DATABASE_REGION });
  const command = new GetSecretValueCommand({ SecretId: DATABASE_SECRET_ID });
  const response = await client.send(command);

  if (!response.SecretString) {
    throw new Error("No secret string found");
  }

  return JSON.parse(response.SecretString);
}

async function getDbClient(): Promise<PrismaClient> {
  if (!dbClient) {
    const creds = await getDbCredentials();
    const host = DATABASE_HOST;
    const port = DATABASE_PORT;
    const dbName = DATABASE_NAME;
    const { username, password } = creds;

    const url = `postgresql://${username}:${password}@${host}:${port}/${dbName}?schema=public`;

    dbClient = new PrismaClient({ datasources: { db: { url } } });
  }

  return dbClient;
}

export default getDbClient;
