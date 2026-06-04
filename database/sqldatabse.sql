-- ============================================================================
-- AgroEstimador - Script PostgreSQL Completo
-- Versión: 1.0.0
-- Fecha: 2026-06-03
-- Motor: PostgreSQL 15+
-- Descripción: Base de datos para estimación de peso y valor de cargas
--              agrícolas mediante muestreo estadístico.
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONES Y CONFIGURACIÓN INICIAL
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; 

-- ============================================================================
-- 1. TABLAS BASE (Sin dependencias FK)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1.1 roles: Catálogo de roles del sistema (RBAC)
-- ----------------------------------------------------------------------------
CREATE TABLE roles (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(50)     NOT NULL,
    description     VARCHAR(255),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_roles_name UNIQUE (name)
);

COMMENT ON TABLE roles IS 'Catálogo de roles del sistema para control de acceso basado en roles (RBAC).';
COMMENT ON COLUMN roles.name IS 'Nombre único del rol: admin, producer, operator, viewer.';

-- ----------------------------------------------------------------------------
-- 1.2 measurement_units: Unidades de medida
-- ----------------------------------------------------------------------------
CREATE TABLE measurement_units (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(50)     NOT NULL,
    abbreviation        VARCHAR(10)     NOT NULL,
    conversion_to_kg    NUMERIC(15,6)   NOT NULL,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_measurement_units_name UNIQUE (name),
    CONSTRAINT uq_measurement_units_abbreviation UNIQUE (abbreviation),
    CONSTRAINT ck_measurement_units_conversion_positive CHECK (conversion_to_kg > 0)
);

COMMENT ON TABLE measurement_units IS 'Catálogo de unidades de medida con factor de conversión a kilogramos.';

-- ----------------------------------------------------------------------------
-- 1.3 app_settings: Configuración global del sistema
-- ----------------------------------------------------------------------------
CREATE TABLE app_settings (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    key             VARCHAR(100)    NOT NULL,
    value           TEXT            NOT NULL,
    data_type       VARCHAR(20)     NOT NULL DEFAULT 'string',
    description     VARCHAR(255),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_app_settings_key UNIQUE (key),
    CONSTRAINT ck_app_settings_data_type CHECK (data_type IN ('string', 'int', 'bool', 'json', 'decimal'))
);

COMMENT ON TABLE app_settings IS 'Parámetros de configuración global del sistema (moneda, zona horaria, versión).';

-- ----------------------------------------------------------------------------
-- 1.4 audit_logs: Registro de auditoría (sin FK para evitar dependencias circulares)
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id              BIGINT          PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    table_name      VARCHAR(50)     NOT NULL,
    record_id       UUID            NOT NULL,
    action          VARCHAR(10)     NOT NULL,
    old_values      JSONB,
    new_values      JSONB,
    changed_fields  TEXT[],
    user_id         UUID,
    ip_address      INET,
    user_agent      VARCHAR(500),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_audit_logs_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))
);

COMMENT ON TABLE audit_logs IS 'Registro inmutable de auditoría para todas las operaciones de cambio en entidades críticas.';
COMMENT ON COLUMN audit_logs.old_values IS 'Valores anteriores del registro (para UPDATE y DELETE). Formato JSONB.';
COMMENT ON COLUMN audit_logs.new_values IS 'Valores nuevos del registro (para INSERT y UPDATE). Formato JSONB.';
COMMENT ON COLUMN audit_logs.changed_fields IS 'Lista de campos que fueron modificados (solo para UPDATE).';

-- ============================================================================
-- 2. TABLAS DE USUARIO Y AUTENTICACIÓN
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 users: Usuarios del sistema
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name          VARCHAR(100)    NOT NULL,
    last_name           VARCHAR(100)    NOT NULL,
    email               VARCHAR(255)    NOT NULL,
    password_hash       VARCHAR(512)    NOT NULL,
    phone               VARCHAR(20),
    document_number     VARCHAR(30),
    avatar_url          VARCHAR(500),
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    email_verified_at   TIMESTAMPTZ,
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_document_number UNIQUE (document_number)
);

COMMENT ON TABLE users IS 'Usuarios registrados: agricultores, operadores y administradores del sistema.';
COMMENT ON COLUMN users.password_hash IS 'Hash del password generado con bcrypt o Argon2. Nunca almacenar texto plano.';
COMMENT ON COLUMN users.document_number IS 'Cédula de ciudadanía o NIT (Colombia). Único en todo el sistema.';

-- ----------------------------------------------------------------------------
-- 2.2 user_roles: Relación N:M entre usuarios y roles
-- ----------------------------------------------------------------------------
CREATE TABLE user_roles (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL,
    role_id         UUID            NOT NULL,
    assigned_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    assigned_by     UUID,

    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id)
        REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_user_roles_assigned_by FOREIGN KEY (assigned_by)
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT uq_user_roles_user_role UNIQUE (user_id, role_id)
);

COMMENT ON TABLE user_roles IS 'Tabla pivote para la asignación N:M de roles a usuarios.';

-- ----------------------------------------------------------------------------
-- 2.3 refresh_tokens: Tokens de refresco JWT
-- ----------------------------------------------------------------------------
CREATE TABLE refresh_tokens (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL,
    token           VARCHAR(512)    NOT NULL,
    device_id       VARCHAR(100),
    expires_at      TIMESTAMPTZ     NOT NULL,
    is_revoked      BOOLEAN         NOT NULL DEFAULT FALSE,
    revoked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT uq_refresh_tokens_token UNIQUE (token)
);

COMMENT ON TABLE refresh_tokens IS 'Tokens de refresco para autenticación JWT con rotación y revocación.';

-- ============================================================================
-- 3. TABLAS DE CATÁLOGOS Y ENTIDADES DE NEGOCIO
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1 products: Catálogo de productos agrícolas
-- ----------------------------------------------------------------------------
CREATE TABLE products (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    VARCHAR(150)    NOT NULL,
    description             VARCHAR(500),
    default_unit_id         UUID,
    current_price_per_kg    NUMERIC(12,2),
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_products_name UNIQUE (name),
    CONSTRAINT fk_products_unit FOREIGN KEY (default_unit_id)
        REFERENCES measurement_units(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT ck_products_price_non_negative CHECK (current_price_per_kg IS NULL OR current_price_per_kg >= 0)
);

COMMENT ON TABLE products IS 'Catálogo de productos agrícolas: fruto de palma, cacao, café, plátano, etc.';

-- ----------------------------------------------------------------------------
-- 3.2 product_price_history: Historial de precios por producto
-- ----------------------------------------------------------------------------
CREATE TABLE product_price_history (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID            NOT NULL,
    price_per_kg    NUMERIC(12,2)   NOT NULL,
    effective_date  DATE            NOT NULL,
    end_date        DATE,
    source          VARCHAR(100),
    created_by      UUID,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_price_history_product FOREIGN KEY (product_id)
        REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_price_history_created_by FOREIGN KEY (created_by)
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT uq_price_history_product_date UNIQUE (product_id, effective_date),
    CONSTRAINT ck_price_history_price_positive CHECK (price_per_kg > 0),
    CONSTRAINT ck_price_history_date_range CHECK (end_date IS NULL OR end_date >= effective_date)
);

COMMENT ON TABLE product_price_history IS 'Historial de precios por producto. Preserva el precio vigente en cada período.';
COMMENT ON COLUMN product_price_history.end_date IS 'NULL indica que el precio sigue vigente.';
COMMENT ON COLUMN product_price_history.source IS 'Fuente del precio: Fedepalma, mercado local, negociación directa, etc.';

-- ----------------------------------------------------------------------------
-- 3.3 farms: Fincas registradas
-- ----------------------------------------------------------------------------
CREATE TABLE farms (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL,
    name            VARCHAR(150)    NOT NULL,
    location        VARCHAR(255),
    municipality    VARCHAR(100),
    department      VARCHAR(100),
    total_hectares  NUMERIC(10,2),
    latitude        NUMERIC(10,7),
    longitude       NUMERIC(10,7),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_farms_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT uq_farms_user_name UNIQUE (user_id, name),
    CONSTRAINT ck_farms_hectares_non_negative CHECK (total_hectares IS NULL OR total_hectares >= 0),
    CONSTRAINT ck_farms_latitude_range CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
    CONSTRAINT ck_farms_longitude_range CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
);

COMMENT ON TABLE farms IS 'Fincas registradas por los usuarios productores. Unidad productiva principal.';
COMMENT ON COLUMN farms.latitude IS 'Coordenada GPS para geolocalización futura. Rango: -90 a 90.';
COMMENT ON COLUMN farms.longitude IS 'Coordenada GPS para geolocalización futura. Rango: -180 a 180.';

-- ----------------------------------------------------------------------------
-- 3.4 lots: Lotes dentro de una finca
-- ----------------------------------------------------------------------------
CREATE TABLE lots (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id         UUID            NOT NULL,
    name            VARCHAR(100)    NOT NULL,
    hectares        NUMERIC(10,2),
    crop_type       VARCHAR(100),
    planting_date   DATE,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_lots_farm FOREIGN KEY (farm_id)
        REFERENCES farms(id) ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT uq_lots_farm_name UNIQUE (farm_id, name),
    CONSTRAINT ck_lots_hectares_non_negative CHECK (hectares IS NULL OR hectares >= 0)
);

COMMENT ON TABLE lots IS 'Lotes o subdivisiones dentro de una finca. Permiten trazabilidad granular.';

-- ----------------------------------------------------------------------------
-- 3.5 vehicles: Vehículos de transporte
-- ----------------------------------------------------------------------------
CREATE TABLE vehicles (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID            NOT NULL,
    name                VARCHAR(100)    NOT NULL,
    plate               VARCHAR(20)     NOT NULL,
    vehicle_type        VARCHAR(50),
    capacity_kg         NUMERIC(10,2)   NOT NULL,
    tare_weight_kg      NUMERIC(10,2),
    fuel_level          SMALLINT,
    next_service_date   DATE,
    status              VARCHAR(20)     NOT NULL DEFAULT 'active',
    maintenance_notes   TEXT,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_vehicles_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT uq_vehicles_plate UNIQUE (plate),
    CONSTRAINT ck_vehicles_capacity_positive CHECK (capacity_kg > 0),
    CONSTRAINT ck_vehicles_tare_non_negative CHECK (tare_weight_kg IS NULL OR tare_weight_kg >= 0),
    CONSTRAINT ck_vehicles_fuel_range CHECK (fuel_level IS NULL OR (fuel_level >= 0 AND fuel_level <= 100)),
    CONSTRAINT ck_vehicles_status CHECK (status IN ('active', 'maintenance', 'inactive'))
);

COMMENT ON TABLE vehicles IS 'Vehículos utilizados para transportar la cosecha desde el campo.';
COMMENT ON COLUMN vehicles.tare_weight_kg IS 'Peso del vehículo vacío (tara). Útil para cálculos por diferencia.';

-- ============================================================================
-- 4. TABLAS TRANSACCIONALES (Cosechas y Muestras)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 4.1 harvests: Registro principal de cosechas
-- ----------------------------------------------------------------------------
CREATE TABLE harvests (
    id                          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID            NOT NULL,
    farm_id                     UUID            NOT NULL,
    lot_id                      UUID,
    product_id                  UUID            NOT NULL,
    vehicle_id                  UUID,
    harvest_date                DATE            NOT NULL,
    total_bunches               INTEGER         NOT NULL,
    price_per_kg_at_harvest     NUMERIC(12,2),
    notes                       TEXT,
    weather_conditions          VARCHAR(50),
    status                      VARCHAR(20)     NOT NULL DEFAULT 'draft',
    device_id                   VARCHAR(100),
    is_synced                   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_harvests_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_harvests_farm FOREIGN KEY (farm_id)
        REFERENCES farms(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_harvests_lot FOREIGN KEY (lot_id)
        REFERENCES lots(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_harvests_product FOREIGN KEY (product_id)
        REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_harvests_vehicle FOREIGN KEY (vehicle_id)
        REFERENCES vehicles(id) ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT ck_harvests_total_bunches_positive CHECK (total_bunches > 0),
    CONSTRAINT ck_harvests_price_non_negative CHECK (price_per_kg_at_harvest IS NULL OR price_per_kg_at_harvest >= 0),
    CONSTRAINT ck_harvests_status CHECK (status IN ('draft', 'completed', 'cancelled')),
    CONSTRAINT ck_harvests_date_not_future CHECK (harvest_date <= CURRENT_DATE + INTERVAL '1 day')
);

COMMENT ON TABLE harvests IS 'Registro principal de cada cosecha. Entidad transaccional central del sistema.';
COMMENT ON COLUMN harvests.total_bunches IS 'Cantidad total de racimos o gajos en la carga.';
COMMENT ON COLUMN harvests.price_per_kg_at_harvest IS 'Snapshot del precio por kg al momento de la cosecha. Denormalización intencional para consulta rápida.';
COMMENT ON COLUMN harvests.device_id IS 'Identificador del dispositivo móvil que registró la cosecha. Usado para sincronización.';
COMMENT ON COLUMN harvests.is_synced IS 'TRUE si el registro ya fue sincronizado con el servidor. FALSE si está pendiente.';

-- ----------------------------------------------------------------------------
-- 4.2 harvest_samples: Muestras tomadas durante la cosecha
-- ----------------------------------------------------------------------------
CREATE TABLE harvest_samples (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    harvest_id      UUID            NOT NULL,
    sample_number   SMALLINT        NOT NULL,
    weight_kg       NUMERIC(8,3)    NOT NULL,
    quality         VARCHAR(10),
    notes           VARCHAR(255),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_harvest_samples_harvest FOREIGN KEY (harvest_id)
        REFERENCES harvests(id) ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT uq_harvest_samples_harvest_number UNIQUE (harvest_id, sample_number),
    CONSTRAINT ck_harvest_samples_number_positive CHECK (sample_number > 0),
    CONSTRAINT ck_harvest_samples_weight_positive CHECK (weight_kg > 0),
    CONSTRAINT ck_harvest_samples_quality CHECK (quality IS NULL OR quality IN ('high', 'medium', 'low'))
);

COMMENT ON TABLE harvest_samples IS 'Muestras individuales de racimos/gajos pesados durante una cosecha.';
COMMENT ON COLUMN harvest_samples.sample_number IS 'Número secuencial de la muestra dentro de la cosecha (1, 2, 3...).';

-- ----------------------------------------------------------------------------
-- 4.3 harvest_calculations: Cálculos automáticos por cosecha
-- ----------------------------------------------------------------------------
CREATE TABLE harvest_calculations (
    id                          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    harvest_id                  UUID            NOT NULL,
    sample_count                INTEGER         NOT NULL,
    average_weight_kg           NUMERIC(10,3)   NOT NULL,
    std_deviation_kg            NUMERIC(10,3),
    min_weight_kg               NUMERIC(8,3),
    max_weight_kg               NUMERIC(8,3),
    estimated_total_weight_kg   NUMERIC(12,3)   NOT NULL,
    estimated_value             NUMERIC(15,2),
    confidence_level            NUMERIC(5,2),
    calculation_method          VARCHAR(50)     NOT NULL DEFAULT 'simple_average',
    calculated_at               TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    calculated_by               UUID,

    CONSTRAINT fk_harvest_calculations_harvest FOREIGN KEY (harvest_id)
        REFERENCES harvests(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_harvest_calculations_user FOREIGN KEY (calculated_by)
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT uq_harvest_calculations_harvest UNIQUE (harvest_id),
    CONSTRAINT ck_harvest_calculations_sample_count_positive CHECK (sample_count > 0),
    CONSTRAINT ck_harvest_calculations_avg_weight_positive CHECK (average_weight_kg > 0),
    CONSTRAINT ck_harvest_calculations_std_dev_non_negative CHECK (std_deviation_kg IS NULL OR std_deviation_kg >= 0),
    CONSTRAINT ck_harvest_calculations_total_weight_positive CHECK (estimated_total_weight_kg > 0),
    CONSTRAINT ck_harvest_calculations_value_non_negative CHECK (estimated_value IS NULL OR estimated_value >= 0),
    CONSTRAINT ck_harvest_calculations_confidence_range CHECK (confidence_level IS NULL OR (confidence_level >= 0 AND confidence_level <= 100))
);

COMMENT ON TABLE harvest_calculations IS 'Cálculos estadísticos derivados de las muestras de cada cosecha. Relación 1:1 con harvests.';
COMMENT ON COLUMN harvest_calculations.estimated_total_weight_kg IS 'total_bunches × average_weight_kg. Peso estimado total de la carga.';
COMMENT ON COLUMN harvest_calculations.estimated_value IS 'estimated_total_weight_kg × price_per_kg_at_harvest. Valor comercial estimado.';
COMMENT ON COLUMN harvest_calculations.confidence_level IS 'Nivel de confianza estadístico del estimado (0-100%).';

-- ============================================================================
-- 5. TABLAS DE SINCRONIZACIÓN OFFLINE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 5.1 sync_queue: Cola de operaciones pendientes
-- ----------------------------------------------------------------------------
CREATE TABLE sync_queue (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id           VARCHAR(100)    NOT NULL,
    user_id             UUID            NOT NULL,
    entity_type         VARCHAR(50)     NOT NULL,
    entity_id           UUID            NOT NULL,
    operation           VARCHAR(10)     NOT NULL,
    payload             JSONB           NOT NULL,
    status              VARCHAR(20)     NOT NULL DEFAULT 'pending',
    attempts            SMALLINT        NOT NULL DEFAULT 0,
    error_message       TEXT,
    client_timestamp    TIMESTAMPTZ     NOT NULL,
    server_timestamp    TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_sync_queue_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT ck_sync_queue_operation CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    CONSTRAINT ck_sync_queue_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT ck_sync_queue_attempts_non_negative CHECK (attempts >= 0)
);

COMMENT ON TABLE sync_queue IS 'Cola FIFO de operaciones pendientes de sincronización desde dispositivos móviles offline.';
COMMENT ON COLUMN sync_queue.client_timestamp IS 'Timestamp del dispositivo al momento de la operación. Preserva el momento real en campo.';

-- ----------------------------------------------------------------------------
-- 5.2 sync_conflicts: Conflictos detectados durante sincronización
-- ----------------------------------------------------------------------------
CREATE TABLE sync_conflicts (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_queue_id   UUID            NOT NULL,
    entity_type     VARCHAR(50)     NOT NULL,
    entity_id       UUID            NOT NULL,
    client_data     JSONB           NOT NULL,
    server_data     JSONB           NOT NULL,
    resolution      VARCHAR(20),
    resolved_by     UUID,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_sync_conflicts_queue FOREIGN KEY (sync_queue_id)
        REFERENCES sync_queue(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_sync_conflicts_resolved_by FOREIGN KEY (resolved_by)
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT ck_sync_conflicts_resolution CHECK (
        resolution IS NULL OR resolution IN ('client_wins', 'server_wins', 'manual', 'merged')
    )
);

COMMENT ON TABLE sync_conflicts IS 'Conflictos detectados durante la sincronización offline para resolución manual o automática.';

-- ============================================================================
-- 6. ÍNDICES
-- ============================================================================

-- --- Índices para users ---
CREATE INDEX ix_users_active ON users(is_active) WHERE is_active = TRUE;
CREATE INDEX ix_users_email_active ON users(email) WHERE is_active = TRUE;

-- --- Índices para user_roles ---
CREATE INDEX ix_user_roles_user_id ON user_roles(user_id);
CREATE INDEX ix_user_roles_role_id ON user_roles(role_id);

-- --- Índices para refresh_tokens ---
CREATE INDEX ix_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX ix_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE is_revoked = FALSE;

-- --- Índices para farms ---
CREATE INDEX ix_farms_user_id ON farms(user_id);
CREATE INDEX ix_farms_user_active ON farms(user_id) WHERE is_active = TRUE;
CREATE INDEX ix_farms_department ON farms(department) WHERE department IS NOT NULL;

-- --- Índices para lots ---
CREATE INDEX ix_lots_farm_id ON lots(farm_id);
CREATE INDEX ix_lots_farm_active ON lots(farm_id) WHERE is_active = TRUE;

-- --- Índices para products ---
CREATE INDEX ix_products_active ON products(is_active) WHERE is_active = TRUE;

-- --- Índices para product_price_history ---
CREATE INDEX ix_price_history_product_date ON product_price_history(product_id, effective_date DESC);
CREATE INDEX ix_price_history_current ON product_price_history(product_id) WHERE end_date IS NULL;

-- --- Índices para vehicles ---
CREATE INDEX ix_vehicles_user_id ON vehicles(user_id);
CREATE INDEX ix_vehicles_user_active ON vehicles(user_id) WHERE is_active = TRUE;
CREATE INDEX ix_vehicles_status ON vehicles(status);
CREATE INDEX ix_vehicles_next_service ON vehicles(next_service_date) WHERE next_service_date IS NOT NULL;

-- --- Índices para harvests (CRÍTICOS para rendimiento) ---
CREATE INDEX ix_harvests_user_id ON harvests(user_id);
CREATE INDEX ix_harvests_farm_id ON harvests(farm_id);
CREATE INDEX ix_harvests_lot_id ON harvests(lot_id) WHERE lot_id IS NOT NULL;
CREATE INDEX ix_harvests_product_id ON harvests(product_id);
CREATE INDEX ix_harvests_vehicle_id ON harvests(vehicle_id) WHERE vehicle_id IS NOT NULL;
CREATE INDEX ix_harvests_harvest_date ON harvests(harvest_date DESC);
CREATE INDEX ix_harvests_status ON harvests(status);

-- Índices compuestos para consultas frecuentes
CREATE INDEX ix_harvests_user_date ON harvests(user_id, harvest_date DESC);
CREATE INDEX ix_harvests_farm_date ON harvests(farm_id, harvest_date DESC);
CREATE INDEX ix_harvests_product_date ON harvests(product_id, harvest_date DESC);
CREATE INDEX ix_harvests_user_farm_date ON harvests(user_id, farm_id, harvest_date DESC);
CREATE INDEX ix_harvests_user_status ON harvests(user_id, status);

-- Índice para sincronización
CREATE INDEX ix_harvests_synced ON harvests(is_synced) WHERE is_synced = FALSE;

-- --- Índices para harvest_samples ---
CREATE INDEX ix_harvest_samples_harvest_id ON harvest_samples(harvest_id);

-- --- Índices para harvest_calculations ---
-- (harvest_id ya tiene UNIQUE constraint que crea un índice implícito)
CREATE INDEX ix_harvest_calculations_calculated_at ON harvest_calculations(calculated_at DESC);

-- --- Índices para sync_queue ---
CREATE INDEX ix_sync_queue_user_id ON sync_queue(user_id);
CREATE INDEX ix_sync_queue_status ON sync_queue(status) WHERE status IN ('pending', 'processing');
CREATE INDEX ix_sync_queue_user_status ON sync_queue(user_id, status);
CREATE INDEX ix_sync_queue_device ON sync_queue(device_id, created_at DESC);
CREATE INDEX ix_sync_queue_entity ON sync_queue(entity_type, entity_id);

-- --- Índices para sync_conflicts ---
CREATE INDEX ix_sync_conflicts_queue_id ON sync_conflicts(sync_queue_id);
CREATE INDEX ix_sync_conflicts_unresolved ON sync_conflicts(created_at DESC) WHERE resolution IS NULL;

-- --- Índices para audit_logs (alto volumen) ---
CREATE INDEX ix_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX ix_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX ix_audit_logs_user_id ON audit_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX ix_audit_logs_table_action ON audit_logs(table_name, action);

-- ============================================================================
-- 7. FUNCIONES Y TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 7.1 Función: Actualización automática de updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_update_timestamp() IS 'Actualiza automáticamente el campo updated_at al valor actual en cada UPDATE.';

-- --- Triggers de updated_at para cada tabla que lo tiene ---
CREATE TRIGGER tr_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER tr_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER tr_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER tr_farms_updated_at
    BEFORE UPDATE ON farms
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER tr_lots_updated_at
    BEFORE UPDATE ON lots
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER tr_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER tr_harvests_updated_at
    BEFORE UPDATE ON harvests
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER tr_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- ----------------------------------------------------------------------------
-- 7.2 Función: Trigger de auditoría genérico
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_old_values JSONB;
    v_new_values JSONB;
    v_changed TEXT[];
    v_key TEXT;
BEGIN
    -- Obtener el user_id de la sesión (establecido por el backend con SET LOCAL)
    BEGIN
        v_user_id := current_setting('app.current_user_id', TRUE)::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_values, user_id, created_at)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), v_user_id, NOW());
        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Calcular campos modificados
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
        v_changed := ARRAY[]::TEXT[];

        FOR v_key IN SELECT jsonb_object_keys(v_new_values)
        LOOP
            IF v_old_values->v_key IS DISTINCT FROM v_new_values->v_key THEN
                v_changed := array_append(v_changed, v_key);
            END IF;
        END LOOP;

        -- Solo auditar si realmente hubo cambios
        IF array_length(v_changed, 1) > 0 THEN
            INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_fields, user_id, created_at)
            VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', v_old_values, v_new_values, v_changed, v_user_id, NOW());
        END IF;
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, user_id, created_at)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), v_user_id, NOW());
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_audit_trigger() IS 'Trigger de auditoría genérico. Registra INSERT, UPDATE y DELETE en audit_logs con detección de campos modificados.';

-- --- Triggers de auditoría para entidades críticas ---
CREATE TRIGGER tr_users_audit
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER tr_farms_audit
    AFTER INSERT OR UPDATE OR DELETE ON farms
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER tr_lots_audit
    AFTER INSERT OR UPDATE OR DELETE ON lots
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER tr_products_audit
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER tr_vehicles_audit
    AFTER INSERT OR UPDATE OR DELETE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER tr_harvests_audit
    AFTER INSERT OR UPDATE OR DELETE ON harvests
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER tr_harvest_samples_audit
    AFTER INSERT OR UPDATE OR DELETE ON harvest_samples
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER tr_harvest_calculations_audit
    AFTER INSERT OR UPDATE OR DELETE ON harvest_calculations
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

-- ============================================================================
-- 8. VISTAS MATERIALIZADAS PARA ESTADÍSTICAS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 8.1 Estadísticas por finca
-- ----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_farm_statistics AS
SELECT
    f.id                        AS farm_id,
    f.name                      AS farm_name,
    f.user_id,
    COUNT(h.id)                 AS total_harvests,
    COALESCE(SUM(hc.estimated_total_weight_kg), 0)  AS total_weight_kg,
    COALESCE(SUM(hc.estimated_value), 0)            AS total_value,
    COALESCE(AVG(hc.average_weight_kg), 0)          AS avg_weight_per_bunch,
    MIN(h.harvest_date)         AS first_harvest_date,
    MAX(h.harvest_date)         AS last_harvest_date,
    COUNT(DISTINCT h.product_id) AS distinct_products,
    COUNT(DISTINCT h.lot_id)    AS distinct_lots
FROM farms f
LEFT JOIN harvests h ON h.farm_id = f.id AND h.status = 'completed'
LEFT JOIN harvest_calculations hc ON hc.harvest_id = h.id
WHERE f.is_active = TRUE
GROUP BY f.id, f.name, f.user_id;

CREATE UNIQUE INDEX ix_mv_farm_statistics_farm_id ON mv_farm_statistics(farm_id);
CREATE INDEX ix_mv_farm_statistics_user_id ON mv_farm_statistics(user_id);

COMMENT ON MATERIALIZED VIEW mv_farm_statistics IS 'Vista materializada con estadísticas agregadas por finca. Refrescar periódicamente con REFRESH MATERIALIZED VIEW CONCURRENTLY.';

-- ----------------------------------------------------------------------------
-- 8.2 Estadísticas por producto
-- ----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_product_statistics AS
SELECT
    p.id                        AS product_id,
    p.name                      AS product_name,
    COUNT(h.id)                 AS total_harvests,
    COUNT(DISTINCT h.user_id)   AS distinct_producers,
    COUNT(DISTINCT h.farm_id)   AS distinct_farms,
    COALESCE(SUM(hc.estimated_total_weight_kg), 0)  AS total_weight_kg,
    COALESCE(SUM(hc.estimated_value), 0)            AS total_value,
    COALESCE(AVG(hc.average_weight_kg), 0)          AS avg_weight_per_bunch,
    MIN(h.harvest_date)         AS first_harvest_date,
    MAX(h.harvest_date)         AS last_harvest_date
FROM products p
LEFT JOIN harvests h ON h.product_id = p.id AND h.status = 'completed'
LEFT JOIN harvest_calculations hc ON hc.harvest_id = h.id
WHERE p.is_active = TRUE
GROUP BY p.id, p.name;

CREATE UNIQUE INDEX ix_mv_product_statistics_product_id ON mv_product_statistics(product_id);

COMMENT ON MATERIALIZED VIEW mv_product_statistics IS 'Vista materializada con estadísticas agregadas por producto agrícola.';

-- ----------------------------------------------------------------------------
-- 8.3 Estadísticas mensuales por usuario
-- ----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_monthly_statistics AS
SELECT
    h.user_id,
    DATE_TRUNC('month', h.harvest_date)::DATE       AS month,
    COUNT(h.id)                                      AS total_harvests,
    SUM(h.total_bunches)                             AS total_bunches,
    COALESCE(SUM(hc.estimated_total_weight_kg), 0)   AS total_weight_kg,
    COALESCE(SUM(hc.estimated_value), 0)             AS total_value,
    COALESCE(AVG(hc.average_weight_kg), 0)           AS avg_weight_per_bunch,
    COUNT(DISTINCT h.farm_id)                        AS farms_harvested,
    COUNT(DISTINCT h.product_id)                     AS products_harvested
FROM harvests h
LEFT JOIN harvest_calculations hc ON hc.harvest_id = h.id
WHERE h.status = 'completed'
GROUP BY h.user_id, DATE_TRUNC('month', h.harvest_date);

CREATE UNIQUE INDEX ix_mv_monthly_statistics_user_month ON mv_monthly_statistics(user_id, month);

COMMENT ON MATERIALIZED VIEW mv_monthly_statistics IS 'Vista materializada con estadísticas mensuales por usuario para el dashboard.';

-- ============================================================================
-- 9. DATOS SEMILLA (SEED DATA)
-- ============================================================================

-- --- Roles predeterminados ---
INSERT INTO roles (name, description) VALUES
    ('admin',       'Administrador del sistema con acceso total'),
    ('producer',    'Agricultor/productor que registra cosechas'),
    ('operator',    'Operario que asiste en el registro de cosechas'),
    ('viewer',      'Usuario de solo lectura para consultas y reportes');

-- --- Unidades de medida predeterminadas ---
INSERT INTO measurement_units (name, abbreviation, conversion_to_kg) VALUES
    ('Kilogramo',   'kg',   1.000000),
    ('Tonelada',    'ton',  1000.000000),
    ('Libra',       'lb',   0.453592),
    ('Arroba',      '@',    12.500000),
    ('Gramo',       'g',    0.001000);

-- --- Productos agrícolas típicos de Colombia ---
INSERT INTO products (name, description, current_price_per_kg) VALUES
    ('Fruto de Palma de Aceite',    'Racimos de fruto fresco (RFF) de palma africana',  850.00),
    ('Cacao en Grano',              'Grano de cacao seco y fermentado',                 8500.00),
    ('Café Pergamino',              'Café en pergamino seco',                           9200.00),
    ('Plátano Hartón',              'Racimos de plátano hartón para consumo',           1200.00),
    ('Yuca',                        'Raíz de yuca fresca',                              600.00),
    ('Aguacate Hass',               'Fruto de aguacate variedad Hass',                  4500.00),
    ('Naranja Valencia',            'Naranja variedad Valencia',                         1800.00),
    ('Maíz en Grano',               'Grano de maíz seco',                              1100.00);

-- --- Configuración inicial del sistema ---
INSERT INTO app_settings (key, value, data_type, description) VALUES
    ('default_currency',        'COP',      'string',   'Moneda predeterminada del sistema (ISO 4217)'),
    ('default_timezone',        'America/Bogota', 'string', 'Zona horaria predeterminada'),
    ('default_language',        'es',       'string',   'Idioma predeterminado del sistema'),
    ('min_samples_for_calculation', '3',    'int',      'Mínimo de muestras requeridas para calcular estimaciones'),
    ('max_sync_retries',        '5',        'int',      'Máximo de reintentos de sincronización'),
    ('schema_version',          '1.0.0',    'string',   'Versión del esquema de base de datos'),
    ('maintenance_mode',        'false',    'bool',     'Indica si el sistema está en mantenimiento');

-- ============================================================================
-- 10. FUNCIÓN DE UTILIDAD: Refrescar todas las vistas materializadas
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_refresh_all_materialized_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_farm_statistics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_statistics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_statistics;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_refresh_all_materialized_views() IS 'Refresca todas las vistas materializadas de estadísticas. Llamar desde un cron job o después de operaciones masivas.';

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

-- Verificación: Listar todas las tablas creadas
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
-- ORDER BY table_name;

-- Verificación: Listar todas las vistas materializadas
-- SELECT matviewname FROM pg_matviews WHERE schemaname = 'public';
