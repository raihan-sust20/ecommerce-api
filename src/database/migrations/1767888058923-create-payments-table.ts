import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreatePaymentsTable1767888058923 implements MigrationInterface {
  name = 'CreatePaymentsTable1767888058923';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'order_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'provider',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'transaction_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            isNullable: false,
            default: `'pending'`,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'raw_response',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // FK → orders.id
    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        name: 'fk_payments_order_id',
        columnNames: ['order_id'],
        referencedTableName: 'orders',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );

    // Index: order_id
    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'idx_payments_order_id',
        columnNames: ['order_id'],
      })
    );

    // Unique index: transaction_id
    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'idx_transaction_id',
        columnNames: ['transaction_id'],
        isUnique: true,
      })
    );

    // Enum safety (recommended)
    await queryRunner.query(`
      ALTER TABLE payments
      ADD CONSTRAINT chk_payment_provider
      CHECK (provider IN ('stripe', 'bkash'))
    `);

    await queryRunner.query(`
      ALTER TABLE payments
      ADD CONSTRAINT chk_payment_status
      CHECK (status IN ('pending', 'completed', 'failed', 'canceled'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('payments');
  }
}
