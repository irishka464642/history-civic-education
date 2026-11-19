/* Практикум "Реформи Русі-України". Без сторонніх бібліотек, серверів і аналітики. */
(function(){
'use strict';
var STORAGE_KEY='rus-reforms-practicum-v1';
var data={};
try{data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{};}catch(e){data={};}
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}catch(e){} updateProgress();}
function el(id){return document.getElementById(id);}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function has(key){return String(data[key]||'').trim().length>0;}
function scrollTop(){var top=document.querySelector('.site-top').offsetHeight+document.querySelector('.hero').offsetHeight-4;window.scrollTo({top:top,behavior:'smooth'});}
function showView(id,doScroll){
 document.querySelectorAll('.view').forEach(function(s){s.classList.toggle('active',s.id===id);});
 document.querySelectorAll('.tab').forEach(function(b){var on=b.getAttribute('data-view')===id;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false');});
 if(doScroll!==false){scrollTop();}
 if(id==='sources'){renderSource();}
 if(id==='finish'){renderQuiz();}
}
document.querySelectorAll('.tab').forEach(function(b){b.addEventListener('click',function(){showView(b.getAttribute('data-view'));});});
document.querySelectorAll('[data-next]').forEach(function(b){b.addEventListener('click',function(){showView(b.getAttribute('data-next'));});});

var sources=[
 {id:'igor',name:'Смерть Ігоря і данина',actor:'Ольга · 945 р.',kind:'Літопис',date:'Початок XII ст.; опис подій 945 р.',work:'«Повість минулих літ»',pdf:'Підручник, с. 306 PDF',excerpt:'«Якщо внадиться вовк до овець, то виносить по одній все стадо, якщо не уб’ють його. Так і сей...»',context:'Літопис передає слова деревлян під час повторного збирання данини Ігорем. Це оцінка конфлікту з погляду літописної оповіді, написаної значно пізніше.',warning:'Цей уривок доводить наявність мотиву конфлікту в літописі, але сам по собі не описує текст Ольжиних «уроків» і «погостів». Їхній зміст реконструюємо за іншими свідченнями.'},
 {id:'sons',name:'Княжі сини в містах',actor:'Володимир · кінець X ст.',kind:'Літопис',date:'Початок XII ст.; розповідь про кінець X ст.',work:'«Повість минулих літ»',pdf:'Підручник, с. 308 PDF',excerpt:'«І посадив він Вишеслава в Новгороді, Ізяслава в Полоцьку, Святополка в Турові, а Ярослава в Ростові...»',context:'Повідомлення про розміщення представників князівської родини в регіональних центрах. Дає підстави обговорити політичний контроль Києва.',warning:'Список княжих призначень не показує, наскільки ефективно кожен намісник управляв регіоном або як це сприймало місцеве населення.'},
 {id:'faith',name:'Чому обрали християнство',actor:'Володимир · 988 р.',kind:'Літописна оповідь',date:'Початок XII ст.; розповідь про 988 р.',work:'«Повість минулих літ»',pdf:'Підручник, с. 308 PDF',excerpt:'«Якби лихий був закон грецький, то не прийняла б хрещення баба твоя Ольга, що була мудрішою за всіх людей».',context:'Літопис вкладає у вуста бояр оцінку хрещення Ольги як аргумент на користь нової віри. Текст формує позитивний образ християнізації.',warning:'Це не протокол історичної наради й не доказ єдиної причини хрещення. Врахуйте церковний світогляд пізнішого літописця.'},
 {id:'pravda',name:'Помста або штраф',actor:'Ярослав · XI ст.',kind:'Правова пам’ятка',date:'XI ст.; редакції доповнювалися пізніше',work:'«Руська правда»',pdf:'Підручник, с. 310–311 PDF',excerpt:'«Якщо вб’є людина людину, то мстити брату за брата, або батькові, або синові... Якщо ж ніхто не буде мстити, то покласти за голову 40 гривень...»',context:'Правило передбачає обмежене коло кровної помсти та альтернативу — грошову «віру». Пізніші редакції права поступово обмежували й скасовували помсту.',warning:'Це норма, а не статистика реальних судових практик. Правовий захист у середньовічній Русі залежав від становища особи; сучасної рівності перед законом тут не було.'},
 {id:'ethics',name:'Обов’язок перед слабшими',actor:'Мономах · початок XII ст.',kind:'Повчальний текст',date:'Початок XII ст.; збережено в літописній традиції',work:'Володимир Мономах, «Повчання дітям»',pdf:'Підручник, с. 328 PDF',excerpt:'«Усього ж паче — вбогих не забувайте, але, наскільки можете, за силами годуйте і подавайте сироті, і за вдову заступайтеся самі, а не давайте сильним губити людину...»',context:'Мономах звертається до нащадків із моральними настановами. Важливо зіставити проголошений ідеал з реальною політикою «Уставу» 1113 р.',warning:'Моральний заклик не дорівнює закону. Текст не доводить, що всі князі виконували настанови або що станове суспільство стало рівноправним.'}
];
var sourceFields=[
 {k:'fact',q:'Що саме з тексту можна встановити? Сформулюйте 1–2 твердження з опорою на слова джерела.'},
 {k:'critique',q:'Хто створив текст, коли, з якою можливою метою? Яку позицію або упередження помічаєте?'},
 {k:'limit',q:'Чого джерело не доводить? Який інший тип джерела ви залучили б для перевірки?'}
];
var sourceIndex=0;
function renderSourceMenu(){
 el('sourceMenu').innerHTML=sources.map(function(s,i){return '<button type="button" class="source-choice'+(i===sourceIndex?' selected':'')+'" data-source="'+i+'"><small>'+esc(s.kind)+' · '+esc(s.actor)+'</small><strong>'+esc(s.name)+'</strong></button>';}).join('');
 el('sourceMenu').querySelectorAll('[data-source]').forEach(function(b){b.addEventListener('click',function(){sourceIndex=Number(b.getAttribute('data-source'));renderSourceMenu();renderSource();});});
}
function renderSource(){
 var s=sources[sourceIndex];
 var mark=sources.map(function(x,i){return i===sourceIndex?'<strong>'+String(i+1)+'</strong>':String(i+1);}).join(' / ');
 var fields=sourceFields.map(function(f){var key='src-'+s.id+'-'+f.k;return '<label>'+esc(f.q)+'<textarea data-save="'+key+'" rows="3" placeholder="Запишіть власну відповідь">'+esc(data[key]||'')+'</textarea></label>';}).join('');
 el('sourceCard').innerHTML='<span class="mini-label">ДЖЕРЕЛО '+mark+'</span><h3>'+esc(s.name)+'</h3><p><span class="pill">'+esc(s.kind)+'</span> · '+esc(s.date)+'</p><blockquote>'+esc(s.excerpt)+'</blockquote><p class="citation">'+esc(s.work)+' · '+esc(s.pdf)+'</p><div class="critical"><b>Контекст:</b> '+esc(s.context)+'<div class="rule"></div><b>Обережно:</b> '+esc(s.warning)+'</div><div class="question-set">'+fields+'</div><div class="actions"><button type="button" class="btn secondary" id="prevSource" '+(sourceIndex===0?'disabled':'')+'>← Попереднє</button><button type="button" class="btn primary" id="nextSource" '+(sourceIndex===sources.length-1?'disabled':'')+'>Наступне джерело →</button></div>';
 el('prevSource').addEventListener('click',function(){if(sourceIndex>0){sourceIndex--;renderSourceMenu();renderSource();}});
 el('nextSource').addEventListener('click',function(){if(sourceIndex<sources.length-1){sourceIndex++;renderSourceMenu();renderSource();}});
}
renderSourceMenu();renderSource();

var cases=[
 {id:'tribute',date:'945 р. · землі деревлян',title:'Після загибелі князя Ігоря',intro:'Повторне полюддя викликало спротив. Ви радите правительці, як відновити надходження данини й знизити ризик нових конфліктів.',choices:[
  {title:'Збирати ще більше данини за допомогою війська',reply:'Швидкий зиск можливий, але ризик нових повстань зростає. Примус без передбачуваних правил не розв’язує системну проблему.'},
  {title:'Установити норми та постійні місця збирання',reply:'Історично близько до реформ Ольги: «уроки» і «погости» роблять порядок передбачуванішим для влади й населення. Але не ліквідують підлеглість та нерівність.'},
  {title:'Повністю відмовитися від будь-якої данини',reply:'Може зняти гостру напругу, та постає питання утримання війська й управління. Потрібна альтернативна модель фінансів, якої ситуація не пропонує.'}
 ]},
 {id:'debt',date:'1113 р. · Київ',title:'Місто після заворушень',intro:'Боргові відносини та соціальна напруга загрожують стабільності. Який підхід дає шанс урегулювати конфлікт і зберегти дієвість влади?',choices:[
  {title:'Проігнорувати боргові проблеми й покладатися тільки на силу',reply:'Силове рішення не усуває економічних причин невдоволення. Стабільність, побудована без правил, лишається крихкою.'},
  {title:'Законодавчо обмежити лихварство, зберігши боргові відносини',reply:'Близько до напряму «Уставу» Мономаха 1113 р. — спроба врівноважити інтереси кредиторів і боржників, а не запровадити сучасну соціальну державу.'},
  {title:'Проголосити всіх підданих повністю рівними перед законом',reply:'Це сучасний принцип, але для станових відносин XII ст. така програма була б анахронічною. Потрібно відділяти наші цінності від реалістичних історичних альтернатив.'}
 ]}
];
function renderCases(){
 el('caseGrid').innerHTML=cases.map(function(c){var opts=c.choices.map(function(a,i){var picked=String(data['case-'+c.id])===String(i);return '<button type="button" class="choice'+(picked?' picked':'')+'" data-case="'+esc(c.id)+'" data-choice="'+i+'">'+esc(a.title)+'</button>';}).join('');var selected=Number(data['case-'+c.id]);var got=has('case-'+c.id);return '<article class="panel case-card"><span class="date-tag">'+esc(c.date)+'</span><h3>'+esc(c.title)+'</h3><p>'+esc(c.intro)+'</p><div class="case-options">'+opts+'</div><div class="feedback'+(got?' visible':'')+'" id="feedback-'+esc(c.id)+'">'+(got?esc(c.choices[selected].reply):'')+'</div></article>';}).join('');
 el('caseGrid').querySelectorAll('[data-case]').forEach(function(b){b.addEventListener('click',function(){data['case-'+b.getAttribute('data-case')]=b.getAttribute('data-choice');persist();renderCases();});});
}
renderCases();

var effects=[
 {id:'olga',ruler:'Ольга',title:'Упорядковані податки',claim:'Фіксація данини могла зменшити кількість конфліктів між центром і громадами.',answer:'hypothesis',reply:'Це обережна гіпотеза: кроки до передбачуваності відомі, однак прямих даних про кількість конфліктів «до» і «після» в наведених уривках немає.'},
 {id:'volodymyr',ruler:'Володимир',title:'Культурна інтеграція',claim:'Християнізація сприяла входженню Русі до європейських мереж церковної, книжної та дипломатичної взаємодії.',answer:'supported',reply:'Це обґрунтований історичний зв’язок, який підтверджується комплексом подальших змін; але поширення християнства було поступовим.'},
 {id:'yaroslav',ruler:'Ярослав',title:'Спільне правове поле',claim:'«Руська правда» залишалася важливим спільним правовим орієнтиром навіть за політичної роздробленості.',answer:'supported',reply:'Таку тяглість підтримує підручник (с. 329 PDF): правова і культурна єдність переживала політичні поділи. Це не означає незмінності кожної норми.'},
 {id:'monomakh',ruler:'Мономах',title:'Кінець міжусобиць',claim:'«Устав» Мономаха назавжди усунув міжкнязівські конфлікти й запровадив сучасну правову рівність.',answer:'overreach',reply:'Це перебільшення та анахронізм. «Устав» регулював окремі соціальні відносини, але не скасував станової нерівності й не припинив роздробленості.'}
];
var labels={supported:'Підтверджена тяглість',hypothesis:'Обережна гіпотеза',overreach:'Перебільшення / анахронізм'};
function renderEffects(){
 el('outcomeGrid').innerHTML=effects.map(function(x){var pick=data['effect-'+x.id];var buttons=Object.keys(labels).map(function(k){return '<button type="button" data-effect="'+x.id+'" data-classify="'+k+'" class="'+(pick===k?'selected':'')+'">'+esc(labels[k])+'</button>';}).join('');
 var f=pick?'<div class="correctness visible"><b>'+(pick===x.answer?'Обґрунтовано.':'Перегляньте висновок.')+'</b> '+esc(x.reply)+'</div>':'';
 return '<article class="panel outcome-card"><span class="pill">'+esc(x.ruler)+'</span><h3 style="margin-top:12px">'+esc(x.title)+'</h3><div class="causal">'+esc(x.claim)+'</div><div class="classify">'+buttons+'</div>'+f+'</article>';}).join('');
 el('outcomeGrid').querySelectorAll('[data-effect]').forEach(function(b){b.addEventListener('click',function(){data['effect-'+b.getAttribute('data-effect')]=b.getAttribute('data-classify');persist();renderEffects();});});
}
renderEffects();

var quiz=[
 {q:'Який наслідок реформ Ольги найточніше описує їхній зміст?',a:['Відмова від усіх платежів','Упорядкування норм і місць збирання данини','Прийняття писаної конституції'],ok:1,why:'«Уроки» — визначені норми данини; «погости» — пункти її збирання та управління.'},
 {q:'Яку адміністративну практику запроваджував Володимир Великий?',a:['Передавав владу лише виборним старійшинам','Замінював місцевих володарів синами й посадниками','Усував усі міста як центри управління'],ok:1,why:'Призначення представників княжої родини зменшувало автономію племінних центрів.'},
 {q:'Яке державне значення мало хрещення Русі в 988 р.?',a:['Дало нову основу легітимності та міжнародним зв’язкам','Негайно зрівняло людей у правах','Усупереч джерелам скасувало всі війни'],ok:0,why:'Єдина релігійна система зміцнювала політичну і культурну інтеграцію, але не гарантувала рівності.'},
 {q:'Що передбачає наведений уривок «Руської правди»?',a:['Тільки сучасне позбавлення волі','Можливість кровної помсти або грошової віри','Обов’язкові вибори суддів'],ok:1,why:'У ранньому тексті помста ще допускалася, а штраф був альтернативою; повне скасування пов’язують із наступними редакціями.'},
 {q:'Що є анахронізмом під час аналізу реформ?',a:['Запитувати, хто отримав вигоду','Порівнювати короткі й довгі наслідки','Приписувати Русі XI ст. сучасну конституційну рівність'],ok:2,why:'Сучасні правові категорії слід застосовувати обережно, не стираючи історичний контекст.'},
 {q:'Яка мета «Уставу» Мономаха в контексті 1113 року?',a:['Посилити регулювання лихварства і знизити соціальну напругу','Створити парламентську республіку','Скасувати князівську владу'],ok:0,why:'«Устав» обмежував окремі зловживання у боргових відносинах, не змінюючи середньовічного типу держави.'},
 {q:'Яка подія відбулася до початку київського князювання Мономаха?',a:['Київське повстання 1113 р.','Любецький з’їзд 1097 р.','Правління Мстислава Великого'],ok:1,why:'Любецький з’їзд відбувся 1097 р.; Мономах став київським князем 1113 р.'},
 {q:'Що найкраще робити, коли літопис схвально описує правителя?',a:['Прийняти оцінку як безсумнівний факт','Відкинути всі літописи','З’ясувати час, автора, мету та зіставити з іншими свідченнями'],ok:2,why:'Критика джерел виявляє його цінність і обмеження та дозволяє перевірити інтерпретацію.'}
];
function renderQuiz(){
 var checked=Boolean(data.quizChecked);
 el('quiz').innerHTML=quiz.map(function(x,i){var v=data['q'+i];var opts=x.a.map(function(y,j){return '<label><input type="radio" name="quiz'+i+'" value="'+j+'" '+(String(v)===String(j)?'checked':'')+'><span>'+esc(y)+'</span></label>';}).join('');
 return '<fieldset class="quiz-question" style="border:0;min-width:0;margin:0;padding-left:0;padding-right:0"><legend>'+(i+1)+'. '+esc(x.q)+'</legend><div class="quiz-options">'+opts+'</div><div class="quiz-expl'+(checked?' visible':'')+'">'+esc(x.why)+'</div></fieldset>';}).join('');
 el('quiz').querySelectorAll('input[type=radio]').forEach(function(b){b.addEventListener('change',function(){var num=b.name.replace('quiz','');data['q'+num]=b.value;data.quizChecked=false;persist();el('quizScore').textContent='';el('quiz').querySelectorAll('.quiz-expl').forEach(function(x){x.classList.remove('visible');});});});
 if(checked)displayScore();
}
function displayScore(){var n=quiz.reduce(function(sum,x,i){return sum+(Number(data['q'+i])===x.ok?1:0);},0);
 el('quizScore').textContent=n+' / '+quiz.length+' правильних';
}
el('checkQuiz').addEventListener('click',function(){data.quizChecked=true;persist();renderQuiz();});
el('resetQuiz').addEventListener('click',function(){quiz.forEach(function(x,i){delete data['q'+i];});data.quizChecked=false;persist();el('quizScore').textContent='';renderQuiz();});
renderQuiz();

function updateProgress(){
 var keys=['cmp1','cmp2','cmp3','cmp4','caseArgument','leg1','leg2','leg3','leg4','thesis'];
 sources.forEach(function(s){sourceFields.forEach(function(f){keys.push('src-'+s.id+'-'+f.k);});});
 cases.forEach(function(c){keys.push('case-'+c.id);});
 effects.forEach(function(x){keys.push('effect-'+x.id);});
 quiz.forEach(function(x,i){keys.push('q'+i);});
 var ready=keys.reduce(function(n,key){return n+(has(key)?1:0);},0);
 var pct=Math.round(100*ready/keys.length);
 el('progressFill').style.width=pct+'%';el('progressText').textContent=pct+'%';
}
document.querySelectorAll('[data-save]').forEach(function(field){if(data[field.getAttribute('data-save')]){field.value=data[field.getAttribute('data-save')];}});
document.addEventListener('input',function(e){var key=e.target.getAttribute&&e.target.getAttribute('data-save');if(key){data[key]=e.target.value;persist();}});
document.querySelectorAll('[data-rubric]').forEach(function(box){var key='rubric-'+box.getAttribute('data-rubric');box.checked=Boolean(data[key]);box.addEventListener('change',function(){data[key]=box.checked;persist();});});
updateProgress();

function textExport(){
 var lines=['ІНТЕРАКТИВНИЙ ПРАКТИКУМ: РЕФОРМИ РУСІ-УКРАЇНИ', 'Ім’я: '+(data.studentName||'не зазначено'),'Клас / група: '+(data.className||'не зазначено'),'Дата експорту: '+new Date().toLocaleString('uk-UA'),'','1. ПОРІВНЯННЯ РЕФОРМ'];
 var tasks=['Передбачуваність влади','Віра і закон','Інтереси суспільних груп','Найдовша післядія'];
 tasks.forEach(function(s,i){lines.push(s+': '+(data['cmp'+(i+1)]||'—'));});
 lines.push('','2. АНАЛІЗ ДЖЕРЕЛ');
 sources.forEach(function(s){lines.push('',s.work+' — '+s.name+' ('+s.pdf+')');sourceFields.forEach(function(f){lines.push(f.q+'\n'+(data['src-'+s.id+'-'+f.k]||'—'));});});
 lines.push('','3. ДИЛЕМИ');
 cases.forEach(function(c){var val=data['case-'+c.id];lines.push(c.title+': '+(has('case-'+c.id)?c.choices[Number(val)].title:'—'));});
 lines.push('Позиція: '+(data.caseArgument||'—'),'','4. ДОВГОТРИВАЛІ НАСЛІДКИ');
 effects.forEach(function(e){lines.push(e.title+': '+(labels[data['effect-'+e.id]]||'—'));});
 ['Негайний результат','Середньострокова післядія','Довготривала спадщина','Межа доказовості'].forEach(function(t,i){lines.push(t+': '+(data['leg'+(i+1)]||'—'));});
 lines.push('','5. ПІДСУМОК / ТЕСТ');
 quiz.forEach(function(q,i){var v=data['q'+i];lines.push((i+1)+'. '+q.q+'\nВідповідь: '+(has('q'+i)?q.a[Number(v)]:'—'));});
 if(data.quizChecked){var correct=quiz.reduce(function(a,q,i){return a+(Number(data['q'+i])===q.ok?1:0);},0);lines.push('Тренувальний тест: '+correct+' / '+quiz.length);}
 lines.push('','АРГУМЕНТОВАНИЙ ВИСНОВОК',data.thesis||'—','','САМООЦІНЮВАННЯ');
 ['comparison','sources','legacy','argument'].forEach(function(s){lines.push(s+': '+(data['rubric-'+s]?'виконано':'ще не позначено'));});
 lines.push('','Джерела: І. Щупак та ін., Історія та громадянська освіта, 10 клас (поглиблений рівень), PDF с. 305–311, 327–329; модельна програма, PDF с. 12–14.');
 return lines.join('\n');
}
// Дозволяє зовнішньому модулю відправки отримати лише дані цієї роботи.
window.PRACTICUM_GET_SUBMISSION_SNAPSHOT=function(){
 var checked=Boolean(data.quizChecked);
 var correct=quiz.reduce(function(a,q,i){return a+(Number(data['q'+i])===q.ok?1:0);},0);
 var written=Object.keys(data).filter(function(k){
  return k==='thesis'||/^cmp[1-4]$/.test(k)||/^src-/.test(k)||/^leg[1-4]$/.test(k)||k==='caseArgument';
 }).some(function(k){return has(k);});
 return {
  answersText:textExport(),
  quizScore:checked?correct+' / '+quiz.length:'не перевірено',
  progress:parseInt(el('progressText').textContent,10)||0,
  hasWrittenAnswer:written
 };
};

el('exportAnswers').addEventListener('click',function(){var blob=new Blob([textExport()],{type:'text/plain;charset=utf-8'});var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download='praktikum-reformy-rusi.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);el('saveStatus').textContent='Файл роботи сформовано. Перевірте папку завантажень.';});
el('printWorksheet').addEventListener('click',function(){window.print();});
el('clearAnswers').addEventListener('click',function(){if(window.confirm('Видалити всі відповіді, вибори та самооцінювання з цього браузера?')){try{localStorage.removeItem(STORAGE_KEY);}catch(e){}window.location.reload();}});
})();
