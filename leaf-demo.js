var map = L.map( 'map', {
  center: [46.0, 25.0],
  minZoom: 2,
  zoom: 7
});

  var redMarker = L.AwesomeMarkers.icon({
    icon: 'default',
    markerColor: 'red'
  });
  var greyMarker = L.AwesomeMarkers.icon({
    icon: 'default',
    markerColor: 'pink'
  });
  var greenMarker = L.AwesomeMarkers.icon({
    icon: 'default',
    markerColor: 'green'
  });
  var blueMarker = L.AwesomeMarkers.icon({
    icon: 'default',
    markerColor: 'blue'
  });
  var blackMarker = L.AwesomeMarkers.icon({
    icon: 'default',
    markerColor: 'black'
  });

var iconMappings = {
    'missingroundabout':redMarker,
    'duplicatedways':greyMarker,
    'orphannodes':blueMarker,
    'orphanways':greenMarker,
    'closed':blackMarker
  }    


  var config = {
    apiKey: "AIzaSyDzOEtUmCSqRqOJDOujUdsJQcNwYnQJ0ok",
    authDomain: "realtimemapping.firebaseapp.com",
    databaseURL: "https://realtimemapping.firebaseio.com",
    storageBucket: "realtimemapping.appspot.com",
    messagingSenderId: "1013902661268"
  };
  firebase.initializeApp(config);
  
  
var database = firebase.database()

function retrieveData(rootUrl){
  var promise = database.ref().once('value')
  return promise
}

function addIndex(geometries,type){
  withIndex = []
  for(var i=0;i<geometries.length;i++){
    withIndex[i] = geometries[i]
    withIndex[i]['properties']['index'] = type+'-'+i
  }
  return withIndex
}

var assignMarkers = function(callback){

  var promise = retrieveData('/')
  promise.then(function(item){
    markerLayerMappings = item.val()
    callback(markerLayerMappings)
  })
  //return markerLayerMappings
}

var initMap = function(){
  L.tileLayer( 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  subdomains: ['a', 'b', 'c']
  }).addTo( map );
}

initMap()

var composeUrlJOSM = function(bbox){
  var rootUrl = "http://127.0.0.1:8111/load_and_zoom?"
  var bboxUrl = "left="+bbox.west+"&right="+bbox.east+"&top="+bbox.north+"&bottom="+bbox.south
  return rootUrl+bboxUrl
}

//Create for each marker and edit
function edit(markers, layer) {
  var josmUrl = "http://localhost:8111/load_object?new_layer=true&objects=w"+markers.properties.id
  var popupContent = "<p>"+ markers.properties.type+"</p>"
  +"<p><a href="+markers.properties.url+" target='_blank'>"+"Edit in iD"+"</a>"+" | " 
  +"<a href="+josmUrl+" target='_blank'>"+"Edit in JOSM  " + '|'+
  "<a  class='change' href='#' id = '"+markers.properties.index+"' '>"+" Change status"+"</p>";
  
  if (markers.properties && markers.properties.url) {
    popupContent;
  } 
  layer.bindPopup(popupContent);
}

var addToMapGeoJsonLayer = function(geojson,type){
    var geojsonLayer = L.geoJson(geojson, {
      onEachFeature: edit,
      pointToLayer:function(feature,latlng){
		 
        if(feature.properties.status == "closed"){
		   return L.marker(latlng,{
          icon:iconMappings["closed"]
        });
		}else{
        return L.marker(latlng,{
          icon:iconMappings[type]
        });
	    }
      }
  })
   
  return geojsonLayer 
}

var clearMap = function(layers){
  layers.forEach(function(layer){
    map.removeLayer(layer)
  })
  layers = []
}

$(function(){
   addedLayers = []
   $("#panel").click(function(){
     clearMap(addedLayers)
     initMap()
     checkedValues = []
     checkboxes = $("input[type='checkbox']").each(function(){
       if($(this).is(":checked")){
         checkedValues.push($(this).attr("value"))
       }
     })
     
     checkedValues.forEach(function(item){
       geom = markerMappings[item]
       layer = addToMapGeoJsonLayer(addIndex(geom,item),item)
       layer.addTo(map)
       addedLayers.push(layer)
     })
   })

assignMarkers(function(item){
  markerMappings = item
  $("#panel").trigger('click')
   })
  
  database.ref('/').on('value',function(snapshot){
    markerMappings = snapshot.val()
    $("#panel").trigger('click')
  })
  
  $(document).on("click",".change",function(e){
    var itemInfo = $(this).attr('id')
    var infoArr  = itemInfo.split("-")
    var index = infoArr[1]
    var type = infoArr[0]
    var item = markerMappings[type][index]
    if(item['properties']['status']=='closed'){
	  item['properties']['status']='open'
	}else {
	  item['properties']['status']='closed'
	}
    $("#panel").trigger('click')
    var updates = {}
    var url = '/'+type+'/'+index
    console.log(url)
    updates[url] = item
    firebase.database().ref().update(updates)
  })

})



