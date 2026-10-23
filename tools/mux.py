#!/usr/bin/env python3
# mux.py <rec.mov> <tts_dir> <out.mp4> — overlay Step1..4 narration at step-card times (from marks.tsv) onto silent screen recording
import sys,os,subprocess
rec,tts,out=sys.argv[1:4]; ff=os.path.expanduser('~/bin/ffmpeg')
marks=[l.rstrip('\n').split('\t') for l in open(os.path.splitext(rec)[0]+'.marks.tsv')]
ev=[(float(t.replace(',','.')),n) for t,n in marks]
enter=next(t for t,n in ev if n=='EnterButton'); nexts=[t for t,n in ev if n=='Next']
FADE_ENTER=9.0; FADE_NEXT=1.5   # seen in trial: card 1 appears ~9s after Enter, later cards ~1.5s after Next
starts=[t+FADE_NEXT for t in nexts]; assert len(starts)==4, nexts
ins=['-i',rec]; fl=[]
for i,t in enumerate(starts,1):
    ins+=['-i',f'{tts}/Step{i}.wav']; fl.append(f'[{i}]adelay={int(t*1000)}|{int(t*1000)}[a{i}]')
fl.append(''.join(f'[a{i}]' for i in range(1,5))+'amix=inputs=4:normalize=0[mix]')
cmd=[ff,'-hide_banner','-loglevel','error','-y',*ins,'-filter_complex',';'.join(fl),'-map','0:v','-map','[mix]','-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-t',str(round(ev[-1][0]+9,1)),out]
subprocess.run(cmd,check=True); print('narration at',[round(s,1) for s in starts],'->',out)
