'use client';

import { Avatar, Grid, IconButton, TableCell } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useRouter } from "next/navigation";
import { useState } from "react";

import Customer from "@/app/core/data/models/customer";

type CustomerTableBodyProps = {
  data: Customer;
};

export default function CustomerTableBody({ data }: CustomerTableBodyProps) {    
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const router = useRouter();

  const redirectToViewScreen = (customerNumber: string) => {
    router.push(`/dashboard/customers/${customerNumber}`)
  };
  
  console.log('Show delete modal?: ', showDeleteModal);

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
            <IconButton color="inherit" size="small" onClick={() => setShowDeleteModal(true)}>
              <DeleteIcon sx={{ opacity: 0.6 }} />
            </IconButton>
          </Grid>
        </Grid>
      </TableCell>
    </>
  );
}
