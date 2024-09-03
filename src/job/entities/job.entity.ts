import { Contract } from 'src/contract/entities/contract.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uuid: string;

  @Column()
  description: string;

  @Column('decimal')
  price: number;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ type: 'date', nullable: true })
  paidDate: Date;

  @ManyToOne(() => Contract, (contract) => contract, {
    eager: false,
    onDelete: 'CASCADE',
  })
  contract: Contract;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp' })
  updatedAt: Date;
}
