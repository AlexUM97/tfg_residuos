CREATE VIEW vista_publica AS 
SELECT 
	IFNULL(fra.Id_fraccion,0) AS 'garbage_id', IFNULL(fra.Descripcion,'No identificado') AS 'garbage', 
	IFNULL(dis.Id_distrito,0) AS 'district_id', IFNULL(dis.Nombre,'NO IDENTIFICADO') AS 'district', 
	IFNULL(aavv.Id_AAVV,0) AS 'subdistrict_id', IFNULL(aavv.Nombre,'No identificado') AS 'subdistrict', 
	DATE(pes.Fecha) AS 'date', YEAR(pes.Fecha) AS 'year', MONTH(pes.Fecha) AS 'month', DAY(pes.Fecha) AS 'day', SUM(pes.Peso) AS 'picked_up'
FROM pesadas_cont pes
LEFT JOIN Fraccion fra ON pes.Id_fraccion = fra.Id_fraccion
LEFT JOIN AAVV ON pes.Id_AAVV = AAVV.Id_AAVV
LEFT JOIN Distritos dis ON aavv.Id_distrito = dis.Id_distrito 
GROUP BY IFNULL(fra.Id_fraccion,0), IFNULL(fra.Descripcion,'No identificado'), 
	IFNULL(dis.Id_distrito,0), IFNULL(dis.Nombre,'NO IDENTIFICADO'), 
	IFNULL(aavv.Id_AAVV,0), IFNULL(aavv.Nombre,'No identificado'), 
	DATE(pes.Fecha), YEAR(pes.Fecha), MONTH(pes.Fecha), DAY(pes.Fecha) 
	
	
	
	
	