/* FormSubmit: HTML form POST без серверного коду та Google Apps Script. */
(function(){
 'use strict';
 function el(id){return document.getElementById(id);}
 var form=el('submissionPanel');
 var button=el('submitToTeacher');
 var notice=el('submissionStatus');
 function status(message,kind){
  notice.textContent=message;
  notice.className='submission-state'+(kind?' '+kind:'');
 }
 form.addEventListener('submit',function(event){
  var name=String(el('studentName').value||'').trim();
  var group=String(el('className').value||'').trim();
  if(name.length<2||!group){
   event.preventDefault();
   status('Укажіть ім’я, прізвище та клас / групу.','error');
   return;
  }
  if(!el('shareAnswers').checked){
   event.preventDefault();
   status('Підтвердьте, що ознайомилися з умовами передавання роботи.','error');
   return;
  }
  if(!window.PRACTICUM_GET_SUBMISSION_SNAPSHOT){
   event.preventDefault();
   status('Не вдалося підготувати відповіді. Оновіть сторінку або збережіть роботу TXT.','error');
   return;
  }
  var snapshot=window.PRACTICUM_GET_SUBMISSION_SNAPSHOT();
  if(!snapshot.hasWrittenAnswer){
   event.preventDefault();
   status('Спочатку запишіть хоча б одну письмову відповідь.','error');
   return;
  }
  if(snapshot.answersText.length>46000){
   event.preventDefault();
   status('Робота завелика для відправлення. Скоротіть відповіді або завантажте файл TXT.','error');
   return;
  }
  if(!navigator.onLine){
   event.preventDefault();
   status('Немає інтернету. Відповіді збережено в браузері — повторіть спробу пізніше.','error');
   return;
  }
  el('submittedAnswers').value=snapshot.answersText;
  el('submittedQuizScore').value=snapshot.quizScore;
  el('submittedProgress').value=String(snapshot.progress)+'%';
  el('submittedAt').value=new Date().toLocaleString('uk-UA');
  el('mailSubject').value='Практикум Русі — '+group.replace(/[\r\n]/g,' ').slice(0,32)+' — '+name.replace(/[\r\n]/g,' ').slice(0,64);
  // Нативне надсилання форми відкриває сторінку FormSubmit в іншій вкладці.
  // Не показуємо "доставлено": після першої відправки потрібна активація пошти.
  status('Форму відправляємо через FormSubmit у новій вкладці. Переконайтеся, що вчитель підтвердив адресу пошти та отримав роботу.','notice');
 });
})();
