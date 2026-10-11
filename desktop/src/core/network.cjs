'use strict';
const os=require('node:os');
function networkReadiness(interfaces=os.networkInterfaces()){
 const found=[];
 for(const [name,addresses] of Object.entries(interfaces)){
  for(const entry of addresses||[]){
   if(entry.family!=='IPv4'||entry.internal)continue;
   const lowered=name.toLowerCase();
   const tunnel=/zerotier|hamachi|radmin|tap-windows|vpn|tailscale|wireguard/.test(lowered);
   found.push({name,address:entry.address,isPossibleVirtualAdapter:tunnel});
  }
 }
 return {adapters:found,possibleVirtualAdapters:found.filter(x=>x.isPossibleVirtualAdapter).length,note:'Adapter presence does not prove that players can discover or join a LAN session. Firewalls, routing and L2 broadcast support must be tested separately. Information stays on this PC.'};
}
module.exports={networkReadiness};
