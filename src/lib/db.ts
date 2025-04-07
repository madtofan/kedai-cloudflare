import { D1Dialect } from "kysely-d1";
import { Kysely } from "kysely";
import { asyncGetEnv } from "./utils";

async function initDbConnectionDev() {
  return new D1Dialect({
    database: (await asyncGetEnv()).DB,
  });
}

export const db = new Kysely({
  dialect: await initDbConnectionDev(),
});
