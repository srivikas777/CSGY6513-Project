import React from 'react';
import {generateRandomId} from '../../utils';
import {Map, View, Feature} from 'ol/';
import {toStringHDMS} from 'ol/coordinate';
import {Draw} from 'ol/interaction';
import {createBox} from 'ol/interaction/Draw';
import GeometryType from 'ol/geom/GeometryType';
import Polygon from 'ol/geom/Polygon';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource, OSM as OSMSource} from 'ol/source';
import {
  ScaleLine,
  ZoomSlider,
  MousePosition,
  OverviewMap,
  defaults as DefaultControls,
} from 'ol/control';
import {fromLonLat} from 'ol/proj';
import {VectorSourceEvent} from 'ol/source/Vector';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import {GeoSpatialVariable} from '../../api/types';
import {searchLocation} from '../../api/rest';
import {
  transformCoordinates,
  centralizeMapToFeature,
  MyMapBrowserEvent,
  wrapLongitude,
} from '../../spatial-utils';
import {SearchBar} from '../SearchBar/SearchBar';
import 'ol/ol.css';

interface GeoSpatialFilterProps {
  state?: GeoSpatialVariable;
  onSelectCoordinates: (coordinates: GeoSpatialVariable) => void;
}

interface GeoSpatialFilterState {
  search: string;
}

class GeoSpatialFilter extends React.PureComponent<
  GeoSpatialFilterProps,
  GeoSpatialFilterState
> {
  mapId = generateRandomId();
  map?: Map;
  source: VectorSource;

  constructor(props: GeoSpatialFilterProps) {
    super(props);
    this.state = {
      search: '',
    };
    this.source = new VectorSource({wrapX: true});
    this.source.on('addfeature', evt => this.onSelectCoordinates(evt));
    this.componentDidUpdate();
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
  }

  featureMatchesProps(feature: Feature): boolean {
    if (!this.props.state) {
      return false;
    }
    const {topLeftLat, topLeftLon, bottomRightLat, bottomRightLon} =
      transformCoordinates(feature);
    const {latitude1, longitude1, latitude2, longitude2} = this.props.state;
    return (
      topLeftLat === latitude1 &&
      topLeftLon === longitude1 &&
      bottomRightLat === latitude2 &&
      bottomRightLon === longitude2
    );
  }

  componentDidUpdate() {
    if (this.props.state) {
      const {latitude1, longitude1, latitude2, longitude2} = this.props.state;
      const features = this.source.getFeatures();
      if (features.length > 0) {
        // Compare with props
        if (this.featureMatchesProps(features[0])) {
          return;
        }
      }

      // Update selection to match props
      this.source.clear();
      const feature = new Feature({
        geometry: new Polygon([
          [
            fromLonLat([longitude1, latitude1], 'EPSG:3857'),
            fromLonLat([longitude2, latitude1], 'EPSG:3857'),
            fromLonLat([longitude2, latitude2], 'EPSG:3857'),
            fromLonLat([longitude1, latitude2], 'EPSG:3857'),
          ],
        ]),
      });
      this.source.addFeature(feature);
      if (this.map) {
        centralizeMapToFeature(this.map, feature);
      }
    } else {
      this.source.clear();
    }
  }

  componentDidMount() {
    const openStreetMapTileLayer = new TileLayer({
      source: new OSMSource(),
    });

    const vectorLayer = new VectorLayer({source: this.source});
    const map = new Map({
      target: this.mapId,
      layers: [openStreetMapTileLayer, vectorLayer],
      // Add in the following map controls
      controls: DefaultControls().extend([
        new ZoomSlider(),
        new MousePosition({
          projection: 'EPSG:4326',
          coordinateFormat: c => {
            if (c === undefined) {
              return '';
            } else {
              let [x, y] = c;
              x = wrapLongitude(x);
              return `${x.toFixed(4)} ${y.toFixed(4)}`;
            }
          },
        }),
        new ScaleLine(),
        new OverviewMap(),
      ]),
      view: new View({
        projection: 'EPSG:3857',
        // center: fromLonLat([-73.986579, 40.6942036], 'EPSG:3857'), // Tandon
        // zoom: 12,
        center: fromLonLat([0, 0], 'EPSG:3857'),
        zoom: 2,
      }),
    });

    map.getViewport().addEventListener('contextmenu', () => {
      // the 'contextmenu' event is triggered on right-button click
      // we use it to clear the current coordinates selection
      this.source.clear();
    });

    this.addInteractions(map, this.source);
    this.map = map;
  }

  onSelectCoordinates(evt: VectorSourceEvent) {
    // Ignore if it matches the props
    if (this.featureMatchesProps(evt.feature)) {
      return;
    }

    let {topLeftLat, topLeftLon, bottomRightLat, bottomRightLon} =
      transformCoordinates(evt.feature);

    topLeftLon = wrapLongitude(topLeftLon);
    bottomRightLon = wrapLongitude(bottomRightLon);

    this.props.onSelectCoordinates({
      type: 'geospatial_variable',
      latitude1: topLeftLat,
      longitude1: topLeftLon,
      latitude2: bottomRightLat,
      longitude2: bottomRightLon,
    });
  }

  addInteractions(map: Map, mapSource: VectorSource) {
    const draw = new Draw({
      source: mapSource,
      type: GeometryType.CIRCLE,
      geometryFunction: createBox(),
      condition: (evt: MapBrowserEvent) => {
        const e = evt as MyMapBrowserEvent; // workaround for type definition bug
        // when the point's button is 1 (left-click), allows drawing
        if (e.pointerEvent.buttons === 1) {
          return true;
        } else {
          return false;
        }
      },
    });

    draw.on('drawstart', () => mapSource.clear());
    map.addInteraction(draw);
  }

  onSearchSubmit() {
    searchLocation(this.state.search)
      .then(results => {
        if (results.length > 0 && results[0].boundingbox) {
          const [minLon, maxLon, minLat, maxLat] = results[0].boundingbox;
          this.props.onSelectCoordinates({
            type: 'geospatial_variable',
            latitude1: maxLat,
            longitude1: minLon,
            latitude2: minLat,
            longitude2: maxLon,
          });
        }
      })
      .catch(() => alert('Error from search server'));
  }

  render() {
    const style = {
      width: '100%',
      height: '400px',
    };
    let bottomLeftText = undefined,
      topRightText = undefined;
    if (this.props.state) {
      const {latitude1, longitude1, latitude2, longitude2} = this.props.state;
      bottomLeftText = toStringHDMS([longitude1, latitude1]);
      topRightText = toStringHDMS([longitude2, latitude2]);
    }
    return (
      <div>
        <div className="row">
          <div className="col-md-12" style={{fontSize: '.9rem'}}>
            <div className="col-md-6 p-0">
              <SearchBar
                active
                value={this.state.search}
                onQueryChange={search => this.setState({search})}
                onSubmitQuery={this.onSearchSubmit}
                placeholder="Search Map"
              />
            </div>
            <span className="d-inline">
              Left-click to start selection. Right-click to clear selection.
            </span>
            <div className="d-inline" style={{float: 'right'}}>
              {bottomLeftText && topRightText && (
                <>
                  <span>
                    Bottom Left: <code>{bottomLeftText}</code>
                  </span>
                  <span className="ml-3">
                    Top Right: <code>{topRightText}</code>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div id={this.mapId} style={style} className="map" />
      </div>
    );
  }
}

export {GeoSpatialFilter};
