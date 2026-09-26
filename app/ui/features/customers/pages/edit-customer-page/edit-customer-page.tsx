import { Link } from "react-router";

import type { CustomerDetails } from "../../../../../server/features/customers/types/customer-details";
import ui from "../../../../styles/product.module.css";
import CustomerForm from "../../components/customer-form/customer-form";
import type { CustomerFormValues } from "../../components/customer-form/customer-form-values";
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
    <section className={`${ui.page} ${styles.page}`}>
      <div className={styles.breadcrumb}>
        <Link className={ui.breadcrumb} to="/customers">
          Customers
        </Link>

        <span aria-hidden="true">›</span>

        <Link className={ui.breadcrumb} to={`/customers/${customer.id}`}>
          {customer.name}
        </Link>

        <span aria-hidden="true">›</span>
        <span>Edit</span>
      </div>

      <header className={ui.header}>
        <div>
          <h1 className="page-title">Edit customer</h1>

          <p className={ui.intro}>
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
