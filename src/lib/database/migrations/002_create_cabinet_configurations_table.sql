-- Migration: Create cabinet_configurations table
-- Version: 002
-- Description: Create table for storing cabinet-specific configurations

CREATE TABLE IF NOT EXISTS cabinet_configurations (
    id VARCHAR(36) PRIMARY KEY,
    cabinet_id VARCHAR(36) NOT NULL,
    config_key VARCHAR(100) NOT NULL,
    config_value JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cabinet_id) REFERENCES cabinets(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cabinet_config (cabinet_id, config_key),
    INDEX idx_cabinet_id (cabinet_id),
    INDEX idx_config_key (config_key)
);