import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateOrderItemsTable1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'order_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'order_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'product_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'quantity',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'subtotal',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
        ],
      }),
      true
    );

    // FK → orders.id (CASCADE)
    await queryRunner.createForeignKey(
      'order_items',
      new TableForeignKey({
        name: 'fk_order_items_order_id',
        columnNames: ['order_id'],
        referencedTableName: 'orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    // FK → products.id (RESTRICT)
    await queryRunner.createForeignKey(
      'order_items',
      new TableForeignKey({
        name: 'fk_order_items_product_id',
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );

    // Helpful indexes
    await queryRunner.createIndex(
      'order_items',
      new TableIndex({
        name: 'idx_order_items_order_id',
        columnNames: ['order_id'],
      })
    );

    await queryRunner.createIndex(
      'order_items',
      new TableIndex({
        name: 'idx_order_items_product_id',
        columnNames: ['product_id'],
      })
    );

    // Optional but recommended: prevent duplicate products per order
    await queryRunner.createIndex(
      'order_items',
      new TableIndex({
        name: 'uniq_order_product',
        columnNames: ['order_id', 'product_id'],
        isUnique: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('order_items');
  }
}
