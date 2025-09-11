'use client';

import { useState } from "react";

import { ConfirmDialog } from "@/app/core/components/ui/dialogs";
import { DataTableContainer, DataTableTextContent } from "@/app/core/components/ui/tables";
import { Customer } from "@/app/core/data/models";
import { PagedData } from "@/app/core/types";

import { CustomerCellContent } from "./customer-table";

export default function CustomerDatasource({ data }: { data: PagedData<Customer> }) {
    const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);

    return (
        <>
            <DataTableContainer
                initialData={data}
                getPageDataRoute="/api/customers"
                pageSize={10}
                tableConfiguration={{
                    columns: [
                        {
                            content: {
                                body: ({ data }) => <DataTableTextContent text={data.customerNumber} />
                            },
                            header: {
                                text: "ID"
                            },
                            width: 120
                        },
                        {
                            content: {
                                body: ({ data }) => <CustomerCellContent customer={data} />
                            },
                            header: {
                                text: "Customer"
                            }
                        },
                        {
                            content: {
                                body: () => <DataTableTextContent text={"12"} />
                            },
                            header: {
                                text: "Active Jobs"
                            },
                            hidden: {
                                md: true
                            },
                            width: 120
                        },
                        {
                            content: {
                                body: () => <DataTableTextContent text={"1"} />
                            },
                            header: {
                                text: "Invoices Pending"
                            },            
                            hidden: {
                                md: true
                            },
                            width: 160
                        },
                        {
                            content: {
                                body: () => <DataTableTextContent text={"Actions go here"} />
                            },
                            header: {
                                text: "Actions"
                            },
                            width: 120
                        }
                    ]
                }} 
            />
            <ConfirmDialog
                open={showDeleteDialog}
                title="Delete Customer"
                message="Are you sure you want to delete this customer?"
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={() => {}}
                onCancel={() => setShowDeleteDialog(false)}
            />
        </>
    );
}