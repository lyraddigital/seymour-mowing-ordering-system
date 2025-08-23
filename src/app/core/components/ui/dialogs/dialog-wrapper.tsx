import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import React from "react";

interface DialogWrapperProps {
  open: boolean;
  title: React.ReactNode;
  onClose: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function DialogWrapper({
  open,
  title,
  onClose,
  actions,
  children,
  maxWidth = "500px"
}: DialogWrapperProps) {
  return (
    <Dialog
      open={open}
      slotProps={{
        paper: {
          sx: {
            width: '95vw',
            maxWidth,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          pr: 4,
          pt: 3,
          pb: 0,
        }}
      >
        <Box sx={{ pt: 0.5 }}>{title}</Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          edge="end"
          size="small"
          color="primary"
          sx={{ mt: -1 }}
        >
          <CloseIcon color="primary" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {children}
      </DialogContent>
      {actions && (
        <DialogActions sx={{ px: 6, pb: 4 }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
}
