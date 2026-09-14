import { expect, it } from "vitest";
import { MemoryRouter } from "react-router";
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
};
it("exposes the edit action to managers", () => {
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <CustomerPage customer={customer} canManage={true} />
    </MemoryRouter>,
  );
  expect(html).toContain('href="/customers/customer/edit"');
  expect(html).toContain("Edit customer");
});
it("hides the edit action without manage permission", () => {
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <CustomerPage customer={customer} canManage={false} />
    </MemoryRouter>,
  );
  expect(html).not.toContain("Edit customer");
});
