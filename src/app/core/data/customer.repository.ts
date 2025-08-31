import {
  GetCommand,
  TransactWriteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

import {
  DYNAMO_DB_TABLE_NAME,
  DYNAMODB_CUSTOMER_SEARCH_INDEX,
} from "@/app/core/configuration";
import { dbClient } from "@/app/core/data/client";
import { EntityType } from "@/app/core/data/entity-type";
import { Customer, PagedData } from "@/app/core/data/models";

export async function getNextCustomerCounter(): Promise<number> {
  const counterResult = await dbClient.send(
    new GetCommand({
      TableName: DYNAMO_DB_TABLE_NAME,
      Key: { pk: "CUSTOMER_COUNTER", sk: "COUNTER" },
    })
  );

  return (counterResult.Item?.currentValue || 0) + 1;
}

export async function getCustomersPage(
  limit: number = 30,
  lastKey?: Record<string, unknown>
): Promise<PagedData<Customer>> {
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const result = await dbClient.send(
    new QueryCommand({
      TableName: DYNAMO_DB_TABLE_NAME,
      IndexName: DYNAMODB_CUSTOMER_SEARCH_INDEX,
      KeyConditionExpression: "entityType = :entityType",
      ExpressionAttributeValues: {
        ":entityType": EntityType.customer,
      },
      Limit: limit,
      ExclusiveStartKey: lastKey,
      ScanIndexForward: true,
    })
  );

  return {
    items: (result.Items ?? []) as Customer[],
    lastEvaluatedKey: result.LastEvaluatedKey,
  };
}

export async function saveCustomer(customer: Customer): Promise<void> {
  const customerNumber = parseInt(customer.customerNumber.split("-")[1], 10);

  await dbClient.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: DYNAMO_DB_TABLE_NAME,
            Item: {
              pk: `CUSTOMER#${customer.customerNumber}`,
              sk: "PROFILE",
              ...customer,
              entityType: EntityType.customer,
              createdAt: customer.createdAt.toISOString(),
              updatedAt: customer.updatedAt.toISOString(),
            },
          },
        },
        {
          Update: {
            TableName: DYNAMO_DB_TABLE_NAME,
            Key: { pk: "CUSTOMER_COUNTER", sk: "COUNTER" },
            UpdateExpression:
              "SET currentValue = :newValue, entityType = :entityType",
            ExpressionAttributeValues: {
              ":newValue": customerNumber,
              ":entityType": EntityType.customerCounter,
            },
          },
        },
      ],
    })
  );
}
