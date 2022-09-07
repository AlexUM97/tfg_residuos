<?php

header("Content-Type: JSON");

ini_set('max_execution_time','-1');
ini_set('memory_limit','-1');

// echo ini_get('max_execution_time');
// echo ini_get('memory_limit');

//Servidor local

$host = "localhost";
$port = 3306;
$controler = 'mysql';
$user = "public_user";
$password = "";
$database = "medioambiente";


$dsn = "$controler:dbname=$database;host=$host;port=$port;charset=UTF8";
$opctions = array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION);

#Array donde se almacenan los resultados
$result = array();

#Variables de filtro
$date_ini = '';
$date_fin = '';
$date_type = '';
$filter = '';
// El símbolo / actua como delimitador, es necesario al principio y al final
// El símbolo \A fuerza que se empiece a evaluar por el principio de la cadena (^ para principio línea)
// El símbolo \z fuerza que se empiece a evaluar por el final de la cadena ($ para final de línea)
$pattern_not_date = "/[^0-9\-]/"; //No queremos que contenga ningún caracter que no sea un número o -
$pattern_date = "/\A20[012][0-9]-[01][0-9]-[0123][0-9]\z/"; //comprobamos que parezca una fecha con formato yyyy-mm-dd
$pattern_not_id = "/[^0-9,]/"; //No queremos que contenga ningún caracter que no sea un número o ,
$pattern_id = "/\A[0-9]+(,[0-9]+)*\z/"; //comprobamos que sean números separados por comas
$error_patern = 0;

//Consultas servidor local
#Fechas de inicio y fin
if(isset($_GET['start'])){
	$start = $_GET['start'];
	if (preg_match($pattern_not_date, $start) === 0 && preg_match($pattern_date, $start) === 1) {
		$filter = "WHERE DATE(date) >= '$start'";
	}
	else {
		echo 'Error con la variable start, debe de ser una decha con formato yyyy-mm-dd';
		$error_patern = 1;
	}
}
if(isset($_GET['end'])){
	$end = $_GET['end'];
	if (preg_match($pattern_not_date, $end) === 0 && preg_match($pattern_date, $end) === 1) {
		if($filter == ''){
			$filter = "WHERE DATE(date) <= '$end'";
		}
		else {
			$filter = "$filter AND DATE(date) <= '$end'";
		}
	}
	else {
		echo 'Error con la variable end, debe de ser una decha con formato yyyy-mm-dd';
		$error_patern = 1;
	}
}
if(isset($_GET['garbage'])){
	$garbage = $_GET['garbage'];
	if (preg_match($pattern_not_id, $garbage) === 0 && preg_match($pattern_id, $garbage) === 1) {
		if($filter == ''){
			$filter = "WHERE garbage_id in ($garbage)";
		}
		else {
			$filter = "$filter AND garbage_id in ($garbage)";
		}
	}
	else {
		echo 'Error con la variable garbage, debe de ser número separados por comas, por ejemplo 1,2,3,4';
		$error_patern = 1;
	}
}
if(isset($_GET['subdistrict'])){
	$subdistrict = $_GET['subdistrict'];
	if (preg_match($pattern_not_id, $subdistrict) === 0 && preg_match($pattern_id, $subdistrict) === 1) {
		if($filter == ''){
			$filter = "WHERE subdistrict_id in ($subdistrict)";
		}
		else {
			$filter = "$filter AND subdistrict_id in ($subdistrict)";
		}
	}
	else {
		echo 'Error con la variable subdistrict, debe de ser número separados por comas, por ejemplo 1,2,3,4';
		$error_patern = 1;
	}
}

if ($error_patern === 0) {
	//Consultas servidor Local
	$sql_fechas = "SELECT MIN(date) AS min_date, MAX(date) AS max_date FROM Medioambiente.vista_publica $filter;";
	$sql_residuos = "SELECT DISTINCT garbage_id, garbage FROM Medioambiente.vista_publica order by garbage_id;";
	$sql_areas = "SELECT DISTINCT district_id, district, subdistrict_id, subdistrict FROM vista_publica ORDER BY district_id, subdistrict_id;";
	$sql_daily = "SELECT DISTINCT garbage_id, district_id, subdistrict_id, year, month, day, picked_up FROM Medioambiente.vista_publica $filter ORDER BY year, month, day;";

	try {
		$connection = new PDO($dsn, $user, $password, $opctions);
		$sentencia = $connection->prepare($sql_fechas);
		$sentencia->execute(); 
		$result = $sentencia->fetchAll();
		$sentencia->closeCursor();
		$list_fechas = array();

		$list_fechas['min_date'] = $result[0]['min_date'];
		$list_fechas['max_date'] = $result[0]['max_date'];


		$connection = new PDO($dsn, $user, $password, $opctions);
		$sentencia = $connection->prepare($sql_residuos);
		$sentencia->execute(); 
		$result = $sentencia->fetchAll();
		$sentencia->closeCursor();
		$list_residuo = array();

		for($i=0; $i<count($result); $i++){
			$list_residuo[$i]['garbage'] = $result[$i]['garbage'];
			$list_residuo[$i]['garbage_id'] = $result[$i]['garbage_id'];
		}


		$connection = new PDO($dsn, $user, $password, $opctions);
		$sentencia = $connection->prepare($sql_areas);
		$sentencia->execute(); 
		$result = $sentencia->fetchAll();
		$sentencia->closeCursor();
		$list_area = array();

		for($i=0; $i<count($result); $i++){
			$list_area[$i]['district_id'] = $result[$i]['district_id'];
			$list_area[$i]['district'] = $result[$i]['district'];
			$list_area[$i]['subdistrict_id'] = $result[$i]['subdistrict_id'];
			$list_area[$i]['subdistrict'] = $result[$i]['subdistrict'];
		}


		$connection = new PDO($dsn, $user, $password, $opctions);
		$sentencia = $connection->prepare($sql_daily);
		$sentencia->execute(); 
		$result = $sentencia->fetchAll();
		$sentencia->closeCursor();
		$output = array();

		//print_r(json_encode($result));

		for($i=0; $i<count($result); $i++){
			$output[$i]['garbage_id'] = $result[$i]['garbage_id'];
			$output[$i]['district_id'] = $result[$i]['district_id'];
			$output[$i]['subdistrict_id'] = $result[$i]['subdistrict_id'];
			$output[$i]['year'] = $result[$i]['year'];
			$output[$i]['month'] = $result[$i]['month'];
			$output[$i]['day'] = $result[$i]['day'];
			$output[$i]['picked_up'] = $result[$i]['picked_up'];
		}


		$sal = array('Dates' => $list_fechas, 'Garbages' => $list_residuo, 'Districts' => $list_area, 'Data' => $output);

		
		print_r(json_encode($sal));
	}
	catch (Exception $e) {
		print_r(json_encode(array("Error" => $e->getMessage())));
	}
}
?>