"use server";

import { serverFormAction } from "@/app/core/actions";
import { pagePaths } from "@/app/core/configuration";
import { FormActionState } from "@/app/core/validators";

// import { pageErrors } from "@/app/sign-in/constants";
import { CreateCustomer } from "@/app/dashboard/customers/types";
import { validateCustomerCreation } from "@/app/dashboard/customers/validators";

// export default async function signInWithCredentials(
//   _: FormActionState<Credentials> | undefined,
//   formData: FormData
// ): Promise<FormActionState<Credentials> | undefined> {
//   return await serverFormAction(
//     formData,
//     validateSignIn,
//     pagePaths.dashboard,
//     async (credentials) => {
//       if (!credentials) {
//         throw new Error(pageErrors.genericError);
//       }

//       const user = await getUserByUsername(credentials.username);

//       if (!user) {
//         throw new Error(pageErrors.genericError);
//       }

//       const hasPasswordMatched = await checkPassword(
//         credentials.password,
//         user.hashedPassword
//       );

//       if (!hasPasswordMatched) {
//         throw new Error(pageErrors.genericError);
//       }

//       await createSession(user.username, credentials.rememberMe);
//     }
//   );
// }

export default async function createCustomer(
  _: FormActionState<CreateCustomer> | undefined,
  data: FormData
): Promise<FormActionState<CreateCustomer> | undefined> {
  return await serverFormAction(
    data,
    validateCustomerCreation,
    pagePaths.customers,
    async (createCustomer) => {
      // if (!customer) {
      //   throw new Error(pageErrors.genericError);
      // }
      // await createCustomerInDB(customer);
    }
  );
}
