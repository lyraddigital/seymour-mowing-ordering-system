import { useEffect, useId, useRef, useState } from "react";
import { useFetcher } from "react-router";

import type {
  action,
  loader,
} from "../../../../../routes/jobs.$jobId.complete";
import type { JobSummary } from "../../../../../server/features/jobs/types/job-summary";
import { parseServicePrice } from "../../../../../server/features/jobs/validation/parse-service-price";
import ui from "../../../../styles/product.module.css";
import styles from "./complete-job-dialog.module.css";

const currency = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

interface CompleteJobDialogProps {
  job: Pick<JobSummary, "id" | "name">;
  returnTo: "list" | "detail";
  disabled: boolean;
}

export default function CompleteJobDialog({
  job,
  returnTo,
  disabled,
}: CompleteJobDialogProps) {
  const review = useFetcher<typeof loader>();
  const completion = useFetcher<typeof action>();
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const priceInput = useRef<HTMLInputElement>(null);
  const id = useId();
  const [step, setStep] = useState<"warning" | "billing">("warning");
  const [servicePrice, setServicePrice] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const busy = completion.state !== "idle";
  const error = submitted ? completion.data?.error : undefined;
  const parsed = parseServicePrice(servicePrice);
  const charges = review.data?.charges;
  const total =
    parsed.success && parsed.value !== null && charges
      ? parsed.value + charges.totalCents
      : null;

  useEffect(() => {
    if (dialog.current?.open) {
      if (step === "billing") priceInput.current?.focus();
      else title.current?.focus();
    }
  }, [step]);

  function open() {
    setStep("warning");
    setSubmitted(false);
    setServicePrice("");
    setReviewed(false);
    void review.load(`/jobs/${job.id}/complete`);
    dialog.current?.showModal();
    title.current?.focus();
  }

  function continueToBilling() {
    const price = review.data?.job.servicePriceCents;
    if (!reviewed && price !== undefined)
      setServicePrice(price === null ? "" : (price / 100).toFixed(2));
    setReviewed(true);
    setStep("billing");
  }

  return (
    <>
      <button
        type="button"
        className={ui.secondaryAction}
        disabled={disabled}
        onClick={open}
      >
        Complete Job
      </button>
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby={`${id}-title`}
        onCancel={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <header className={styles.header}>
          <div>
            <h2 ref={title} id={`${id}-title`} tabIndex={-1}>
              {step === "warning" ? "Complete this job?" : "Finalise billing"}
            </h2>
            <p className={styles.context}>{job.name}</p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Close"
            disabled={busy}
            onClick={() => dialog.current?.close()}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div className={styles.body}>
          <div hidden={step !== "warning"}>
            <p>
              Completing the job finalises its billable details. Make sure all
              additional charges have been added before continuing.
            </p>
            <p>
              You can reopen the job later only if it hasn't been added to an
              invoice.
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className={ui.primaryAction}
                disabled={!review.data || review.state !== "idle"}
                onClick={continueToBilling}
              >
                Continue
              </button>
              <button
                type="button"
                className={ui.secondaryAction}
                onClick={() => dialog.current?.close()}
              >
                Cancel
              </button>
            </div>
            {review.state !== "idle" && (
              <p role="status">Loading billing details…</p>
            )}
          </div>
          <div hidden={step !== "billing"}>
            <completion.Form
              method="post"
              action={`/jobs/${job.id}/complete`}
              aria-busy={busy}
              onSubmit={() => setSubmitted(true)}
            >
              <input type="hidden" name="returnTo" value={returnTo} />
              <div className={styles.priceField}>
                <label htmlFor={`${id}-price`}>Service price</label>
                <div
                  className={`${styles.moneyField} ${
                    error ? styles.moneyFieldError : ""
                  }`}
                >
                  <span aria-hidden="true">$</span>
                  <input
                    ref={priceInput}
                    id={`${id}-price`}
                    name="servicePrice"
                    type="text"
                    inputMode="decimal"
                    required
                    value={servicePrice}
                    onChange={(event) => {
                      setServicePrice(event.target.value);
                      setSubmitted(false);
                    }}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : undefined}
                    disabled={busy}
                  />
                  <span className={styles.currencyCode}>AUD</span>
                </div>
                {error && (
                  <p id={`${id}-error`} role="alert" className={styles.error}>
                    {error}
                  </p>
                )}
              </div>
              <h3>Additional charges</h3>
              {charges?.items.length ? (
                <ul className={styles.charges}>
                  {charges.items.map((item) => (
                    <li key={item.id}>
                      <span>{item.description}</span>
                      <strong>{currency.format(item.amountCents / 100)}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No additional charges.</p>
              )}
              <p className={styles.total} aria-live="polite">
                <span>Job total</span>
                <strong>
                  {total === null
                    ? "Enter a valid service price"
                    : currency.format(total / 100)}
                </strong>
              </p>
              <div className={styles.actions}>
                <button
                  type="submit"
                  className={ui.primaryAction}
                  disabled={busy || !charges}
                >
                  {busy ? "Completing…" : "Complete job"}
                </button>
                <button
                  type="button"
                  className={ui.secondaryAction}
                  disabled={busy}
                  onClick={() => setStep("warning")}
                >
                  Back
                </button>
              </div>
            </completion.Form>
          </div>
        </div>
      </dialog>
    </>
  );
}
