import { User } from "next-auth";

type AdminUser = User & {
  username: string;
  password: string;
};

export default AdminUser;
