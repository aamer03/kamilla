const fs=require('fs'),path=require('path');
let count=0;
for(const file of fs.readdirSync('dist').filter(f=>f.endsWith('.html'))){
 const html=fs.readFileSync('dist/'+file,'utf8');
 for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  const url=match[1];
  if(!/^(https?:|mailto:|tel:|#)/.test(url)&&!fs.existsSync(path.join('dist',url.split('#')[0])))throw Error(file+': '+url);
 }
 count++;
}
console.log(count+' pages checked; local links and assets exist.');
