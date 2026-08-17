import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Category } from "./entities/Category";
import { Account } from "./entities/Account";
import { Transaction } from "./entities/Transaction";
import { PasswordResetToken } from "./entities/PasswordResetToken";
import { IntegrationConfig } from "./entities/IntegrationConfig";
import { Family } from "./entities/Family";
import { FamilyMember } from "./entities/FamilyMember";
import { HouseSplitResident } from "./entities/HouseSplitResident";
import { HouseSplitBill } from "./entities/HouseSplitBill";
import { PiggyBank } from "./entities/PiggyBank";

const host = process.env.POSTGRES_HOST || "localhost";
const port = parseInt(process.env.POSTGRES_PORT || "5432", 10);
const username = process.env.POSTGRES_USER || "postgres";
const password = process.env.POSTGRES_PASSWORD || "F2Wgk8qLrT7mXvYpQ9nCz3d";
const database = process.env.POSTGRES_DB || "finac-db";

const entities = [User, Category, Account, Transaction, PasswordResetToken, IntegrationConfig, Family, FamilyMember, HouseSplitResident, HouseSplitBill, PiggyBank];

declare global {
  // eslint-disable-next-line no-var
  var __typeorm_datasource: DataSource | undefined;
}

export function createDataSource(): DataSource {
  return new DataSource({
    type: "postgres",
    host,
    port,
    username,
    password,
    database,
    synchronize: true,
    logging: false,
    entities,
    subscribers: [],
    migrations: [],
  });
}

export async function getDataSource(): Promise<DataSource> {
  if (globalThis.__typeorm_datasource && globalThis.__typeorm_datasource.isInitialized) {
    try {
      if (globalThis.__typeorm_datasource.hasMetadata(User)) {
        return globalThis.__typeorm_datasource;
      }
    } catch {
      // If metadata check fails due to HMR reload
    }
  }

  const ds = createDataSource();
  await ds.initialize();
  globalThis.__typeorm_datasource = ds;
  return ds;
}
