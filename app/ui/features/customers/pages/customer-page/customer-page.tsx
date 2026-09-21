import { Link } from "react-router";
import type { CustomerDetails } from "../../../../../server/features/customers/types/customer-details";
import type { CustomerFinancialHistory } from "../../../../../server/features/customers/types/customer-financial-history";
import CustomerFinances from "../../components/customer-finances/customer-finances";
import CustomerArchiveActions from "../../components/customer-archive-actions/customer-archive-actions";
import ui from "../../../../styles/product.module.css";
import styles from "./customer-page.module.css";
type CustomerPageProps = {
  customer: CustomerDetails;
  canManage: boolean;
  financialHistory: CustomerFinancialHistory | null;
};
export default function CustomerPage({
  customer,
  canManage,
  financialHistory,
}: CustomerPageProps) {
  const archived = customer.archivedAt !== null;
  const locality = [customer.suburb, customer.state, customer.postcode]
    .filter(Boolean)
    .join(" ");
  const address = [
    customer.addressLine1,
    customer.addressLine2,
    locality,
  ].filter(Boolean);
  return (
    <section className={ui.page}>
      <Link
        className={ui.breadcrumb}
        to={archived ? "/customers/archived" : "/customers"}
      >
        {archived ? "← Archived customers" : "← Customers"} / Customer details
      </Link>
      <header className={ui.header}>
        <div>
          <div className={styles.title}>
            <h1 className="page-title">{customer.name}</h1>
            <span className={archived ? ui.archived : ui.active}>
              {archived ? "Archived" : "Active"}
            </span>
          </div>
          <p className={ui.intro}>
            {archived
              ? "Customer details and financial history are preserved. Restore this customer before editing."
              : "Contact details, service address and financial history."}
          </p>
        </div>
        {canManage &&
          (archived ? (
            <CustomerArchiveActions customerId={customer.id} archived />
          ) : (
            <Link
              className={ui.primaryAction}
              to={`/customers/${customer.id}/edit`}
            >
              Edit customer
            </Link>
          ))}
      </header>
      <div className={styles.details}>
        <section className={styles.info}>
          <h2>Contact</h2>
          {customer.email || customer.phone ? (
            <dl className={styles.detailList}>
              {customer.email && (
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${customer.email}`}>{customer.email}</a>
                  </dd>
                </div>
              )}
              {customer.phone && (
                <div>
                  <dt>Phone</dt>
                  <dd>
                    <a href={`tel:${customer.phone}`}>{customer.phone}</a>
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <p className={styles.muted}>No contact details added.</p>
          )}
        </section>
        <section className={styles.info}>
          <h2>Service address</h2>
          {address.length ? (
            <address className={styles.address}>
              {address.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </address>
          ) : (
            <p className={styles.muted}>No address added.</p>
          )}
        </section>
        <section className={styles.notes}>
          <h2>Notes</h2>
          {customer.notes ? (
            <p className={styles.noteText}>{customer.notes}</p>
          ) : (
            <p className={styles.muted}>No notes added.</p>
          )}
        </section>
      </div>
      {financialHistory && <CustomerFinances history={financialHistory} />}
      {canManage && !archived && (
        <section
          className={styles.danger}
          aria-labelledby="customer-danger-heading"
        >
          <h2 id="customer-danger-heading">Danger zone</h2>
          <p>
            Archive customers who are no longer active. Their records and
            financial history will be kept.
          </p>
          <CustomerArchiveActions customerId={customer.id} archived={false} />
        </section>
      )}
    </section>
  );
}
