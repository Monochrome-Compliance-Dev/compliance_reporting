import { QueryClient } from "@tanstack/react-query";

const TEN_MIN = 10 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: TEN_MIN,
      gcTime: 60 * 60 * 1000, // 1 hour
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1, // surface errors via AlertContext instead of hammering
    },
    mutations: {
      retry: 0,
    },
  },
});
