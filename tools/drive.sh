#!/bin/zsh
# drive.sh <out.mov> <seconds> — record preview region + drive Inside Fear flow; writes <out>.marks.tsv (sec<TAB>event)
S=${0:a:h}; M=(python3 $S/mcp.py call); OUT=$1; SECS=${2:-130}; MK=${OUT%.mov}.marks.tsv; : > $MK
T0=0; mark(){ printf "%.1f\t%s\n" $(( $(date +%s.%N) - T0 )) "$1" >> $MK; }
pinch(){ python3 $S/tap.py "$1" && mark "$1"; }
$M PreviewPanelTool '{"action":"refresh","index":0,"waitForReady":true}' >/dev/null
$M MovePreviewCamera '{"action":"reset"}' >/dev/null
osascript -e 'tell application "Lens Studio" to activate'; sleep 0.5
screencapture -x -V $SECS -R 1149,214,768,842 "$OUT" & RP=$!; T0=$(date +%s.%N)
sleep 4
pinch StartButton;  sleep 8          # amygdala lights, blame voice
pinch EnterButton;  sleep 12         # entering fade → inside (step 0, no card)
pinch Next;         sleep 9          # step 1 Stimulus
pinch Next;         sleep 9          # step 2 Neurons fire
pinch Next;         sleep 4          # step 3 Alarm (behind-right, cue arrow)
$M MovePreviewCamera '{"action":"rotate","yaw":150}' >/dev/null && mark rotate; sleep 6
$M MovePreviewCamera '{"action":"reset"}' >/dev/null && mark reset; sleep 3
pinch Next;         sleep 10         # step 4 Fear fades
pinch "退 / Exit";  sleep 8
wait $RP; cat $MK; ls -la "$OUT"
