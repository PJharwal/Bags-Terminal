import psycopg2
from psycopg2.extras import RealDictCursor
import os
import time
import json

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postress:ul")

def get_db_connection():
    """Create a database connection"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def init_db():
    """Initialize the database with the schema"""
    conn = get_db_connection()
    if not conn:
        return

    try:
        cur = conn.cursor()
        
        # Read schema from a string or file. Since the user provided the schema in the prompt, 
        # I will embed it here for simplicity, but ideally it should be in a separate .sql file.
        schema_sql = """
        -- ============================================================================
        -- TOKENS TABLE - Static/Semi-Static Metadata
        -- ============================================================================
        CREATE TABLE IF NOT EXISTS tokens (
            -- Core Identity (from base_token_info)
            mint VARCHAR(44) PRIMARY KEY,  -- base_address in API
            name VARCHAR(255),
            symbol VARCHAR(32),
            logo TEXT,
            creator VARCHAR(44) NOT NULL,
            
            -- Supply & Economics (static after creation)
            total_supply NUMERIC(30, 0),
            
            -- Platform Info
            platform VARCHAR(20) DEFAULT 'pumpfun',
            launchpad VARCHAR(50),  -- "Pump.fun", "Raydium", etc.
            
            -- Pool Information
            pool_address VARCHAR(44),  -- address in API root / pool_id in base_token_info
            biggest_pool_address VARCHAR(44),
            pool_type INTEGER,
            bonding_curve VARCHAR(44),
            
            -- Quote Token Info
            quote_address VARCHAR(44),  -- SOL address
            quote_symbol VARCHAR(10),   -- "SOL"
            
            -- Launch Data
            initial_liquidity NUMERIC(20, 9),
            initial_quote_reserve NUMERIC(20, 9),
            
            -- Burn Status (semi-static)
            burn_ratio NUMERIC(5, 4),
            burn_status VARCHAR(20),
            dev_token_burn_amount NUMERIC(30, 0),
            dev_token_burn_ratio NUMERIC(5, 4),
            
            -- Authority Status (static after renouncement)
            renounced BOOLEAN,
            renounced_mint INTEGER DEFAULT 0,
            renounced_freeze_account INTEGER DEFAULT 0,
            renowned_count INTEGER DEFAULT 0,
            
            -- Tax Configuration (semi-static)
            buy_tax NUMERIC(5, 4),
            sell_tax NUMERIC(5, 4),
            
            -- Security Flags (semi-static)
            is_honeypot BOOLEAN,
            rug_ratio NUMERIC(5, 4),
            cto_flag INTEGER DEFAULT 0,
            
            -- Social & Metadata (semi-static)
            social_links JSONB,
            twitter_change_flag INTEGER DEFAULT 0,
            twitter_rename_count INTEGER DEFAULT 0,
            telegram_dup INTEGER DEFAULT 0,
            twitter_dup INTEGER DEFAULT 0,
            website_dup INTEGER DEFAULT 0,
            image_dup VARCHAR(10),
            
            -- Creator Status (semi-static)
            creator_close BOOLEAN DEFAULT false,
            creator_token_status VARCHAR(50),  -- "creator_hold", "creator_sold", etc.
            
            -- DexScreener Marketing (changes occasionally)
            dexscr_ad INTEGER DEFAULT 0,
            dexscr_ad_ts BIGINT,
            dexscr_update_link INTEGER DEFAULT 0,
            dexscr_update_link_ts BIGINT,
            dexscr_boost_fee NUMERIC(10, 4),
            dexscr_boost_ts BIGINT,
            dexscr_trending_bar INTEGER DEFAULT 0,
            dexscr_trending_bar_ts BIGINT,
            
            -- Timestamps
            creation_timestamp BIGINT,
            open_timestamp BIGINT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            migrated_at TIMESTAMP WITH TIME ZONE,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_tokens_creator ON tokens(creator);
        CREATE INDEX IF NOT EXISTS idx_tokens_created_at ON tokens(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_tokens_creation_ts ON tokens(creation_timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_tokens_launchpad ON tokens(launchpad);
        CREATE INDEX IF NOT EXISTS idx_tokens_burn_status ON tokens(burn_status);
        CREATE INDEX IF NOT EXISTS idx_tokens_honeypot ON tokens(is_honeypot) WHERE is_honeypot = true;
        CREATE INDEX IF NOT EXISTS idx_tokens_pool ON tokens(pool_address);

        -- ============================================================================
        -- TOKEN STATE TABLE - Frequently Changing Data
        -- ============================================================================
        CREATE TABLE IF NOT EXISTS token_state (
            mint VARCHAR(44) PRIMARY KEY REFERENCES tokens(mint) ON DELETE CASCADE,
            
            -- Current Price & Market Cap (changes every trade)
            price NUMERIC(20, 12),              -- price in API
            price_sol NUMERIC(20, 12),          -- same as above, kept for compatibility
            market_cap NUMERIC(20, 4),
            market_cap_sol NUMERIC(20, 4),
            history_highest_market_cap NUMERIC(20, 4),
            
            -- Liquidity (changes frequently)
            liquidity NUMERIC(20, 9),
            quote_reserve NUMERIC(20, 9),
            quote_reserve_usd NUMERIC(20, 4),
            
            -- Bonding Curve Progress
            curve_progress NUMERIC(5, 2) DEFAULT 0 CHECK (curve_progress >= 0 AND curve_progress <= 100),
            virtual_sol_reserves NUMERIC(30, 0),
            virtual_token_reserves NUMERIC(30, 0),
            real_sol_reserves NUMERIC(30, 0),
            real_token_reserves NUMERIC(30, 0),
            
            -- 24h Trading Metrics (updated frequently)
            volume_24h NUMERIC(20, 9),          -- volume in API
            buys_24h INTEGER,                   -- buys in API
            sells_24h INTEGER,                  -- sells in API
            swaps_24h INTEGER,                  -- swaps in API
            total_fee NUMERIC(20, 9),
            
            -- Price Changes (updated every few minutes)
            price_change_5m NUMERIC(10, 4),    -- price_change_percent5m
            price_change_1h NUMERIC(10, 4),    -- price_change_percent1h
            price_change_1m NUMERIC(10, 4),    -- price_change_percent1m (likely 1 month)
            
            -- Holder Metrics (updated periodically)
            holder_count INTEGER DEFAULT 0,
            top_10_holder_rate NUMERIC(5, 4),
            bluechip_owner_percentage NUMERIC(5, 4),
            
            -- Creator & Dev Holdings (updated periodically)
            creator_balance_rate NUMERIC(5, 4),
            dev_team_hold_rate NUMERIC(5, 4),
            
            -- Trader Classification Metrics (updated periodically)
            bot_degen_count INTEGER DEFAULT 0,
            bot_degen_rate NUMERIC(5, 4),
            smart_degen_count INTEGER DEFAULT 0,
            sniper_count INTEGER DEFAULT 0,
            top70_sniper_hold_rate NUMERIC(5, 4),
            bundler_trader_amount_rate NUMERIC(5, 4),
            rat_trader_amount_rate NUMERIC(5, 4),
            
            -- Trading Behavior Flags (updated periodically)
            is_wash_trading BOOLEAN DEFAULT false,
            is_show_alert BOOLEAN DEFAULT false,
            hot_level INTEGER DEFAULT 0,
            launchpad_status INTEGER DEFAULT 0,
            
            -- Timestamps
            last_trade_at BIGINT,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_token_state_market_cap ON token_state(market_cap DESC NULLS LAST);
        CREATE INDEX IF NOT EXISTS idx_token_state_price ON token_state(price DESC NULLS LAST);
        CREATE INDEX IF NOT EXISTS idx_token_state_volume ON token_state(volume_24h DESC NULLS LAST);
        CREATE INDEX IF NOT EXISTS idx_token_state_holder_count ON token_state(holder_count DESC);
        CREATE INDEX IF NOT EXISTS idx_token_state_liquidity ON token_state(liquidity DESC NULLS LAST);
        CREATE INDEX IF NOT EXISTS idx_token_state_last_trade ON token_state(last_trade_at DESC);
        CREATE INDEX IF NOT EXISTS idx_token_state_wash_trading ON token_state(is_wash_trading) WHERE is_wash_trading = true;

        -- ============================================================================
        -- TRIGGERS
        -- ============================================================================

        CREATE OR REPLACE FUNCTION update_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS tokens_update_timestamp ON tokens;
        CREATE TRIGGER tokens_update_timestamp
            BEFORE UPDATE ON tokens
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();

        DROP TRIGGER IF EXISTS token_state_update_timestamp ON token_state;
        CREATE TRIGGER token_state_update_timestamp
            BEFORE UPDATE ON token_state
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();
        """
        
        cur.execute(schema_sql)
        conn.commit()
        print("Database initialized successfully.")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        conn.rollback()
    finally:
        conn.close()

def save_token_data(pool_data):
    """Save or update token data in the database"""
    conn = get_db_connection()
    if not conn:
        return

    try:
        cur = conn.cursor()
        
        # Extract data
        base_token_info = pool_data.get('base_token_info', {})
        mint = base_token_info.get('address')
        
        if not mint:
            print("No mint address found, skipping.")
            return

        # Prepare tokens data
        tokens_data = {
            'mint': mint,
            'name': base_token_info.get('name'),
            'symbol': base_token_info.get('symbol'),
            'logo': base_token_info.get('logo'),
            'creator': base_token_info.get('creator'),
            'total_supply': base_token_info.get('total_supply'),
            'platform': 'pumpfun', # Defaulting as per schema
            'launchpad': pool_data.get('launchpad'),
            'pool_address': pool_data.get('address'), # Root address is pool address
            'biggest_pool_address': base_token_info.get('biggest_pool_address'),
            'pool_type': pool_data.get('pool_type'),
            'quote_address': pool_data.get('quote_address'),
            'quote_symbol': pool_data.get('quote_symbol'),
            'initial_liquidity': pool_data.get('initial_liquidity'),
            'initial_quote_reserve': pool_data.get('initial_quote_reserve'),
            'burn_ratio': pool_data.get('burn_ratio'),
            'burn_status': pool_data.get('burn_status'),
            'dev_token_burn_amount': base_token_info.get('dev_token_burn_amount'),
            'dev_token_burn_ratio': base_token_info.get('dev_token_burn_ratio'),
            'renounced': base_token_info.get('renounced'),
            'renounced_mint': base_token_info.get('renounced_mint'),
            'renounced_freeze_account': base_token_info.get('renounced_freeze_account'),
            'renowned_count': base_token_info.get('renowned_count'),
            'buy_tax': base_token_info.get('buy_tax'),
            'sell_tax': base_token_info.get('sell_tax'),
            'is_honeypot': base_token_info.get('is_honeypot'),
            'rug_ratio': base_token_info.get('rug_ratio'),
            'cto_flag': pool_data.get('cto_flag'),
            'social_links': json.dumps(base_token_info.get('social_links', {})),
            'twitter_change_flag': base_token_info.get('twitter_change_flag'),
            'twitter_rename_count': base_token_info.get('twitter_rename_count'),
            'telegram_dup': pool_data.get('telegram_dup'),
            'twitter_dup': pool_data.get('twitter_dup'),
            'website_dup': pool_data.get('website_dup'),
            'image_dup': pool_data.get('image_dup'),
            'creator_close': base_token_info.get('creator_close'),
            'creator_token_status': base_token_info.get('creator_token_status'),
            'dexscr_ad': pool_data.get('dexscr_ad'),
            'dexscr_ad_ts': pool_data.get('dexscr_ad_ts'),
            'dexscr_update_link': pool_data.get('dexscr_update_link'),
            'dexscr_update_link_ts': pool_data.get('dexscr_update_link_ts'),
            'dexscr_boost_fee': pool_data.get('dexscr_boost_fee'),
            'dexscr_boost_ts': pool_data.get('dexscr_boost_ts'),
            'dexscr_trending_bar': pool_data.get('dexscr_trending_bar'),
            'dexscr_trending_bar_ts': pool_data.get('dexscr_trending_bar_ts'),
            'creation_timestamp': pool_data.get('creation_timestamp'),
            'open_timestamp': pool_data.get('open_timestamp'),
        }

        # Prepare token_state data
        token_state_data = {
            'mint': mint,
            'price': base_token_info.get('price'),
            'price_sol': base_token_info.get('price'), # Assuming price is in SOL based on context, or update if needed
            'market_cap': base_token_info.get('market_cap'),
            'liquidity': pool_data.get('liquidity'),
            'quote_reserve': pool_data.get('quote_reserve'),
            'quote_reserve_usd': pool_data.get('quote_reserve_usd'),
            'volume_24h': base_token_info.get('volume'),
            'buys_24h': base_token_info.get('buys'),
            'sells_24h': base_token_info.get('sells'),
            'swaps_24h': base_token_info.get('swaps'),
            'total_fee': pool_data.get('total_fee'),
            'price_change_5m': base_token_info.get('price_change_percent5m'),
            'price_change_1h': base_token_info.get('price_change_percent1h'),
            'price_change_1m': base_token_info.get('price_change_percent1m'),
            'holder_count': base_token_info.get('holder_count'),
            'top_10_holder_rate': base_token_info.get('top_10_holder_rate'),
            'bluechip_owner_percentage': base_token_info.get('bluechip_owner_percentage'),
            'creator_balance_rate': base_token_info.get('creator_balance_rate'),
            'dev_team_hold_rate': pool_data.get('dev_team_hold_rate'),
            'bot_degen_count': pool_data.get('bot_degen_count'),
            'bot_degen_rate': pool_data.get('bot_degen_rate'),
            'smart_degen_count': base_token_info.get('smart_degen_count'),
            'sniper_count': base_token_info.get('sniper_count'),
            'top70_sniper_hold_rate': pool_data.get('top70_sniper_hold_rate'),
            'bundler_trader_amount_rate': base_token_info.get('bundler_trader_amount_rate'),
            'rat_trader_amount_rate': base_token_info.get('rat_trader_amount_rate'),
            'is_wash_trading': base_token_info.get('is_wash_trading'),
            'is_show_alert': base_token_info.get('is_show_alert'),
            'hot_level': base_token_info.get('hot_level'),
            'launchpad_status': base_token_info.get('launchpad_status'),
            'history_highest_market_cap': pool_data.get('history_highest_market_cap'),
        }

        # Insert into tokens
        columns = list(tokens_data.keys())
        values = list(tokens_data.values())
        placeholders = ', '.join(['%s'] * len(values))
        update_stmt = ', '.join([f"{col} = EXCLUDED.{col}" for col in columns if col != 'mint'])
        
        sql_tokens = f"""
            INSERT INTO tokens ({', '.join(columns)})
            VALUES ({placeholders})
            ON CONFLICT (mint) DO UPDATE SET
            {update_stmt};
        """
        cur.execute(sql_tokens, values)

        # Insert into token_state
        columns_state = list(token_state_data.keys())
        values_state = list(token_state_data.values())
        placeholders_state = ', '.join(['%s'] * len(values_state))
        update_stmt_state = ', '.join([f"{col} = EXCLUDED.{col}" for col in columns_state if col != 'mint'])
        
        sql_state = f"""
            INSERT INTO token_state ({', '.join(columns_state)})
            VALUES ({placeholders_state})
            ON CONFLICT (mint) DO UPDATE SET
            {update_stmt_state};
        """
        cur.execute(sql_state, values_state)
        
        conn.commit()
        # print(f"Saved data for {tokens_data['symbol']}")
        
    except Exception as e:
        print(f"Error saving data: {e}")
        conn.rollback()
    finally:
        conn.close()
