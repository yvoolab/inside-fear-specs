#!/usr/bin/env python3
# minimal MCP streamable-http client: mcp.py list | call <tool> '<json-args>'
import json,sys,urllib.request,os,re
cfg=json.load(open(os.path.expanduser('.mcp.json')))['mcpServers']['lens-studio']
URL=cfg['url']; AUTH=cfg['headers']['Authorization']
SF=os.path.join(os.path.dirname(os.path.abspath(__file__)),'.mcp-session')
def rpc(method,params=None,id_=1,sid=None):
    body={"jsonrpc":"2.0","method":method}
    if params is not None: body["params"]=params
    if id_ is not None: body["id"]=id_
    h={"Content-Type":"application/json","Accept":"application/json, text/event-stream","Authorization":AUTH}
    if sid: h["Mcp-Session-Id"]=sid
    req=urllib.request.Request(URL,json.dumps(body).encode(),h)
    try: r=urllib.request.urlopen(req,timeout=120)
    except urllib.error.HTTPError as e: return None,e.read().decode()
    nsid=r.headers.get("Mcp-Session-Id"); raw=r.read().decode()
    if 'text/event-stream' in r.headers.get('Content-Type',''):
        data=[l[5:].strip() for l in raw.splitlines() if l.startswith('data:')]
        raw=data[-1] if data else ''
    return nsid,raw
def session():
    if os.path.exists(SF):
        sid=open(SF).read().strip()
        _,raw=rpc("ping",None,0,sid)
        if raw and 'error' not in json.loads(raw or '{}'): return sid
    sid,raw=rpc("initialize",{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"specs-1023c","version":"0"}})
    rpc("notifications/initialized",{},None,sid)
    open(SF,'w').write(sid or '')
    return sid
sid=session()
if sys.argv[1]=='list':
    _,raw=rpc("tools/list",{},2,sid); d=json.loads(raw)
    for t in d['result']['tools']: print(t['name'],'—',t.get('description','')[:110].replace('\n',' '))
elif sys.argv[1]=='desc':
    _,raw=rpc("tools/list",{},2,sid); d=json.loads(raw)
    for t in d['result']['tools']:
        if t['name'] in sys.argv[2:]: print(json.dumps(t,indent=1))
else:
    args=json.loads(sys.argv[3]) if len(sys.argv)>3 else {}
    _,raw=rpc("tools/call",{"name":sys.argv[2],"arguments":args},3,sid)
    d=json.loads(raw)
    if 'error' in d: print("ERR",d['error']); sys.exit(1)
    for c in d['result'].get('content',[]):
        print(c.get('text') if c.get('type')=='text' else f"<{c.get('type')}>")
    if d['result'].get('isError'): sys.exit(1)
