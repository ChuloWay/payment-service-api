import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1725213186385 implements MigrationInterface {
  name = 'Init1725213186385';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "profiles" ("id" SERIAL NOT NULL, "uuid" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "profession" character varying NOT NULL, "balance" numeric NOT NULL, "role" "public"."profiles_role_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, CONSTRAINT "UQ_2c0c7196c89bdcc9b04f29f3fe6" UNIQUE ("uuid"), CONSTRAINT "PK_8e520eb4da7dc01d0e190447c8e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "contracts" ("id" SERIAL NOT NULL, "uuid" character varying NOT NULL, "terms" character varying NOT NULL, "status" "public"."contracts_status_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, "contractorId" integer, "clientId" integer, CONSTRAINT "UQ_d47764660e5f64763194e3c66f1" UNIQUE ("uuid"), CONSTRAINT "PK_2c7b8f3a7b1acdd49497d83d0fb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "jobs" ("id" SERIAL NOT NULL, "uuid" character varying NOT NULL, "description" character varying NOT NULL, "price" numeric NOT NULL, "isPaid" boolean NOT NULL DEFAULT false, "paidDate" date, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, "contractId" integer, CONSTRAINT "UQ_2ad99c480880ac224b7e39338ba" UNIQUE ("uuid"), CONSTRAINT "PK_cf0a6c42b72fcc7f7c237def345" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "contracts" ADD CONSTRAINT "FK_25e8a897e43bfc4dde1f0918995" FOREIGN KEY ("contractorId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contracts" ADD CONSTRAINT "FK_62a5163bebb9d95e503b01c0fb0" FOREIGN KEY ("clientId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_f4f2e7125f414668e5d0bef8233" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "jobs" DROP CONSTRAINT "FK_f4f2e7125f414668e5d0bef8233"`);
    await queryRunner.query(`ALTER TABLE "contracts" DROP CONSTRAINT "FK_62a5163bebb9d95e503b01c0fb0"`);
    await queryRunner.query(`ALTER TABLE "contracts" DROP CONSTRAINT "FK_25e8a897e43bfc4dde1f0918995"`);
    await queryRunner.query(`DROP TABLE "jobs"`);
    await queryRunner.query(`DROP TABLE "contracts"`);
    await queryRunner.query(`DROP TABLE "profiles"`);
  }
}
