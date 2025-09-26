import { PropsWithChildren } from "react";

import { Header } from "./Header";

export function AppShell({ children }: PropsWithChildren): JSX.Element {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main" role="main">
        <div className="app-container">{children}</div>
      </main>
    </div>
  );
}
