import React from 'react';
import {Composition,getInputProps,registerRoot} from 'remotion';
import {dimensions} from './animations/score/PianoPresentation';
import {PianoScoreScene,type PianoScoreSceneProps} from './animations/score/PianoScoreScene';
type SongProps=PianoScoreSceneProps & {width?:number;height?:number;presentation?:{cameraPath?:{cameraX:number;cameraY:number}[]}};
const Song:React.FC<SongProps>=(props)=><PianoScoreScene {...props} timeline={{...props.timeline,cameraPath:props.presentation?.cameraPath??props.timeline.cameraPath}}/>;
const Root:React.FC=()=>{
  const input=getInputProps<SongProps>();
  if(!input.timeline||!input.scoreSrc)throw new Error('SONG_PROPS_REQUIRED: provide the checked song props; no demo fallback is allowed.');
  return <Composition id="PianoRemotion-Song" component={Song}
    durationInFrames={input.timeline.durationInFrames} fps={input.timeline.fps} width={input.width??dimensions(input.aspectRatio).width} height={input.height??dimensions(input.aspectRatio).height}
    defaultProps={{...input}}/>;
};
registerRoot(Root);
