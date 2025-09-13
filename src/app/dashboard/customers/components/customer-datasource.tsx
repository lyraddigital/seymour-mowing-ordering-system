'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/app/core/components/ui/dialogs";
import { DataTableContainer, DataTableTextContent } from "@/app/core/components/ui/tables";
import { pagePaths } from "@/app/core/configuration";

import {
    CustomerNameCellContent,
    CustomerActionsCellContent
} from "./customer-table";
import { Customer } from "@/app/core/data/models";

export default function CustomerDatasource() {
    const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
    const router = useRouter();

    const redirectToViewScreen = (customerNumber: string) => {
        router.push(`${pagePaths.customers}/${customerNumber}`);
    };

    return (
        <>
            <DataTableContainer               
                tableConfiguration={{
                    columns: [
                        {
                            content: {
                                body: ({ data }: { data: Customer }) => <DataTableTextContent text={data.customerNumber} />
                            },
                            header: {
                                text: "ID"
                            },
                            width: 120
                        },
                        {
                            content: {
                                body: ({ data }: { data: Customer }) => <CustomerNameCellContent customer={data} />
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
                            alignment: 'right',
                            content: {
                                body: ({ data }: { data: Customer }) => (
                                    <CustomerActionsCellContent
                                        onDeletePressed={() => setShowDeleteDialog(true)}
                                        onViewPressed={() => redirectToViewScreen(data.customerNumber)}
                                    />
                                ),
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