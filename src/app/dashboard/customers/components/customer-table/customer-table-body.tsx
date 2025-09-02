'use client';

import { TableCell } from "@mui/material";

import Customer from "@/app/core/data/models/customer";

type CustomerTableBodyProps = {
  data: Customer;
};

export default function CustomerTableBody({ data }: CustomerTableBodyProps) {
  return (
    <>
        <TableCell>{data.customerNumber}</TableCell>
        <TableCell>{data.customerName}</TableCell>
        <TableCell>{data.contactName}</TableCell>
        <TableCell>{data.contactEmail}</TableCell>
        <TableCell>{data.contactPhone}</TableCell>
        <TableCell>
            {data.profilePicUrl ? (
                <img src={data.profilePicUrl} alt="Profile" style={{ width: 40, height: 40, borderRadius: "50%" }} />
            ) : "-"}
        </TableCell>        
    </>
  );
}
