const { getPool } = require('../config/database');

/**
 * Base Model class with schema validation and auto-migration features
 */
class BaseModel {
  /**
   * Define the schema for the model
   * Should be overridden by child classes
   * @returns {Object} Schema definition
   */
  static getSchema() {
    throw new Error('getSchema() must be implemented by child class');
  }

  /**
   * Get the current table structure from database
   */
  static async getTableStructure() {
    const pool = getPool();
    try {
      const [columns] = await pool.query(
        `SELECT 
          COLUMN_NAME as Field,
          COLUMN_TYPE as Type,
          IS_NULLABLE as \`Null\`,
          COLUMN_KEY as \`Key\`,
          COLUMN_DEFAULT as \`Default\`,
          EXTRA as Extra
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION`,
        [this.tableName]
      );
      
      const [indexes] = await pool.query(
        `SHOW INDEX FROM ${this.tableName}`,
        []
      );
      
      return { columns, indexes };
    } catch (error) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
        return { columns: [], indexes: [] };
      }
      throw error;
    }
  }

  /**
   * Compare schema definition with actual table structure
   */
  static compareSchemas(expectedColumns, actualColumns, expectedIndexes, actualIndexes) {
    const changes = {
      columnsToAdd: [],
      columnsToModify: [],
      columnsToDrop: [],
      indexesToAdd: [],
      indexesToDrop: []
    };

    // Create maps for easier comparison
    const actualColumnMap = new Map(actualColumns.map(col => [col.Field, col]));
    const expectedColumnMap = new Map(expectedColumns.map(col => [col.name, col]));

    // Check for columns to add or modify
    expectedColumns.forEach(expectedCol => {
      const actualCol = actualColumnMap.get(expectedCol.name);
      
      if (!actualCol) {
        changes.columnsToAdd.push(expectedCol);
      } else {
        // Check if column needs modification
        if (this.columnNeedsUpdate(expectedCol, actualCol)) {
          changes.columnsToModify.push(expectedCol);
        }
      }
    });

    // Check for columns to drop (optional - can be disabled for safety)
    // actualColumns.forEach(actualCol => {
    //   if (!expectedColumnMap.has(actualCol.Field) && 
    //       actualCol.Field !== 'id' && 
    //       actualCol.Field !== 'createdAt' && 
    //       actualCol.Field !== 'updatedAt') {
    //     changes.columnsToDrop.push(actualCol.Field);
    //   }
    // });

    // Compare indexes
    const actualIndexMap = new Map();
    actualIndexes.forEach(idx => {
      if (!actualIndexMap.has(idx.Key_name)) {
        actualIndexMap.set(idx.Key_name, []);
      }
      actualIndexMap.get(idx.Key_name).push(idx.Column_name);
    });

    expectedIndexes.forEach(expectedIdx => {
      const actualIdx = actualIndexMap.get(expectedIdx.name);
      if (!actualIdx || !this.arraysEqual(actualIdx, expectedIdx.columns)) {
        changes.indexesToAdd.push(expectedIdx);
      }
    });

    return changes;
  }

  /**
   * Check if a column needs to be updated
   */
  static columnNeedsUpdate(expectedCol, actualCol) {
    // Normalize types for comparison
    const normalizedExpected = this.normalizeColumnType(expectedCol.type);
    const normalizedActual = this.normalizeColumnType(actualCol.Type);

    if (normalizedExpected !== normalizedActual) {
      return true;
    }

    // Check nullable
    const expectedNullable = expectedCol.nullable ? 'YES' : 'NO';
    if (expectedNullable !== actualCol.Null) {
      return true;
    }

    // Check default value
    if (expectedCol.default !== undefined) {
      const expectedDefault = expectedCol.default === null ? null : String(expectedCol.default);
      const actualDefault = actualCol.Default === null ? null : String(actualCol.Default);
      if (expectedDefault !== actualDefault) {
        return true;
      }
    }

    return false;
  }

  /**
   * Normalize column type for comparison
   */
  static normalizeColumnType(type) {
    return type.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/int\(\d+\)/g, 'int')
      .replace(/varchar\((\d+)\)/g, 'varchar($1)')
      .replace(/\s*auto_increment\s*/gi, '')
      .replace(/\s*primary key\s*/gi, '')
      .trim();
  }

  /**
   * Check if two arrays are equal
   */
  static arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();
    return sorted1.every((val, idx) => val === sorted2[idx]);
  }

  /**
   * Generate ALTER TABLE statements for schema changes
   */
  static generateAlterStatements(changes) {
    const statements = [];

    // Add new columns
    changes.columnsToAdd.forEach(col => {
      // Skip if it's the PRIMARY KEY column (should be in CREATE TABLE only)
      if (col.type.toUpperCase().includes('PRIMARY KEY')) {
        return;
      }
      
      let sql = `ALTER TABLE ${this.tableName} ADD COLUMN ${col.name} ${col.type}`;
      if (!col.nullable) sql += ' NOT NULL';
      if (col.default !== undefined) {
        sql += ` DEFAULT ${col.default === null ? 'NULL' : this.formatDefaultValue(col.default, col.type)}`;
      }
      if (col.extra) sql += ` ${col.extra}`;
      if (col.after) sql += ` AFTER ${col.after}`;
      statements.push(sql);
    });

    // Modify existing columns
    changes.columnsToModify.forEach(col => {
      // Skip if it's the PRIMARY KEY column (can't easily modify)
      if (col.name === 'id' || col.type.toUpperCase().includes('PRIMARY KEY')) {
        return;
      }
      
      let sql = `ALTER TABLE ${this.tableName} MODIFY COLUMN ${col.name} ${col.type}`;
      if (!col.nullable) sql += ' NOT NULL';
      if (col.default !== undefined) {
        sql += ` DEFAULT ${col.default === null ? 'NULL' : this.formatDefaultValue(col.default, col.type)}`;
      }
      if (col.extra) sql += ` ${col.extra}`;
      statements.push(sql);
    });

    // Drop columns (commented out for safety)
    // changes.columnsToDrop.forEach(colName => {
    //   statements.push(`ALTER TABLE ${this.tableName} DROP COLUMN ${colName}`);
    // });

    // Add indexes
    changes.indexesToAdd.forEach(idx => {
      // Try to drop if exists (without IF EXISTS for compatibility)
      if (idx.name !== 'PRIMARY') {
        // We'll try to drop, but ignore errors if it doesn't exist
        statements.push({
          sql: `ALTER TABLE ${this.tableName} DROP INDEX ${idx.name}`,
          ignoreError: true
        });
      }
      
      let sql;
      if (idx.type === 'FOREIGN KEY') {
        // Try to drop foreign key constraint first
        statements.push({
          sql: `ALTER TABLE ${this.tableName} DROP FOREIGN KEY ${idx.name}`,
          ignoreError: true
        });
        
        sql = `ALTER TABLE ${this.tableName} ADD CONSTRAINT ${idx.name} FOREIGN KEY (${idx.columns.join(', ')}) REFERENCES ${idx.references.table}(${idx.references.column})`;
        if (idx.onDelete) sql += ` ON DELETE ${idx.onDelete}`;
        if (idx.onUpdate) sql += ` ON UPDATE ${idx.onUpdate}`;
      } else if (idx.type === 'UNIQUE') {
        sql = `ALTER TABLE ${this.tableName} ADD UNIQUE INDEX ${idx.name} (${idx.columns.join(', ')})`;
      } else {
        sql = `ALTER TABLE ${this.tableName} ADD INDEX ${idx.name} (${idx.columns.join(', ')})`;
      }
      statements.push({ sql, ignoreError: false });
    });

    return statements;
  }

  /**
   * Format default value based on type
   */
  static formatDefaultValue(value, type) {
    const lowerType = type.toLowerCase();
    
    if (value === 'CURRENT_TIMESTAMP' || value === 'NULL') {
      return value;
    }
    
    if (lowerType.includes('int') || lowerType.includes('decimal') || 
        lowerType.includes('float') || lowerType.includes('double') ||
        lowerType.includes('boolean') || lowerType.includes('bool')) {
      return value;
    }
    
    return `'${value}'`;
  }

  /**
   * Validate and update table schema
   */
  static async validateAndUpdateSchema() {
    const pool = getPool();
    
    try {
      // Get expected schema from model definition
      const schema = this.getSchema();
      
      // Get actual table structure
      const { columns: actualColumns, indexes: actualIndexes } = await this.getTableStructure();
      
      // If table doesn't exist, create it
      if (actualColumns.length === 0) {
        console.log(`⚠ Table '${this.tableName}' does not exist. Creating...`);
        await this.ensureTable();
        return;
      }

      // Compare schemas
      const changes = this.compareSchemas(
        schema.columns,
        actualColumns,
        schema.indexes || [],
        actualIndexes
      );

      // Check if there are any changes
      const hasChanges = 
        changes.columnsToAdd.length > 0 ||
        changes.columnsToModify.length > 0 ||
        changes.columnsToDrop.length > 0 ||
        changes.indexesToAdd.length > 0;

      if (!hasChanges) {
        console.log(`✓ Table '${this.tableName}' schema is up to date`);
        return;
      }

      // Generate and execute ALTER statements
      console.log(`⚠ Table '${this.tableName}' schema needs updates:`);
      
      if (changes.columnsToAdd.length > 0) {
        console.log(`  - Adding ${changes.columnsToAdd.length} column(s): ${changes.columnsToAdd.map(c => c.name).join(', ')}`);
      }
      if (changes.columnsToModify.length > 0) {
        console.log(`  - Modifying ${changes.columnsToModify.length} column(s): ${changes.columnsToModify.map(c => c.name).join(', ')}`);
      }
      if (changes.indexesToAdd.length > 0) {
        console.log(`  - Adding ${changes.indexesToAdd.length} index(es): ${changes.indexesToAdd.map(i => i.name).join(', ')}`);
      }

      const statements = this.generateAlterStatements(changes);
      
      for (const statement of statements) {
        const isObject = typeof statement === 'object';
        const sql = isObject ? statement.sql : statement;
        const ignoreError = isObject ? statement.ignoreError : false;
        
        try {
          console.log(`  Executing: ${sql}`);
          await pool.query(sql);
        } catch (error) {
          // Ignore expected errors
          if (ignoreError) {
            if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY' || error.code === 'ER_BAD_FIELD_ERROR') {
              // Index or constraint doesn't exist, that's fine
              continue;
            }
          }
          console.error(`  ✗ Error executing: ${sql}`);
          console.error(`    ${error.message}`);
        }
      }

      console.log(`✓ Table '${this.tableName}' schema updated successfully`);
      
    } catch (error) {
      console.error(`✗ Error validating schema for '${this.tableName}':`, error.message);
      throw error;
    }
  }

  /**
   * Ensure table exists and validate schema
   */
  static async ensureTableWithValidation() {
    await this.ensureTable();
    await this.validateAndUpdateSchema();
  }
}

module.exports = BaseModel;
