import { PropsWithChildren } from "react";

export default function SectionHeading({ children }: PropsWithChildren) {
  return (
    <h2 className="text-green-800 font-bold uppercase text-xl mb-6 mt-6">{ children }</h2>
  );
}
