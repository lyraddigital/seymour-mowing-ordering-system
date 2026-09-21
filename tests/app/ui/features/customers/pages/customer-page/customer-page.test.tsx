import { expect, it } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router";
import { renderToStaticMarkup } from "react-dom/server";
import CustomerPage from "../../../../../../../app/ui/features/customers/pages/customer-page/customer-page";
const customer = {
  id: "customer",
  name: "Customer",
  email: null,
  phone: null,
  addressLine1: null,
  addressLine2: null,
  suburb: null,
  state: null,
  postcode: null,
  notes: null,
  archivedAt: null,
};
it("exposes the edit action to managers", () => {
  const html = renderToStaticMarkup(
    <RouterProvider
      router={createMemoryRouter([
        {
          path: "/",
          element: (
            <CustomerPage
              customer={customer}
              canManage={true}
              financialHistory={null}
            />
          ),
        },
      ])}
    />,
  );
  expect(html).toContain('href="/customers/customer/edit"');
  expect(html).toContain("Edit customer");
  expect(html).toContain("Confirm archive");
  expect(html).toContain('action="/customers/customer/archive"');
  expect(html).not.toContain('name="intent"');
});
it("hides the edit action without manage permission", () => {
  const html = renderToStaticMarkup(
    <RouterProvider
      router={createMemoryRouter([
        {
          path: "/",
          element: (
            <CustomerPage
              customer={customer}
              canManage={false}
              financialHistory={null}
            />
          ),
        },
      ])}
    />,
  );
  expect(html).not.toContain("Edit customer");
});

it("shows archived status and restore without editing or archive", () => {
  const html = renderToStaticMarkup(
    <RouterProvider
      router={createMemoryRouter([
        {
          path: "/",
          element: (
            <CustomerPage
              customer={{ ...customer, archivedAt: 3 }}
              canManage={true}
              financialHistory={null}
            />
          ),
        },
      ])}
    />,
  );
  expect(html).toContain("Archived");
  expect(html).toContain("Restore customer");
  expect(html).toContain('action="/customers/customer/restore"');
  expect(html).not.toContain("Edit customer");
  expect(html).not.toContain("Archive customer");
});
