import { Link } from "react-router-dom";

export function Header(): JSX.Element {
  return (
    <header style={{ padding: "1rem 2rem", borderBottom: "1px solid #3a3a3a" }}>
      <nav style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <Link to="/" style={{ fontWeight: 600, fontSize: "1.1rem" }}>
          Music Manager
        </Link>
        <span style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
          SSHFS 라이브러리와 FFmpeg 스트리밍을 위한 웹 콘솔
        </span>
      </nav>
    </header>
  );
}
