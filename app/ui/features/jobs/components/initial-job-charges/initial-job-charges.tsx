import { useRef, useState } from "react";

import type { CreateJobFieldErrors } from "../../../../../server/features/jobs/types/create-job-input";
import type { JobItemFormValues } from "../../../../../server/features/jobs/validation/parse-job-item-form";
import ui from "../../../../styles/product.module.css";
import styles from "./initial-job-charges.module.css";

interface InitialJobChargesProps {
  values?: JobItemFormValues[];
  fieldErrors?: CreateJobFieldErrors;
  disabled: boolean;
}

interface ChargeRow {
  id: number;
  values: JobItemFormValues;
  errors: {
    description?: string;
    quantity?: string;
    unitPrice?: string;
  };
}

export default function InitialJobCharges({
  values = [],
  fieldErrors,
  disabled,
}: InitialJobChargesProps) {
  const nextId = useRef(values.length);

  const [rows, setRows] = useState<ChargeRow[]>(() =>
    values.map((value, index) => ({
      id: index,
      values: value,
      errors: {
        description: fieldErrors?.[`charges[${index}].description`],
        quantity: fieldErrors?.[`charges[${index}].quantity`],
        unitPrice: fieldErrors?.[`charges[${index}].unitPriceCents`],
      },
    })),
  );

  function addCharge() {
    const id = nextId.current++;

    setRows((current) => [
      ...current,
      {
        id,
        values: {
          description: "",
          quantity: "1",
          unitPrice: "",
        },
        errors: {},
      },
    ]);
  }

  function removeCharge(id: number) {
    setRows((current) => current.filter((row) => row.id !== id));
  }

  return (
    <section
      className={styles.section}
      aria-labelledby="additional-charges-heading"
    >
      <header>
        <h2 id="additional-charges-heading">Additional charges</h2>

        <p>Optional charges for this job. You can also add them later.</p>
      </header>

      {rows.map((row, index) => {
        const descriptionId = `charge-${row.id}-description`;
        const quantityId = `charge-${row.id}-quantity`;
        const unitPriceId = `charge-${row.id}-unit-price`;

        return (
          <fieldset key={row.id} className={styles.charge} disabled={disabled}>
            <legend>Charge {index + 1}</legend>

            <div className={styles.fields}>
              <div className={styles.description}>
                <label htmlFor={descriptionId}>Description</label>

                <input
                  id={descriptionId}
                  name={`charges[${index}].description`}
                  type="text"
                  required
                  maxLength={500}
                  defaultValue={row.values.description}
                  aria-invalid={!!row.errors.description}
                  aria-describedby={
                    row.errors.description
                      ? `${descriptionId}-error`
                      : undefined
                  }
                />

                {row.errors.description && (
                  <p
                    className={styles.error}
                    id={`${descriptionId}-error`}
                    role="alert"
                  >
                    {row.errors.description}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor={quantityId}>Quantity</label>

                <input
                  id={quantityId}
                  name={`charges[${index}].quantity`}
                  type="number"
                  min="1"
                  step="1"
                  required
                  defaultValue={row.values.quantity}
                  aria-invalid={!!row.errors.quantity}
                  aria-describedby={
                    row.errors.quantity ? `${quantityId}-error` : undefined
                  }
                />

                {row.errors.quantity && (
                  <p
                    className={styles.error}
                    id={`${quantityId}-error`}
                    role="alert"
                  >
                    {row.errors.quantity}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor={unitPriceId}>Unit price</label>

                <div className={styles.moneyField}>
                  <span aria-hidden="true">$</span>

                  <input
                    id={unitPriceId}
                    name={`charges[${index}].unitPrice`}
                    type="text"
                    inputMode="decimal"
                    required
                    defaultValue={row.values.unitPrice}
                    aria-invalid={!!row.errors.unitPrice}
                    aria-describedby={
                      row.errors.unitPrice
                        ? `${unitPriceId}-error`
                        : `${unitPriceId}-hint`
                    }
                  />
                </div>

                {row.errors.unitPrice ? (
                  <p
                    className={styles.error}
                    id={`${unitPriceId}-error`}
                    role="alert"
                  >
                    {row.errors.unitPrice}
                  </p>
                ) : (
                  <p className={styles.hint} id={`${unitPriceId}-hint`}>
                    Enter the unit price in Australian dollars.
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              className={ui.secondaryAction}
              aria-label={`Remove charge ${index + 1}`}
              onClick={() => removeCharge(row.id)}
            >
              Remove charge
            </button>
          </fieldset>
        );
      })}

      <button
        type="button"
        className={ui.secondaryAction}
        disabled={disabled}
        onClick={addCharge}
      >
        Add charge
      </button>
    </section>
  );
}
