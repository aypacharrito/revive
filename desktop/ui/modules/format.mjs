export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export const duration=mins=>mins>=60?`${Math.floor(mins/60)}h ${Math.round(mins%60)}m`:`${Math.round(mins||0)}m`;
export const bytes=value=>{if(!Number.isFinite(value)||value<0)return '—';if(value<1024)return `${value} B`;if(value<1048576)return `${(value/1024).toFixed(1)} KB`;if(value<1073741824)return `${(value/1048576).toFixed(1)} MB`;return `${(value/1073741824).toFixed(2)} GB`;};
export const dateLabel=s=>{if(!s)return 'Never played';const d=new Date(s);if(isNaN(+d))return '—';return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric'}).format(d);};
export const idAttr=val=>escapeHTML(val);
