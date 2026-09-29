import type { FormHTMLAttributes } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

import CompleteJobDialog from "../../../../../../../app/ui/features/jobs/components/complete-job-dialog/complete-job-dialog";

// Render the billing step with the service price the user has entered.
vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return {
    ...react,
    useState: (initial: unknown) =>
      react.useState(
        initial === "warning" ? "billing" : initial === "" ? "100.00" : initial,
      ),
  };
});
vi.mock("react-router", () => ({
  useFetcher: () => ({
    state: "idle",
    data: {
      job: { servicePriceCents: 10000 },
      charges: {
        items: [
          {
            id: "charge",
            description: "Green waste",
            quantity: 3,
            unitPriceCents: 1000,
          },
        ],
        totalCents: 3000,
      },
    },
    Form: (props: FormHTMLAttributes<HTMLFormElement>) => <form {...props} />,
  }),
}));

it("reviews charge quantity, unit price, line amount and the full completion total", () => {
  const html = renderToStaticMarkup(
    <CompleteJobDialog
      job={{ id: "job", name: "Mowing" }}
      returnTo="detail"
      disabled={false}
    />,
  );
  expect(html).toContain("Green waste");
  expect(html).toContain("3 × $10.00");
  expect(html).toContain("$30.00");
  expect(html).toContain("$130.00");
});
