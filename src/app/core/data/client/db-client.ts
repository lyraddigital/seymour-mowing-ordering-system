import { PrismaClient } from "@prisma/client";

import {  
  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_NAME,
  DATABASE_USERNAME,
  DATABASE_PASSWORD
} from "@/app/core/configuration";

let dbClient: PrismaClient | null = null;

async function getDbClient(): Promise<PrismaClient> {
  if (!dbClient) {
    const host = DATABASE_HOST;
    const port = DATABASE_PORT;
    const dbName = DATABASE_NAME;
    const username = DATABASE_USERNAME;
    const password = DATABASE_PASSWORD;

    const url = `postgresql://${username}:${password}@${host}:${port}/${dbName}?schema=public`;

    dbClient = new PrismaClient({ datasources: { db: { url } } });
  }

  return dbClient;
}

export default getDbClient;
