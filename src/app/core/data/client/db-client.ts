import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { DYNAMO_DB_REGION } from "@/app/core/configuration";

const client = new DynamoDBClient({ region: DYNAMO_DB_REGION });
const dbClient = DynamoDBDocumentClient.from(client);

export default dbClient;
