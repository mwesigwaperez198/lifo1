"use client";
import { useState, useCallback } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { api } from "./client";
import type { ReactNode } from "react";

let client: QueryClient | null = null;

function getClient() {
  if (!client) {
    client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          gcTime: 5 * 60_000,
          refetchOnWindowFocus: false,
          retry: 1,
        },
      },
    });
  }
  return client;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={getClient()}>{children}</QueryClientProvider>;
}

// ── Query keys ──────────────────────────────────────────────────────────────

export const qk = {
  notifications: ["notifications"] as const,
  goals: ["goals"] as const,
  purchases: ["purchases"] as const,
  settings: ["settings"] as const,
  prices: (purchaseId: number) => ["prices", purchaseId] as const,
} as const;

// ── Typed GET hook ──────────────────────────────────────────────────────────

export function useApiQuery<T>(
  key: readonly unknown[],
  path: string,
  opts?: Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn"> & { enabled?: boolean }
) {
  return useQuery<T, Error>({
    queryKey: key,
    queryFn: () => api<T>(path),
    ...opts,
  });
}

// ── Typed mutation hook ─────────────────────────────────────────────────────

type MutationOpts<TData, TVariables> = Pick<
  UseMutationOptions<TData, Error, TVariables>,
  "onSuccess" | "onError" | "onMutate" | "onSettled" | "retry"
> & {
  invalidate?: (readonly unknown[])[];
};

export function useApiMutation<TData, TVariables = void>(
  fn: (vars: TVariables) => Promise<TData>,
  opts?: MutationOpts<TData, TVariables>
) {
  const qc = useQueryClient();
  const { invalidate, onSuccess, ...rest } = opts ?? {};

  return useMutation<TData, Error, TVariables>({
    mutationFn: fn,
    onSuccess: (data, variables, onMutateResult, context) => {
      onSuccess?.(data, variables, onMutateResult, context);
      if (invalidate) {
        for (const key of invalidate) {
          qc.invalidateQueries({ queryKey: [...key] });
        }
      }
    },
    ...rest,
  });
}

// ── Convenience hooks for common patterns ───────────────────────────────────

export function useInvalidate(...keys: (readonly unknown[])[]) {
  const qc = useQueryClient();
  return useCallback(() => {
    for (const key of keys) {
      qc.invalidateQueries({ queryKey: [...key] });
    }
  }, [qc, keys]);
}

// ── useSubmit replaces the Modals.tsx version ───────────────────────────────

export function useSubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<unknown>) => {
    setLoading(true);
    setError(null);
    try {
      await fn();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      return false;
    } finally {
      setLoading(false);
    }
  };
  return { loading, error, run };
}
