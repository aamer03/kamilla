const fs=require('fs'),path=require('path');
let count=0;
function pages(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?pages(path.join(directory,entry.name)):entry.name.endsWith('.html')?[path.relative('dist',path.join(directory,entry.name))]:[])}
for(const file of pages('dist')){
 const html=fs.readFileSync('dist/'+file,'utf8');
 for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  const url=match[1];
  const target=url.startsWith('/')?path.join('dist',url.slice(1).split('#')[0]):path.join('dist',path.dirname(file),url.split('#')[0]);
  if(!/^(https?:|mailto:|tel:|#)/.test(url)&&!fs.existsSync(target))throw Error(file+': '+url);
 }
 count++;
}
const translations=require('./translations.cjs');
if(translations.some(row=>row.length!==3||row.some(value=>!value)))throw Error('Incomplete translation entry');
for(const language of ['ru','uz'])for(const file of fs.readdirSync('dist').filter(f=>f.endsWith('.html'))){
 const html=fs.readFileSync(path.join('dist',language,file),'utf8');
 if(!html.includes('lang="'+language+'"'))throw Error('Missing page language');
 if((html.match(/<h1[ >]/g)||[]).length!==1)throw Error('Expected one main heading');
 if(!html.includes('class="language-switch"'))throw Error('Missing language switcher');
}
console.log(count+' pages checked; local links and assets exist.');
