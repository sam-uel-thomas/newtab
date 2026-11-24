import React from "react";
import { Composition } from "remotion";
import { NewTabFilm, DURATION } from "./Film";

export const Root: React.FC = () => (
  <Composition
    id="NewTab"
    component={NewTabFilm}
    durationInFrames={DURATION}
    fps={30}
    width={1920}
    height={1080}
  />
);
