'use client';

import { useActionState } from "react";

import { signOut } from "@/app/core/actions";

export default function SignOutForm() {
  const [_, action] = useActionState(signOut, undefined);   

  return (
    <form action={action}>
      <button type="submit">Sign Out</button>
    </form>
  )
}

