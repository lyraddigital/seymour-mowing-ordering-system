import { Link } from "react-router";

import type { InvoiceSummary } from "../../../../../server/features/invoices/types/invoice-summary";
import Icon from "../../../../components/icon/icon";
import ui from "../../../../styles/product.module.css";
import InvoiceList from "../../components/invoice-list/invoice-list";

interface InvoicesPageProps {
  invoices: InvoiceSummary[];
  canManage: boolean;
}

export default function InvoicesPage({
  invoices,
  canManage,
}: InvoicesPageProps) {
  return (
    <section className={ui.page}>
      <header className={ui.header}>
        <div>
          <h1 className="page-title">Invoices</h1>

          <p className={ui.intro}>
            Draft, issued and voided invoices for your customers.
          </p>
        </div>

        {canManage && (
          <Link className={ui.primaryAction} to="/invoices/new">
            <Icon name="plus" />
            Create invoice
          </Link>
        )}
      </header>

      {invoices.length ? (
        <InvoiceList invoices={invoices} />
      ) : (
        <div className={ui.emptyState}>
          <h2>No invoices yet</h2>

          <p>
            Create an invoice from completed work when you are ready to bill a
            customer.
          </p>

          {canManage && (
            <Link className={ui.primaryAction} to="/invoices/new">
              <Icon name="plus" />
              Create invoice
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
