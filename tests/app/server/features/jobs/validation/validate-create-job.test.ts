import { expect, it } from "vitest";
import { JobValidationError } from "../../../../../../app/server/features/jobs/errors/job-validation-error";
import { validateCreateJob } from "../../../../../../app/server/features/jobs/validation/validate-create-job";

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
  ).toEqual({
    ...valid,
    charges: [],
  });
});

it("accepts a job with no additional charges", () => {
  expect(validateCreateJob(valid)).toEqual({
    ...valid,
    charges: [],
  });
});

it("validates and normalises an initial additional charge", () => {
  expect(
    validateCreateJob({
      ...valid,
      charges: [
        {
          description: "  Green waste removal  ",
          quantity: 3,
          unitPriceCents: 1500,
        },
      ],
    }),
  ).toEqual({
    ...valid,
    charges: [
      {
        description: "Green waste removal",
        quantity: 3,
        unitPriceCents: 1500,
      },
    ],
  });
});

it("validates and normalises multiple initial additional charges", () => {
  expect(
    validateCreateJob({
      ...valid,
      charges: [
        {
          description: "  Green waste removal  ",
          quantity: 2,
          unitPriceCents: 1500,
        },
        {
          description: "  Fertiliser  ",
          quantity: 4,
          unitPriceCents: 725,
        },
      ],
    }),
  ).toEqual({
    ...valid,
    charges: [
      {
        description: "Green waste removal",
        quantity: 2,
        unitPriceCents: 1500,
      },
      {
        description: "Fertiliser",
        quantity: 4,
        unitPriceCents: 725,
      },
    ],
  });
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

it.each([
  {
    name: "empty description",
    charge: {
      description: " \n\t ",
      quantity: 1,
      unitPriceCents: 1000,
    },
    field: "description",
  },
  {
    name: "description over 500 characters",
    charge: {
      description: "x".repeat(501),
      quantity: 1,
      unitPriceCents: 1000,
    },
    field: "description",
  },
  {
    name: "zero quantity",
    charge: {
      description: "Green waste removal",
      quantity: 0,
      unitPriceCents: 1000,
    },
    field: "quantity",
  },
  {
    name: "negative quantity",
    charge: {
      description: "Green waste removal",
      quantity: -1,
      unitPriceCents: 1000,
    },
    field: "quantity",
  },
  {
    name: "fractional quantity",
    charge: {
      description: "Green waste removal",
      quantity: 1.5,
      unitPriceCents: 1000,
    },
    field: "quantity",
  },
  {
    name: "negative unit price",
    charge: {
      description: "Green waste removal",
      quantity: 1,
      unitPriceCents: -1,
    },
    field: "unitPriceCents",
  },
])("rejects an initial charge with $name", ({ charge, field }) => {
  try {
    validateCreateJob({
      ...valid,
      charges: [charge],
    });

    throw new Error("Expected validation to fail.");
  } catch (error) {
    expect(error).toBeInstanceOf(JobValidationError);
    expect(error).toMatchObject({
      fieldErrors: {
        [`charges[0].${field}`]: expect.any(String),
      },
    });
  }
});

it("associates validation errors with the correct charge index", () => {
  try {
    validateCreateJob({
      ...valid,
      charges: [
        {
          description: "Green waste removal",
          quantity: 2,
          unitPriceCents: 1500,
        },
        {
          description: "",
          quantity: 0,
          unitPriceCents: -1,
        },
      ],
    });

    throw new Error("Expected validation to fail.");
  } catch (error) {
    expect(error).toBeInstanceOf(JobValidationError);
    expect(error).toMatchObject({
      fieldErrors: {
        "charges[1].description": expect.any(String),
        "charges[1].quantity": expect.any(String),
        "charges[1].unitPriceCents": expect.any(String),
      },
    });
  }
});

it("collects job and additional-charge validation errors together", () => {
  try {
    validateCreateJob({
      ...valid,
      name: "",
      charges: [
        {
          description: "",
          quantity: 0,
          unitPriceCents: -1,
        },
      ],
    });

    throw new Error("Expected validation to fail.");
  } catch (error) {
    expect(error).toBeInstanceOf(JobValidationError);
    expect(error).toMatchObject({
      fieldErrors: {
        name: expect.any(String),
        "charges[0].description": expect.any(String),
        "charges[0].quantity": expect.any(String),
        "charges[0].unitPriceCents": expect.any(String),
      },
    });
  }
});

it("accepts a zero unit price", () => {
  expect(
    validateCreateJob({
      ...valid,
      charges: [
        {
          description: "Included disposal",
          quantity: 2,
          unitPriceCents: 0,
        },
      ],
    }),
  ).toEqual({
    ...valid,
    charges: [
      {
        description: "Included disposal",
        quantity: 2,
        unitPriceCents: 0,
      },
    ],
  });
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
