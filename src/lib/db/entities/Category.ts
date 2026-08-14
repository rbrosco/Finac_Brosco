import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

export enum CategoryType {
  INCOME = "income",
  EXPENSE = "expense"
}

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", nullable: true })
  user_id!: string | null;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "enum", enum: CategoryType, default: CategoryType.EXPENSE })
  type!: CategoryType;

  @Column({ type: "varchar", length: 50, default: "#6366f1" })
  color!: string;

  @Column({ type: "varchar", length: 50, default: "Tag" })
  icon!: string;

  @Column({ type: "boolean", default: false })
  is_default!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "user_id" })
  user!: User | null;
}
