'use client';

import { DataTableContainer } from "@/app/core/components/ui/tables";
import { Customer } from "@/app/core/data/models";
import { PagedData } from "@/app/core/types";

export default function CustomerDatasource({ data }: { data: PagedData<Customer> }) {
  return (
    <DataTableContainer
      initialData={data}
      getPageDataRoute="/api/customers"
      pageSize={10}
      tableConfiguration={{
        columns: [{
            content: {
                body: ({ data }) => <div>{data.customerNumber}</div>
            },
            header: {
                text: "ID"
            },
            width: 120
        }, {
            content: {
                body: ({ data }) => <div>{data.customerName}</div>
            },
            header: {
                text: "Customer"
            }
        },
        {
            content: {
                body: ({ data }) => <div>{12}</div>
            },
            header: {
                text: "Active Jobs"
            },
            width: 120
        },
        {
            content: {
                body: ({ data }) => <div>{1}</div>
            },
            header: {
                text: "Invoices Pending"
            },
            width: 160
        },
        {
            content: {
                body: ({ data }) => <div>Actions go here</div>
            },
            header: {
                text: "Actions"
            },
            width: 120
        }]
       }} />
  );
}