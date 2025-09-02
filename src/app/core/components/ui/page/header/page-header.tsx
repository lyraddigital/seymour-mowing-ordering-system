import { Breadcrumbs, Typography, Divider, Box } from "@mui/material";

import { breadcrumbItems } from "@/app/core/configuration";

import BreadcrumbEntry from "./breadcrumb-entry";

type PageHeaderProps = {
  title: string;
  breadcrumbsKey?: string;
  actionItem?: React.ReactElement;
}

export default function PageHeader({ title, breadcrumbsKey, actionItem }: PageHeaderProps) {
  const breadcrumbs = breadcrumbsKey ? breadcrumbItems[breadcrumbsKey] || [] : [];

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" component="h2">{title}</Typography>
          <Breadcrumbs aria-label="breadcrumb" sx={{ pt: 2 }}>
            {breadcrumbs.map((item, index) =>
              <BreadcrumbEntry key={index} item={item} />
            )}
          </Breadcrumbs>
        </Box>
        {actionItem && (
          <Box
            sx={{
              mt: { xs: 10, sm: 0 },              
              display: 'flex'
            }}
          >
            {actionItem}
          </Box>
        )}
      </Box>
      <Divider sx={{ my: 6 }} />
    </>
  );
}
