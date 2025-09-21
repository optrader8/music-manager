import { useEffect } from "react";

import { useApiHealth } from "../hooks/useApiHealth";

export function HomePage(): JSX.Element {
  const { data, isLoading, refetch } = useApiHealth();

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return (
    <section>
      <h1>음악 라이브러리 상태</h1>
      <p>백엔드 FastAPI 서비스와 React 클라이언트의 기본 구성을 검증합니다.</p>
      {isLoading && <p>상태 확인 중...</p>}
      {data && <p>API 상태: {data.status}</p>}
    </section>
  );
}
