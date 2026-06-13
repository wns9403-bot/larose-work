var TZ = 'Asia/Seoul';
var HQ_SPREADSHEET_ID = '1K7tmm3w1_nqWimoUaz9l_rffmH1-qGlWA7iL9y6NbKs';

var STORES = [
  {
    name: '롯데백화점 소공 본점',
    sourceFolderId: '13YP3BMRCKLnhbUJJhCw0BEWRXAg8VODZ',
    hqSheetGid: 1610503667,
    fileType: 'daily'
  },
  {
    name: '롯데백화점 잠실점',
    sourceFolderId: '1sdzDQWC3hX3dwXi1g4pAdekKil9trlfu',
    hqSheetGid: 1610503667,
    fileType: 'monthly'
  }
];

function runImmediateTest() {
  syncByFileDate('26-05-27');
}

function syncToday() {
  var fileDate = Utilities.formatDate(new Date(), TZ, 'yy-MM-dd');
  STORES.forEach(function(store) {
    try {
      syncByFileDateForStore(fileDate, store);
      Logger.log('반영 완료: ' + store.name + ' / ' + fileDate);
    } catch (e) {
      Logger.log('반영 실패: ' + store.name + ' / ' + fileDate + ' / ' + e.message);
    }
  });
}

function syncByFileDate(fileDate) {
  STORES.forEach(function(store) {
    try {
      syncByFileDateForStore(fileDate, store);
      Logger.log('반영 완료: ' + store.name + ' / ' + fileDate);
    } catch (e) {
      Logger.log('반영 실패: ' + store.name + ' / ' + fileDate + ' / ' + e.message);
    }
  });
}

function syncByFileDateForStore(fileDate, store) {
  var sourceSheet;
  if (store.fileType === 'monthly') {
    sourceSheet = getMonthlySourceSheet(fileDate, store.sourceFolderId);
  } else {
    var file = findSourceFile(fileDate, store.sourceFolderId);
    if (!file) throw new Error('원본 파일을 찾지 못했습니다: ' + fileDate);
    sourceSheet = SpreadsheetApp.openById(file.id).getSheets()[0];
  }
  var sourceValues = sourceSheet.getDataRange().getDisplayValues();
  var data = buildReportData(sourceValues);
  var hq = SpreadsheetApp.openById(HQ_SPREADSHEET_ID);
  var hqSheet = getSheetByGid(hq, store.hqSheetGid);
  writeHorizontalHq(hqSheet, fileDate, data, store.name);
}

function getMonthlySourceSheet(fileDate, sourceFolderId) {
  var parts = fileDate.split('-');
  var month = Number(parts[1]);
  var day = Number(parts[2]);
  var fileName = month + '월 데일리리포트';
  var tabName = month + '/' + day;
  var file = findSourceFileByName(fileName, sourceFolderId);
  if (!file) throw new Error('월간 파일을 찾지 못했습니다: ' + fileName);
  var ss = SpreadsheetApp.openById(file.id);
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) throw new Error('탭을 찾지 못했습니다: ' + tabName);
  return sheet;
}

function findSourceFile(fileName, sourceFolderId) {
  return findSourceFileByName(fileName, sourceFolderId);
}

function findSourceFileByName(fileName, sourceFolderId) {
  var q = "'" + sourceFolderId + "' in parents"
    + " and name = '" + fileName + "'"
    + " and mimeType = 'application/vnd.google-apps.spreadsheet'"
    + " and trashed = false";
  var res = Drive.Files.list({
    q: q,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    fields: 'files(id,name)',
    pageSize: 1
  });
  return res.files && res.files.length ? res.files[0] : null;
}

function buildReportData(values) {
  return {
    kpi: getRightValue(values, ['ERP 매출', 'EDI 매출']),
    sales: getRightValue(values, ['누계 매출']),
    rate: getRightValue(values, ['달성률']),
    staff: getStaffNames(values),
    top3: getTop3(values),
    inflow: getRightValue(values, ['유입 고객 수']),
    purchase: getRightValue(values, ['구매 고객 수']),
    conversion: getRightValue(values, ['구매 전환율']),
    issueFirstTeam: getIssueText(values)
  };
}

function writeHorizontalHq(sheet, fileDate, data, storeName) {
  var values = sheet.getDataRange().getDisplayValues();
  var storeRow = findStoreRow(values, storeName);
  if (storeRow < 0) throw new Error('HQ 시트에서 매장명을 찾지 못했습니다: ' + storeName);
  var dateCol = findDateColumn(values, fileDate);
  var rowMap = findItemRows(values, storeRow);
  setByRowName(sheet, rowMap, dateCol, ['KPI'], data.kpi);
  setByRowName(sheet, rowMap, dateCol, ['매출총합', '매출 총합', '총매출', '매출'], data.sales);
  setByRowName(sheet, rowMap, dateCol, ['달성률'], data.rate);
  setByRowName(sheet, rowMap, dateCol, ['근무자명', '근무자', '직원명'], data.staff);
  setByRowName(sheet, rowMap, dateCol, ['판매 TOP 3', '판매 TOP3', 'TOP 3', 'TOP3'], data.top3);
  setByRowName(sheet, rowMap, dateCol, ['유입'], data.inflow);
  setByRowName(sheet, rowMap, dateCol, ['구매'], data.purchase);
  setByRowName(sheet, rowMap, dateCol, ['전환'], data.conversion);
  setByRowName(sheet, rowMap, dateCol, ['이슈사항(퍼스트팀)', '이슈사항'], data.issueFirstTeam);
  var actionRow = findRowByNames(rowMap, ['조치결과(퍼스트팀)', '조치결과']);
  if (actionRow >= 0) {
    var cell = sheet.getRange(actionRow + 1, dateCol + 1);
    if (!String(cell.getDisplayValue() || '').trim()) {
      cell.setValue('해당 없음');
    }
  }
}

function findStoreRow(values, storeName) {
  for (var r = 0; r < values.length; r++) {
    for (var c = 0; c < Math.min(values[r].length, 5); c++) {
      if (norm(values[r][c]) === norm(storeName)) return r;
    }
  }
  return -1;
}

function findDateColumn(values, fileDate) {
  var parts = fileDate.split('-');
  var targetMonth = Number(parts[1]);
  var targetDay = Number(parts[2]);
  var dateHeaderRow = 3;
  for (var c = 0; c < values[dateHeaderRow].length; c++) {
    var parsed = parseMonthDay(values[dateHeaderRow][c]);
    if (parsed && parsed.month === targetMonth && parsed.day === targetDay) {
      return c;
    }
  }
  throw new Error('HQ 시트 4행에서 날짜 열을 찾지 못했습니다: ' + fileDate);
}

function parseMonthDay(value) {
  var text = String(value || '').trim();
  var m1 = text.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (m1) return { month: Number(m1[1]), day: Number(m1[2]) };
  var m2 = text.match(/^(\d{1,2})\s*\/\s*(\d{1,2})$/);
  if (m2) return { month: Number(m2[1]), day: Number(m2[2]) };
  var d = new Date(text);
  if (!isNaN(d.getTime())) return { month: d.getMonth() + 1, day: d.getDate() };
  return null;
}

function findItemRows(values, storeRow) {
  var map = {};
  var endRow = Math.min(values.length, storeRow + 13);
  for (var r = storeRow + 1; r < endRow; r++) {
    var label = values[r][2];
    if (String(label || '').trim()) {
      var key = norm(label);
      if (map[key] === undefined) {
        map[key] = r;
      }
    }
  }
  return map;
}

function setByRowName(sheet, rowMap, dateCol, names, value) {
  if (value === '' || value === null || value === undefined) return;
  var row = findRowByNames(rowMap, names);
  if (row >= 0) {
    sheet.getRange(row + 1, dateCol + 1).setValue(value);
  }
}

function findRowByNames(rowMap, names) {
  for (var i = 0; i < names.length; i++) {
    var key = norm(names[i]);
    if (rowMap[key] !== undefined) return rowMap[key];
  }
  return -1;
}

function getRightValue(values, labels) {
  for (var r = 0; r < values.length; r++) {
    for (var c = 0; c < values[r].length; c++) {
      for (var i = 0; i < labels.length; i++) {
        if (norm(values[r][c]) === norm('-' + labels[i]) || norm(values[r][c]) === norm(labels[i])) {
          return cell(values, r, c + 1);
        }
      }
    }
  }
  return '';
}

function getStaffNames(values) {
  for (var r = 0; r < values.length; r++) {
    if (norm(values[r][0]) === norm('-근무자')) {
      var names = [];
      for (var c = 3; c < values[r].length; c++) {
        var name = cell(values, r, c);
        if (name) names.push(name);
      }
      return names.join(', ');
    }
  }
  return '';
}

function getTop3(values) {
  var lines = [];
  for (var r = 0; r < values.length; r++) {
    var label = norm(values[r][0]);
    if (label === norm('TOP 1') || label === norm('TOP1')) {
      lines.push('1. ' + cell(values, r, 1) + ' ' + cell(values, r, 2) + '개');
    }
    if (label === norm('TOP 2') || label === norm('TOP2')) {
      lines.push('2. ' + cell(values, r, 1) + ' ' + cell(values, r, 2) + '개');
    }
    if (label === norm('TOP 3') || label === norm('TOP3')) {
      lines.push('3. ' + cell(values, r, 1) + ' ' + cell(values, r, 2) + '개');
    }
  }
  return lines.join('\n');
}

function getIssueText(values) {
  var startRow = -1;
  for (var r = 0; r < values.length; r++) {
    if (norm(values[r][0]).indexOf(norm('특이사항')) !== -1) {
      startRow = r + 1;
      break;
    }
  }
  if (startRow < 0) return '';
  var lines = [];
  for (var i = startRow; i < values.length; i++) {
    var text = cell(values, i, 1);
    if (text) lines.push(text);
  }
  return lines.join('\n');
}

function cell(values, r, c) {
  if (!values[r]) return '';
  if (values[r][c] === undefined) return '';
  return String(values[r][c]).trim();
}

function norm(value) {
  return String(value || '')
    .replace(/\s+/g, '')
    .replace(/[：:]/g, '')
    .trim()
    .toLowerCase();
}

function getSheetByGid(ss, gid) {
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === Number(gid)) {
      return sheets[i];
    }
  }
  throw new Error('대상 GID 시트를 찾지 못했습니다.');
}

function createDailyTrigger() {
  deleteDailyTrigger();
  ScriptApp.newTrigger('syncToday')
    .timeBased()
    .everyDays(1)
    .atHour(22)
    .nearMinute(10)
    .inTimezone(TZ)
    .create();
}

function deleteDailyTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'syncToday') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function runMay18To31() {
  var dates = [
    '26-05-18', '26-05-19', '26-05-20', '26-05-21',
    '26-05-22', '26-05-23', '26-05-24', '26-05-25',
    '26-05-26', '26-05-27', '26-05-28', '26-05-29',
    '26-05-30', '26-05-31'
  ];
  dates.forEach(function(fileDate) {
    syncByFileDate(fileDate);
  });
}
