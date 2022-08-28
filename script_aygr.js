//Declaración de variables globales
var received_data;
var garbage_graph;
var filtered_data;
var map;
var geojson_district;
var geojson_subdistrict;


//https://www.chartjs.org/docs/latest/developers/updates.html
function addData(chart, label, data) {
    chart.data.labels = label;
    chart.data.datasets = data;
    chart.update();
}

function removeData(chart) {
    chart.data.labels.pop();
    chart.data.datasets.forEach((dataset) => {
        dataset.data.pop();
    });
    chart.update();
}

//
function showHideElement(element) {
	$("#" + element).toggle();
}

function changeTableIcon(element) {
	let icon = document.getElementById(element);

	if (icon.getAttribute('class') === 'fa fa-plus') {
		icon.setAttribute('class','fa fa-minus');
	}
	else if (icon.getAttribute('class') === 'fa fa-minus') {
		icon.setAttribute('class','fa fa-plus');
	}
	else { //En caso de que sea algo raro lo elimino
		icon.setAttribute('class','');
	}
}

function activate_navbar(element){
	const navbar_element = document.getElementById(element);
	let navbar = document.querySelector('#navbar');


	for(opt of navbar.children){
		if (opt.getAttribute('id') === navbar_element.getAttribute('id')){
			opt.setAttribute("class", "active");

			$('#' + opt.getAttribute('for')).show();
		} 
		else {
			opt.setAttribute("class", "inactive");

			$('#' + opt.getAttribute('for')).hide();
		}
	}
}


//
function getUniques(obj){
	return obj.filter((v, i, a) => a.indexOf(v) === i);
}

//https://stackoverflow.com/questions/23095637/how-do-you-get-random-rgb-in-javascript
function getRandomRgb() {
	var num = Math.round(0xffffff * Math.random());
	var r = num >> 16;
	var g = num >> 8 & 255;
	var b = num & 255;
	//return 'rgb(' + r + ', ' + g + ', ' + b + ')';
	let rgb = Array();
	rgb['r'] = r;
	rgb['g'] = g;
	rgb['b'] = b;
	 
	return rgb;
}

//
function max_datefields(){
	let today = new Date();
	let dd = today.getDate();
	let mm = today.getMonth() + 1; //January is 0
	let yyyy = today.getFullYear();
	dd = (dd < 10) ? '0' + dd : dd;
	mm = (mm < 10) ? '0' + mm : mm;
	today = yyyy + '-' + mm + '-' + dd;

	document.getElementById("start_date").setAttribute("max", today);
	document.getElementById("end_date").setAttribute("max", today);
	document.getElementById("end_date").value = today;
}

//
function groupBy(objectArray, grouped_by, counter){
	let helper = {};
	return objectArray.reduce(function(acc, obj) {
	  let key = ''
	  for(c of grouped_by){
		  	key += obj[c] + '-';
		  }

		  let valor = {}
	  for(c of grouped_by){
		  	valor[c] = obj[c];
		  }
		  valor[counter] = obj[counter];

	  if(!helper[key]) {
	    helper[key] = valor;
	    acc.push(helper[key]);
	  } else {
	    helper[key].picked_up = parseInt(helper[key].picked_up) + parseInt(obj.picked_up);
	  }
	  return acc;
	}, []);
}

function check_start_date_input(){
	const start_date = document.getElementById("start_date").value;
	const end_date = document.getElementById("end_date").value;
	const date_min = document.getElementById("start_date").min;
	const date_max = document.getElementById("start_date").max;

	if (start_date >= date_min && start_date <= date_max && Date.parse(start_date) !== NaN){
		document.getElementById("start_date").setAttribute("class", "correct_date");
		if (start_date > end_date){
			document.getElementById("end_date").value = start_date;
		}

		show_tables();
	}
	else{
		document.getElementById("start_date").setAttribute("class", "incorrect_date");
	}
}

function prepare_file(date_format, format){
	const garbages = received_data['Garbages'];

	const garbages_list = {}
	garbages.forEach(g => garbages_list[g.garbage_id] = g.garbage);

	const districts = received_data['Districts'];

	const districts_list = {}
	districts.forEach(d => districts_list[d.district_id] = d.district);

	const subdistricts_list = {}
	districts.forEach(sd => subdistricts_list[sd.subdistrict_id] = sd.subdistrict);

	const enriched_data = filtered_data.map(dat => {
	    const nuevo = {
	        ...dat, // Todo lo que tiene el registro
	        garbage: garbages_list[dat.garbage_id],
	        district: districts_list[dat.district_id],
	        subdistrict: subdistricts_list[dat.subdistrict_id],
	    }
	    return nuevo
	})


	const exporting_data = 
			date_format === 'day' ? 
				groupBy(enriched_data, ['district','subdistrict','garbage','year','month','day'], 'picked_up').map(elem => ({district: elem.district, subdistrict: elem.subdistrict, garbage: elem.garbage, date: elem.year+'-'+elem.month+'-'+elem.day, picked_up: elem.picked_up})) :
			date_format === 'month' ?
				groupBy(enriched_data, ['district','subdistrict','garbage','year','month'], 'picked_up').map(elem => ({district: elem.district, subdistrict: elem.subdistrict, garbage: elem.garbage, date: elem.year+'-'+elem.month, picked_up: elem.picked_up})) :
			date_format === 'year' ?
				groupBy(enriched_data, ['district','subdistrict','garbage','year'], 'picked_up').map(elem => ({district: elem.district, subdistrict: elem.subdistrict, garbage: elem.garbage, date: elem.year, picked_up: elem.picked_up}))
				: '';
	
	let file = '';

	if (format === 'csv')  {
		file = '\"district\",\"subdistrict\",\"garbage\",\"date\",\"picked_up_kg\"\n';

		exporting_data.forEach(el => file += '\"'+el.district+'\",\"'+el.subdistrict+'\",\"'+el.garbage+'\",\"'+el.date+'\",\"'+el.picked_up+'\"\n');
	}
	if (format === 'json')  {
		file = '{"data":[';

		exporting_data.forEach(el => file += '{\"district\":\"'+el.district+'\",\"subdistrict\":\"'+el.subdistrict+'\",\"garbage\":\"'+el.garbage+'\",\"date\":\"'+el.date+'\",\"picked_up_kg\":\"'+el.picked_up+'\"},');

		file = file.substring(0, file.length-1) + ']}';
	}
	
	return file;
}

function donwload_file(){
	const date_format = document.querySelector('input[name="df_date"]:checked').value; 
	const format = document.querySelector('input[name="df_format"]:checked').value;

	if ((format === 'csv' || format === 'json') && (date_format === 'year' || date_format === 'month' || date_format === 'day')){
		
		const uInt8 = new TextEncoder().encode(prepare_file(date_format, format));

		// streamSaver.createWriteStream() returns a writable byte stream
		// The WritableStream only accepts Uint8Array chunks
		// (no other typed arrays, arrayBuffers or strings are allowed)
		const fileStream = streamSaver.createWriteStream('filename.'+format, {
			size: uInt8.byteLength, // (optional filesize) Will show progress
			writableStrategy: undefined, // (optional)
			readableStrategy: undefined  // (optional)
		});

		//Para evitar llenar el ordenador de descargas vamos a solo mostrarlo por consola		
		const writer = fileStream.getWriter();
		writer.write(uInt8);
		writer.close();
	}
	else {
		console.error("No se puede descargar el fichero, se han indicado mal los parámetros necesarios.");
	}
}

function check_end_date_input(){
	const start_date = document.getElementById("start_date").value;
	const end_date = document.getElementById("end_date").value;
	const date_min = document.getElementById("end_date").min;
	const date_max = document.getElementById("end_date").max;

	if (end_date >= date_min && end_date <= date_max && Date.parse(end_date) !== NaN){
		document.getElementById("end_date").setAttribute("class", "correct_date");
		if (start_date > end_date){
			document.getElementById("start_date").value = end_date;
		}

		show_tables();
	}
	else{
		document.getElementById("end_date").setAttribute("class", "incorrect_date");
	}
}

function hideCheckboxFilter(htmlId){
	const checkbox = document.getElementById(htmlId);
	checkbox.checked = false;
	show_tables();
}

async function populate() {
	//Conexión con la API
	//const requestURL = 'http://localhost/api.php';
	const requestURL = 'https://raw.githubusercontent.com/AlexUM97/tfg_residuos/main/registros_prueba.json';
	const request = new Request(requestURL);

	const response = await fetch(request);
	//Se utiliza var porque necesitamos que sea global, no podemos limitar a la función
	received_data = await response.json();

	max_datefields();


	//Declarar filtros residuos
	const garbages = received_data['Garbages'];
	let garbage_filter = document.getElementById("garbage_filter");

	for(gar of garbages){
		let div = document.createElement("DIV");
		div.setAttribute("id", "garbage_" + gar.garbage_id);
		div.setAttribute("class", "garbage_div");

		let checkbox = document.createElement("INPUT");
		checkbox.setAttribute("type", "checkbox");
		checkbox.setAttribute("id", "garbage_checkbox_" + gar.garbage_id);
		checkbox.setAttribute("class", "garbage_checkbox");
		checkbox.setAttribute("onchange", "show_tables()");
		checkbox.checked = true;
		
		let label = document.createElement("LABEL");
		label.setAttribute("for", "garbage_checkbox_" + gar.garbage_id);
		label.innerHTML = gar.garbage;
		label.setAttribute("class", "garbage_label");

		div.appendChild(checkbox);
		div.appendChild(label);
		
		garbage_filter.appendChild(div);
	}


	//Declarar filtros distritios
	const list_district_ids = getUniques(received_data['Districts'].map(elem => elem.district_id));
	let district_filter = document.getElementById("district_filter");

	for(dis of list_district_ids){
		let dis_div = document.createElement("DIV");
		dis_div.setAttribute("id", "district_" + dis.district_id);
		dis_div.setAttribute("class", "district_div");

		const subdistricts = received_data['Districts'].filter(elem => elem.district_id === dis);

		let dis_label = document.createElement("LABEL");
		dis_label.innerHTML = subdistricts[0].district;
		dis_label.setAttribute("class", "district_label");

		dis_div.appendChild(dis_label);

		for (subdis of subdistricts){
			let subdis_div = document.createElement("DIV");
			subdis_div.setAttribute("id", "subdistrict_" + subdis.subdistrict_id);
			subdis_div.setAttribute("class", "subdistrict_div");

			let subdis_checkbox = document.createElement("INPUT");
			subdis_checkbox.setAttribute("type", "checkbox");
			subdis_checkbox.setAttribute("id", "subdistrict_checkbox_" + subdis.subdistrict_id);
			subdis_checkbox.setAttribute("class", "subdistrict_checkbox");
			subdis_checkbox.setAttribute("onchange", "show_tables()");
			subdis_checkbox.checked = true;

			let subdis_label = document.createElement("LABEL");
			subdis_label.setAttribute("for", "subdistrict_checkbox_" + subdis.subdistrict_id);
			subdis_label.innerHTML = subdis.subdistrict;
			subdis_label.setAttribute("class", "subdistrict_label");

			subdis_div.appendChild(subdis_checkbox);
			subdis_div.appendChild(subdis_label);
			
			dis_div.appendChild(subdis_div);
		}

		let br = document.createElement("BR");

		district_filter.appendChild(dis_div);
		district_filter.appendChild(br);

	}

	//Ecopuntos igual que districts

	//Inicializamos gráficas
	garbage_graph = new Chart(document.querySelector("#garbage_graph"), {
	    type: 'bar',// Tipo de gráfica
	    data: {
	    	labels: Array(),
	    	datasets: Array()
	    },
	    options: {
	        scales: {
	            yAxes: [{
	                ticks: {
	                    beginAtZero: true
	                }
	            }],
	        },
	    }
	});
	
	const requestURL_district = 'https://raw.githubusercontent.com/AlexUM97/tfg_residuos/main/Distritos_Municipales_20220101_WGS84.geojson';
	const request_district = new Request(requestURL_district);

	const response_district = await fetch(request_district);
	const district = await response_district.json();


	const requestURL_subdistrict = 'https://raw.githubusercontent.com/AlexUM97/tfg_residuos/main/Asociaciones_Vecinos_20220101_WGS84.geojson';
	const request_subdistrict = new Request(requestURL_subdistrict);

	const response_subdistrict = await fetch(request_subdistrict);
	const subdistrict = await response_subdistrict.json();


	map = await L.map('map').setView([37.177, -3.59675], 12);
	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; Colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}).addTo(map);

	activate_navbar('navbar_garbage_table');

	geojson_district = await L.geoJSON(district, {
	    style: function(feature) {
	        switch (feature.properties.DISTRITO) {
	            case 'ALBAYZIN': return {color: "green", "fillOpacity": 0.4};
	            case 'NORTE':   return {color: "yellow", "fillOpacity": 0.4};
	            case 'BEIRO':   return {color: "red", "fillOpacity": 0.4};
	            case 'CHANA':   return {color: "pink", "fillOpacity": 0.4};
	            case 'RONDA':   return {color: "lightblue", "fillOpacity": 0.4};
	            case 'CENTRO':   return {color: "orange", "fillOpacity": 0.4};
	            case 'GENIL':   return {color: "blue", "fillOpacity": 0.4};
	            case 'ZAIDIN':   return {color: "violet", "fillOpacity": 0.4};
	        }
	    }
	}).addTo(map);

	geojson_subdistrict = await L.geoJSON(subdistrict, {
	    style: {
		"color": "black",
		"weight": 3,
		"fillColor": "grey",
		"fillOpacity": 0
	}
	}).addTo(map);

	show_tables();
}

async function show_tables() {
	//los datos de entrada están en la variable received_data
	const start_date = document.getElementById("start_date").value;
	const end_date = document.getElementById("end_date").value;

	const garbages = received_data['Garbages'];
	let present_garbages = Array();
	for(gar of garbages) {
		const garbage_checkbox = document.getElementById("garbage_checkbox_"+gar.garbage_id);

		if(garbage_checkbox.checked){
			present_garbages.push(gar);
		}
	}

	const districts = received_data['Districts'];
	let present_districts = Array();
	for(dis of districts) {
		const subdistrict_checkbox = document.getElementById("subdistrict_checkbox_"+dis.subdistrict_id);

		if(subdistrict_checkbox.checked){
			present_districts.push(dis);
		}
	}


	//Filtramos la información recibida
	filtered_data = 
			received_data['Data']
			.filter (	elem => 
						Date.parse(elem.year+'-'+elem.month+'-'+elem.day) >= Date.parse(start_date) &&
						Date.parse(elem.year+'-'+elem.month+'-'+elem.day) <= Date.parse(end_date) &&
						present_garbages.map(g => g.garbage_id).indexOf(elem.garbage_id) > -1 &&
						present_districts.map(g => g.subdistrict_id).indexOf(elem.subdistrict_id) > -1
					);


	//Imprimimos el header (metadata)
	//printHeader(data);

	//Preparamos los popups y filtros del mapa
	geojson_subdistrict.eachLayer(
		function (layer) {
			//Se quita el Popup por si hubiese
			layer.bindPopup();

			let div = document.createElement("DIV");
			let table_html = "<table id='tabla' align=center cellpadding=10> <tr><th>Distrito</th><td>"+layer.feature.properties.DISTRITO+"</td></tr> <tr><th>AAVV</th><td>"+layer.feature.properties.AAVV+"</td></tr>";
			div.setAttribute("class","map_popup"); 
		
			if (present_districts.map(g => g.subdistrict_id).indexOf(layer.feature.properties.AAVV_ID)===-1){
				//Si desactivado oscurecer
				layer.setStyle({"fillOpacity": 0.75});
			}
			else{
				//Si activo no oscurecer
				layer.setStyle({"fillOpacity": 0});

				//Si es activo se le añade Popup para indicar distrito y AAVV

				const layer_filtered_data = filtered_data.filter(elem => elem.subdistrict_id == layer.feature.properties.AAVV_ID);
				const layer_garbage = groupBy(layer_filtered_data, ['garbage_id'], 'picked_up');
				
				for(gar of present_garbages){
					const valor = layer_garbage.filter(elem => elem.garbage_id === gar.garbage_id)[0];
					if (valor === undefined){
						table_html += "<tr><th>"+gar.garbage+"</th><td>0 kg</td></tr>";
					}
					else {
						table_html += "<tr><th>"+gar.garbage+"</th><td>"+valor.picked_up.toLocaleString('de-DE')+" kg</td></tr>";
					}
				}
			}
			table_html += "</table>";
			//Se le añade Popup para indicar lo necesario
			div.innerHTML = table_html;
			layer.bindPopup(div);
		}
	);


	//calculamos los datos para basura por año, mes y día
	const garbage_per_day = groupBy(filtered_data, ['garbage_id','year','month','day'], 'picked_up')

	const garbage_per_month = groupBy(garbage_per_day, ['garbage_id','year','month'], 'picked_up')

	const garbage_per_year = groupBy(garbage_per_month, ['garbage_id','year'], 'picked_up')

	printAllData(
		'garbage_table', 
		'garbage', 
		garbage_per_day,
		garbage_per_month,
		garbage_per_year,
		present_garbages
	);


	//Preparamos la gráfica:
	removeData(garbage_graph);

	const year_list = getUniques(garbage_per_year.map(elem => elem.year)).sort((a,b)=>(a-b));
	const labels_graph = present_garbages.map(g => g.garbage).concat('TOTAL');
	let datasets = Array();
	
	for(year of year_list){
		const yearly_data = garbage_per_year.filter(elem => elem.year == year);

		let set = Array();
		const rgb = getRandomRgb();

		for (garb of present_garbages){
			const valor = yearly_data.filter(elem => elem.garbage_id === garb.garbage_id)[0];

			if(valor === undefined){ //si devuelve undefined es que no está, insertarmos un 0
				set.push(0);
			}
			else{ //Está ese valor, por tanto insertamos en la tabla dicho 
				set.push(valor.picked_up);
			}
		}

		set.push(set.reduce((pv,cv)=>parseInt(pv)+parseInt(cv),0));

		datasets.push({	label:'Residuos recogidos (kg) por año - ' + year, 
						data: set, 
						backgroundColor: 'rgba('+rgb.r+', '+rgb.g+', '+rgb.b+', 0.2)', 
						bordercolor: 'rgba('+rgb.r+', '+rgb.g+', '+rgb.b+', 1)',
						borderWidth: 2
					});
	}

	addData(garbage_graph, labels_graph, datasets);
	
	//API dinámica
	let filtered_api = document.getElementById('filtered_api');

	let api_garbages = '';
	let api_subdistrict = '';

	for (gar of present_garbages){
		api_garbages += ',' + gar.garbage_id;
	}
	api_garbages = api_garbages.substring(1);

	// for (gar of present_subdistrict){
	// 	api_subdistrict += ',' + gar.subdistrict_id;
	// }
	// api_subdistrict = api_subdistrict.substring(1);

	filtered_api.innerHTML = 'http://localhost/api.php?';
	if (Date.parse(start_date) != Date.parse(document.getElementById("start_date").min)){
		filtered_api.innerHTML += 'sd=' + start_date;
	}

	if (Date.parse(end_date) != Date.parse(document.getElementById("end_date").max)){
		filtered_api.innerHTML += 'ed=' + end_date;
	}

}

function printAllData(my_table, counter, daily_data, monthly_data, yearly_data, counter_list){
	const list_year = getUniques(yearly_data.map(elem => elem.year)).sort((a,b)=>(a-b));

	//Creamos los datos para la tabla
	// si se quiere con borde añadir border=1 después de table
	let table_html = "<table id='tabla_residuos' align=center cellpadding=10>";
	//Añadimos la cabecera
	table_html+='<thead><tr class="header"><th>Fecha</th>';
	for (cont of counter_list){
		table_html+='<td">' + cont[counter] + '</td>';
	}
	table_html+='<td>TOTAL</td></tr></thead>';

	//Añadimos los valores
	for (index_anual of list_year){
		const datos_anual = yearly_data.filter(elem => elem.year === index_anual);
		const datos_mensual = monthly_data.filter(elem => elem.year === index_anual);
		const lista_mensual = getUniques(datos_mensual.map(elem => elem.month)).sort((a,b)=>(a-b));
		const total_y = datos_anual.map(elem => elem.picked_up).reduce((pv,cv)=>parseInt(pv)+parseInt(cv),0);
		const total_year = total_y.toLocaleString('de-DE') + ' kg';

		table_html+='<tr  class="data_per_year" onclick="changeTableIcon(\'hidden_row_icon_'+ counter + index_anual + '_meses\');showHideElement(\'hidden_row_'+ counter + index_anual +'_meses\')"><th><i class="fa fa-plus" aria-hidden="true" id="hidden_row_icon_'+ counter + index_anual + '_meses"> </i>' + index_anual + '</th>';
		for (cont of counter_list){
			const valor = datos_anual.filter(elem => elem[counter+'_id'] === cont[counter+'_id'])[0];

			if(valor === undefined){ //si devuelve undefined es que no está, insertarmos un 0
				table_html+='<td>0 kg</td>';
			}
			else{ //Está ese valor, por tanto insertamos en la tabla dicho 
				const picked_up = valor.picked_up.toLocaleString('de-DE') + ' kg';

				table_html+='<td>' + picked_up + '</td>';
			}
		}
		
		table_html+='<td>' + total_year+ '</td>';
		
		
		table_html+='</tr><tbody id="hidden_row_'+ counter + index_anual +'_meses" class="hidden_row" >';
		for(index_mensual of lista_mensual){
			const datos_diario = daily_data.filter(elem => elem.year === index_anual && elem.month === index_mensual);
			const lista_diaria = getUniques(datos_diario.map(elem => elem.day)).sort((a,b)=>(a-b));
			const total_m = datos_mensual.filter(elem => elem.month == index_mensual).map(elem => elem.picked_up).reduce((pv,cv)=>parseInt(pv)+parseInt(cv),0);
			const total_month = total_m.toLocaleString('de-DE') + ' kg';

			table_html+='<tr class="data_per_month" id="hidden_row_'+ counter + index_anual + index_mensual +'" onclick="changeTableIcon(\'hidden_row_icon_'+ counter + index_anual + index_mensual +'\');';
			for(index_diario of lista_diaria){
				table_html+='showHideElement(\'hidden_row_'+ counter + index_anual + index_mensual + index_diario +'\');';
			} 
			table_html+='"><th><i class="fa fa-plus" aria-hidden="true" id="hidden_row_icon_'+ counter + index_anual + index_mensual + '"> </i>';
			if (index_mensual == 1){
					table_html+='Enero</th>';
				}
			else if (index_mensual == 2){
					table_html+='Febrero</th>';
				}
			else if (index_mensual ==  3){
					table_html+='Marzo</th>';
				}
			else if (index_mensual ==  4){
					table_html+='Abril</th>';
				}
			else if (index_mensual ==  5){
					table_html+='Mayo</th>';
				}
			else if (index_mensual ==  6){
					table_html+='Junio</th>';
				}
			else if (index_mensual ==  7){
					table_html+='Julio</th>';
				}
			else if (index_mensual ==  8){
					table_html+='Agosto</th>';
				}
			else if (index_mensual ==  9){
					table_html+='Septiembre</th>';
				}
			else if (index_mensual ==  10){
					table_html+='Octubre</th>';
				}
			else if (index_mensual ==  11){
					table_html+='Noviembre</th>';
				}
			else if (index_mensual == 12){
					table_html+='Diciembre</th>';
				}
			else {
					table_html+=index_mensual + '</th>';
				}
			
			for (cont of counter_list){
				const valor = datos_mensual.filter(elem => elem[counter+'_id'] === cont[counter+'_id'] && elem.month == index_mensual)[0];
				if(valor === undefined){ //si devuelve undefined es que no está, insertarmos un 0
					table_html+='<td>0 kg</td>';
				}
				else{ //Está ese valor, por tanto insertamos en la tabla dicho 
					const picked_up = valor.picked_up.toLocaleString('de-DE') + ' kg';

					table_html+='<td>' + picked_up + '</td>';
				}
			}
			
			table_html+='<td>' + total_month + '</td></tr>';

			for(index_diario of lista_diaria){
				const total_d = datos_diario.filter(elem => elem.month == index_mensual && elem.day == index_diario).map(elem => elem.picked_up).reduce((pv,cv)=>parseInt(pv)+parseInt(cv),0);
				const total_day = total_d.toLocaleString('de-DE') + ' kg';

				table_html+='<tr  id="hidden_row_'+ counter + index_anual + index_mensual + index_diario +'" class="data_per_day hidden_row"> <th>' + index_diario + '</th>';
				for (cont of counter_list){
					const valor = datos_diario.filter(elem => elem[counter+'_id'] === cont[counter+'_id'] && elem.month == index_mensual && elem.day == index_diario)[0];
					
					if(valor === undefined){ //si devuelve undefined es que no está, insertarmos un 0
						table_html+='<td>0 kg</td>';
					}
					else{ //Está ese valor, por tanto insertamos en la tabla dicho 
						const picked_up = valor.picked_up.toLocaleString('de-DE') + ' kg';

						table_html+='<td>' + picked_up + '</td>';
					}
				}
				
				table_html+='<td>' + total_day + '</td></tr>';
			}
		}
		table_html+='</tbody>';
	}
	table_html+='</table>';

	document.getElementById(my_table).innerHTML = table_html;
}

function printHeader(obj) {
	const header = document.querySelector('header');
	const myH1 = document.createElement('h1');
	myH1.textContent = obj['Meta'];
	header.appendChild(myH1);
}

populate();
