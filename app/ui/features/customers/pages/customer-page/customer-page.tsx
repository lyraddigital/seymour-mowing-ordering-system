import { Link } from "react-router";
import Icon from "../../../../components/icon/icon";
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
    [customer.addressLine1, customer.addressLine2].filter(Boolean).join(", "),
    locality,
  ].filter(Boolean);
  return (
    <section className={ui.page}>
      <div className={styles.breadcrumb}>
        <Link
          className={ui.breadcrumb}
          to={archived ? "/customers/archived" : "/customers"}
        >
          {archived ? "Archived customers" : "Customers"}
        </Link>
        <span aria-hidden="true">›</span>
        <span>{customer.name}</span>
      </div>
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
              : "Customer details, financial overview and related invoices and payments."}
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
              <Icon name="edit" />
              Edit customer
            </Link>
          ))}
      </header>
      <div className={styles.details}>
        <section className={styles.info}>
          <span className={styles.panelIcon}>
            <Icon name="contact" />
          </span>
          <div className={styles.panelContent}>
            <h2>Contact</h2>
            {customer.email || customer.phone ? (
              <dl className={styles.detailList}>
                {customer.email && (
                  <div>
                    <dt>
                      <Icon name="mail" />
                      <span className={styles.srOnly}>Email</span>
                    </dt>
                    <dd>
                      <a href={`mailto:${customer.email}`}>{customer.email}</a>
                    </dd>
                  </div>
                )}
                {customer.phone && (
                  <div>
                    <dt>
                      <Icon name="contact" />
                      <span className={styles.srOnly}>Phone</span>
                    </dt>
                    <dd>
                      <a href={`tel:${customer.phone}`}>{customer.phone}</a>
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className={styles.muted}>No contact details added.</p>
            )}
          </div>
        </section>
        <section className={styles.info}>
          <span className={styles.panelIcon}>
            <Icon name="address" />
          </span>
          <div className={styles.panelContent}>
            <h2>Address</h2>
            {address.length ? (
              <address className={styles.address}>
                {address.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </address>
            ) : (
              <p className={styles.muted}>No address added.</p>
            )}
          </div>
        </section>
        <section className={styles.notes}>
          <span className={styles.panelIcon}>
            <Icon name="notes" />
          </span>
          <div className={styles.panelContent}>
            <h2>Notes</h2>
            {customer.notes ? (
              <p className={styles.noteText}>{customer.notes}</p>
            ) : (
              <p className={styles.muted}>No notes added.</p>
            )}
          </div>
        </section>
      </div>
      {financialHistory && <CustomerFinances history={financialHistory} />}
      {canManage && !archived && (
        <section
          className={styles.danger}
          aria-labelledby="customer-danger-heading"
        >
          <span className={styles.dangerIcon}>
            <Icon name="danger" />
          </span>
          <div className={styles.dangerCopy}>
            <h2 id="customer-danger-heading">Danger zone</h2>
            <p>
              Archive customers who are no longer active. Their records and
              financial history will be kept.
            </p>
          </div>
          <CustomerArchiveActions customerId={customer.id} archived={false} />
        </section>
      )}
    </section>
  );
}
