import { Breadcrumbs, Link, Typography } from "@mui/material";

import { breadcrumbItems } from "@/app/core/configuration";

interface PageHeaderProps {
  title: string;
  breadcrumbsKey?: string;
}

export default function PageHeader({ title, breadcrumbsKey }: PageHeaderProps) {
  const breadcrumbs = breadcrumbsKey ? breadcrumbItems[breadcrumbsKey] || [] : [];

  return (
    <>
      <Typography variant="h5" component="h2">{title}</Typography>
      <Breadcrumbs aria-label="breadcrumb" sx={{ pt: 2 }}>
        {breadcrumbs.map((crumb, index) =>
          crumb.href ? (
            <Link key={index} href={crumb.href}>
              {crumb.text}
            </Link>
          ) : (
            <Typography key={index} color="text.primary">
              {crumb.text}
            </Typography>
          )
        )}
      </Breadcrumbs>
    </>
  );
}
