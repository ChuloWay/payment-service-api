import { Profile } from 'src/profile/entities/profile.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

export enum ContractStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  TERMINATED = 'terminated',
}

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uuid: string;

  @Column()
  terms: string;

  @Column({ type: 'enum', enum: ContractStatus })
  status: ContractStatus;

  @ManyToOne(() => Profile, (profile) => profile.contractorContracts, {
    onDelete: 'SET NULL',
  })
  contractor: Profile;

  @ManyToOne(() => Profile, (profile) => profile.clientContracts, {
    eager: false,
    onDelete: 'SET NULL',
  })
  client: Profile;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp' })
  updatedAt: Date;
}
