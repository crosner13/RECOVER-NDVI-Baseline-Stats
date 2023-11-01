
require([
    "esri/config",
    "esri/Map",
    "esri/views/MapView",
    "esri/renderers/RasterStretchRenderer",
    "esri/layers/ImageryLayer",
    "esri/Basemap",
    "esri/widgets/Expand",
    "esri/widgets/LayerList",
    "esri/widgets/Search",
    "esri/widgets/Home",
    "esri/widgets/BasemapGallery",
    "esri/widgets/Legend",
    "esri/rest/identify",
    "esri/rest/support/IdentifyParameters",
    "esri/rest/support/MultipartColorRamp",
    "esri/Graphic"
], function (esriConfig, Map, MapView, RasterStretchRenderer, ImageryLayer, Basemap, Expand,
    LayerList, Search, Home, BasemapGallery, Legend,
    identify, IdentifyParameters, MultipartColorRamp, Graphic) {

    const colorRamp = MultipartColorRamp.fromJSON({
        "type": "multipart",
        "colorRamps": [
            {
                "type": "algorithmic",
                "algorithm": "esriHSVAlgorithm",
                "fromColor": [
                    110,
                    70,
                    45,
                    255
                ],
                "toColor": [
                    204,
                    204,
                    102,
                    255
                ]
            },
            {
                "type": "algorithmic",
                "algorithm": "esriHSVAlgorithm",
                "fromColor": [
                    204,
                    204,
                    102,
                    255
                ],
                "toColor": [
                    48,
                    100,
                    102,
                    255
                ]
            }
        ]
    });

    const renderer = new RasterStretchRenderer({
        colorRamp: colorRamp,
        stretchType: "min-max"
    });

    const ndviLayer = new ImageryLayer({
        portalItem: {
            id: "f6bb66f1c11e467f9a9a859343e27cf8"
        },
        popupEnabled: false,
        visible: false
    });
    // Get all NDVI Baseline Statistics imagery layers from REST endpoints
    const ndviMean = new ImageryLayer({
        url: "https://giscenter.rdc.isu.edu/server/rest/services/RECOVER/NDVI_Mean/ImageServer",
        renderer: renderer
    });
    const ndviMedian = new ImageryLayer({
        url: "https://giscenter.rdc.isu.edu/server/rest/services/RECOVER/NDVI_Median/ImageServer",
        renderer: renderer,
        visible: false
    });
    const ndviMax = new ImageryLayer({
        url: "https://giscenter.rdc.isu.edu/server/rest/services/RECOVER/NDVI_Maximum/ImageServer",
        renderer: renderer,
        visible: false
    });
    const ndviStdDev = new ImageryLayer({
        url: "https://giscenter.rdc.isu.edu/server/rest/services/RECOVER/NDVI_Standard_Deviation/ImageServer",
        renderer: renderer,
        visible: false
    });
    const ndviUpper = new ImageryLayer({
        url: "https://giscenter.rdc.isu.edu/server/rest/services/RECOVER/NDVI_95PCT_CI_Upper_Bound/ImageServer",
        renderer: renderer,
        visible: false
    });
    const ndviLower = new ImageryLayer({
        url: "https://giscenter.rdc.isu.edu/server/rest/services/RECOVER/NDVI_95PCT_CI_Lower_Bounds/ImageServer",
        renderer: renderer,
        visible: false
    });

    // Set up map
    const statLayers = [ndviMean, ndviMedian, ndviMax, ndviStdDev, ndviUpper, ndviLower]; // order here matters, as it determines which pixel values are returned in what order later.
    const mapLayers = [ndviLayer, ndviMean, ndviMedian, ndviMax, ndviStdDev, ndviUpper, ndviLower]

    const view = new MapView({
        container: "viewDiv",
        map: new Map({
            basemap: "dark-gray-vector",
            layers: mapLayers
        }),
        center: [-111.236885, 40.5],
        zoom: 4
    });

    // Main
    const infoDiv = document.getElementById("infoDiv");
    view.ui.add(infoDiv, "top-right");

    view.on("click", function (event) {
        createGraphic(event.mapPoint.latitude, event.mapPoint.longitude);
    });

    function createGraphic(lat, long) {
        view.graphics.removeAll();
        
        var point = {
            type: "point",
            longitude: long,
            latitude: lat
        };

        var markerSymbol = {
            type: "simple-marker",
            color: [0, 255, 255],
            outline: {width: "0.5px"},
            size: 9
        };

        var pointGraphic = new Graphic({
            geometry: point,
            symbol: markerSymbol
        });

        view.graphics.add(pointGraphic);
    };

    view.on("click", function (event) {
        // Get the coordinates of the click on the view
        var lat = Math.round(event.mapPoint.latitude * 1000) / 1000;
        var lon = Math.round(event.mapPoint.longitude * 1000) / 1000;
        console.log(lat, lon);

        var pixelVals = [];

        var mean;

        statLayers[0].identify({
            geometry: event.mapPoint
        }).then((identifyResponse) => {
            mean = identifyResponse.value;
        });

        var median;

        statLayers[1].identify({
            geometry: event.mapPoint
        }).then((identifyResponse) => {
            median = identifyResponse.value;
        });

        var max;

        statLayers[2].identify({
            geometry: event.mapPoint
        }).then((identifyResponse) => {
            max = identifyResponse.value;
        });

        var stdDev;

        statLayers[3].identify({
            geometry: event.mapPoint
        }).then((identifyResponse) => {
            stdDev = identifyResponse.value;
        });

        var upperBound;

        statLayers[4].identify({
            geometry: event.mapPoint
        }).then((identifyResponse) => {
            upperBound = identifyResponse.value;
        });

        var lowerBound;

        statLayers[5].identify({
            geometry: event.mapPoint
        }).then((identifyResponse) => {
            lowerBound = identifyResponse.value;
        });

        for (let i = 0; i < statLayers.length; i++) {
            statLayers[i].identify({
                geometry: event.mapPoint
            }).then((identifyResponse) => {
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
            <td>${mean}</td>
          </tr>
          <tr>
            <td>Median</td>
            <td>${median}</td>
          </tr>
          <tr>
            <td>Maximum</td>
            <td>${max}</td>
          </tr>
          <tr>
            <td>Standard Deviation</td>
            <td>${stdDev}</td>
          </tr>
          <tr>
            <td>95% Confidence Interval Upper Bound</td>
            <td>${upperBound}</td>
          </tr>
          <tr>
            <td>95% Confidence Interval Lower Bound</td>
            <td>${lowerBound}</td>
          </tr>
        </table>`
                
                view.openPopup({
                    content: HTML
                });
            });
        }
    });

    view.when(() => {
        view.openPopup({
            title: "NDVI Baseline Statistics",
            content: "Click anywhere in the contiguous Western United States to view NDVI Baseline statistics from 1984 - 2022.",
            location: view.center
        });
    });

    // Add widgets
    view.when(() => {
        const searchWidget = new Search({
            view: view
        });
        const homeWidget = new Home({
            view: view
        });
        const basemapGalleryExpand = new Expand({
            view: view,
            content: new BasemapGallery({
                view: view
            })
        });
        const layerListExpand = new Expand({
            view: view,
            content: new LayerList({
                view: view
            })
        });
        const legendExpand = new Expand({
            view: view,
            content: new Legend({
                view: view
            })
        });

        view.ui.add({
            component: searchWidget,
            position: "top-left",
            index: 0
        });
        view.ui.add({
            component: homeWidget,
            position: "top-left",
            index: 1
        });
        view.ui.add(basemapGalleryExpand, "top-left");
        view.ui.add(layerListExpand, "top-left");
        view.ui.add(legendExpand, "top-left");

    });
});
