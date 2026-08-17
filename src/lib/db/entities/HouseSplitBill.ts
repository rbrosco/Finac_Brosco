import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("house_split_bills")
export class HouseSplitBill {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  user_id!: string;

  @Column({ type: "varchar", length: 7, default: "2026-08" })
  month!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "numeric", precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: "varchar", length: 255 })
  paid_by_name!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  paid_by_user_id!: string | null;

  @Column({ type: "varchar", length: 50, default: "days" })
  split_method!: string;

  @Column({ type: "varchar", length: 50, default: "power" })
  icon_type!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
}
