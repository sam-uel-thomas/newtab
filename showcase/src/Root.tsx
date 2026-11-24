import React from "react";
import { Composition, Still } from "remotion";
import { Banner, BannerGuides, BANNER } from "./Banner";
import { NewTabFilm, DURATION } from "./Film";
import { Tour, TOUR_DURATION } from "./Tour";

export const Root: React.FC = () => (
  <>
    <Composition
      id="NewTab"
      component={NewTabFilm}
      durationInFrames={DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="Tour"
      component={Tour}
      durationInFrames={TOUR_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
    <Still id="Banner" component={Banner} width={BANNER.width} height={BANNER.height} />
    <Still id="BannerGuides" component={BannerGuides} width={BANNER.width} height={BANNER.height} />
  </>
);
