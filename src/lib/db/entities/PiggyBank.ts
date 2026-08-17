import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

export enum RiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  VERY_HIGH = "VERY_HIGH"
}

@Entity("piggy_banks")
export class PiggyBank {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  user_id!: string;

  @Column({ type: "varchar", length: 150 })
  name!: string;

  @Column({ type: "numeric", precision: 14, scale: 2, default: 0 })
  target_amount!: number;

  @Column({ type: "numeric", precision: 14, scale: 2, default: 0 })
  current_amount!: number;

  @Column({ type: "varchar", length: 50, default: "TESOURO_SELIC" })
  investment_type!: string;

  @Column({ type: "enum", enum: RiskLevel, default: RiskLevel.LOW })
  risk_level!: RiskLevel;

  @Column({ type: "numeric", precision: 6, scale: 2, default: 10.5 })
  expected_return_rate!: number; // Percentage per year (% a.a.)

  @Column({ type: "numeric", precision: 14, scale: 2, default: 0 })
  monthly_deposit!: number;

  @Column({ type: "varchar", length: 20, nullable: true })
  target_date!: string | null;

  @Column({ type: "varchar", length: 50, default: "#10b981" })
  color!: string;

  @Column({ type: "varchar", length: 50, default: "PiggyBank" })
  icon!: string;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
}
