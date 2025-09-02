import { Link, Typography } from "@mui/material";

import { BreadcrumbItem } from "@/app/core/types";

type BreadcrumbEntryProps = {
  item: BreadcrumbItem;
}

export default function BreadcrumbEntry({ item }: BreadcrumbEntryProps) {
  return item.href ? (
    <Link
      href={item.href}
      underline="none"
      sx={{
        "&:hover, &:focus, &:active": {
          textDecoration: "underline",
        },
      }}
    >
      {item.text}
    </Link>
  ) : (
    <Typography color="text.primary" sx={{ opacity: 0.6 }}>
      {item.text}
    </Typography>
  );
}