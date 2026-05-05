import type { db } from "~/server/db";

export type DB = typeof db;
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
