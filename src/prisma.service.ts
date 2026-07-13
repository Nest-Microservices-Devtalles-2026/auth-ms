import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

  private readonly logger = new Logger('AuthService');

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }


  async onModuleInit() {
    this.$connect();
    this.logger.log('MongoDB connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('MongoDB disconnected');
  }
  
}