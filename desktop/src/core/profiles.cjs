'use strict';
const PROFILE_DATA = {
  blur: {
    id: 'blur', label: 'Blur', mode: 'lan', support: 'COMMUNITY / LAN',
    badge: 'LAN multiplayer supported', players: 'Up to 20 (LAN)',
    verdict: 'The PC version has LAN multiplayer. REVIVE can launch the game and help friends coordinate a supported virtual LAN or community service, but does not yet configure a virtual network automatically.',
    next: ['Install and verify your legitimate PC copy.', 'Choose an existing virtual LAN application or approved community server.', 'Test lobby discovery between two computers.'],
    links: [{label:'Community notes',url:'https://www.nexusmods.com/blur/mods/4'}]
  },
  'sunset overdrive': {
    id: 'sunset', label: 'Sunset Overdrive', mode: 'research', support: 'PC CO-OP UNAVAILABLE',
    badge: 'Requires game-specific restoration work', players: 'Xbox: 2–8 / PC: solo',
    verdict: 'Chaos Squad multiplayer existed on Xbox, but was omitted from the PC release. A launcher or virtual LAN cannot turn it back on. Do not promise PC co-op without a verified port/mod or a legal, functioning game-specific implementation.',
    next: ['Continue research into PC port compatibility and community projects.', 'Do not represent multiplayer as working.', 'Distinguish Xbox cloud streaming from actual PC multiplayer.'],
    links: [{label:'Xbox capabilities',url:'https://www.xbox.com/en-us/games/store/Sunset-Overdrive/BRZHFR5XBLQS'}]
  }
};
function profileFor(title) {
  const key = String(title || '').trim().toLowerCase();
  return PROFILE_DATA[key] || {id:'generic',label:title,mode:'unknown',support:'NOT TESTED',badge:'No verified multiplayer adapter',players:'Unknown',verdict:'REVIVE can launch this local game, but multiplayer support requires separate testing and possibly an approved game-specific solution.',next:['Identify the exact PC game version.','Determine whether the game has LAN, direct IP, dedicated server, or missing multiplayer code.','Test with an authorized copy and a second Windows machine.'],links:[]};
}
module.exports = { profileFor, PROFILE_DATA };
