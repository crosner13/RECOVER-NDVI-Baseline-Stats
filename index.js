
require([
    "esri/config",
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/ImageryLayer",
    "esri/widgets/LayerList",
    "esri/widgets/Legend",
    "esri/rest/identify",
    "esri/rest/support/IdentifyParameters"
  ], function(esriConfig, Map, MapView, ImageryLayer, LayerList, Legend, identify, IdentifyParameters) {

    // Get all NDVI Baseline Statistics imagery layers from REST endpoints
    const ndviMean = new ImageryLayer({
        url: "https://giscenter.rdc.isu.edu/server/rest/services/RECOVER/NDVI_Mean/ImageServer"//,
        // popupTemplate: {
        //   title: "Mean",
        //   content: "{Raster.ServicePixelValue}"
        // }
      });
    const ndviMedian = new ImageryLayer({
        url: "https://giscenter.rdc.isu.edu/server/rest/services/RECOVER/NDVI_Median/ImageServer",
        visible: false
      });
    const ndviMax = new ImageryLayer({
        url: "https://giscenter.rdc.isu.edu/server/rest/services/RECOVER/NDVI_Maximum/ImageServer",
        visible: false
      });
    const ndviMin = new ImageryLayer({
        url: "https://giscenter.rdc.isu.edu/server/rest/services/RECOVER/NDVI_Minimum/ImageServer",
        visible: false
      });
    const ndviStdDev = new ImageryLayer({
        url: "https://giscenter.rdc.isu.edu/server/rest/services/RECOVER/NDVI_Standard_Deviation/ImageServer",
        visible: false
      });
    const ndviUpper = new ImageryLayer({
        url: "https://giscenter.rdc.isu.edu/server/rest/services/RECOVER/NDVI_95PCT_CI_Upper_Bound/ImageServer",
        visible: false
      });
    const ndviLower = new ImageryLayer({
        url: "https://giscenter.rdc.isu.edu/server/rest/services/RECOVER/NDVI_95PCT_CI_Lower_Bounds/ImageServer",
        visible: false
      });
    
    const statLayers = [ndviMean, ndviMedian, ndviMax,  ndviStdDev, ndviUpper, ndviLower]; // order here matters, as it determines which pixel values are returned in what order later.
    
    const view = new MapView({
      container: "viewDiv",
      map: new Map({
        basemap: "dark-gray-vector",
        layers: statLayers // add ndviLower, ndviMin when they stop misbehaving
      }),
      zoom: 12,
      center: [-112.433096, 42.861323]
    });
    
    const infoDiv = document.getElementById("infoDiv");
    view.ui.add(infoDiv, "top-right");
    
    view.on("click", function(event) {
        // Get the coordinates of the click on the view
        var lat = Math.round(event.mapPoint.latitude * 1000) / 1000;
        var lon = Math.round(event.mapPoint.longitude * 1000) / 1000;
        console.log(lat, lon);
      
        var pixelVals = [];
      
        for (let i = 0; i < statLayers.length; i++) {
          statLayers[i].identify({
            geometry: event.mapPoint
          }).then((identifyResponse)=>{
            pixelVals.push(identifyResponse.value); // TODO: Verify that responses are not asynchronous, and that pixel values are actually being returned in the order that they appear in the statLayers array
            HTML = `
         <div>You clicked the map at ${lat}, ${lon}.</div>
         <table>
          <tr style="background-color:#DCC48E;">
            <th>NDVI Baseline Statistics</th>
            <th></th>
          </tr>
          <tr>
            <td>Mean</td>
            <td>${pixelVals[0]}</td>
          </tr>
          <tr>
            <td>Median</td>
            <td>${pixelVals[1]}</td>
          </tr>
          <tr>
            <td>Maximum</td>
            <td>${pixelVals[2]}</td>
          </tr>
          <tr>
            <td>Standard Deviation</td>
            <td>${pixelVals[3]}</td>
          </tr>
          <tr>
            <td>95% Confidence Interval Upper Bound</td>
            <td>${pixelVals[4]}</td>
          </tr>
          <tr>
            <td>95% Confidence Interval Lower Bound</td>
            <td>${pixelVals[5]}</td>
          </tr>
        </table>`
            document.getElementById("infoDiv").innerHTML = HTML;
              // `You clicked the map at: ${lat}, ${lon}. and the pixel values are ${pixelVals}`;
          }).catch((err)=>{
            document.getElementById("infoDiv").innerHTML = `There was an error processing your request. Please click the map to try again.`;
            console.error(err);
          });
        }
        console.log(pixelVals);   
    });
      
    view.when(() => {
        const layerList = new LayerList({
          view: view
        });

        // Add widget to the top right corner of the view
        view.ui.add(layerList, "bottom-left");
      
        // view.openPopup({
        //       title: "NDVI Baseline Statistics",
        //       content:
        //         "Click the map to get NDVI baseline statistics from ###DATE to ###DATE.",
        //       location: view.center
        //     });
    });
});
