import { Connection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import DatabaseManager from '../database/connection';
import { 
  Cabinet, 
  CabinetConfig, 
  CreateCabinetRequest, 
  UpdateCabinetRequest, 
  CabinetFilters,
  CabinetStatus,
  createCabinet
} from '../models/cabinet';

export interface CabinetRepository {
  create(data: CreateCabinetRequest): Promise<Cabinet>;
  findById(id: string): Promise<Cabinet | null>;
  findBySlug(slug: string): Promise<Cabinet | null>;
  findAll(filters?: CabinetFilters): Promise<Cabinet[]>;
  update(id: string, data: UpdateCabinetRequest): Promise<Cabinet | null>;
  delete(id: string): Promise<boolean>;
  getConfig(cabinetId: string, configKey: string): Promise<CabinetConfig | null>;
  setConfig(cabinetId: string, configKey: string, configValue: any): Promise<void>;
  deleteConfig(cabinetId: string, configKey: string): Promise<boolean>;
  getAllConfigs(cabinetId: string): Promise<CabinetConfig[]>;
}

export class MySQLCabinetRepository implements CabinetRepository {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async create(data: CreateCabinetRequest): Promise<Cabinet> {
    const cabinet = createCabinet(data);
    const connection = await this.dbManager.getMainConnection();

    try {
      // Check if slug already exists
      const existingCabinet = await this.findBySlug(cabinet.slug);
      if (existingCabinet) {
        throw new Error(`Cabinet with slug '${cabinet.slug}' already exists`);
      }

      // Insert cabinet record
      const insertQuery = `
        INSERT INTO cabinets (
          id, name, slug, address_street, address_city, address_postal_code, 
          address_country, phone, email, timezone, status, database_name, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await connection.execute(insertQuery, [
        cabinet.id,
        cabinet.name,
        cabinet.slug,
        cabinet.address.street,
        cabinet.address.city,
        cabinet.address.postalCode,
        cabinet.address.country,
        cabinet.phone,
        cabinet.email,
        cabinet.timezone,
        cabinet.status,
        cabinet.databaseName,
        cabinet.createdAt,
        cabinet.updatedAt
      ]);

      // Store cabinet settings as configuration
      if (cabinet.settings) {
        await this.setConfig(cabinet.id, 'settings', cabinet.settings);
      }

      return cabinet;
    } catch (error) {
      console.error('Error creating cabinet:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<Cabinet | null> {
    const connection = await this.dbManager.getMainConnection();

    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM cabinets WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        return null;
      }

      const cabinet = this.mapRowToCabinet(rows[0]);
      
      // Load settings from configuration
      const settings = await this.getConfig(id, 'settings');
      if (settings) {
        cabinet.settings = settings.configValue;
      }

      return cabinet;
    } catch (error) {
      console.error('Error finding cabinet by ID:', error);
      throw error;
    }
  }

  async findBySlug(slug: string): Promise<Cabinet | null> {
    const connection = await this.dbManager.getMainConnection();

    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM cabinets WHERE slug = ?',
        [slug]
      );

      if (rows.length === 0) {
        return null;
      }

      const cabinet = this.mapRowToCabinet(rows[0]);
      
      // Load settings from configuration
      const settings = await this.getConfig(cabinet.id, 'settings');
      if (settings) {
        cabinet.settings = settings.configValue;
      }

      return cabinet;
    } catch (error) {
      console.error('Error finding cabinet by slug:', error);
      throw error;
    }
  }

  async findAll(filters: CabinetFilters = {}): Promise<Cabinet[]> {
    const connection = await this.dbManager.getMainConnection();

    try {
      let query = 'SELECT * FROM cabinets WHERE 1=1';
      const params: any[] = [];

      // Apply filters
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.search) {
        query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Add ordering
      query += ' ORDER BY created_at DESC';

      // Add pagination
      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);

        if (filters.offset) {
          query += ' OFFSET ?';
          params.push(filters.offset);
        }
      }

      const [rows] = await connection.execute<RowDataPacket[]>(query, params);

      const cabinets = rows.map(row => this.mapRowToCabinet(row));

      // Load settings for each cabinet (could be optimized with a join)
      for (const cabinet of cabinets) {
        const settings = await this.getConfig(cabinet.id, 'settings');
        if (settings) {
          cabinet.settings = settings.configValue;
        }
      }

      return cabinets;
    } catch (error) {
      console.error('Error finding cabinets:', error);
      throw error;
    }
  }

  async update(id: string, data: UpdateCabinetRequest): Promise<Cabinet | null> {
    const connection = await this.dbManager.getMainConnection();

    try {
      const existingCabinet = await this.findById(id);
      if (!existingCabinet) {
        return null;
      }

      // Build dynamic update query
      const updateFields: string[] = [];
      const params: any[] = [];

      if (data.name !== undefined) {
        updateFields.push('name = ?');
        params.push(data.name);
      }

      if (data.phone !== undefined) {
        updateFields.push('phone = ?');
        params.push(data.phone);
      }

      if (data.email !== undefined) {
        updateFields.push('email = ?');
        params.push(data.email);
      }

      if (data.timezone !== undefined) {
        updateFields.push('timezone = ?');
        params.push(data.timezone);
      }

      if (data.status !== undefined) {
        updateFields.push('status = ?');
        params.push(data.status);
      }

      if (data.address) {
        if (data.address.street !== undefined) {
          updateFields.push('address_street = ?');
          params.push(data.address.street);
        }
        if (data.address.city !== undefined) {
          updateFields.push('address_city = ?');
          params.push(data.address.city);
        }
        if (data.address.postalCode !== undefined) {
          updateFields.push('address_postal_code = ?');
          params.push(data.address.postalCode);
        }
        if (data.address.country !== undefined) {
          updateFields.push('address_country = ?');
          params.push(data.address.country);
        }
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = ?');
        params.push(new Date());
        params.push(id);

        const updateQuery = `UPDATE cabinets SET ${updateFields.join(', ')} WHERE id = ?`;
        await connection.execute(updateQuery, params);
      }

      // Update settings if provided
      if (data.settings) {
        const currentSettings = await this.getConfig(id, 'settings');
        const mergedSettings = currentSettings 
          ? { ...currentSettings.configValue, ...data.settings }
          : data.settings;
        
        await this.setConfig(id, 'settings', mergedSettings);
      }

      // Return updated cabinet
      return await this.findById(id);
    } catch (error) {
      console.error('Error updating cabinet:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    const connection = await this.dbManager.getMainConnection();

    try {
      const [result] = await connection.execute<ResultSetHeader>(
        'DELETE FROM cabinets WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting cabinet:', error);
      throw error;
    }
  }

  async getConfig(cabinetId: string, configKey: string): Promise<CabinetConfig | null> {
    const connection = await this.dbManager.getMainConnection();

    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM cabinet_configurations WHERE cabinet_id = ? AND config_key = ?',
        [cabinetId, configKey]
      );

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      return {
        configKey: row.config_key,
        configValue: JSON.parse(row.config_value),
        cabinetId: row.cabinet_id
      };
    } catch (error) {
      console.error('Error getting cabinet config:', error);
      throw error;
    }
  }

  async setConfig(cabinetId: string, configKey: string, configValue: any): Promise<void> {
    const connection = await this.dbManager.getMainConnection();

    try {
      const query = `
        INSERT INTO cabinet_configurations (id, cabinet_id, config_key, config_value, created_at, updated_at)
        VALUES (UUID(), ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE 
          config_value = VALUES(config_value),
          updated_at = NOW()
      `;

      await connection.execute(query, [
        cabinetId,
        configKey,
        JSON.stringify(configValue)
      ]);
    } catch (error) {
      console.error('Error setting cabinet config:', error);
      throw error;
    }
  }

  async deleteConfig(cabinetId: string, configKey: string): Promise<boolean> {
    const connection = await this.dbManager.getMainConnection();

    try {
      const [result] = await connection.execute<ResultSetHeader>(
        'DELETE FROM cabinet_configurations WHERE cabinet_id = ? AND config_key = ?',
        [cabinetId, configKey]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting cabinet config:', error);
      throw error;
    }
  }

  async getAllConfigs(cabinetId: string): Promise<CabinetConfig[]> {
    const connection = await this.dbManager.getMainConnection();

    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM cabinet_configurations WHERE cabinet_id = ?',
        [cabinetId]
      );

      return rows.map(row => ({
        configKey: row.config_key,
        configValue: JSON.parse(row.config_value),
        cabinetId: row.cabinet_id
      }));
    } catch (error) {
      console.error('Error getting all cabinet configs:', error);
      throw error;
    }
  }

  private mapRowToCabinet(row: RowDataPacket): Cabinet {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      address: {
        street: row.address_street,
        city: row.address_city,
        postalCode: row.address_postal_code,
        country: row.address_country
      },
      phone: row.phone,
      email: row.email,
      timezone: row.timezone,
      status: row.status as CabinetStatus,
      databaseName: row.database_name,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}