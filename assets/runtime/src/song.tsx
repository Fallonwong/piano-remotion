import React from 'react';
import {Composition,getInputProps,registerRoot} from 'remotion';
import {PianoScoreScene,type PianoScoreSceneProps} from './animations/score/PianoScoreScene';
type SongProps=PianoScoreSceneProps & {width?:number;height?:number};
const Root:React.FC=()=>{
  const input=getInputProps<SongProps>();
  if(!input.timeline||!input.scoreSrc)throw new Error('SONG_PROPS_REQUIRED: provide the checked song props; no demo fallback is allowed.');
  return <Composition id="PianoRemotion-Song" component={PianoScoreScene}
    durationInFrames={input.timeline.durationInFrames} fps={input.timeline.fps} width={input.width??1280} height={input.height??720}
    defaultProps={{timeline:input.timeline,scoreSrc:input.scoreSrc,audioSrc:input.audioSrc,title:input.title,subtitle:input.subtitle,label:input.label,credit:input.credit,background:input.background,fontFamily:input.fontFamily,scoreImage:input.scoreImage,camera:input.camera,rightStyle:input.rightStyle,leftStyle:input.leftStyle,vignette:input.vignette,showProgress:input.showProgress,fadeFrames:input.fadeFrames,overlay:input.overlay}}/>;
};
registerRoot(Root);
