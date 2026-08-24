import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Server state here only changes via our own mutations/polling, so we
      // don't want a stray window-focus refetch to interrupt an in-progress poll.
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
