import { Link } from "react-router";
import type { CreateCustomerInput } from "../../../server/features/customers/types/create-customer-input";
import CustomerForm from "./customer-form";
import styles from "./customers-page.module.css";

export default function NewCustomerPage({
  values,
  fieldErrors,
}: {
  values?: CreateCustomerInput;
  fieldErrors?: { name?: string };
}) {
  return (
    <section className={styles.formPage}>
      <Link className={styles.backLink} to="/customers">
        ← Customers
      </Link>
      <header className={styles.header}>
        <div>
          <h1 className="page-title">New customer</h1>
          <p className={styles.intro}>
            Start with a name. Add other details as needed.
          </p>
        </div>
      </header>
      <CustomerForm values={values} fieldErrors={fieldErrors} />
    </section>
  );
}
