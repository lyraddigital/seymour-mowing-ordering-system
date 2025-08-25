import { GetCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

import { DYNAMO_DB_TABLE_NAME } from "@/app/core/configuration";
import { dbClient } from "@/app/core/data/client";
import { Customer } from "@/app/core/data/models";
import { EntityType } from "@/app/core/data/entity-type";

export async function getNextCustomerCounter(): Promise<number> {
  const counterResult = await dbClient.send(
    new GetCommand({
      TableName: DYNAMO_DB_TABLE_NAME,
      Key: { pk: "CUSTOMER_COUNTER", sk: "COUNTER" },
    })
  );

  return (counterResult.Item?.currentValue || 0) + 1;
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
