import NextAuth from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";

const nextAuth = NextAuth(authConfig);

const auth = cache(nextAuth.auth);

// Raw (uncached) auth — used by middleware where React `cache` is unavailable.
export const authMiddleware = nextAuth.auth;

export const { handlers, signIn, signOut } = nextAuth;
export { auth };
