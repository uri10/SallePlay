
function onLoad () {
	if (typeof(Storage) !== "undefined") {
		var aux;
		for (var i = 0; i < localStorage.length; i++) {
			aux = localStorage.getItem(localStorage.key(i));
			localStorage.removeItem(localStorage.key(i));
			localStorage.setItem(i.toString(), aux);
		}
	}
}

window.onload = onLoad;
window.location.href = "#";
var music_template = document.getElementById("busquedaView-template");
var aux_favoritos_template = document.getElementById("favoritosView-template");
music_template.style.display = "none";
aux_favoritos_template.style.display = "none";

function trunkText(str) {
	var truncated;
	var maxLength = 20;
    if (str.length > maxLength) {
        truncated = str.substring(0,maxLength) + "...";
    }else {
    	truncated = str;
    }
    return truncated;
}

function showRelacionados (q, artista) {
	var xhr = new XMLHttpRequest();
	xhr.addEventListener("load", function () {
		try {
			var json = JSON.parse(this.responseText);
			var aux = json.toptracks.track[0];
			if (aux.image[3]["#text"].length < 4) {
				document.getElementById("recomendacion" + q).getElementsByClassName("recomendacion_img")[0].src = "./htdocs/imag/songNotFound2.jpg";
			}else {
				document.getElementById("recomendacion" + q).getElementsByClassName("recomendacion_img")[0].src = aux.image[3]["#text"];
			}

			document.getElementById("recomendacion" + q).getElementsByClassName("nombreArtista")[0].innerHTML = trunkText(aux.artist.name);
			document.getElementById("recomendacion" + q).getElementsByClassName("nombreCancion")[0].innerHTML = trunkText(aux.name);
		}catch (error) {
			console.log(error);
		}
	});
	xhr.open("GET", "http://ws.audioscrobbler.com/2.0/?method=artist.getTopTracks&artist="+artista+"&limit=5&format=json&api_key=9d87d6c9c3e84d9e663fb108741bc07d");
	xhr.send();
}

function getNumber(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function relacionados (q, idArtista) {
	var xhr = new XMLHttpRequest();
	xhr.addEventListener("load", function () {
		var json = JSON.parse(this.responseText);
		var aux = json.artists[q];
		showRelacionados(q, aux.name);
	});
	xhr.open("GET", "https://api.spotify.com/v1/artists/" + idArtista + "/related-artists");
	xhr.send();
}

function artistasRecomendados () {
	var idArtista;
	for (var i = 0; i < 5; i++) {
		try {
			//escogemos relacionados de un artista favorito aleatorio
			idArtista = localStorage.getItem(getNumber(0, localStorage.length)).split("@")[5];
			relacionados(i, idArtista);
		}catch(err) {
			console.log(err);
		}
	}
}

function mostrarRecomendados () {
	onLoad();
	if (localStorage.getItem(0) == null || localStorage.getItem(0) == "undefined" || localStorage.getItem(0) == "null") {
		recomendados();
	}else {
		artistasRecomendados();
	}
}

mostrarRecomendados();

function callarTodos () {
	var objs = document.getElementsByClassName("play/pause-button");
	for (var i = 0; i < objs.length; i++) {
		if (objs[i].dataset.play === "1" || objs[i].dataset.play === "0") {
		  	objs[i].dataset.play = "-1";
		  	objs[i].className = "glyphicon glyphicon-play play/pause-button";
	  	}
	};
}

document.getElementById("audioPlayer").addEventListener("ended", callarTodos);

var reproductor = {
	cargar: function (src) {
		var player = document.getElementById("audioPlayer");
		player.src = src;
		player.load();
		player.play();
	},
	play: function () {
		var player = document.getElementById("audioPlayer");
		player.play();
	},
	pause: function () {
		var player = document.getElementById("audioPlayer");
		player.pause(); 
	}
};

function insertarElemento (tipo, img, nombreCancion, album, artista, song, qFavorito, idArtist) {
	music_template.style.display = "inline";
	aux_favoritos_template.style.display = "inline";
	//tipo de plantilla, la hacemos visible
	var template = document.getElementById(tipo + "-template");
	var nuevo = template.cloneNode(true);
	if (tipo === "busquedaView") {
		//la idArtist
		nuevo.dataset.idArtist = idArtist;
	}
	//la imagen
	var imagen = nuevo.getElementsByClassName("image-element")[0];
	imagen.src = img;
	//nombre de canción, artista y álbum
	nuevo.getElementsByClassName("nombreCancion")[0].innerHTML = nombreCancion;
	nuevo.getElementsByClassName("nombreAlbum")[0].innerHTML = album;	
	nuevo.getElementsByClassName("nombreArtista")[0].innerHTML = artista;	
	//metemos los listeners
	var btn = nuevo.getElementsByClassName("play/pause-button")[0];
	btn.addEventListener("click", function cambiarPlay () {
		if (btn.dataset.play == "-1"){
			//-1 = no se ha reproducido aun
			callarTodos();
			btn.dataset.play = "1";
			btn.className = "glyphicon glyphicon-pause play/pause-button";
			reproductor.cargar(song);
			// 0 = play; 1 = pause
		}else if (btn.dataset.play === "0") {
			btn.dataset.play = "1";
			btn.className = "glyphicon glyphicon-pause play/pause-button";
			reproductor.play();
		}else if (btn.dataset.play === "1"){
			btn.dataset.play = "0";
			btn.className = "glyphicon glyphicon-play play/pause-button";
			reproductor.pause();
		}
	});
	var btnAux = nuevo.getElementsByClassName("aux-button")[0];
	if (btnAux.dataset.button === "1") {
		//boton de papelera
		btnAux.addEventListener("click", function () {
			if (btn.dataset.play === "1") {
				reproductor.pause();
			}
			eliminarFavorito(qFavorito);
			nuevo.remove();
			mostrarRecomendados();
		});
	}else if (btnAux.dataset.button === "0") {
		//boton favorito
		btnAux.addEventListener("click", function () {
			//insertamos en la BBDD
			btnAux.dataset.qFavorito = insertarFavorito (img, nombreCancion, album, artista, song, idArtist);
			//insertamos el favorito a la lista
			insertarElemento("favoritosView", img, nombreCancion, album, artista, song, btnAux.dataset.qFavorito, idArtist);
			mostrarRecomendados();
		});
	}

	nuevo.style.visibility = "visible";
	document.getElementById(tipo).appendChild(nuevo);

	music_template.style.display = "none";
	aux_favoritos_template.style.display = "none";
}

function callBackSpotify (tipo, contexto) {
	try {
		var json = JSON.parse(contexto.responseText);
		var aux;
		for (var i = 0; i < json.tracks.items.length; i++) {
			aux = json.tracks.items[i];
			insertarElemento(tipo, aux.album.images[1].url, aux.name, aux.album.name, aux.artists[0].name, aux.preview_url, "0", aux.artists[0].id);
		}	
	}catch (err) {
		console.log(err);
	}
}

function listarCanciones (string, tipo) {
	if (string === undefined) return;
	try {
		var xhr = new XMLHttpRequest();
		xhr.addEventListener("load", function () {
			callBackSpotify(tipo, this);
		});
		xhr.open("GET", "https://api.spotify.com/v1/search?q=" + string + "&type=track");
		xhr.send();
	}catch (error) {
		console.log(error);
	}
}

function insertarFavorito (img, nombreCancion, nombreAlbum, nombreArtista, song, idArtist) {
	if (typeof(Storage) !== "undefined") {
		var aux = img+"@"+nombreCancion+"@"+nombreAlbum+"@"+nombreArtista+"@"+song+"@"+idArtist;
		localStorage.setItem(localStorage.length.toString(), aux);
		return (localStorage.length-1).toString();
	}else {
		console.log("Que mala suerte! Tu navegador no permite localStorage")
	}
	return -1;
}

function eliminarFavorito (id) {
	localStorage.removeItem(id);
}

function cargarFavoritos (tipo) {
	if (typeof(Storage) !== "undefined") {
		var aux, split;
		for (var i = 0; i < localStorage.length; i++) {
			try {
				aux = localStorage.getItem(localStorage.key(i));
				split = aux.split("@");
				insertarElemento (tipo, split[0], split[1], split[2], split[3], split[4], i, split[5]);
			}catch (err) {
				console.log(error);
			}
		}
	}
	aux_favoritos_template.style.display = "none";
}

document.getElementById("search-button").addEventListener("click", function () {
		callarTodos();

		var music_template = document.getElementById("busquedaView-template");
		while (music_template.nextSibling) {
		    music_template.nextSibling.parentNode.removeChild(music_template.nextSibling);
		}
		if (document.getElementById("search-text").value) {
			listarCanciones(document.getElementById("search-text").value.toString(), "busquedaView");
		}
		music_template.style.display = "none";
});

function mostrar(){
	document.getElementById('oculto').style.display = 'block';
}

cargarFavoritos ("favoritosView");