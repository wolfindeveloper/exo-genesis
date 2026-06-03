-- EXO-GENESIS: Cleanup legacy — drop unused tables, normalize old IDs
-- Run this in Supabase SQL Editor

-- 1. Drop unused tables from old Lab system
DROP TABLE IF EXISTS experiment_log CASCADE;
DROP TABLE IF EXISTS discoveries CASCADE;

-- 2. Delete items from removed Lab system (elements)
DELETE FROM user_inventory WHERE item_type = 'element';

-- 3. Delete items with stale/unknown item types
DELETE FROM user_inventory WHERE item_type = 'consumable';

-- 4. Normalize legacy tiered resource IDs → single-tier
UPDATE user_inventory SET item_config_id = 'fuel'
WHERE item_config_id IN ('fuel_t1', 'fuel_t2', 'fuel_t3', 'fuel_t4', 'fuel_t5');

UPDATE user_inventory SET item_config_id = 'repair_kit'
WHERE item_config_id IN ('repair_kit_t1', 'repair_kit_t2', 'repair_kit_t3', 'repair_kit_t4', 'repair_kit_t5', 'repair_fit_t1');

-- 5. Delete auto-generated artifacts from old box system (artifact_<uuid> pattern)
DELETE FROM user_inventory WHERE item_config_id LIKE 'artifact_%' AND item_config_id NOT IN (
    'oko_buri', 'zub_vremeni', 'serdce_tumannosti', 'kogot_feniksa',
    'shepot_pustoty', 'kristall_zabvenia', 'pero_sudby', 'glaz_drevnego',
    'iskra_tvorenia', 'oskolok_radugi', 'rebro_leviafana', 'kluch_ot_vselennoi',
    'lunnyi_kamen', 'rzhavyi_yakor', 'zerkalo_istiny', 'pechat_haosa',
    'vetka_mirovogo_dreva', 'eho_pervogo_vzryva', 'cheshuia_drakonia',
    'kaplia_vechnosti', 'slomannaia_strela', 'kub_nevozmozhnosti', 'pylca_zvezd',
    'ten_proshlogo', 'svitok_pustoty', 'koleso_sansary', 'molnua_v_banke',
    'chernyi_led', 'kost_udachi', 'atom_straha', 'provoloka_sudby',
    'gvozd_programmy', 'sleza_android', 'falshivaia_moneta', 'nit_ariadny',
    'oblomok_tostervselennoi', 'runa_povorota', 'sharovaia_teleportacia',
    'ampula_vdohnovenia', 'pepel_galaktiki',
    'termos_optimizma', 'slovar_izvineniy', 'sinya_izolenta', 'ochki_veroyatnosti'
);

-- 6. Delete items with item_config_id not matching any known resource or artifact
-- (catch-all for anything else that slipped through)
DELETE FROM user_inventory
WHERE item_config_id NOT IN (
    'fuel', 'repair_kit',
    'oko_buri', 'zub_vremeni', 'serdce_tumannosti', 'kogot_feniksa',
    'shepot_pustoty', 'kristall_zabvenia', 'pero_sudby', 'glaz_drevnego',
    'iskra_tvorenia', 'oskolok_radugi', 'rebro_leviafana', 'kluch_ot_vselennoi',
    'lunnyi_kamen', 'rzhavyi_yakor', 'zerkalo_istiny', 'pechat_haosa',
    'vetka_mirovogo_dreva', 'eho_pervogo_vzryva', 'cheshuia_drakonia',
    'kaplia_vechnosti', 'slomannaia_strela', 'kub_nevozmozhnosti', 'pylca_zvezd',
    'ten_proshlogo', 'svitok_pustoty', 'koleso_sansary', 'molnua_v_banke',
    'chernyi_led', 'kost_udachi', 'atom_straha', 'provoloka_sudby',
    'gvozd_programmy', 'sleza_android', 'falshivaia_moneta', 'nit_ariadny',
    'oblomok_tostervselennoi', 'runa_povorota', 'sharovaia_teleportacia',
    'ampula_vdohnovenia', 'pepel_galaktiki',
    'termos_optimizma', 'slovar_izvineniy', 'sinya_izolenta', 'ochki_veroyatnosti'
);

-- 7. Fix any ships with non-standard ship_config_id
UPDATE user_ships SET ship_config_id = 'vega_mk2'
WHERE ship_config_id != 'vega_mk2';
