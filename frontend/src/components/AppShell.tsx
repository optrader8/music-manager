import { PropsWithChildren } from "react";

import { Header } from "./Header";

export function AppShell({ children }: PropsWithChildren): JSX.Element {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}
