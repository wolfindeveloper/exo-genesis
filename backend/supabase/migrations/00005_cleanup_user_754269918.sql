-- Cleanup for user 754269918
-- Removes old element items, fixes ship_config_id

-- 1. Delete leftover element items from old Lab system
DELETE FROM user_inventory
WHERE user_id = '754269918'
  AND item_type = 'element';

-- 2. Delete items with unknown item_config_id (not matching any resource or artifact)
DELETE FROM user_inventory
WHERE user_id = '754269918'
  AND item_config_id NOT IN (
    'fuel', 'repair_kit', 'fragments',
    'oko_buri', 'zub_vremeni', 'serdce_tumannosti', 'kogot_feniksa',
    'shepot_pustoty', 'kristall_zabvenia', 'pero_sudby', 'glaz_drevnego',
    'iskra_tvorenia', 'oskolok_radugi', 'rebro_leviafana', 'kluch_ot_vselennoi',
    'lunnyi_kamen', 'rzhavyi_yakor', 'zerkalo_istiny', 'pechat_haosa',
    'vetka_mirovogo_dreva', 'eho_pervogo_vzryva', 'cheshuia_drakona',
    'kaplia_vechnosti', 'slomannaia_strela', 'kub_nevozmozhnosti', 'pylca_zvezd',
    'ten_proshlogo', 'svitok_pustoty', 'koleso_sansary', 'molnua_v_banke',
    'chernyi_led', 'kost_udachi', 'atom_straha', 'provoloka_sudby',
    'gvozd_programmy', 'sleza_android', 'falshivaia_moneta', 'nit_ariadny',
    'oblomok_tostervselennoi', 'runa_povorota', 'sharovaia_teleportacia',
    'ampula_vdohnovenia', 'pepel_galaktiki',
    'termos_optimizma', 'slovar_izvineniy', 'sinya_izolenta', 'ochki_veroyatnosti'
  );

-- 3. Delete stale tiered resources (pre-Phase 1) and unknown generated artifacts
DELETE FROM user_inventory
WHERE user_id = '754269918'
  AND item_config_id IN ('fuel_t1', 'repair_kit_t1', 'artifact_6c669c59');

-- 4. Fix ship_config_id to vega_mk2 if it's something else
UPDATE user_ships
SET ship_config_id = 'vega_mk2'
WHERE user_id = '754269918'
  AND ship_config_id != 'vega_mk2';
