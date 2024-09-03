import { Logger } from '@nestjs/common';
import { Contract } from 'src/contract/entities/contract.entity';
import { Job } from 'src/job/entities/job.entity';
import { Profile } from 'src/profile/entities/profile.entity';
import { SeedService } from 'src/seed/seed.service';
import { DataSource, DataSourceOptions } from 'typeorm';
require('dotenv').config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  synchronize: false,
  logging: false,
  entities: [Profile, Contract, Job], // Include entities directly here
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
};

const dataSource = new DataSource(dataSourceOptions);

async function seedDatabase(dataSource: DataSource) {
  const profileRepository = dataSource.getRepository(Profile);
  const contractRepository = dataSource.getRepository(Contract);
  const jobRepository = dataSource.getRepository(Job);

  const seedService = new SeedService(
    profileRepository,
    contractRepository,
    jobRepository,
  );
  await seedService.seed();
}

dataSource
  .initialize()
  .then(async () => {
    Logger.log('Data Source has been initialized!', 'Database');

    if (process.env.SEED_DATABASE === 'true') {
      Logger.log('Seeding database...');
      await seedDatabase(dataSource); // Run the seed function
      Logger.log('Database seeding completed!', 'Database');
    }
  })
  .catch((err) => {
    Logger.error('Error during Data Source initialization');
    Logger.error(err);
  });

export default dataSource;
