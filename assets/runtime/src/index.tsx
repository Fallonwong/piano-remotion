import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {PianoScoreScene} from './animations/score/PianoScoreScene';
import timelineData from '../public/score/demo/timeline.json';
import type {PianoTimeline} from './animations/score/PianoScoreScene';
const timeline = timelineData as PianoTimeline;
export const Root: React.FC = () => <Composition
  id="PianoRemotion-Demo" component={PianoScoreScene}
  durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={1280} height={720}
  defaultProps={{timeline,scoreSrc:'score/demo/score.svg',title:'Piano Remotion',label:'TWO HANDS / GLOWING NOTES',subtitle:'Light between the notes.',overlay:{enabled:false}}}
  calculateMetadata={({props})=>({durationInFrames:props.timeline.durationInFrames,fps:props.timeline.fps})}
/>;
registerRoot(Root);
