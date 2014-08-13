function Rappid(){this.map=null,this.routeLayer=null,this.latlng=null,this.vehicles=null,this.shape=null,this.availableRoutes=ko.observableArray(),this.route=ko.observable(),this.stops=ko.observableArray(),this.includeList=ko.observable(!0),this.includeMap=ko.observable(!0),this.includeToggleBtn=ko.computed(function(){return!this.includeList()||!this.includeMap()}.bind(this))}function Shape(e,t){this.route=e,this.direction=t,this._shape=[]}function Stop(e){var t=e.stop_name.replace("(SB)","").replace("(NB)","");this.name=ko.observable(t),this.direction=ko.observable(parseInt(e.direction_id)),this.route=ko.observable(parseInt(e.route_id)),this.code=ko.observable(e.stop_code),this.desc=ko.observable(e.stop_desc),this.id=ko.observable(e.stop_id),this.lat=ko.observable(e.stop_lat),this.lon=ko.observable(e.stop_lon),this.timezone=ko.observable(e.stop_timezone),this.url=ko.observable(e.url),this.errorMsg=ko.observable(),this.trips=ko.observableArray(),this.closest=ko.observable(!1),this.cssId=ko.observable("stop-"+e.stop_id),this.showTrips=ko.observable(!1),this.loadedTrips=ko.observable(!1),this.loading=ko.observable(!1),this.showProgress=ko.computed(function(){return this.loading()&&!this.loadedTrips()}.bind(this)),this.color="rgb(199,16,22)",this.marker=leaflet.circleMarker([this.lat(),this.lon()],{color:"white",opacity:1,weight:3,fillColor:this.color,fill:!0,fillOpacity:1,radius:12,zIndexOffset:config.stopZIndex}),this.marker.bindPopup(this.popupContent()),this.marker.addEventListener("click",function(){this.loadedTrips()||this.loadTrips().then(null,console.error)}.bind(this))}function Trip(e){this.tripTime=ko.observable(e.Triptime),this.id=ko.observable(e.Tripid),this.skedTripID=ko.observable(e.Skedtripid),this.block=ko.observable(e.Block),this.exception=ko.observable(e.Exception),this.moment=ko.computed(function(){return moment(this.tripTime(),"hh:mm A")}.bind(this)),this.prettyTime=ko.computed(function(){return this.moment().fromNow()}.bind(this)),this.old=ko.computed(function(){return!this.moment().isAfter()}.bind(this))}function Vehicles(e,t){this.route=e,this.direction=t,this._vehicles=[],this._markers={}}var leaflet=require("leaflet"),when=require("when"),LocateControl=leaflet.Control.extend({userLatLng:[0,0],innerMarker:null,outerMarker:null,map:null,options:{icon:"icon-location",position:"topleft",zoomLevel:16,pollInterval:3e4},onAdd:function(e){this.container=leaflet.DomUtil.create("div","locate-control leaflet-bar leaflet-control"),this.map=e;var t=leaflet.DomUtil.create("a","leaflet-bar-part leaflet-bar-part-single "+this.options.icon,this.container);return leaflet.DomEvent.on(t,"click",leaflet.DomEvent.stopPropagation).on(t,"click",leaflet.DomEvent.preventDefault).on(t,"click",this.zoomToLocation.bind(this)).on(t,"dblclick",leaflet.DomEvent.stopPropagation),this.locate(),this.container},zoomToLocation:function(){this.map.setView(this.userLatLng,this.options.zoomLevel)},locate:function(){this.container.classList.add("loading"),this.map.locate({maximumAge:1e3,enableHighAccuracy:!0,watch:!0}),this.map.on("locationfound",function(e){this.userLatLng=e.latlng,this.updateMarkers(),this.container.classList.remove("loading")}.bind(this)),this.map.on("locationerror",function(e){this.userLatLng={lat:30.268066,lng:-97.743189},this.updateMarkers(),this.container.classList.remove("loading"),console.error("Unable to find location: ",e.message)}.bind(this))},updateMarkers:function(){this.innerMarker&&this.outerMarker||this.createMarkers(this.map),this.innerMarker.setLatLng(this.userLatLng),this.outerMarker.setLatLng(this.userLatLng)},createMarkers:function(){this.innerMarker=leaflet.circleMarker(this.userLatLng,{weight:0,fillColor:"rgb(16,94,251)",fill:!0,fillOpacity:1,radius:5}),this.outerMarker=leaflet.circleMarker(this.userLatLng,{color:"rgb(20,130,210)",opacity:1,weight:2,fillColor:"rgb(108,196,253)",fill:!0,fillOpacity:.4,radius:15}),this.outerMarker.addTo(this.map),this.outerMarker.bindPopup("Current Location"),this.innerMarker.addTo(this.map)}});module.exports=LocateControl;var config={vehicleZIndex:10,stopZIndex:5};module.exports=config;var ko=require("knockout"),Rappid=require("./rappid"),rappid=window.rappid=new Rappid;window.ko=ko,ko.applyBindings(rappid,document.getElementById("lerappid")),rappid.start().catch(function(e){console.error(e),"The CapMetro API is unavailable"===e&&rappid.rustle()});var ko=require("knockout"),L=require("leaflet"),when=require("when"),NProgress=require("NProgress"),LocateControl=require("./LocateControl"),RoutesCollection=require("./models/RoutesCollection"),Vehicles=require("./models/Vehicles"),Shape=require("./models/Shape"),StopCollection=require("./models/StopCollection");Rappid.prototype={start:function(){var e=when.defer();return this.resize(),this.setupMap(),RoutesCollection.fetch().then(function(t){this.availableRoutes(t);var r=JSON.parse(localStorage.getItem("rappid:route")),o=this.availableRoutes()[0];r&&(o=this.availableRoutes().filter(function(e){return r.id===e.id&&r.direction===e.direction})[0]),this.route(o),this.setupRoute().then(null,console.error),e.resolve()}.bind(this),e.reject),NProgress.configure({showSpinner:!1}),e.promise},refresh:function(){NProgress.start();var e,t=when.defer(),r=this.vehicles.fetch(),o=this.stops().map(function(e){return e.refresh()});return r.then(this.vehicles.draw.bind(this.vehicles,this.routeLayer)),e=[r],e=e.concat(o),when.all(e).done(function(){NProgress.done(),setTimeout(this.refresh.bind(this),15e3),t.resolve(!0)}.bind(this),function(e){console.error(e),NProgress.done(),"The CapMetro API is unavailable"===e&&this.rustle(),t.resolve(!1)}.bind(this)),t.promise},setupMap:function(){var e,t,r;this.map=L.map("map",{zoomControl:!1}),this.map.setView([30.267153,-97.743061],12),e=L.tileLayer("https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png",{maxZoom:18,attribution:'<a href="http://openstreetmap.org">OpenStreetMap</a> | <a href="http://mapbox.com">Mapbox</a>',id:"drmaples.ipbindf8"}),t=new L.Control.Zoom({position:"bottomright"}),r=new LocateControl({position:"bottomright",zoomLevel:16}),e.addTo(this.map),t.addTo(this.map),r.addTo(this.map),this.map.on("locationfound",function(e){this.latlng||StopCollection.closest(this.stops(),e.latlng),this.latlng=e.latlng}.bind(this))},selectRoute:function(){this.setupRoute().done(null,console.error)},setupRoute:function(){var e,t,r,o,i=when.defer(),s=this.route().id,n=this.route().direction;return this.track(),console.log("Setup route",this.route()),localStorage.setItem("rappid:route",ko.toJSON(this.route())),this.routeLayer&&this.map.removeLayer(this.routeLayer),this.routeLayer=L.layerGroup(),this.routeLayer.addTo(this.map),this.vehicles=new Vehicles(s,n),this.shape=new Shape(s,n),t=this.shape.fetch(),t.then(this.shape.draw.bind(this.shape,this.routeLayer)),r=this.vehicles.fetch(),r.then(this.vehicles.draw.bind(this.vehicles,this.routeLayer)),o=StopCollection.fetch(s,n),o.then(function(e){StopCollection.draw(e,this.routeLayer),this.stops(e),this.latlng&&StopCollection.closest(e,this.latlng)}.bind(this)),e=[t,r,o],when.all(e).done(function(){setTimeout(this.refresh.bind(this),15e3),i.resolve()}.bind(this),function(e){console.error(e),NProgress.done(),"The CapMetro API is unavailable"===e&&this.rustle(),i.resolve(!1)}.bind(this)),i.promise},resize:function(){window.screen.width<=1024?(this.includeMap(!0),this.includeList(!1)):(this.includeMap(!0),this.includeList(!0))},toggleMap:function(){this.includeList(!this.includeList()),this.includeMap(!this.includeMap()),this.map.invalidateSize(),this.map.closePopup(),document.body.scrollTop=document.documentElement.scrollTop=0},track:function(){var e=this.route().id+"-"+this.route().direction;window.ga("send",{dimension1:e,hitType:"screen",screenName:e})},rustle:function(){window.alert("There was a problem fetching data from CapMetro.\nClose the app and try again.")}},module.exports=Rappid;var when=require("when"),requests={requestID:0,send:function(e,t,r,o){var i,s=when.defer(),n=new XMLHttpRequest,a=!1,l=e.toLowerCase(),u="get"===l,h="delete"===l;this.requestID+=1,i=this.requestID,u&&r&&Object.keys(r).length>0&&(t+="?"+this.serializeParams(r)),n.onload=function(){if(!a){a=!0;{n.status>299?console.error:console.log}console.log(i.toString(),"["+e.toUpperCase()+"]",t,"=>",n.status);var r=n.getResponseHeader("content-type")||n.getResponseHeader("Content-type");if(n.status>=200&&n.status<400){var o=null;if(/application\/json/i.test(r))o=JSON.parse(n.responseText);else if(/text\/xml/i.test(r)){var l=new DOMParser;o=l.parseFromString(n.responseText,"text/xml")}else o=n.responseText;s.resolve(o)}else s.reject(n.responseText)}},n.onerror=function(){s.reject(new Error("Unable to connect to the server."))},n.ontimeout=function(){s.reject(new Error("It took too long for the server to respond."))},n.open(e,t,!0),o&&o.forEach(function(e,t){n.setRequestHeader(t,e)});var c=void 0===r||u?void 0:JSON.stringify(r);return!h||c&&0!==c.length||(c="1"),n.timeout=3e4,n.send(c),s.promise},serializeParams:function(e){function t(e,t){r.push(encodeURIComponent(e)+"="+encodeURIComponent(t))}var r=[];for(var o in e)if(e.hasOwnProperty(o)){var i=e[o];if(Array.isArray(i)){var s=t.bind(void 0,o);i.forEach(s)}else t(o,i)}return r.join("&")}};requests.get=requests.send.bind(requests,"GET"),requests.put=requests.send.bind(requests,"PUT"),requests.patch=requests.send.bind(requests,"PATCH"),requests.post=requests.send.bind(requests,"POST"),requests.delete=requests.send.bind(requests,"DELETE"),module.exports=requests;var utils={formatDirection:function(e,t){if(e=parseInt(e),0===t)return 801===e?"North":550===e?"South":"South";if(1===t){if(801===e)return"South";if(550===e)return"North"}return"S"===t?"South":"N"===t?"North":void 0},getDirectionID:function(e,t){if(e=parseInt(e),t=t.toLowerCase().replace("/",""),"north"===t||"n"===t){if(801===e)return 0;if(550===e)return 1}if("south"===t||"s"===t){if(801===e)return 1;if(550===e)return 0}return 0}};module.exports=utils;var when=require("when"),requests=require("../requests"),RoutesCollection={fetch:function(){var e=when.defer();return requests.get("data/routes.json").then(function(t){var r=t.map(function(e){return e});e.resolve(r)}).catch(function(t){console.error(t),e.reject(t)}),e.promise}};module.exports=RoutesCollection;var L=require("leaflet"),when=require("when"),config=require("../config"),requests=require("../requests");Shape.prototype={fetch:function(){var e=when.defer();return requests.get("data/shapes_"+this.route+"_"+this.direction+".json").then(function(t){this._shape=t.map(function(e){return new L.LatLng(e.shape_pt_lat,e.shape_pt_lon)}),e.resolve()}.bind(this)).catch(function(t){console.error("problem fetching shape",t),e.reject(t)}),e.promise},draw:function(e){var t="rgb(199,16,22)",r=new L.Polyline(this._shape,{color:t,stroke:!0,weight:5,opacity:.9,smoothFactor:1});r.addTo(e),r.bringToBack()}},module.exports=Shape;var ko=require("knockout"),when=require("when"),leaflet=require("leaflet"),TripCollection=require("./TripCollection"),fs=require("fs"),config=require("../config"),stopPopupHTML=fs.readFileSync(__dirname+"/../templates/stop-popup.html","utf8");Stop.prototype={toggleTrips:function(){this.showTrips(!this.showTrips()),this.showTrips()?this.marker.openPopup():this.marker.closePopup(),this.loadedTrips()||this.loadTrips().then(null,function(e){console.error(e)})},loadTrips:function(){var e=when.defer();return this.showTrips(!0),this.loading(!0),TripCollection.fetch(this.route(),this.direction(),this.id()).then(function(t){this.loadedTrips(!0),this.loading(!1),this.trips(t),this.errorMsg(null),e.resolve()}.bind(this),function(t){this.loadedTrips(!0),this.loading(!1),this.errorMsg(t),e.reject(t)}.bind(this)),e.promise},refresh:function(){return this.showTrips()?this.loadTrips():void 0},popupContent:function(){var e=document.createElement("div");return e.innerHTML=stopPopupHTML,ko.applyBindings(this,e),e}},module.exports=Stop;var L=require("leaflet"),when=require("when"),geolib=require("geolib"),config=require("../config"),Stop=require("./Stop"),requests=require("../requests"),StopCollection={fetch:function(e,t){var r=when.defer();return requests.get("data/stops_"+e+"_"+t+".json").then(function(e){var t=e.map(function(e){return new Stop(e)});r.resolve(t)}).catch(function(e){console.error("Problem fetching stop",e),r.reject(e)}),r.promise},draw:function(e,t){e.forEach(function(e){e.marker.addTo(t)})},closest:function(e,t){if(e.length){var r,o,i=e.map(function(e){return{latitude:e.lat(),longitude:e.lon()}}),s={latitude:t.lat,longitude:t.lng};return r=geolib.findNearest(s,i,0,1),o=e[parseInt(r.key)],o.closest(!0),document.body.scrollTop=document.getElementById(o.cssId()).offsetTop,document.getElementById("list").scrollTop=document.getElementById(o.cssId()).offsetTop,o.toggleTrips(),o}}};module.exports=StopCollection;var ko=require("knockout"),moment=require("moment");module.exports=Trip;var when=require("when"),utils=require("../utils"),Trip=require("./Trip"),requests=require("../requests"),TripCollection={fetch:function(e,t,r){var o=when.defer(),i="http://query.yahooapis.com/v1/public/yql",s="http://www.capmetro.org/planner/s_service.asp?output=xml&opt=2&tool=SI&route="+e+"&stopid="+r,n={q:'select * from xml where url="'+s+'"',format:"json"};return requests.get(i,n).then(function(e){var r,i,s,n,a,l=e.query.results;if(null===l||!l.Envelope)return console.error("Bad arrival times data:",e),void o.reject("The CapMetro API is unavailable");if(r=l.Envelope,i=r.Body.Fault)return console.error(i),void o.reject(new Error(i.faultstring));s=r.Body.SchedulenearbyResponse.Atstop.Service,Array.isArray(s)&&(s=s.filter(function(e){return utils.getDirectionID(e.Route,e.Direction)===t})[0]),n=s.Tripinfo,Array.isArray(n)||(n=[n]),a=n.map(function(e){return new Trip(e)});for(var u=0;u<a.length;u++)if(!a[u].old()){u>0&&(a=a.slice(u-1));break}o.resolve(a)}.bind(this)).catch(function(e){console.error("Fetch arrivals",e),o.reject(e)}),o.promise}};module.exports=TripCollection;var L=require("leaflet"),when=require("when"),_=require("underscore"),utils=require("../utils"),config=require("../config"),requests=require("../requests");Vehicles.prototype={fetch:function(){var e=when.defer(),t="http://query.yahooapis.com/v1/public/yql",r={q:'select * from xml where url="http://www.capmetro.org/planner/s_buslocation.asp?route=*"',format:"json"};return requests.get(t,r).then(function(t){var r,o=t.query.results;return null!==o&&o.Envelope?(r=o.Envelope.Body.BuslocationResponse,r.Vehicles?(this._vehicles=r.Vehicles.Vehicle,Array.isArray(this._vehicles)||(this._vehicles=[this._vehicles]),this._vehicles.forEach(function(e){var t=e.Positions.Position,r=Array.isArray(t)?t[0]:t;e.lat=r.split(",")[0],e.lng=r.split(",")[1]}),void e.resolve()):void e.reject(new Error("Zero active vehicles"))):(console.error("Bad vehicle location data:",t),void e.reject("The CapMetro API is unavailable"))}.bind(this)).catch(function(t){console.error("Fetch vehicles",t),e.reject(t)}),e.promise},draw:function(e){var t=this.route,r=this.direction,o=_.filter(this._vehicles,function(e){var o=parseInt(e.Route),i=utils.getDirectionID(e.Route,e.Direction);return t===o&&r===i}),i=o.map(function(e){return e.Vehicleid}),s=_.filter(Object.keys(this._markers),function(e){return!_.find(i,function(t){return t===e})});console.log("Vehicles",o.length,"Deleted",s.length),s.forEach(function(t){e.removeLayer(this._markers[t]),delete this._markers[t]}.bind(this)),o.forEach(function(t){var r=this._markers[t.Vehicleid],o=this.popupContent(t),i="Y"===t.Inservice?"rgb(34,189,252)":"rgb(188,188,188)";if(r){var s=r.getLatLng(),n=[s.lat,s.lng],a=[parseFloat(t.lat),parseFloat(t.lng)],l=200,u=[a[0]-n[0],a[1]-n[1]];return r._popup.setContent(o),r.setStyle({fillColor:i}),void(_.isEqual(n,a)||("visible"===document.visibilityState?this.animateMarker(r,0,l,n,u):r.setLatLng(a)))}r=L.circleMarker([t.lat,t.lng],{color:"#fff",weight:3,radius:15,opacity:1,fillOpacity:"0.9",fillColor:i,zIndexOffset:config.vehicleZIndex}),r.bindPopup(o),r.addTo(e),this._markers[t.Vehicleid]=r}.bind(this))},popupContent:function(e){var t='<span class="id">Vehicle '+e.Vehicleid+"</span>",r=["Updated at "+e.Updatetime,"Moving "+utils.formatDirection(e.Route,e.Direction)+" at "+e.Speed+"mph","Reliable? "+e.Reliable,"Stopped? "+e.Stopped,"Off Route? "+e.Offroute,"In Service? "+e.Inservice].join("<br />");return'<div class="vehicle">'+t+r+"</div>"},easeInOutCubic:function(e,t,r,o){return(e/=o/2)<1?r/2*e*e*e+t:r/2*((e-=2)*e*e+2)+t},animateMarker:function(e,t,r,o,i){var s=this.easeInOutCubic(t,o[0],i[0],r),n=this.easeInOutCubic(t,o[1],i[1],r);e.setLatLng([s,n]),r>t&&setTimeout(this.animateMarker.bind(this,e,t+1,r,o,i),10)}},module.exports=Vehicles;
//# sourceMappingURL=bundle.js.map