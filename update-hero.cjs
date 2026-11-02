const fs=require('fs');
const replacement='<div class="art hero-illustration"><img src="community-connection.png" alt="Colorful illustration of people connecting in a community garden" width="1024" height="1280" fetchpriority="high"></div>';
const original=fs.readFileSync('build.cjs','utf8');
fs.writeFileSync('build.cjs',original.replace(/<div class="art" role="img"[\s\S]*?<span class="art-foot">ROOTED IN UNDERSTANDING<\/span><\/div>/,replacement));
const html=fs.readFileSync('dist/index.html','utf8');
fs.writeFileSync('dist/index.html',html.replace(/<div class="art" role="img"[\s\S]*?<span class="art-foot">ROOTED IN UNDERSTANDING<\/span><\/div>/,replacement));
fs.appendFileSync('dist/style.css','\n.hero-illustration{border-radius:180px 180px 12px 12px;background:#deedf6;min-height:0;aspect-ratio:4/5}.hero-illustration img{width:100%;height:100%;object-fit:cover;display:block}@media(max-width:700px){.hero-illustration{min-height:0;max-width:450px}}\n');
