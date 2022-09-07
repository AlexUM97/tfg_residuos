CREATE TABLE Pesadas_cont (Fecha DATETIME, Tag INT, Calca CHAR(1), Peso INT, Garbage CHAR(1), 
						District CHAR(1), Latitude INT, Longitude INT, Id_fraccion INT, Id_AAVV INT);

DELIMITER //

FOR fecha IN 0..730 #Fecha
DO
	FOR Id_fraccion IN 0..8	#Id_fraccion
	DO
		FOR Id_aavv IN 0..32 #Id_AAVV
		DO
			FOR tag_contenedor IN 0..3 #Tag
			DO
				INSERT INTO Pesadas_cont VALUES 
					('2016-01-01' + INTERVAL fecha DAY, 
					tag_camion, NULL, 
					(fecha+(50*Id_fraccion)+(10*Id_aavv))%1000, 
					NULL, NULL, NULL, NULL, 
					Id_fraccion, Id_aavv );
			END FOR;
		END FOR;
	END FOR;
END FOR;
//

DELIMITER ;

SELECT * FROM Pesadas_cont;

