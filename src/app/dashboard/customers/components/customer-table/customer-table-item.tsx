'use client';

import { Avatar, Grid, IconButton, TableCell } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useRouter } from "next/navigation";
import { useState } from "react";

import { pagePaths } from "@/app/core/configuration";
import { Customer } from "@/app/core/data/models";
import { ConfirmDialog } from "@/app/core/components/ui/dialogs";

type CustomerTableItemProps = {
  data: Customer;
};

export default function CustomerTableItem({ data }: CustomerTableItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const router = useRouter();

  const redirectToViewScreen = (customerNumber: string) => {
    router.push(`${pagePaths.customers}/${customerNumber}`);
  };

  return (
    <>
      <TableCell width={120}>
        {data.customerNumber}
      </TableCell>
      <TableCell>
        <Grid container gap={3} flexWrap="nowrap">
          <Avatar sx={{
              width: 40,
              height: 40,
              bgcolor: "secondary.main",
              color: "secondary.contrastText",
            }}>
            { !data.profilePicUrl ? <img src={"https://pbs.twimg.com/profile_images/884488953725947905/Uef29ZQc_400x400.jpg"} alt="Profile" style={{ width: 40, height: 40, borderRadius: "50%" }} /> : "S" }
          </Avatar>
          <Grid container direction="column">
            <Grid>
              {data.customerName}
            </Grid>
            <Grid>
              {data.contactEmail}
            </Grid>
          </Grid>
        </Grid>
      </TableCell>
      <TableCell width={120}>12</TableCell>
      <TableCell width={160}>1</TableCell>
      <TableCell width={120}>        
        <Grid container justifyContent="flex-end" spacing={1}>
          <Grid container>            
            <IconButton color="inherit" size="small" onClick={() => redirectToViewScreen(data.customerNumber)}>
              <VisibilityIcon sx={{ opacity: 0.6 }} />
            </IconButton>
          </Grid>
          <Grid container>            
            <IconButton color="inherit" size="small" onClick={() => setShowDeleteDialog(true)}>
              <DeleteIcon sx={{ opacity: 0.6 }} />
            </IconButton>
          </Grid>
        </Grid>
      </TableCell>
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
