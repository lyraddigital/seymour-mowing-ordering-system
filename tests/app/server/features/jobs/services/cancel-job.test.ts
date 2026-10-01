import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { customers } from "../../../../../../app/server/db/schema/customers";
import { jobItems } from "../../../../../../app/server/db/schema/job-items";
import { jobStatusHistory } from "../../../../../../app/server/db/schema/job-status-history";
import { jobs } from "../../../../../../app/server/db/schema/jobs";
import { users } from "../../../../../../app/server/db/schema/users";
import { PermissionDeniedError } from "../../../../../../app/server/auth/authorization/errors/permission-denied-error";
import { JobValidationError } from "../../../../../../app/server/features/jobs/errors/job-validation-error";
import { createJob } from "../../../../../../app/server/features/jobs/services/create-job.server";
import { internalUser } from "../../../../../support/fixtures/internal-user";

const user = internalUser();

const input = {
  customerId: "customer",
  scheduledDate: "2026-09-15",
  name: "  Lawn service  ",
  description: " Mow lawn ",
};

beforeEach(async () => {
  const db = createDb(env.DB);

  await db.delete(jobItems);
  await db.delete(jobStatusHistory);
  await db.delete(jobs);
  await db.delete(customers);
  await db.delete(users);

  await db.insert(users).values(user);
  await db
    .insert(customers)
    .values({ id: "customer", name: "Customer", createdAt: 1, updatedAt: 1 });
});

it.each(["admin", "operator"] as const)(
  "creates a scheduled job and records the internal %s user",
  async (role) => {
    const before = Date.now();

    const { id } = await createJob(env.DB, { ...user, role }, input);

    const db = createDb(env.DB);
    const saved = await db.select().from(jobs).get();

    expect(saved).toMatchObject({
      id,
      customerId: "customer",
      scheduledDate: input.scheduledDate,
      name: "Lawn service",
      description: "Mow lawn",
      servicePriceCents: null,
    });
    expect(saved!.createdAt).toBeGreaterThanOrEqual(before);
    expect(saved!.updatedAt).toBe(saved!.createdAt);

    expect(await db.select().from(jobStatusHistory)).toEqual([
      {
        id: expect.any(String),
        jobId: id,
        status: "scheduled",
        createdByUserId: user.id,
        createdAt: saved!.createdAt,
      },
    ]);

    expect(await db.select().from(jobItems)).toEqual([]);
  },
);

it("creates a job with one initial additional charge", async () => {
  const { id } = await createJob(env.DB, user, {
    ...input,
    charges: [
      {
        description: "  Green waste removal  ",
        quantity: 3,
        unitPriceCents: 1500,
      },
    ],
  });

  const db = createDb(env.DB);
  const savedJob = await db.select().from(jobs).get();

  expect(savedJob).toMatchObject({
    id,
    customerId: "customer",
    name: "Lawn service",
    description: "Mow lawn",
    scheduledDate: input.scheduledDate,
    servicePriceCents: null,
  });

  expect(await db.select().from(jobItems)).toEqual([
    {
      id: expect.any(String),
      jobId: id,
      description: "Green waste removal",
      quantity: 3,
      unitPriceCents: 1500,
      createdAt: savedJob!.createdAt,
      updatedAt: savedJob!.createdAt,
    },
  ]);
});

it("creates a job with multiple initial additional charges", async () => {
  const { id } = await createJob(env.DB, user, {
    ...input,
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

  const db = createDb(env.DB);
  const savedJob = await db.select().from(jobs).get();
  const savedItems = await db.select().from(jobItems);

  expect(savedItems).toEqual([
    {
      id: expect.any(String),
      jobId: id,
      description: "Green waste removal",
      quantity: 2,
      unitPriceCents: 1500,
      createdAt: savedJob!.createdAt,
      updatedAt: savedJob!.createdAt,
    },
    {
      id: expect.any(String),
      jobId: id,
      description: "Fertiliser",
      quantity: 4,
      unitPriceCents: 725,
      createdAt: savedJob!.createdAt,
      updatedAt: savedJob!.createdAt,
    },
  ]);
});

it("accepts an initial additional charge with a zero unit price", async () => {
  const { id } = await createJob(env.DB, user, {
    ...input,
    charges: [
      {
        description: "Included disposal",
        quantity: 2,
        unitPriceCents: 0,
      },
    ],
  });

  expect(await createDb(env.DB).select().from(jobItems)).toEqual([
    expect.objectContaining({
      jobId: id,
      description: "Included disposal",
      quantity: 2,
      unitPriceCents: 0,
    }),
  ]);
});

it.each(["nonexistent", "archived"])(
  "rejects a %s customer without any inserts",
  async (state) => {
    const db = createDb(env.DB);

    if (state === "archived") {
      await db.update(customers).set({ archivedAt: 2 });
    }

    await expect(
      createJob(env.DB, user, {
        ...input,
        customerId: state === "nonexistent" ? "missing" : "customer",
        charges: [
          {
            description: "Green waste removal",
            quantity: 2,
            unitPriceCents: 1500,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(JobValidationError);

    expect(await db.select().from(jobs)).toEqual([]);
    expect(await db.select().from(jobStatusHistory)).toEqual([]);
    expect(await db.select().from(jobItems)).toEqual([]);
  },
);

it("rolls back the job when its initial history insert fails a user foreign key", async () => {
  await expect(
    createJob(
      env.DB,
      { ...user, id: "missing-user" },
      {
        ...input,
        charges: [
          {
            description: "Green waste removal",
            quantity: 2,
            unitPriceCents: 1500,
          },
        ],
      },
    ),
  ).rejects.toThrow();

  const db = createDb(env.DB);

  expect(await db.select().from(jobs)).toEqual([]);
  expect(await db.select().from(jobStatusHistory)).toEqual([]);
  expect(await db.select().from(jobItems)).toEqual([]);
});

it("rolls back the job and status when an initial charge insert fails", async () => {
  const db = createDb(env.DB);

  await db.run(
    "CREATE TRIGGER fail_initial_job_item BEFORE INSERT ON job_items BEGIN SELECT RAISE(ABORT, 'initial job item failure'); END;",
  );

  try {
    await expect(
      createJob(env.DB, user, {
        ...input,
        charges: [
          {
            description: "Green waste removal",
            quantity: 2,
            unitPriceCents: 1500,
          },
        ],
      }),
    ).rejects.toThrow();

    expect(await db.select().from(jobs)).toEqual([]);
    expect(await db.select().from(jobStatusHistory)).toEqual([]);
    expect(await db.select().from(jobItems)).toEqual([]);
  } finally {
    await db.run("DROP TRIGGER IF EXISTS fail_initial_job_item;");
  }
});

it("validates job input at the service boundary before writing", async () => {
  await expect(
    createJob(env.DB, user, {
      ...input,
      description: " ",
      charges: [
        {
          description: "Green waste removal",
          quantity: 2,
          unitPriceCents: 1500,
        },
      ],
    }),
  ).rejects.toBeInstanceOf(JobValidationError);

  const db = createDb(env.DB);

  expect(await db.select().from(jobs)).toEqual([]);
  expect(await db.select().from(jobStatusHistory)).toEqual([]);
  expect(await db.select().from(jobItems)).toEqual([]);
});

it("validates all initial additional charges before writing", async () => {
  await expect(
    createJob(env.DB, user, {
      ...input,
      charges: [
        {
          description: "Valid charge",
          quantity: 2,
          unitPriceCents: 1500,
        },
        {
          description: "Invalid charge",
          quantity: 0,
          unitPriceCents: 1000,
        },
      ],
    }),
  ).rejects.toBeInstanceOf(JobValidationError);

  const db = createDb(env.DB);

  expect(await db.select().from(jobs)).toEqual([]);
  expect(await db.select().from(jobStatusHistory)).toEqual([]);
  expect(await db.select().from(jobItems)).toEqual([]);
});

it.each(["", " \n\t", "x".repeat(201)])(
  "rejects invalid job name %j before writing",
  async (name) => {
    await expect(
      createJob(env.DB, user, {
        ...input,
        name,
        charges: [
          {
            description: "Green waste removal",
            quantity: 2,
            unitPriceCents: 1500,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(JobValidationError);

    const db = createDb(env.DB);

    expect(await db.select().from(jobs)).toEqual([]);
    expect(await db.select().from(jobStatusHistory)).toEqual([]);
    expect(await db.select().from(jobItems)).toEqual([]);
  },
);

it("requires permission before inserting", async () => {
  await expect(
    createJob(
      env.DB,
      { ...user, role: "unknown" as "admin" },
      {
        ...input,
        charges: [
          {
            description: "Green waste removal",
            quantity: 2,
            unitPriceCents: 1500,
          },
        ],
      },
    ),
  ).rejects.toBeInstanceOf(PermissionDeniedError);

  const db = createDb(env.DB);

  expect(await db.select().from(jobs)).toEqual([]);
  expect(await db.select().from(jobStatusHistory)).toEqual([]);
  expect(await db.select().from(jobItems)).toEqual([]);
});
