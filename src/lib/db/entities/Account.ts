import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

export enum AccountType {
  CHECKING = "checking",
  CREDIT_CARD = "credit_card",
  CASH = "cash",
  SAVINGS = "savings",
  INVESTMENT = "investment"
}

@Entity("accounts")
export class Account {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  user_id!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "enum", enum: AccountType, default: AccountType.CHECKING })
  type!: AccountType;

  @Column({ type: "numeric", precision: 12, scale: 2, default: 0 })
  initial_balance!: number;

  @Column({ type: "varchar", length: 50, default: "#3b82f6" })
  color!: string;

  @Column({ type: "varchar", length: 50, default: "Wallet" })
  icon!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
}
