/**
 * Приймання учнівських робіт з практикуму «Реформи Русі-України».
 * Працює як Google Apps Script Web App (Execute as: Me, Who has access: Anyone).
 *
 * 1. Змініть NOTIFY_EMAIL на власну адресу.
 * 2. Виконайте setup() один раз і надайте дозволи Google.
 * 3. Deploy > New deployment > Web app, скопіюйте URL з /exec.
 * 4. Вставте його в submission-config.js на сайті GitHub Pages.
 *
 * Google-таблиця залишається приватною у вашому Google Drive.
 */

const SETTINGS = {
  SHEET_TITLE: 'Реформи Русі-України — відповіді учнів',
  SHEET_TAB: 'Відповіді',
  NOTIFY_EMAIL: 'ВСТАВТЕ_СВОЮ_EMAIL_АДРЕСУ',
  MAX_TEXT_LENGTH: 46000
};

/** Одноразова ініціалізація приватної таблиці. */
function setup() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('SPREADSHEET_ID');
  let book;
  if (id) {
    book = SpreadsheetApp.openById(id);
  } else {
    book = SpreadsheetApp.create(SETTINGS.SHEET_TITLE);
    id = book.getId();
    props.setProperty('SPREADSHEET_ID', id);
  }
  let sheet = book.getSheetByName(SETTINGS.SHEET_TAB);
  if (!sheet) {
    sheet = book.getSheets()[0];
    sheet.setName(SETTINGS.SHEET_TAB);
  }
  if (!sheet.getRange('A1').getValue()) {
    const headers = [
      'Отримано', 'Учень / учениця', 'Клас / група',
      'Тренувальний тест', 'Заповнено, %',
      'Повний текст роботи', 'Ідентифікатор', 'Сповіщення email'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#e9ede7').setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 165);
    sheet.setColumnWidth(2, 200);
    sheet.setColumnWidth(3, 125);
    sheet.setColumnWidth(4, 130);
    sheet.setColumnWidth(5, 110);
    sheet.setColumnWidth(6, 460);
    sheet.setColumnWidth(7, 280);
    sheet.setColumnWidth(8, 150);
  }
  console.log('ПРИВАТНА ТАБЛИЦЯ: ' + book.getUrl());
  console.log('E-mail для сповіщень: ' + SETTINGS.NOTIFY_EMAIL);
  return book.getUrl();
}

/** Обробник вебформи. */
function doPost(e) {
  const response = (value) => ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return response({ok:false, error:'empty_request'});
    }
    if (e.postData.contents.length > 60000) {
      return response({ok:false, error:'too_large'});
    }
    const p = JSON.parse(e.postData.contents);
    // Honeypot: приховане поле для автоматизованих ботів.
    if (p.contactWebsite) {
      return response({ok:true, ignored:true});
    }
    if (p.project !== 'reformy-rusi-v1') {
      return response({ok:false, error:'unknown_project'});
    }
    const name = String(p.studentName || '').trim().slice(0, 120);
    const group = String(p.className || '').trim().slice(0, 60);
    const text = String(p.answersText || '').trim();
    const submissionId = String(p.submissionId || '').trim().slice(0, 100);
    const pct = Number(p.progress);
    if (name.length < 2 || group.length < 1 || text.length < 40 ||
        text.length > SETTINGS.MAX_TEXT_LENGTH || submissionId.length < 12 ||
        !Number.isFinite(pct) || pct < 0 || pct > 100) {
      return response({ok:false, error:'validation_failed'});
    }

    const props = PropertiesService.getScriptProperties();
    const spreadsheetId = props.getProperty('SPREADSHEET_ID');
    if (!spreadsheetId) {
      return response({ok:false, error:'run_setup_first'});
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    let duplicate = false;
    try {
      const cache = CacheService.getScriptCache();
      const key = 'done-' + submissionId.replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80);
      if (cache.get(key)) {
        duplicate = true;
      } else {
        const book = SpreadsheetApp.openById(spreadsheetId);
        const sheet = book.getSheetByName(SETTINGS.SHEET_TAB);
        if (!sheet) throw new Error('No submission sheet; run setup again.');
        const rawScore = String(p.quizScore || 'не перевірено').slice(0, 48);
        sheet.appendRow([
          new Date(),
          safeCell(name),
          safeCell(group),
          safeCell(rawScore),
          Math.round(pct),
          safeCell(text),
          safeCell(submissionId),
          'Очікує'
        ]);
        cache.put(key, '1', 21600);
        SpreadsheetApp.flush();
      }
    } finally {
      lock.releaseLock();
    }
    if (duplicate) {
      return response({ok:true, saved:true, duplicate:true});
    }

    let emailSent = false;
    try {
      if (SETTINGS.NOTIFY_EMAIL.includes('@') && MailApp.getRemainingDailyQuota() > 0) {
        MailApp.sendEmail({
          to: SETTINGS.NOTIFY_EMAIL.trim(),
          subject: 'Практикум Русі — нова робота: ' + name + ' (' + group + ')',
          body: [
            'Надійшла робота з практикуму «Реформи Русі-України».',
            'Учень / учениця: ' + name,
            'Клас / група: ' + group,
            'Тест: ' + (p.quizScore || 'не перевірено'),
            'Заповнено: ' + Math.round(pct) + '%',
            'Отримано: ' + new Date().toLocaleString('uk-UA'),
            '',
            '--- ВІДПОВІДІ ---',
            text
          ].join('\n'),
          name: 'Практикум — історія та громадянська освіта'
        });
        emailSent = true;
      }
    } catch (mailError) {
      console.error('Поштове сповіщення не вдалося: ' + mailError.message);
    }
    try {
      const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(SETTINGS.SHEET_TAB);
      const finder = sheet.getRange(2, 7, Math.max(1, sheet.getLastRow() - 1), 1)
                          .createTextFinder(submissionId).matchEntireCell(true).findNext();
      if (finder) sheet.getRange(finder.getRow(), 8).setValue(emailSent ? 'Надіслано' : 'Не надіслано');
    } catch (statusError) {
      console.error('Не вдалося оновити позначку про лист: ' + statusError.message);
    }
    return response({ok:true, saved:true, emailed:emailSent});
  } catch (error) {
    console.error('Помилка під час приймання роботи: ' + error.message);
    return response({ok:false, error:'server_error'});
  }
}

/** Запобігає виконанню формул із тексту, введеного учнем, у Google Sheets. */
function safeCell(value) {
  const s = String(value == null ? '' : value).replace(/\u0000/g,'');
  return /^[\s]*[=+\-@]/.test(s) ? "'" + s : s;
}
