import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("house_split_residents")
export class HouseSplitResident {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  user_id!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "boolean", default: false })
  is_external!: boolean;

  @Column({ type: "int", default: 30 })
  days_present!: number;

  @Column({ type: "int", default: 1 })
  family_count!: number;

  @Column({ type: "float", default: 1.0 })
  weight!: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  pix_key!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
}
