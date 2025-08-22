import AddIcon from "@mui/icons-material/Add";

import { PageHeader } from "@/app/core/components/ui/page/header";
import { ActionButton } from "@/app/core/components/ui/forms/buttons";

export default function CustomersPage() {
  const addButton = (
    <ActionButton text="Add customer" icon={<AddIcon />} />
  );

  return (
    <PageHeader title="Customers" breadcrumbsKey="customers" actionItem={addButton} />
  );
}
