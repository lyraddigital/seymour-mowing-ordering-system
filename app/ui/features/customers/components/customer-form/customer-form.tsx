import { Form, Link, useNavigation } from "react-router";
import type { CustomerFormValues } from "./customer-form-values";
import styles from "./customer-form.module.css";

export default function CustomerForm({
  values,
  fieldErrors,
  submitLabel = "Create customer",
  cancelTo = "/customers",
}: {
  values?: CustomerFormValues;
  submitLabel?: string;
  cancelTo?: string;
  fieldErrors?: { name?: string };
}) {
  const navigation = useNavigation();
  const saving = navigation.state !== "idle";
  return (
    <Form method="post" className={styles.form} aria-busy={saving}>
      <fieldset className={styles.section}>
        <legend>Customer</legend>
        <p className={styles.sectionHint}>Name is the only required field.</p>
        <div className={styles.fields}>
          <div className={styles.fullField}>
            <label htmlFor="name">
              Name <span className={styles.required}>Required</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="off"
              defaultValue={values?.name ?? ""}
              required
              aria-invalid={!!fieldErrors?.name}
              aria-describedby={fieldErrors?.name ? "name-error" : undefined}
            />
            {fieldErrors?.name && (
              <p className={styles.fieldError} id="name-error" role="alert">
                {fieldErrors.name}
              </p>
            )}
          </div>
        </div>
      </fieldset>
      <fieldset className={styles.section}>
        <legend>Contact</legend>
        <p className={styles.sectionHint}>How to get in touch.</p>
        <div className={styles.fields}>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={values?.email ?? ""}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              defaultValue={values?.phone ?? ""}
            />
          </div>
        </div>
      </fieldset>
      <fieldset className={styles.section}>
        <legend>Address</legend>
        <p className={styles.sectionHint}>
          Service address in Victoria. All address fields are optional.
        </p>
        <div className={styles.addressFields}>
          <div className={styles.fullField}>
            <label htmlFor="addressLine1">Address line 1</label>
            <input
              id="addressLine1"
              name="addressLine1"
              type="text"
              autoComplete="address-line1"
              defaultValue={values?.addressLine1 ?? ""}
            />
          </div>
          <div className={styles.fullField}>
            <label htmlFor="addressLine2">Address line 2</label>
            <input
              id="addressLine2"
              name="addressLine2"
              type="text"
              autoComplete="address-line2"
              defaultValue={values?.addressLine2 ?? ""}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="suburb">Suburb</label>
            <input
              id="suburb"
              name="suburb"
              type="text"
              autoComplete="address-level2"
              defaultValue={values?.suburb ?? ""}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="postcode">Postcode</label>
            <input
              id="postcode"
              name="postcode"
              type="text"
              autoComplete="postal-code"
              defaultValue={values?.postcode ?? ""}
            />
          </div>
        </div>
      </fieldset>
      <fieldset className={styles.section}>
        <legend>Notes</legend>
        <p className={styles.sectionHint}>Useful details for your team.</p>
        <div className={styles.fields}>
          <div className={styles.fullField}>
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              defaultValue={values?.notes ?? ""}
            />
          </div>
        </div>
      </fieldset>
      <div className={styles.actions}>
        <button
          className={styles.primaryAction}
          type="submit"
          disabled={saving}
        >
          {saving ? "Saving…" : submitLabel}
        </button>
        <Link className={styles.secondaryAction} to={cancelTo}>
          Cancel
        </Link>
        <span className={styles.savingStatus} role="status">
          {saving ? "Saving customer details…" : ""}
        </span>
      </div>
    </Form>
  );
}
