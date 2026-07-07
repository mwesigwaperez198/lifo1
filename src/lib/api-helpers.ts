import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "./auth";

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
export function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}
export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function checkCsrf(req: NextRequest): Promise<boolean> {
  const token = req.headers.get("x-csrf-token");
  const cookie = req.cookies.get("lg_csrf")?.value;
  return !!token && !!cookie && token === cookie;
}

export type SafeUser = {
  id: number;
  email: string;
  username: string;
  fullName: string;
  avatar: string | null;
  bio: string | null;
  role: string;
  theme: string | null;
  accentColor: string | null;
  currency: string | null;
  monthlyIncome: string | null;
  twoFactorEnabled: boolean | null;
};

export function sanitizeUser(u: {
  id: number; email: string; username: string; fullName: string; avatar: string | null;
  bio: string | null; role: string | null; theme: string | null; accentColor: string | null;
  currency: string | null; monthlyIncome: string | null; twoFactorEnabled: boolean | null;
}): SafeUser {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    fullName: u.fullName,
    avatar: u.avatar,
    bio: u.bio,
    role: u.role ?? "user",
    theme: u.theme ?? "dark",
    accentColor: u.accentColor ?? "#7c3aed",
    currency: u.currency ?? "USD",
    monthlyIncome: u.monthlyIncome,
    twoFactorEnabled: u.twoFactorEnabled ?? false,
  };
}

/** Get the authenticated user or null (for GET endpoints). */
export async function userOr401() {
  const user = await getCurrentUser();
  return user;
}
