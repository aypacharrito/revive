export const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const PRESENCE_SECONDS = 110;
export function presenceKey(userId) { if(!ID_PATTERN.test(userId))throw Error('Invalid user identifier'); return `revive:presence:v1:${userId.toLowerCase()}`; }
export function cleanIds(input) {
  if (typeof input !== 'string' || input.length > 1800) return [];
  return [...new Set(input.split(',').map(x => x.trim().toLowerCase()).filter(x=>ID_PATTERN.test(x)))].slice(0,30);
}
export function allowedFriends(rows,myId,requested) {
  const set = new Set();
  for(const item of rows||[]) {
    if(item.status && item.status !== 'accepted') continue;
    const other = item.sender_id === myId ? item.recipient_id : item.recipient_id === myId ? item.sender_id : null;
    if(other && ID_PATTERN.test(other))set.add(other.toLowerCase());
  }
  return requested.filter(id=>set.has(id) && id!==myId);
}
