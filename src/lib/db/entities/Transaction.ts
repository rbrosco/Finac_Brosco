import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { Category } from "./Category";
import { Account } from "./Account";

export enum TransactionType {
  INCOME = "income",
  FIXED_EXPENSE = "fixed_expense",
  VARIABLE_EXPENSE = "variable_expense"
}

export enum TransactionStatus {
  PAID = "paid",
  PENDING = "pending"
}

export enum TransactionFrequency {
  MONTHLY = "monthly",
  ANNUAL = "annual",
  ONE_OFF = "one_off"
}

@Entity("transactions")
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  user_id!: string;

  @Column({ type: "uuid", nullable: true })
  category_id!: string | null;

  @Column({ type: "uuid", nullable: true })
  account_id!: string | null;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "enum", enum: TransactionType })
  type!: TransactionType;

  @Column({ type: "numeric", precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: "date" })
  due_date!: string;

  @Column({ type: "date", nullable: true })
  payment_date!: string | null;

  @Column({ type: "enum", enum: TransactionStatus, default: TransactionStatus.PENDING })
  status!: TransactionStatus;

  @Column({ type: "enum", enum: TransactionFrequency, default: TransactionFrequency.ONE_OFF })
  frequency!: TransactionFrequency;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "text", nullable: true })
  attachment_url!: string | null;

  @Column({ type: "boolean", default: false })
  is_recurring!: boolean;

  @Column({ type: "uuid", nullable: true })
  parent_transaction_id!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => Category, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "category_id" })
  category!: Category | null;

  @ManyToOne(() => Account, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "account_id" })
  account!: Account | null;
}
