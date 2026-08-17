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

  @Column({ type: "varchar", length: 50, default: "finac" })
  evolution_keyword!: string;

  @Column({ type: "boolean", default: true })
  require_keyword!: boolean;

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

  @Column({ type: "varchar", length: 50, default: "openai" })
  ai_provider!: string;

  @Column({ type: "varchar", length: 255, default: "https://api.openai.com/v1" })
  ai_base_url!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  ai_api_key!: string | null;

  @Column({ type: "varchar", length: 100, default: "gpt-4o-mini" })
  ai_model!: string;

  @Column({ type: "text", nullable: true })
  ai_prompt_instructions!: string | null;

  @Column({ type: "boolean", default: true })
  is_ai_enabled!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
}
