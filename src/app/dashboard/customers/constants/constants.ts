type CreateCustomerFeatureErrors = {
  genericError: string;
};

type FormFields = {
  customerName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  profilePic: string;
};

export const formFields: FormFields = {
  customerName: "customerName",
  contactName: "contactName",
  contactEmail: "contactEmail",
  contactPhone: "contactPhone",
  profilePic: "profilePic",
};

export const createCustomerFeatureErrors: CreateCustomerFeatureErrors = {
  genericError:
    "Issue while trying to create a customer. Please try again later.",
};
