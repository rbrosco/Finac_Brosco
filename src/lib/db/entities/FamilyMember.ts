import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Family } from "./Family";
import { User } from "./User";

export enum FamilyRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
  VIEWER = "VIEWER"
}

export enum FamilyMemberStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED"
}

@Entity("family_members")
export class FamilyMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  family_id!: string;

  @Column({ type: "uuid" })
  user_id!: string;

  @Column({ type: "enum", enum: FamilyRole, default: FamilyRole.MEMBER })
  role!: FamilyRole;

  @Column({ type: "enum", enum: FamilyMemberStatus, default: FamilyMemberStatus.ACCEPTED })
  status!: FamilyMemberStatus;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => Family, { onDelete: "CASCADE" })
  @JoinColumn({ name: "family_id" })
  family!: Family;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
}
