import type { StoryStepConfigState, StoryStepState } from './types';

/** Converts a config author's human-readable step state into the short-key internal shape
 *  the stories tool applies to the adapter. */
export function toStoryStepState(config: StoryStepConfigState): StoryStepState {
  const { layers, hiddenLayers, view, transparency, projection, terrain } = config;
  return {
    l: layers,
    h: hiddenLayers,
    v: [view.center[0], view.center[1], view.zoom, view.bearing ?? 0, view.pitch ?? 0],
    t: transparency,
    p: projection,
    terrain,
  };
}
