'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

interface AddCustomerDialogProps {
  open: boolean;
  cancelPressed: () => void;
  createPressed: () => void;
}

export default function AddCustomerDialog({ open, cancelPressed, createPressed }: AddCustomerDialogProps) {
  return (
    <Dialog open={open}>
      <DialogTitle>Add Customer</DialogTitle>
      <DialogContent>
        Dialog goes here
      </DialogContent>
      <DialogActions>
        <Button onClick={cancelPressed}>Cancel</Button>
        <Button variant="contained" onClick={createPressed}>Create</Button>
      </DialogActions>
    </Dialog>
  );
}
