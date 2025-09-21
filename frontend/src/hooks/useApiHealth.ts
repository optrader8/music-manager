import { useQuery } from "@tanstack/react-query";

import { apiClient } from "../services/apiClient";
import { ApiHealth } from "../types/api";

export function useApiHealth() {
  return useQuery({
    queryKey: ["api", "health"],
    queryFn: async () => {
      const response = await apiClient.get<ApiHealth>("/health");
      return response.data;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
