import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import React, { PropsWithChildren } from "react";

type DialogWrapperProps = PropsWithChildren & {
    actions?: React.ReactNode;
    maxWidth?: string;
    onClose: () => void;
    open: boolean;
    title: React.ReactNode;
};

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
        <Box component="span" sx={{ pt: 0.5 }}>{title}</Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          size="small"
          color="primary"
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
