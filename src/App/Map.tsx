import React from "react";
// @ts-ignore
import geojsonExtent from '@mapbox/geojson-extent'
import toGeoJson from './toGeoJson'
import setCluster from './setCluster'
import Shop from './Shop'
import SearchList from './SearchList'

type Props = {
  data: Pwamap.ShopData[];
};

// 画面全体を包むコンテナのスタイル
const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
};

// 地図部分のスタイル
const mapStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
};

// 左上に絶対配置する検索ボックスのスタイル
const searchBoxStyle: React.CSSProperties = {
  position: 'absolute',
  top: '10px',
  left: '10px',
  zIndex: 999,
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  padding: '8px',
  borderRadius: '4px',
  maxWidth: '320px',
};

const hidePoiLayers = (map: any) => {
  const hideLayers = [
    'poi',
    'poi-primary',
    'poi-r0-r9',
    'poi-r10-r24',
    'poi-r25',
    'poi-bus',
    'poi-entrance',
  ];

  for (let i = 0; i < hideLayers.length; i++) {
    const layerId = hideLayers[i];
    map.setLayoutProperty(layerId, 'visibility', 'none');
  }
};

const Content = (props: Props) => {
  const mapNode = React.useRef<HTMLDivElement>(null);
  const [mapObject, setMapObject] = React.useState<any>();
  const [shop, setShop] = React.useState<Pwamap.ShopData | undefined>(undefined);

  // マップ内にスポットを追加
  const addMarkers = (map: any, data: Pwamap.ShopData[]) => {
    if (!map || data.length === 0) {
      return;
    }

    map.on('render', () => {
      // すでに "shops" ソースがあれば何もしない
      if (map.getSource('shops')) {
        return;
      }

      // POI を非表示
      hidePoiLayers(map);

      const textColor = '#000000';
      const textHaloColor = '#FFFFFF';
      const geojson = toGeoJson(data);

      map.addSource('shops', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 25,
      });

      map.addLayer({
        id: 'shop-points',
        type: 'circle',
        source: 'shops',
        filter: ['all', ['==', '$type', 'Point']],
        paint: {
          'circle-radius': 13,
          'circle-color': '#FF0000',
          'circle-opacity': 0.4,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-opacity': 1,
        },
      });

      map.addLayer({
        id: 'shop-symbol',
        type: 'symbol',
        source: 'shops',
        filter: ['all', ['==', '$type', 'Point']],
        paint: {
          'text-color': textColor,
          'text-halo-color': textHaloColor,
          'text-halo-width': 2,
        },
        layout: {
          'text-field': '{スポット名}',
          'text-font': ['Noto Sans Regular'],
          'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
          'text-radial-offset': 0.5,
          'text-justify': 'auto',
          'text-size': 12,
          'text-anchor': 'top',
          'text-max-width': 12,
          'text-allow-overlap': false,
        },
      });

      map.on('mouseenter', 'shop-points', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'shop-points', () => {
        map.getCanvas().style.cursor = '';
      });

      map.on('mouseenter', 'shop-symbol', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'shop-symbol', () => {
        map.getCanvas().style.cursor = '';
      });

      // クラスタ外のスポットクリック時にモーダルを表示
      map.on('click', 'shop-points', (event: any) => {
        if (!event.features[0].properties.cluster) {
          setShop(event.features[0].properties);
        }
      });
      map.on('click', 'shop-symbol', (event: any) => {
        if (!event.features[0].properties.cluster) {
          setShop(event.features[0].properties);
        }
      });

      // クラスターをクリックしたら拡大
      setCluster(map);
    });
  };

  // コンポーネント初回レンダー / data変化時にスポットを追加
  React.useEffect(() => {
    addMarkers(mapObject, props.data);
  }, [mapObject, props.data]);

  // data変化時に地図の表示範囲をフィット
  React.useEffect(() => {
    if (!mapObject || props.data.length === 0) {
      return;
    }
    const geojson = toGeoJson(props.data);
    const bounds = geojsonExtent(geojson);

    if (bounds) {
      mapObject.fitBounds(bounds, {
        padding: 50,
      });
    }
  }, [mapObject, props.data]);

  // マップの初期化 (1度のみ)
  React.useEffect(() => {
    if (!mapNode.current || mapObject) {
      return;
    }
    // @ts-ignore
    const { geolonia } = window;

    const map = new geolonia.Map({
      container: mapNode.current,
      style: 'geolonia/gsi',
    });

    const onMapLoad = () => {
      hidePoiLayers(map);
      setMapObject(map);
    };
    const orientationChangeHandler = () => {
      map.resize();
    };

    map.on('load', onMapLoad);
    window.addEventListener('orientationchange', orientationChangeHandler);

    return () => {
      window.removeEventListener('orientationchange', orientationChangeHandler);
      map.off('load', onMapLoad);
    };
  }, [mapNode, mapObject]);

  const closeHandler = () => {
    setShop(undefined);
  };

  return (
    <div style={containerStyle}>
      {/* 左上に検索フォームを配置 */}
      <div style={searchBoxStyle}>
        <SearchList data={props.data} />
      </div>

      {/* 地図表示エリア */}
      <div
        ref={mapNode}
        style={mapStyle}
        data-geolocate-control="on"
        data-marker="off"
        data-gesture-handling="off"
      ></div>

      {/* 店舗詳細モーダル */}
      {shop ? <Shop shop={shop} close={closeHandler} /> : <></>}
    </div>
  );
};

export default Content;
