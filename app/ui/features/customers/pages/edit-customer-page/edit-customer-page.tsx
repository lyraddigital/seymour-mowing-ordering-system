import { Link } from "react-router";

import type { CustomerDetails } from "../../../../../server/features/customers/types/customer-details";
import type { CustomerFormValues } from "../../components/customer-form/customer-form-values";
import CustomerForm from "../../components/customer-form/customer-form";
import styles from "./edit-customer-page.module.css";

export default function EditCustomerPage({
  customer,
  values,
  fieldErrors,
}: {
  customer: CustomerDetails;
  values?: CustomerFormValues;
  fieldErrors?: { name?: string };
}) {
  return (
    <section className={styles.page}>
      <Link className={styles.backLink} to={`/customers/${customer.id}`}>
        ← Customer details
      </Link>

      <header className={styles.header}>
        <div>
          <h1 className="page-title">Edit customer</h1>
          <p className={styles.intro}>
            Update contact details, address, or notes for this customer.
          </p>
        </div>
      </header>

      <CustomerForm
        values={values ?? customer}
        fieldErrors={fieldErrors}
        submitLabel="Save changes"
        cancelTo={`/customers/${customer.id}`}
      />
    </section>
  );
}
