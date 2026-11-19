/**
 * Приймання робіт практикуму «Реформи Русі-України» тільки на електронну пошту.
 *
 * ПІДКЛЮЧЕННЯ (один раз):
 * 1. У приватному проєкті https://script.google.com вставте цей код у Code.gs.
 * 2. Замініть рядок EMAIL_TO на власну адресу (не робіть проєкт публічним у GitHub).
 * 3. Виберіть authorizeMail, натисніть Run та надайте Google дозвіл надсилати листи.
 * 4. Deploy > New deployment > Web app:
 *       Execute as: Me; Who has access: Anyone.
 * 5. URL, що закінчується на /exec, вставте в submission-config.js сайту.
 *
 * Google Таблиці НЕ використовуються.
 */
const EMAIL_TO = 'ВСТАВТЕ_СВОЮ_ПОШТУ';
const PROJECT = 'reformy-rusi-v1';
const MAX_TEXT_LENGTH = 46000;

/** Лише для одноразового дозволу MailApp. Надсилає тестовий лист власнику. */
function authorizeMail() {
  if (!isEmailConfigured_()) throw new Error('Спочатку впишіть свою пошту в EMAIL_TO.');
  MailApp.sendEmail({
    to: EMAIL_TO,
    subject: 'Тест: приймання робіт із практикуму налаштовано',
    body: 'Це тестовий лист із вашого Google Apps Script.\n'
      + 'Після публікації Web app роботи учнів надходитимуть сюди.'
  });
  console.log('Тестовий лист відправлено. Перевірте пошту та папку «Спам».');
}

/** Запит від сайту GitHub Pages. */
function doPost(e) {
  try {
    if (!isEmailConfigured_()) return response_({ok:false,error:'email_not_configured'});
    if (!e || !e.postData || !e.postData.contents ||
        e.postData.contents.length > 60000) {
      return response_({ok:false,error:'empty_or_oversized_request'});
    }

    const p = JSON.parse(e.postData.contents);
    // Захист від частини простих автоматичних ботів.
    if (p.contactWebsite) return response_({ok:true,ignored:true});
    if (p.project !== PROJECT) return response_({ok:false,error:'wrong_project'});

    const name = String(p.studentName || '').trim().slice(0,120);
    const group = String(p.className || '').trim().slice(0,60);
    const answers = String(p.answersText || '').trim();
    const quiz = String(p.quizScore || 'не перевірено').slice(0,50);
    const id = String(p.submissionId || '').trim().slice(0,100);
    const progress = Number(p.progress);

    if (name.length < 2 || !group || answers.length < 40 ||
        answers.length > MAX_TEXT_LENGTH || id.length < 12 ||
        !Number.isFinite(progress) || progress < 0 || progress > 100) {
      return response_({ok:false,error:'invalid_data'});
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      const cache = CacheService.getScriptCache();
      const safeId = id.replace(/[^a-zA-Z0-9_-]/g,'').slice(0,90);
      if (cache.get('sent-'+safeId)) {
        return response_({ok:true,sent:true,duplicate:true});
      }
      if (MailApp.getRemainingDailyQuota() < 1) {
        return response_({ok:false,error:'mail_quota_exceeded'});
      }

      const body = [
        'Практикум: «Реформи Русі-України»',
        'Учень / учениця: '+name,
        'Клас / група: '+group,
        'Тренувальний тест: '+quiz,
        'Заповнено: '+Math.round(progress)+'%',
        'Час: '+new Date().toLocaleString('uk-UA'),
        'ID роботи: '+id,
        '',
        '=== ВІДПОВІДІ УЧНЯ ===',
        answers
      ].join('\n');

      MailApp.sendEmail({
        to: EMAIL_TO,
        subject: 'Практикум Русі — '+cleanSubject_(group)+' — '+cleanSubject_(name),
        body: body,
        name: 'Практикум з історії та громадянської освіти'
      });
      cache.put('sent-'+safeId, '1', 21600);
      return response_({ok:true,sent:true});
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    console.error('Помилка надсилання: '+(err && err.message || err));
    return response_({ok:false,error:'mail_send_failed'});
  }
}

function isEmailConfigured_() {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(EMAIL_TO);
}
function cleanSubject_(text) {
  return String(text).replace(/[\r\n\u0000-\u001f]/g,' ').slice(0,65);
}
function response_(json) {
  return ContentService.createTextOutput(JSON.stringify(json))
    .setMimeType(ContentService.MimeType.JSON);
}
