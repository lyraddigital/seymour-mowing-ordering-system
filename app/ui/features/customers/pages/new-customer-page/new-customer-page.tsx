import { Link } from "react-router";

import type { CreateCustomerInput } from "../../../../../server/features/customers/types/create-customer-input";
import ui from "../../../../styles/product.module.css";
import CustomerForm from "../../components/customer-form/customer-form";
import styles from "./new-customer-page.module.css";

export default function NewCustomerPage({
  values,
  fieldErrors,
}: {
  values?: CreateCustomerInput;
  fieldErrors?: { name?: string };
}) {
  return (
    <section className={`${ui.page} ${styles.page}`}>
      <div className={styles.breadcrumb}>
        <Link className={ui.breadcrumb} to="/customers">
          Customers
        </Link>

        <span aria-hidden="true">›</span>
        <span>New customer</span>
      </div>

      <header className={ui.header}>
        <div>
          <h1 className="page-title">New customer</h1>

          <p className={ui.intro}>
            Start with a name. Add other details as needed.
          </p>
        </div>
      </header>

      <CustomerForm values={values} fieldErrors={fieldErrors} />
    </section>
  );
}
