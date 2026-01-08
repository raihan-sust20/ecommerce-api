import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateProductsAndProductCategoriesTables1767884437743
  implements MigrationInterface
{
  name = 'CreateProductsAndProductCategoriesTables1767884437743';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /**
     * PRODUCTS TABLE
     */
    await queryRunner.createTable(
      new Table({
        name: 'products',
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
            name: 'sku',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'stock',
            type: 'int',
            default: 0,
          },
          {
            name: 'status',
            type: 'varchar',
            default: `'active'`,
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

    // Indexes
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'product_slug_index',
        columnNames: ['sku'],
      })
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'product_name_index',
        columnNames: ['name'],
      })
    );

    /**
     * PRODUCT_CATEGORIES JOIN TABLE
     */
    await queryRunner.createTable(
      new Table({
        name: 'product_categories',
        columns: [
          {
            name: 'product_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'category_id',
            type: 'uuid',
            isPrimary: true,
          },
        ],
      }),
      true
    );

    // FK → products.id
    await queryRunner.createForeignKey(
      'product_categories',
      new TableForeignKey({
        name: 'fk_product_categories_product_id',
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    // FK → categories.id
    await queryRunner.createForeignKey(
      'product_categories',
      new TableForeignKey({
        name: 'fk_product_categories_category_id',
        columnNames: ['category_id'],
        referencedTableName: 'categories',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop FKs first
    await queryRunner.dropForeignKey(
      'product_categories',
      'fk_product_categories_product_id'
    );

    await queryRunner.dropForeignKey(
      'product_categories',
      'fk_product_categories_category_id'
    );

    // Drop join table
    await queryRunner.dropTable('product_categories');

    // Drop indexes
    await queryRunner.dropIndex('products', 'product_slug_index');
    await queryRunner.dropIndex('products', 'product_name_index');

    // Drop products table
    await queryRunner.dropTable('products');
  }
}
