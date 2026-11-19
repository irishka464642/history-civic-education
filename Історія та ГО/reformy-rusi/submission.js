/* Student submission UI. Sends only after explicit user action. */
(function(){
 'use strict';
 function el(id){return document.getElementById(id);}
 var endpoint=String(window.PRACTICUM_SUBMISSION_ENDPOINT||'').trim();
 var ready=/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec(?:\?.*)?$/.test(endpoint);
 var busy=false;
 var btn=el('submitToTeacher');
 function status(msg,kind){
  var node=el('submissionStatus');
  node.textContent=msg;
  node.className='submission-state'+(kind?' '+kind:'');
 }
 if(!ready){
  btn.disabled=true;
  status('Онлайн-надсилання ще не увімкнене вчителем. Поки що збережіть роботу через «Зберегти мою роботу» нижче.','notice');
 }else{
  status('Приймання робіт налаштоване. Вкажіть ім’я, клас і підтвердьте передавання відповідей.','success');
 }
 btn.addEventListener('click',async function(){
  if(!ready){status('Надсилання ще не налаштовано вчителем.','notice');return;}
  if(busy)return;
  var name=String(el('studentName').value||'').trim();
  var group=String(el('className').value||'').trim();
  if(name.length<2||group.length<1){
   status('Вкажіть ім’я та прізвище і клас / групу.','error');return;
  }
  if(!el('shareAnswers').checked){
   status('Підтвердьте, що вам відомо про передавання відповідей учителю.','error');return;
  }
  var snapshot=window.PRACTICUM_GET_SUBMISSION_SNAPSHOT();
  if(!snapshot.hasWrittenAnswer){
   status('Спочатку запишіть принаймні одну письмову відповідь.','error');return;
  }
  if(!navigator.onLine){
   status('Немає інтернету. Дані залишилися у браузері. Повторіть спробу пізніше.','error');return;
  }
  var payload={
   project:'reformy-rusi-v1',
   studentName:name,
   className:group,
   answersText:snapshot.answersText,
   quizScore:snapshot.quizScore,
   progress:snapshot.progress,
   contactWebsite:el('contactWebsite').value||'',
   submissionId:'rusi-'+Date.now()+'-'+Math.random().toString(36).slice(2,13)
  };
  if(payload.answersText.length>46000){
   status('Робота завелика для надсилання. Скоротіть відповідь або завантажте текстовий файл.','error');return;
  }
  busy=true;btn.disabled=true;
  status('Відправляємо запит. Залиште сторінку відкритою.','notice');
  try{
   // Apps Script Web App не дає доступної перевірки результату через CORS:
   // no-cors response є opaque. Тому не стверджуємо, що лист успішно доставлено.
   await fetch(endpoint,{
    method:'POST',mode:'no-cors',
    body:new Blob([JSON.stringify(payload)],{type:'text/plain;charset=UTF-8'})
   });
   status('Запит на надсилання виконано. Сайт не може незалежно підтвердити запис у таблиці та доставку листа. Уточніть у вчителя, чи роботу отримано; для резервної копії завантажте TXT нижче.','notice');
  }catch(err){
   status('Не вдалося виконати запит. Відповіді залишилися у браузері: повторіть спробу або збережіть TXT.','error');
  }finally{busy=false;btn.disabled=false;}
 });
})();
