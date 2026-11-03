const fs=require('fs');
const entries=require('./translations.cjs');
const names={en:'English',ru:'Русский',uz:'O‘zbek'};
const titleWords={ru:{'About Kamilla':'О Камилле','Careers & Worker Inquiries':'Работа и обращения соискателей','Contact & Appointments':'Контакты и встречи','Advocacy & Support in NYC':'Защита интересов и поддержка в Нью-Йорке','Resources':'Полезная информация','Services':'Услуги'},uz:{'About Kamilla':'Kamilla haqida','Careers & Worker Inquiries':'Ish va murojaatlar','Contact & Appointments':'Bog‘lanish va uchrashuvlar','Advocacy & Support in NYC':'Nyu-Yorkda manfaatlarni himoya qilish va ko‘mak','Resources':'Foydali ma’lumotlar','Services':'Xizmatlar'}};
const descriptions={ru:'Свяжитесь с Камиллой Ахмедовой в Нью-Йорке по вопросам OPWDD, NHTD, TBI и работы. Английский, русский и узбекский языки.',uz:'Nyu-York shahrida OPWDD, NHTD, TBI va ish masalalari bo‘yicha Kamilla Akhmedova bilan bog‘laning. Ingliz, rus va o‘zbek tillari.'};
const email={ru:{work:'Вопрос о работе',appointment:'Запрос на встречу',body:'Здравствуйте, Камилла!\n\nЯ хочу договориться о встрече.\nУдобный день или время:\nЯзык общения:\nТема:\nНомер для обратного звонка:'},uz:{work:'Ish imkoniyatlari haqida',appointment:'Uchrashuv so‘rovi',body:'Salom, Kamilla!\n\nUchrashuv so‘ramoqchiman.\nQulay kun yoki vaqt:\nMuloqot tili:\nMavzu:\nQayta qo‘ng‘iroq qilish uchun raqam:'}};
const files=fs.readdirSync('dist').filter(f=>f.endsWith('.html'));
for(const file of files){
 const original=fs.readFileSync('dist/'+file,'utf8');
 for(const lang of ['en','ru','uz']){
  const map=new Map(entries.map(row=>[row[0],row[lang==='ru'?1:2]]));
  let html=original;
  if(lang!=='en'){
   html=html.replace('lang="en"',`lang="${lang}"`);
   html=html.replace(/>([^<>]+)</g,(full,text)=>{const s=text.trim();let out=map.get(s);if(s.startsWith('© '))out=s.replace('Kamilla Akhmedova',lang==='ru'?'Камилла Ахмедова':'Kamilla Akhmedova');return out===undefined?full:'>'+text.replace(s,out)+'<'});
   html=html.replace(/<title>(.*?) \| Kamilla Akhmedova<\/title>/,(_,title)=>`<title>${titleWords[lang][title]||title} | ${lang==='ru'?'Камилла Ахмедова':'Kamilla Akhmedova'}</title>`);
   html=html.replace(/(<meta name="description" content=")[^"]*/,'$1'+descriptions[lang]);
   html=html.replace(/(alt|aria-label)="([^"]*)"/g,(_,attr,value)=>`${attr}="${map.get(value)||value}"`);
   html=html.replace(/(href|src)="(style\.css|main\.js|assets\/[^"#]+)"/g,'$1="../$2"');
   html=html.replace(/mailto:kamillaturob@gmail.com\?subject=([^"&]+)(?:&body=([^"#]+))?/g,(_,subject,body)=>'mailto:kamillaturob@gmail.com?subject='+encodeURIComponent(body?email[lang].appointment:email[lang].work)+(body?'&amp;body='+encodeURIComponent(email[lang].body):''));
   // A complete sentence avoids mixing grammatical forms across language spans.
   html=html.replace(/<div class="language-band">[\s\S]*?<\/div>/,`<div class="language-band"><span>${lang==='ru'?'Камилла говорит на английском, русском и узбекском языках.':'Kamilla ingliz, rus va o‘zbek tillarida so‘zlashadi.'}</span></div>`);
  }
  html=html.replace(/<br>/g,' ');
  const languageLabel={en:'Website language',ru:'Язык сайта',uz:'Sayt tili'}[lang];
  const links=Object.entries(names).map(([code,label])=>{const href=lang==='en'?(code==='en'?file:code+'/'+file):(code==='en'?'../'+file:code===lang?file:'../'+code+'/'+file);return `<a href="${href}" lang="${code}" hreflang="${code}"${code===lang?' aria-current="page"':''}>${label}</a>`}).join('');
  html=html.replace('</header>',`<nav class="language-switch" aria-label="${languageLabel}">${links}</nav></header>`);
  html=html.replace('</head>',['en','ru','uz'].map(code=>`<link rel="alternate" hreflang="${code}" href="/${code==='en'?'':code+'/'}${file}">`).join('')+'</head>');
  const dir=lang==='en'?'dist':'dist/'+lang;fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/'+file,html);
 }
}
