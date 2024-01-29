import { useDojo } from '@/DojoContext';
import { useComponentStates } from '@/hooks/useComponentState';
import { getNeighbors } from '@/utils/map';
import { Phase, useElementStore } from '@/utils/store';
import { getComponentValue } from '@latticexyz/recs';
import React, { Fragment, useRef, useState } from 'react';
import carte from '../../../public/map_sea3D_transparent.png';
import mapDataRaw from '../../assets/map/map.json';
import Region from './Region';
import FortifyPanel from './FortifyPanel';

const mapData: MapData = mapDataRaw;

interface PathItem {
  id: number;
  path: string;
}

interface MapData {
  [key: string]: PathItem[];
}

const Map = () => {
  const containerRef = useRef(null);

  const {
    setup: {
      clientComponents: { Tile },
    },
  } = useDojo();

  const { tileIds, turn } = useComponentStates();
  const { current_state, current_source, set_current_source, set_current_target } = useElementStore((state) => state);

  const handleRegionClick = (regionId: number) => {
    const tile = getComponentValue(Tile, tileIds[regionId - 1]);
    if (current_state == Phase.DEPLOY) {
      if (tile.owner !== turn) {
        set_current_source(null);
        return;
      }
      set_current_source(regionId);
    } else if (current_state == Phase.ATTACK) {
      if (tile !== undefined) {
        if (tile.owner === turn) {
          set_current_source(regionId);
          set_current_target(null);
        } else {
          if (current_source && getNeighbors(current_source).includes(regionId)) {
            set_current_target(regionId);
          } else {
            console.log('Can t interract with this tile');
          }
        }
      } else {
        console.log('Can t interract with this tile');
      }
    } else if (current_state == Phase.FORTIFY) {
      // if clicked tile is owned by the player
      if (tile.owner === turn) {
        if (current_source) {
          set_current_target(regionId);
        } else {
          set_current_source(regionId);
        }
      } else {
        console.log('Can t interract with this tile');
      }
    }
  };
  const [isZoomed, setIsZoomed] = useState(false);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0, rectWidth: 0, rectHeight: 0 });

  const toggleZoom = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX; // Position X du clic par rapport à la div
    const y = e.clientY; // Position Y du clic par rapport à la div

    const rectWidth = rect.width; // Largeur de la div
    const rectHeight = rect.height; // Hauteur de la div

    console.log(x, y);
    console.log(rect.left, rect.top, rectWidth, rectHeight);

    setClickPosition({ x, y, rectWidth, rectHeight });
    setIsZoomed(!isZoomed);
  };

  const zoomStyle = isZoomed
    ? {
        // transform: `scale(1.25) translate(${clickPosition.rectWidth / 2 - clickPosition.x}px, ${
        //   clickPosition.rectHeight / 2 - clickPosition.y
        // }px)`,
        transform: `translate(-10px,10px)`,
        transition: 'transform 1s ease-in-out', // Durée de l'animation
      }
    : {};

  const isFortifyPanelVisible =
    current_state === Phase.FORTIFY || current_state === Phase.ATTACK || current_state === Phase.DEPLOY;

  return (
    <>
      <div className="absolute top-[25%] left-1 w-1/6 z-10">{isFortifyPanelVisible && <FortifyPanel />}</div>
      <div className="relative w-full" ref={containerRef}>
        {/* <img src={carte} alt="Carte" className="w-full h-full absolute top-0 left-0" /> */}
        <div className={`w-full h-[600px] overflow-hidden`} onClick={(e) => toggleZoom(e)} style={zoomStyle}>
          <svg
            viewBox="0 0 3669 1932" // Ajustez cette valeur en fonction de vos coordonnées
            preserveAspectRatio="true"
            className="w-full h-full absolute top-0 left-0 fill-cyan-500"
            width={'100%'}
            height={'100%'}
          >
            <image href={carte} width="100%" height="100%" />

            {Object.keys(mapData).map((region) => (
              <Fragment key={region}>
                {mapData[region].map((item) => (
                  <Region
                    playerTurn={turn}
                    key={item.id}
                    id={item.id}
                    region={region}
                    containerRef={containerRef}
                    d={`M${item.path} z`}
                    onRegionClick={() => handleRegionClick(item.id)}
                  />
                ))}
              </Fragment>
            ))}
          </svg>
        </div>
      </div>
      {/* <SupplyModal
        open={supplyModalOpen}
        player={player}
        onClose={setSupplyModalOpen}
        regionId={currentRegionSupplyId}
      /> */}
    </>
  );
};
export default Map;
