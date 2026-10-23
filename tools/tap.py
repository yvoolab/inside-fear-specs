#!/usr/bin/env python3
# tap.py <name> — find enabled interactable by name, pinch at its worldPosition (bypasses self-collider obstruction quirk)
import sys,json,subprocess,os
S=os.path.dirname(os.path.abspath(__file__))
def call(tool,args): return subprocess.run(["python3",f"{S}/mcp.py","call",tool,json.dumps(args)],capture_output=True,text=True).stdout
name=sys.argv[1]
q='{ m: sceneObjects(filter:{hasComponents:["Interactable"], enabledOnly:true}, limit:40) { matches { summary transform { worldPosition } } } }'
d=json.loads(call("QueryRuntimeSceneTool",{"query":q}))
ms=[m for m in d["data"]["m"]["matches"] if m["summary"]["name"]==name]
if not ms:
    print("NOTFOUND",name,"have:",[m["summary"]["name"] for m in d["data"]["m"]["matches"]]); sys.exit(1)
p=ms[0]["transform"]["worldPosition"]
r=call("PreviewInteractTool",{"action":"Pinch","worldPosition":p})
print("tap",name,p,"OK" if '"commandId"' in r else r[:160])
