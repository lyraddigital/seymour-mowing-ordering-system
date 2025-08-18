type PageErrors = {
  genericError: string;
};

type FormFields = {
  username: string;
  password: string;
  rememberMe: string;
};

export const pageErrors: PageErrors = {
  genericError:
    "Issue while signing in. Please check your username and password and try again.",
};

export const formFields: FormFields = {
  username: "username",
  password: "password",
  rememberMe: "rememberMe",
};
