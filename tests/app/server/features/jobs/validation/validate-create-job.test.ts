import { expect, it } from "vitest";
import { validateCreateJob } from "../../../../../../app/server/features/jobs/validation/validate-create-job";
import { JobValidationError } from "../../../../../../app/server/features/jobs/errors/job-validation-error";

const valid = {
  customerId: "customer",
  scheduledDate: "2028-02-29",
  name: "Lawn service",
  description: "Mow lawn",
};
it("trims valid input and accepts a leap day", () => {
  expect(
    validateCreateJob({
      customerId: " customer ",
      scheduledDate: " 2028-02-29 ",
      name: "  Lawn service \n",
      description: " Mow lawn \n",
    }),
  ).toEqual(valid);
});
it.each([
  ["name", ""],
  ["name", " \n\t"],
  ["name", "x".repeat(201)],
  ["customerId", ""],
  ["customerId", " \t"],
  ["scheduledDate", ""],
  ["scheduledDate", "2026-02-29"],
  ["scheduledDate", "2026-04-31"],
  ["scheduledDate", "2026-13-01"],
  ["scheduledDate", "2026-00-10"],
  ["scheduledDate", "2026-01-00"],
  ["scheduledDate", "2026-1-01"],
  ["scheduledDate", "not a date"],
  ["scheduledDate", "2026-01-01T00:00:00Z"],
  ["scheduledDate", "0000-01-01"],
  ["description", " \n\t"],
  ["description", "x".repeat(2001)],
])("rejects invalid %s (%s)", (field, value) => {
  expect(() => validateCreateJob({ ...valid, [field]: value })).toThrow(
    JobValidationError,
  );
  try {
    validateCreateJob({ ...valid, [field]: value });
  } catch (error) {
    expect(error).toMatchObject({
      fieldErrors: { [field]: expect.any(String) },
    });
  }
});
it("accepts a name at the 200-character limit", () => {
  expect(
    validateCreateJob({ ...valid, name: "x".repeat(200) }).name,
  ).toHaveLength(200);
});
it("accepts the description limit and dates at the supported boundaries", () => {
  for (const scheduledDate of ["0001-01-01", "9999-12-31"]) {
    expect(
      validateCreateJob({
        ...valid,
        scheduledDate,
        name: "Lawn service",
        description: "x".repeat(2000),
      }).description,
    ).toHaveLength(2000);
  }
});
