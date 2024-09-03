import { Contract } from 'src/contract/entities/contract.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

export enum ProfileRole {
  CLIENT = 'client',
  CONTRACTOR = 'contractor',
}

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uuid: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  profession: string;

  @Column('decimal')
  balance: number;

  @Column({
    type: 'enum',
    enum: ProfileRole,
  })
  role: ProfileRole;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Contract, (contract) => contract.contractor, {
    eager: false,
    cascade: ['insert', 'update'],
    onDelete: 'SET NULL',
  })
  contractorContracts: Contract[];

  @OneToMany(() => Contract, (contract) => contract.client, {
    eager: false,
    cascade: ['insert', 'update'],
    onDelete: 'SET NULL',
  })
  clientContracts: Contract[];
}
