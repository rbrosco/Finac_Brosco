import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("integration_configs")
export class IntegrationConfig {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", unique: true })
  user_id!: string;

  @Column({ type: "varchar", length: 255, default: "http://localhost:9002" })
  evolution_api_url!: string;

  @Column({ type: "varchar", length: 255, default: "evo_fbpzwxq9n7squlurxxwpioob" })
  evolution_api_key!: string;

  @Column({ type: "varchar", length: 100, default: "finac_instance" })
  evolution_instance_name!: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  whatsapp_number!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  n8n_webhook_url!: string | null;

  @Column({ type: "varchar", length: 100, default: "secret_finac_token_123" })
  webhook_secret!: string;

  @Column({ type: "boolean", default: true })
  is_whatsapp_enabled!: boolean;

  @Column({ type: "boolean", default: true })
  is_n8n_enabled!: boolean;

  @Column({ type: "boolean", default: true })
  notify_on_created!: boolean;

  @Column({ type: "boolean", default: true })
  notify_on_due!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
}
