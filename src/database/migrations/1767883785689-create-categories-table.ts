import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateCategoriesTable1767883785689
  implements MigrationInterface
{
  name = 'CreateCategoriesTable1767883785689';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'categories',
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
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'slug',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'parent_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'path',
            type: 'varchar',
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

    // Unique index on slug
    await queryRunner.createIndex(
      'categories',
      new TableIndex({
        name: 'category_slug_unique_index',
        columnNames: ['slug'],
        isUnique: true,
      })
    );

    // Self-referencing FK (parent → children)
    await queryRunner.createForeignKey(
      'categories',
      new TableForeignKey({
        name: 'fk_categories_parent_id',
        columnNames: ['parent_id'],
        referencedTableName: 'categories',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'categories',
      'fk_categories_parent_id'
    );

    await queryRunner.dropIndex(
      'categories',
      'category_slug_unique_index'
    );

    await queryRunner.dropTable('categories');
  }
}
