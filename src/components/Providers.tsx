"use client";
import { type ReactNode } from "react";
import { QueryProvider } from "@/lib/query";

export function Providers({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
