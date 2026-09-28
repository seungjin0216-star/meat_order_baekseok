// ══════════════════════════════════════════════════════════════════
//  🔴 이 파일은 「백석 발주 GAS」 것입니다
//
//     배포 주소     AKfycbw97e3t…
//     구분하는 법   왼쪽 함수 목록에  cartAdd · sendCartDue · cartSend  가 보이면 맞습니다
//     ⚠️ 헷갈리기 쉬운 곳   마감체크리스트 GAS (AKfycbxeauYy…) — 거기엔 saveCash 가 있습니다
//
//  ⚠️ 2026-09-29 — 발주 코드를 마감체크리스트 GAS 에 붙여넣어
//     마감체크리스트가 통째로 멈춘 일이 있었습니다.
//     편집기 안에서는 두 프로젝트 모두 파일 이름이 Code.gs 라 구분이 안 됩니다.
//     ⚠️ 붙여넣기 전에 왼쪽 함수 목록부터 확인하십시오.
// ══════════════════════════════════════════════════════════════════

// ============================================================
//  장수한우곱창 백석점 — Google Apps Script
//  파일명: 백석_코드.gs  |  v2.2
//
//  ⚠️ 이것은 백업본입니다. 실제 동작하는 코드는 Apps Script 편집기 안에 있습니다.
//     script.google.com → 「고기주문_백석」 프로젝트
//     여기를 고쳐도 실제 동작은 바뀌지 않습니다. 편집기에 붙여넣어야 적용됩니다.
//
//  🔑 SOLAPI_API_KEY / SOLAPI_API_SECRET 는 일부러 비워두었습니다.
//     이 파일은 깃허브에 올라갈 수 있으므로 실제 키를 절대 적지 마세요.
//     실제 값은 Apps Script 편집기 안에만 존재합니다.
//
//  [v2.2 변경사항] (2026-08-22)
//    ⚠️ 2026-08-18 사고 — 월요일 장사 마감이 늦어져 화요일 00:35 에 발주를 넣었더니
//       그 자리에서 업체로 문자가 나가버렸다. 화요일 저녁에 나갔어야 했다.
//
//    - 「영업일」 개념 추가. 새벽 8시 이전은 전날 영업분으로 본다.
//      가게가 자정을 넘겨 영업하는데 코드는 자정에 날을 바꿔서 생긴 틈이었다.
//      화면(food.html)도 날짜만 영업일로 보고 시각은 실제 시계를 써서 같은 문제가 있었다.
//    - 식자재 지연 여부를 서버가 직접 판단. 화면이 보내는 값은 참고만 한다.
//      (브라우저에 옛 화면이 캐시돼 있으면 틀린 값이 오기 때문)
//    - 휴무 판정을 셋으로 분리 — 우리 가게 / 고기 업체 / 식자재 업체
//        우리 가게    화요일만. 공휴일에도 영업
//        고기 업체    화요일 + 공휴일 전부 휴무
//        식자재 업체   공휴일에도 일함
//      예전엔 하나로 묶여 있어서 공휴일 전날 발주가 이유 없이 밀렸다.
//    - 예약 시각이 이미 지난 경우(예: 화요일 21시 발주) 즉시 발송으로 전환
//
//  [v2.1 변경사항] (2026-07-17)
//    - 화요일 고정휴무 + 공휴일(정적 리스트)일 때 고기 발주 자동 지연발송을
//      일반화. 예전에는 월요일에만 이 처리가 되어 있어서, 화요일이 아닌
//      다른 휴무일(공휴일 등) 전날 주문은 그냥 평소처럼 나가버렸음.
//    - HOLIDAYS_2026 정적 목록 + isClosedDay() 헬퍼 추가. 매년 12월경
//      다음 해 공휴일을 이 목록에 추가해줘야 함.
//
//  [v2.0 변경사항]
//    - 식자재 발주 기능 통합 (food_order type)
//    - 식자재 발주: Solapi SMS/LMS 발송 (업체별 문자)
//    - 식자재 월·화 발주 → 화요일 20:30 자동 발송
//    - 식자재 발주 기록 → 기존 스프레드시트에 '식자재발주' 시트 추가
//
//  [v1.1 변경사항]
//    - 월요일 발주 시 업체 문자를 화요일 20:00으로 자동 지연 발송
//    - 화요일 발주 알림 자동 skip (백석 휴무)
// ============================================================

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  🔑 키는 코드에 적지 않는다
//
//  스크립트 속성에 저장해두면 이 파일을 통째로 복사·백업해도 키가 새지 않는다.
//  코드를 다시 붙여넣어도 키는 그대로 남는다 (예전처럼 매번 다시 넣을 필요 없음).
//
//  설정 방법 (딱 한 번만):
//    Apps Script 편집기 → 왼쪽 ⚙️ 프로젝트 설정 → 맨 아래 스크립트 속성
//    → 「스크립트 속성 추가」 로 아래 두 개 등록
//        SOLAPI_API_KEY      = 솔라피 API Key
//        SOLAPI_API_SECRET   = 솔라피 API Secret
//    → 등록 후 checkSolapiKeys() 를 실행해서 확인
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const _PROPS = PropertiesService.getScriptProperties();

const CONFIG = {
  SOLAPI_API_KEY    : (_PROPS.getProperty('SOLAPI_API_KEY')    || '').trim(),
  SOLAPI_API_SECRET : (_PROPS.getProperty('SOLAPI_API_SECRET') || '').trim(),

  // 발송이 실패했을 때 알림을 받을 이메일 (솔라피가 막혀도 이건 나감)
  OWNER_EMAIL       : 'seungjin0216@gmail.com',

  SENDER_NUMBER     : '01041216995',
  VENDOR_NUMBER     : '01041216995',
  OWNER_NUMBER      : '01053226995',
  BAESEOK_ADMIN     : '01041216995',

  KAKAO: {
    PFID : 'KA01PF260426075804420VO8o8M5w9IQ',
    TEMPLATES: {
      ORDER_REMINDER : 'KA01TP260426075940443LF7oyhJVJnq',
      ORDER_REPORT   : 'KA01TP260426080250645hFylvbOFfd2',
      STOCK_REPORT   : 'KA01TP260426080045813YtTbrFxp0yz',
      VENDOR_ORDER   : 'KA01TP260426080129891HOhFBeJ7ijV',
    }
  },

  BAESEOK: {
    TARGET_BY_DAY : [3, 3, 3, 3, 4, 4, 4],
    MIN_ORDER : 1,
    MAX_ORDER : 2,
  },

  // ── [v2.0 추가] 식자재 발주 설정 ─────────────────────────
  FOOD: {
    SHEET_NAME     : '식자재발주',
    SMS_MAX_BYTES  : 90,
    LMS_MAX_BYTES  : 2000,
    // ══════════════════════════════════════════════════════
    //  🔴 업체 전화번호 — 여기가 진짜입니다 (2026-09-27 수정)
    //
    //  ⚠️ 그전에는 전부 'TODO' 로 사장님 번호(01041216995)가 들어 있었습니다.
    //     화면(food.html CFG.PHONES)에만 진짜 번호가 있었고,
    //     handleFoodOrder 는 앱이 보낸 번호를 먼저 보니 괜찮았습니다.
    //     ⚠️ 그런데 바구니로 나가는 길(sendCartFor_)은 여기만 봅니다.
    //        그래서 26-09-22 바구니 v3.0 이후 발주 문자가 전부 사장님 번호로 갔습니다.
    //        업체는 아무것도 못 받았습니다. 아무도 몰랐습니다 — 또 조용한 실패입니다.
    //
    //  ⚠️ 번호를 바꿀 때는 food.html CFG.PHONES 도 같이 고치십시오.
    //     두 곳에 있는 값입니다. 앱은 화면 표시에 씁니다.
    // ══════════════════════════════════════════════════════
    PHONES: {
      '미락'    : '01089421859',
      '콩나물'  : '01062333466',
      '주류'    : '01056079640',
      '음료수'  : '01037982411',
      '사장님'  : '01053226995',
      // 아래 셋은 사장님이 직접 사 오는 것들입니다. 사장님 번호가 맞습니다.
      '원당'    : '01041216995',
      '네이버'  : '01041216995',
      '배달관련': '01041216995',
    },
  },

  HOLIDAY_API_KEY : '',
  SPREADSHEET_ID  : '10v0LxS97dofRa_jE7U2gYzwveqrxfGirCD9B-Zuon5o',
  SHEET_ORDER     : '발주기록',
  SHEET_STOCK     : '입고기록',
  SHEET_FAIL      : '발송실패',   // 실패 이력이 쌓이는 곳
};


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ⓪ 실패 알림 — 조용한 실패를 막는 핵심
//
//  왜 이메일인가
//    솔라피가 막혀서 실패한 건데 알림을 또 솔라피로 보내면 그것도 실패한다.
//    MailApp 은 구글 내장이라 솔라피 상태와 무관하게 나간다. 키도 필요 없다.
//    (구글 계정 기준 하루 100통까지 무료 — 실패 알림 용도로는 충분)
//
//  2026-08-11 사고
//    솔라피에 IP 접근 제한이 걸려 GAS(구글 서버 IP)가 차단됐다.
//    발송은 전부 실패했는데 로그에는 "발송 완료"만 찍혀서 아무도 몰랐다.
//    발주 문자가 안 나가면 고기가 안 들어온다. 반드시 알아야 한다.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function alertFailure(제목, 내용, 사유) {
  console.log('🚨 발송 실패 [' + 제목 + '] ' + 사유);

  // 이메일과 시트 기록은 서로 독립적으로 시도한다.
  // 하나가 실패해도 다른 하나는 남아야 한다.
  try {
    MailApp.sendEmail(
      CONFIG.OWNER_EMAIL,
      '🚨 [백석점] ' + 제목,
      '발송에 실패했습니다.\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '내용: ' + 내용 + '\n' +
      '사유: ' + 사유 + '\n' +
      '시각: ' + formatDate(new Date()) + ' ' +
                 Utilities.formatDate(new Date(), 'Asia/Seoul', 'HH:mm') + '\n' +
      '━━━━━━━━━━━━━━━━━━━━\n\n' +
      '👉 업체에 직접 연락해서 발주하세요.\n\n' +
      '자주 나오는 원인\n' +
      ' · 허용되지 않은 IP  → 솔라피에서 IP 접근 제한 해제\n' +
      ' · 잔액 부족        → 솔라피 충전\n' +
      ' · 발신번호 미등록   → 솔라피 발신번호 등록 확인\n'
    );
  } catch (e) {
    console.log('실패 알림 메일 전송 실패: ' + e.message);
  }

  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = ss.getSheetByName(CONFIG.SHEET_FAIL);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_FAIL);
      sheet.appendRow(['시각', '지점', '구분', '내용', '사유', '조치완료']);
      sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#fee2e2');
    }
    sheet.appendRow([
      Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm'),
      '백석점', 제목, 내용, 사유, '',
    ]);
  } catch (e) {
    console.log('실패 시트 기록 실패: ' + e.message);
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  [v2.1 추가] 화요일 고정휴무 + 공휴일 판정 (정적 목록)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 한국 공휴일은 정부가 매년 미리 발표하므로, 여기 날짜만 매년 갱신하면 됨.
// (대체공휴일 포함. 2026년: 제헌절이 18년 만에 공휴일로 재지정되어 포함됨)
const HOLIDAYS_2026 = [
  '2026-01-01', // 신정
  '2026-02-16', '2026-02-17', '2026-02-18', // 설날 연휴
  '2026-03-01', // 삼일절
  '2026-03-02', // 대체공휴일(삼일절)
  '2026-05-05', // 어린이날
  '2026-05-24', // 부처님오신날
  '2026-05-25', // 대체공휴일(부처님오신날)
  '2026-06-06', // 현충일
  '2026-07-17', // 제헌절
  '2026-08-15', // 광복절
  '2026-08-17', // 대체공휴일(광복절)
  '2026-09-24', '2026-09-25', '2026-09-26', // 추석 연휴
  '2026-10-03', // 개천절
  '2026-10-05', // 대체공휴일(개천절)
  '2026-10-09', // 한글날
  '2026-12-25', // 크리스마스
];

// ⚠️ [v2.2] "누가 쉬는 날인가" 를 셋으로 나눴습니다
//
//    예전에는 isClosedDay() 하나가 전부를 뜻해서, 공휴일이면 우리 가게도
//    쉬는 것으로 계산됐습니다. 그래서 공휴일 전날 발주가 이유 없이 밀렸습니다.
//    (2026-08-16 일요일 발주가 화요일로 밀리는 문제)
//
//    실제로는 이렇습니다.
//      우리 가게    화요일만 휴무. 공휴일에도 정상 영업
//      고기 업체    화요일 + 공휴일(빨간날) 전부 휴무 → 납품 못 받음
//      식자재 업체   공휴일에도 일함 (예외는 업체가 알아서 처리, 우리는 신경 안 씀)
//
//    셋이 다르므로 이름을 나눕니다. 하나로 묶으면 또 같은 사고가 납니다.

function isHoliday(date) {
  const key = Utilities.formatDate(date, 'Asia/Seoul', 'yyyy-MM-dd');
  return HOLIDAYS_2026.indexOf(key) !== -1;
}

// 우리 가게가 쉬는 날 — 화요일만
function isOurClosedDay(date) {
  return date.getDay() === 2;
}

// 고기 업체가 쉬는 날 — 화요일 + 공휴일. 이날은 납품을 못 받는다.
function isMeatVendorClosed(date) {
  return date.getDay() === 2 || isHoliday(date);
}

// 예전 이름. 다른 곳에서 부르고 있을 수 있어 남겨둔다 (고기 기준과 같음).
function isClosedDay(date) {
  return isMeatVendorClosed(date);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  [v2.2] 영업일 개념 — 자정을 넘겨 발주해도 그 전날 영업분으로 본다
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
//  ⚠️ 2026-08-18 사고
//     월요일 장사 마감이 늦어져 실제로는 화요일 00:35 에 발주를 넣으셨다.
//     코드는 "지금은 화요일이고 내일은 수요일(영업일)" 로 보고 즉시 발송해버렸다.
//     원래는 화요일 저녁에 모아서 보내야 했다.
//
//     가게는 자정을 넘겨 영업한다(라스트오더 23:30, 마감 00:00 무렵).
//     그래서 "달력상의 날"과 "장사하는 날"이 다르다. 이 함수가 그 차이를 메운다.
//
//  새벽 8시를 경계로 잡은 이유
//     마감 정리가 아무리 늦어도 새벽 8시를 넘기지는 않는다.
//     8시 이후에 넣는 발주는 그날 영업을 준비하며 넣는 것으로 본다.
//     (화면 쪽 food.html 의 getBusinessDate() 와 같은 기준이다. 어긋나면 안 된다.)
const BIZ_DAY_START_HOUR = 8;

// 지금이 어느 "영업일"인지 (새벽이면 전날)
function getBusinessDate(now) {
  const d = new Date(now);
  if (d.getHours() < BIZ_DAY_START_HOUR) d.setDate(d.getDate() - 1);
  return d;
}

// 영업일 기준으로 몇 시인지 — 새벽 0시 35분은 "전날 24시 35분" 으로 센다.
// 이걸 안 하면 "월요일인데 0시" 가 되어 시간 조건이 전부 무너진다.
function getBusinessHour(now) {
  const h = now.getHours();
  return h < BIZ_DAY_START_HOUR ? h + 24 : h;
}

// 이 발주를 화요일 저녁까지 모아뒀다가 보내야 하는가
//
//   영업일이 월요일   내일이 화요일(휴무)이라 납품을 못 받는다 → 수요일 납품용으로 모은다
//   영업일이 화요일   가게는 쉬지만 수요일 납품 발주를 넣는 날이다 → 저녁에 보낸다
//
// 화면(food.html)이 보내주는 delay_to_tuesday 값은 더 이상 믿지 않는다.
// 브라우저에 옛 화면이 캐시돼 있으면 틀린 값이 오기 때문이다. 서버가 직접 판단한다.
function shouldHoldUntilTuesday(now) {
  const bizDay = getBusinessDate(now).getDay();
  return bizDay === 1 || bizDay === 2;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ① HTML 반환
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function doGet(e) {
  // ⚠️ 2026-09-22 — 발주 바구니를 읽어가는 길을 냈습니다.
  //    앱이 다른 주소(깃허브)에 있어서 그냥 fetch 하면 브라우저가 막습니다.
  //    그래서 <script> 로 불러가는 옛날 방식(JSONP)을 씁니다.
  const p = (e && e.parameter) || {};
  if (p.action === 'holidays') {
    const json = JSON.stringify({ ok: true, items: holidayList() });
    if (p.callback) {
      return ContentService.createTextOutput(p.callback + '(' + json + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  }
  if (p.action === 'cart') {
    const json = JSON.stringify(getCart(p.date));
    if (p.callback) {
      return ContentService.createTextOutput(p.callback + '(' + json + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  }

  return HtmlService
    .createHtmlOutputFromFile('index')
    .setTitle('백석점 발주·입고')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ② POST 수신
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.type === 'order')      return handleOrder(data);
    if (data.type === 'stock')      return handleStock(data);
    if (data.type === 'food_order') return handleFoodOrder(data); // [v2.0]
    if (data.type === 'cart_add')    return cartAdd(data);        // [v3.0] 담기
    if (data.type === 'cart_remove') return cartRemove(data);     // [v3.0] 빼기
    if (data.type === 'cart_absorb') return cartAbsorb(data);     // [v4.0] ⚠️ v5 에서 안 씁니다
    if (data.type === 'cart_send')   return cartSend(data);       // [v4.0] 사람이 보내기
    if (data.type === 'cart_set')    return cartSet(data);        // [v5.0] 이 품목을 정확히 N 으로
    if (data.type === 'cash_alert')  return cashAlert(data);      // 마감 시재 부족 알림
    if (data.type === 'holiday_add')    return holidayAdd(data);     // [v3.1] 임시휴무
    if (data.type === 'holiday_remove') return holidayRemove(data);
    return jsonResponse({ ok: false, message: '알 수 없는 type' });
  } catch (err) {
    console.log('doPost 오류: ' + err.message);
    return jsonResponse({ ok: false, message: err.message });
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ②-B 발주 바구니 [v3.0] — 2026-09-22
//
//  왜 만들었나
//    그전에는 「발송」을 누르면 그 자리에서 문자가 나갔습니다.
//    여러 명이 각자 폰에서 누르면 각각 나갑니다. 서로 모릅니다.
//    ⚠️ 2026-09-19 원당에서 콩나물 문자가 세 번 나갔습니다.
//
//    이제는 담아만 둡니다. 문자는 정해진 시각에 한 번만 나갑니다.
//    몇 번을 담아도 나가는 건 한 번입니다 — 중복이 구조적으로 불가능합니다.
//
//  🔴 2026-09-27 [v4.0] — 자동 발송을 껐습니다. 사람이 보냅니다
//
//  사장님 말:
//    「무조건 식자재발주는 켤 거야. 미리 장바구니에 담아놓으면
//      추후에 발주하는 데 도움이 되게끔만 사용되면 됨」
//    「굳이 업체별로 시간 제한을 둘 필요 없을 것 같아. 단 알림만 오게끔」
//
//  ⚠️ 왜 바꿨나 — 2026-09-27 사진으로 확인된 사고
//    바구니(서버)와 화면 체크(ST)가 따로 놀았습니다.
//      마감체크 gr2 에서 온 대파 5   키 = 미락:대파:gr2
//      마감체크 gl1 에서 온 대파 1   키 = 미락:대파:gl1
//      발주앱에서 직접 체크한 대파 13 키 = 미락:대파:      ← 출처가 빔
//    셋이 각각 살아남아 19가 될 판이었습니다.
//    ⚠️ 게다가 미리보기는 화면 체크만 보여줘서 「대파 13」이라고 거짓말했습니다.
//
//  이제 이렇게 돕니다
//    ① 앱을 열면 바구니를 화면 체크로 **가져옵니다** (cart_absorb)
//       같은 품목은 출처가 달라도 합칩니다. 대파 5+1 → 6
//       가져간 줄은 '흡수' 로 표시되어 두 번 들어가지 않습니다
//    ② 사람이 보고 고칩니다 (6 → 13)
//    ③ 「발주하기」를 누르면 그때 나갑니다 (cart_send)
//       ⚠️ 시간 제한이 없습니다. 언제 눌러도 나갑니다
//    ④ 나간 뒤 사장님께 카톡 요약이 갑니다
//
//  알림 (자동 발송 대신)
//    21:30   미락 — 22:30 마감 전에 알립니다
//    23:30   나머지
//    ⚠️ 01041216995 로만 갑니다 (사장님 지정 2026-09-27)
//
//    주류      ⚠️ 바구니를 안 씁니다. 재고를 세어 그 자리에서 보냅니다
//              사장님: 「주류는 지금처럼이 딱 좋아」
//
//  ── 고치지 않고 쌓기만 합니다 ─────────────────────────
//    담기도 빼기도 보냄도 전부 새 줄입니다.
//    ① 두 폰이 동시에 눌러도 서로 덮어쓸 일이 없습니다
//    ② 「누가 언제 무엇을」이 통째로 남습니다
//    읽을 때 품목마다 마지막 줄만 보면 지금 상태가 됩니다.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CART_SHEET = '발주바구니';

// 업체별 보내는 시각. 여기 없는 업체는 기본(00:25)입니다.
const CART_TIME = {
  '미락': { hour: 22, min: 25, nextDay: false, 마감: '22:30' },
};
const CART_TIME_DEFAULT = { hour: 0, min: 25, nextDay: true, 마감: '00:30' };

// ⚠️ 바구니를 안 쓰는 업체. 주류는 재고를 세어 그때그때 보냅니다.
const CART_SKIP = ['주류'];

// ── 🔔 발주 알림 [v4.0] 2026-09-27 ──────────────────────
//
//  자동 발송을 껐으므로 「넣으세요」를 알려주는 것이 유일한 안전장치입니다.
//  ⚠️ 이게 안 오면 발주가 통째로 빠집니다. 여기를 지우지 마십시오.
//
//  사장님 지정: 01041216995 로만 보냅니다
const CART_ALERT_PHONE = '01041216995';

// 몇 시에 어느 업체를 알릴 것인가. 영업일 기준 시각입니다 (24시 = 자정)
//   ⚠️ 미락은 22:30 이 업체 마감이라 21:30 에 알립니다. 한 시간 여유
const CART_ALERTS = [
  { hour: 21, min: 30, 업체들: ['미락'],  이름: '미락' },
  { hour: 23, min: 30, 업체들: null,     이름: '나머지' },   // null = 미락 빼고 전부
];

// 한 번 알리고 안 보냈으면 이만큼 뒤에 한 번 더
const CART_ALERT_REPEAT_MIN = 45;

// ── 가져갈 것 알림 (2026-09-25) ────────────────────────
//
//  사장님 말:
//    「사장님 탭에 문자는 와야 해. 하지만 14시쯤에는 알림이 와야
//      내가 가지러 들렀다가 가는 거야」
//
//  「사장님」 탭은 업체가 아니라 사장님이 직접 가져오는 것들입니다.
//  (국수소스·파장소스·감미 등)
//  새벽 00:25 문자는 「무엇이 떨어졌나」이고,
//  14시 문자는 「오늘 들러서 가져갈 것」입니다. 쓰임이 다릅니다.
//
//  ⚠️ 새벽 문자는 01053226995 로, 낮 알림은 01041216995 로 갑니다.
//     둘은 다른 번호이고 다른 시각입니다.
const CART_NOTIFY = {
  '사장님': { 번호: '01041216995', hour: 14, min: 0 },
};

// 그 영업일 것을 언제 알릴 것인가 — 문자가 나간 날(영업일+1) 낮입니다
function cartNotifyAt_(bizDate, supplier) {
  const c = CART_NOTIFY[supplier];
  if (!c) return null;
  const t = new Date(bizDate);
  t.setDate(t.getDate() + 1);        // 00:25 에 나가므로 하루 뒤가 발송일입니다
  t.setHours(c.hour, c.min, 0, 0);
  return t;
}

function cartTime_(supplier) {
  return CART_TIME[supplier] || CART_TIME_DEFAULT;
}

// ══════════════════════════════════════════════════════════
//  쉬는 날  (2026-09-25)
//
//  ⚠️ 제가 발주를 「담기 + 예약 발송」으로 바꾸면서 원래 있던 휴무 판단을
//     새 길로 안 옮겼습니다. 그래서 화요일에도, 미락이 쉬는 일요일에도
//     문자가 나가고 있었습니다. 사장님 말: 「원래 잘했잖아」 — 맞습니다.
//
//  사장님이 정한 방식:
//    「받을 날」을 먼저 찾고 그 전날 밤에 보낸다.
//    예) 미락 휴무가 수·목이면, 월요일 발주는 목 22:25 에 나가야
//        금요일 장사할 때 받는다.
//
//  정기휴무는 여기 두고, 임시휴무는 사장님이 앱에서 넣습니다.
//  ⚠️ 둘이 겹쳐도 상관없습니다. 그냥 「쉬는 날」로 합쳐서 봅니다.
// ══════════════════════════════════════════════════════════

const 우리휴무요일_ = 2;                      // 화요일 (0=일)

// 업체별 정기 휴무 요일 (사장님 확인 2026-09-25)
//   ⚠️ 주류는 「수·목·일에 주문 가능」이지만 막지 않습니다.
//      업체가 쉴 때 미리 넣어달라고 하는 일이 있어서, 안내만 하고 판단은 사람이 합니다.
const 업체휴무요일_ = {
  '미락': [0],        // 일요일
  // 콩나물 · 네이버 · 사장님 · 배달관련 · 원당 · 음료수 — 쉬는 날 없음
};

const HOLIDAY_SHEET = '휴무일';

// ── 임시 휴무 읽기 ──────────────────────────────────────
//    시트 「휴무일」: 시작일 · 종료일 · 대상 · 사유
//    대상이 '전체' 면 가게 휴무, 업체 이름이면 그 업체만
function getHolidaySheet_() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(HOLIDAY_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(HOLIDAY_SHEET);
    sheet.appendRow(['시작일', '종료일', '대상', '사유', '넣은시각', '폰']);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#fee2e2');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

let _임시휴무 = null;      // 한 번 읽으면 이 실행 동안 재사용합니다
function 임시휴무_() {
  if (_임시휴무) return _임시휴무;
  _임시휴무 = [];
  try {
    const sheet = getHolidaySheet_();
    const last = sheet.getLastRow();
    if (last >= 2) {
      sheet.getRange(2, 1, last - 1, 4).getValues().forEach(function (r) {
        const s = 날짜글_(r[0]), e = 날짜글_(r[1]) || 날짜글_(r[0]);
        if (!s) return;
        _임시휴무.push({ 시작: s, 끝: e, 대상: String(r[2] || '전체').trim() });
      });
    }
  } catch (err) {
    // ⚠️ 못 읽어도 멈추지 않습니다. 정기휴무만으로 판단합니다.
    console.log('휴무일 탭 읽기 실패: ' + err.message);
  }
  return _임시휴무;
}

// 어떤 모양으로 적혀 있어도 yyyy-MM-dd 로 맞춥니다
function 날짜글_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Seoul', 'yyyy-MM-dd');
  const m = String(v || '').match(/(\d{2,4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!m) return '';
  let y = parseInt(m[1], 10); if (y < 100) y += 2000;
  const p = n => String(n).padStart(2, '0');
  return y + '-' + p(parseInt(m[2], 10)) + '-' + p(parseInt(m[3], 10));
}

// ── 그날 쉬나 ───────────────────────────────────────────
function 우리쉬나_(d) {
  if (d.getDay() === 우리휴무요일_) return true;
  if (isHoliday(d)) return true;                       // 법정 공휴일
  const key = Utilities.formatDate(d, 'Asia/Seoul', 'yyyy-MM-dd');
  return 임시휴무_().some(function (h) {
    return h.대상 === '전체' && key >= h.시작 && key <= h.끝;
  });
}

function 업체쉬나_(d, supplier) {
  const 요일들 = 업체휴무요일_[supplier] || [];
  if (요일들.indexOf(d.getDay()) >= 0) return true;
  const key = Utilities.formatDate(d, 'Asia/Seoul', 'yyyy-MM-dd');
  return 임시휴무_().some(function (h) {
    return h.대상 === supplier && key >= h.시작 && key <= h.끝;
  });
}

// ── 받을 수 있는 첫날 ───────────────────────────────────
//    담은 다음날부터 하루씩 밀며 「우리도 열고 업체도 여는 날」을 찾습니다.
function 받을날_(bizDate, supplier) {
  const d = new Date(bizDate);
  d.setDate(d.getDate() + 1);
  for (let i = 0; i < 21; i++) {                       // 3주까지만 봅니다
    if (!우리쉬나_(d) && !업체쉬나_(d, supplier)) return d;
    d.setDate(d.getDate() + 1);
  }
  return d;
}

// ── 그 영업일에 이 업체가 나갈 시각 ─────────────────────
//
//  ⚠️ 받을 날을 먼저 정하고 거기서 거꾸로 셉니다.
//     미락은 밤 22:25 에 보내면 다음날 받습니다  → 받을날 하루 전
//     나머지는 자정 넘어 00:25 에 보내면 그날 받습니다 → 받을날 당일
//
//  ⚠️ 00:25 는 달력으로는 다음날 새벽이지만 「그 전날 밤」입니다.
//     2026-09-25 에 사장님이 이걸 「목요일에 보낸다」로 읽고 되물으셨습니다.
//     원래 쓰던 「오전 8시 전은 전날 영업분」과 같은 셈법입니다.
//       월화수 휴무 → 받을날 목요일 → 발송 10/1 00:25 = 수요일 밤
function cartSendAt_(bizDate, supplier) {
  const c = cartTime_(supplier);
  const 받는날 = 받을날_(bizDate, supplier);
  const t = new Date(받는날);
  if (!c.nextDay) t.setDate(t.getDate() - 1);          // 미락처럼 전날 밤에 보내는 경우
  t.setHours(c.hour, c.min, 0, 0);
  return t;
}

function getCartSheet_() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CART_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(CART_SHEET);
    sheet.appendRow(['시각', '영업일', '지점', '업체', '품목', '수량', '상태', '폰', '출처']);
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#dbeafe');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ⚠️ 「출처」가 왜 필요한가 — 2026-09-22
//
//    마감체크리스트의 여러 줄이 발주에서는 한 품목으로 모입니다.
//
//      라면용대파 · 다진대파 · 전골용대파  →  미락 대파 1개씩
//      대파김치                          →  미락 대파 5개
//
//    사장님 말: 「라면용대파, 대파김치를 체크했다? = 대파 6개」
//
//    ⚠️ 출처가 없으면 마지막에 담은 것만 남아 5개가 됩니다.
//       출처를 같이 적어두면 「대파:gl1=1」 「대파:gr2=5」로 따로 세어 6개가 됩니다.
//       그리고 라면용대파만 빼면 5개로 알아서 줄어듭니다.
//
//    출처가 없는 것(발주앱에서 그냥 담은 것)은 '' 이고, 그것도 한 자리를 차지합니다.

// ── 임시 휴무 넣기·빼기·보기 (2026-09-25) ───────────────
//
//  ⚠️ 정기 휴무(화요일·미락 일요일)는 코드에 있습니다. 여기는 임시만 다룹니다.
//     사장님 말: 「정기휴무는 가지고 있되, 임시적인 휴무를 내가 정할 수 있게」
function holidayAdd(data) {
  return cartLock_(function () {
    const 시작 = 날짜글_(data.from);
    const 끝   = 날짜글_(data.to) || 시작;
    const 대상 = String(data.target || '전체').trim();
    if (!시작) return jsonResponse({ ok: false, message: '날짜를 못 읽었습니다' });

    getHolidaySheet_().appendRow([
      시작, 끝, 대상, String(data.reason || ''), new Date(), String(data.device || ''),
    ]);
    _임시휴무 = null;                    // 다시 읽게 합니다
    return jsonResponse({ ok: true, from: 시작, to: 끝, target: 대상 });
  });
}

function holidayRemove(data) {
  return cartLock_(function () {
    const 시작 = 날짜글_(data.from);
    const 대상 = String(data.target || '전체').trim();
    const sheet = getHolidaySheet_();
    const last = sheet.getLastRow();
    if (last < 2) return jsonResponse({ ok: false, message: '지울 것이 없습니다' });

    // ⚠️ 뒤에서부터 지웁니다. 앞에서 지우면 줄 번호가 밀려 엉뚱한 줄이 지워집니다.
    const rows = sheet.getRange(2, 1, last - 1, 3).getValues();
    let 지움 = 0;
    for (let i = rows.length - 1; i >= 0; i--) {
      if (날짜글_(rows[i][0]) === 시작 && String(rows[i][2] || '전체').trim() === 대상) {
        sheet.deleteRow(i + 2);
        지움++;
      }
    }
    _임시휴무 = null;
    return jsonResponse({ ok: 지움 > 0, removed: 지움 });
  });
}

function holidayList() {
  const 오늘 = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
  // 이미 지난 것은 안 보여줍니다. 시트에는 기록으로 남습니다.
  return 임시휴무_().filter(function (h) { return h.끝 >= 오늘; })
    .map(function (h) { return { from: h.시작, to: h.끝, target: h.대상 }; });
}

// ── 담기 ────────────────────────────────────────────────
function cartAdd(data) {
  return cartLock_(function () {
    const items = data.items || [];
    if (!items.length) return jsonResponse({ ok: false, message: '담을 것이 없습니다' });

    const now  = new Date();
    const biz  = getBusinessDate(now);
    const 지점  = (typeof BRANCH !== 'undefined') ? BRANCH : '백석점';

    const 거절 = [];
    const 넘김 = [];     // 마감이 지나 다음 영업일로 넘어간 업체
    const rows = [];

    items.forEach(function (it) {
      const 업체 = String(it.supplier || '');

      if (CART_SKIP.indexOf(업체) >= 0) {
        거절.push(업체 + ' 은 바구니를 쓰지 않습니다');
        return;
      }
      // ⚠️ [v4.0] 2026-09-27 — 시각에 따라 날짜를 옮기지 않습니다.
      //
      //    그전에는 「보낼 시각이 지났으면 다음 영업일로 넘김」이었습니다.
      //    ⚠️ 미락은 22:25 에 나가는데 마감 작업은 00시 넘어서 합니다.
      //       그래서 마감 중에 담은 미락 품목은 **언제나** 하루 늦었습니다.
      //       게다가 no-cors 라 화면이 답장을 못 읽어 아무도 몰랐습니다.
      //
      //    이제 자동 발송이 없으므로 넘길 이유가 없습니다.
      //    담긴 것은 그 영업일에 그대로 남고, 사람이 앱에서 보고 보냅니다.
      var 담을영업일 = biz;
      rows.push([now, formatDate(담을영업일), 지점, 업체, String(it.item || ''),
                 String(it.qty || ''), '담김', String(data.device || ''),
                 String(it.src || '')]);
    });

    if (rows.length) {
      const sheet = getCartSheet_();
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 9).setValues(rows);
    }
    return jsonResponse({ ok: rows.length > 0, added: rows.length,
                          rejected: 거절, movedToNextDay: 넘김 });
  });
}

// ── 빼기 ────────────────────────────────────────────────
function cartRemove(data) {
  return cartLock_(function () {
    const items = data.items || [];
    if (!items.length) return jsonResponse({ ok: false, message: '뺄 것이 없습니다' });

    const now = new Date();
    const biz = getBusinessDate(now);
    const 지점 = (typeof BRANCH !== 'undefined') ? BRANCH : '백석점';

    const rows = items.map(function (it) {
      return [now, formatDate(biz), 지점, String(it.supplier || ''),
              String(it.item || ''), '', '뺌', String(data.device || ''),
              String(it.src || '')];
    });
    const sheet = getCartSheet_();
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 9).setValues(rows);
    return jsonResponse({ ok: true, removed: rows.length });
  });
}

// ── 지금 담겨 있는 것 ────────────────────────────────────
//    품목마다 마지막 줄만 봅니다. 마지막이 「담김」이면 담긴 것입니다.
// 출처별 수량을 더합니다. { gl1:1, gl3:1, gr2:5 } → 7
// ⚠️ 같은 출처를 둘이 눌러도 한 번만 셉니다 (마지막 값만 담겨 있습니다)
function 출처합_(출처별) {
  if (!출처별) return 0;
  let s = 0;
  Object.keys(출처별).forEach(function (k) { s += 출처별[k] || 0; });
  return s;
}

function getCart(dateStr) {
  const now  = new Date();
  const biz  = getBusinessDate(now);
  const date = dateStr || formatDate(biz);

  const sheet = getCartSheet_();
  const last  = sheet.getLastRow();
  if (last < 2) return { ok: true, date: date, items: [], sent: {}, notified: {} };

  // 하루치만 보면 되므로 끝에서 600줄만 읽습니다
  const from = Math.max(2, last - 600 + 1);
  const rows = sheet.getRange(from, 1, last - from + 1, 9).getValues();

  const 본것  = {};   // 이 품목은 확정됐다 (더 안 본다)
  const 더한것 = {};   // [v5.0] 확정 전까지 더한 수량
  const 더했나 = {};   // [v5.0] ⚠️ 수량 0 인 토글 품목도 「담겼다」를 알아야 합니다
  const 합계  = {};   // [v5.0] 최종 수량
  const 정보  = {};   // [v5.0] 업체·품목 이름 등
  const 계속  = {};   // [v5.0] false = 꺼진 품목
  const 담긴것 = [];
  const 보냄  = {};
  const 알림  = {};   // 「가져갈 것」을 이미 알린 업체
  const 발주알림  = {};   // [v4.0] 「발주 넣으세요」를 알린 시각 (영업일 기준 분)
  const 발주알림두번 = {};

  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    // ⚠️ 영업일은 '26.09.22(화)' 같은 글자로 저장돼 있습니다.
    //    이걸 다시 날짜로 바꾸려 하면 Invalid Date 가 되어 하루치가 통째로 안 잡힙니다.
    //    시트가 날짜로 인식해 버린 줄만 formatDate 를 태웁니다.
    const 줄날짜 = (r[1] instanceof Date) ? formatDate(r[1]) : String(r[1]);
    if (줄날짜 !== date) continue;

    const 업체 = String(r[3]);
    const 상태 = String(r[6]);

    if (상태 === '보냄' || 상태 === '보냄(실패)') {
      if (!보냄[업체]) 보냄[업체] = rowHHMM_(r[0]);
      continue;
    }
    if (상태 === '가져갈알림' || 상태 === '가져갈알림(실패)') {
      if (!알림[업체]) 알림[업체] = rowHHMM_(r[0]);
      continue;
    }
    // ⚠️ [v4.0] 「발주 넣으세요」 알림 기록. 품목이 아니므로 목록에는 안 넣습니다.
    //    업체 칸에 알림 이름(미락/나머지)이 들어 있습니다.
    if (상태 === '알림' || 상태 === '알림(실패)') {
      const h = rowHHMM_(r[0]);                      // 'HH:MM'
      if (h) {
        const hh = parseInt(h.slice(0, 2), 10);
        const 분 = (hh < BIZ_DAY_START_HOUR ? hh + 24 : hh) * 60 + parseInt(h.slice(3), 10);
        if (발주알림[업체] === undefined) 발주알림[업체] = 분;
        else 발주알림두번[업체] = true;               // 두 번째 줄이 있으면 이미 두 번 알린 것
      }
      continue;
    }

    // ══════════════════════════════════════════════════════
    //  [v5.0] 품목 줄 — 업체:품목 으로만 봅니다. 출처는 안 나눕니다
    //
    //  ⚠️ v4.0 까지는 키에 출처(src)를 넣었습니다.
    //     마감체크 네 곳(gl1·gl3·gl5·gr2)에서 온 대파를 각각 세려던 것이었는데,
    //     발주앱에서 직접 체크한 대파(출처 빔)와 섞이면서 5+1+13=19 가 될 판이었습니다.
    //     이제 합계만 맞으면 되므로 한 품목으로 봅니다.
    //
    //  뒤에서부터 보다가
    //    '정함'(set) 을 만나면 그 값으로 확정하고 더 안 봅니다
    //    '끔'  을 만나면 그 품목은 꺼진 것입니다
    //    '담김'(add) 은 확정 전까지 계속 더합니다
    //    '뺌'  을 만나면 그 품목을 뺍니다
    // ══════════════════════════════════════════════════════
    const 키 = 업체 + ':' + String(r[4]);
    if (본것[키]) continue;               // 이미 확정된 품목입니다
    if (상태 === '흡수') continue;         // ⚠️ v4.0 유산 — 무시합니다

    // ⚠️ '끔' 은 그 시점까지만 지웁니다.
    //    껐다가 다시 담은 것(더 나중 줄)은 살아야 합니다.
    //    뒤에서부터 보므로, 여기 올 때 더한것 에 있는 것이 곧 「끈 뒤에 담긴 것」입니다.
    if (상태 === '끔' || 상태 === '뺌') {
      본것[키] = true;
      if (더했나[키]) 합계[키] = 출처합_(더한것[키]);   // 끈 뒤에 다시 담겼습니다
      else 계속[키] = false;
      continue;
    }

    if (상태 === '정함') {
      본것[키] = true;                     // 여기서 멈춥니다. 사람이 정한 값입니다
      const n = parseFloat(r[5]);
      const 앞 = 출처합_(더한것[키]);        // 확정 뒤에 온 add 들
      합계[키] = ((isFinite(n) && n > 0) ? n : 0) + 앞;
      정보[키] = { supplier: 업체, item: String(r[4]), at: rowHHMM_(r[0]),
                   device: String(r[7] || ''), phone: '' };
      continue;
    }

    if (상태 === '담김') {
      if (계속[키] === false) continue;    // 이미 꺼진 품목입니다
      // ══════════════════════════════════════════════════
      //  ⚠️ 출처별로 마지막 값만 셉니다   2026-09-27
      //
      //  사장님 질문: 「a가 마감체크에서 대파 1을 넣고, b도 대파 1을 넣으면 몇 개?」
      //
      //    같은 자리(gl1)를 둘이 누른 것   →  같은 대파입니다. 1이어야 합니다
      //    다른 자리(gl1·gl3)를 누른 것    →  각각 필요합니다. 2가 맞습니다
      //
      //  ⚠️ v5.0 처음에는 출처를 통째로 버려서 둘 다 2가 됐습니다.
      //     버릴 것은 「마감체크 출처 vs 발주앱 체크」의 구분이었지,
      //     「마감체크 자리끼리」의 구분이 아니었습니다.
      //
      //  뒤에서부터 보므로 출처마다 처음 만난 줄이 곧 마지막 값입니다.
      // ══════════════════════════════════════════════════
      const 출처 = String(r[8] || '');
      if (!더한것[키]) 더한것[키] = {};
      if (더한것[키][출처] === undefined) {
        const n = parseFloat(r[5]);
        더한것[키][출처] = (isFinite(n) && n > 0) ? n : 0;
      }
      더했나[키] = true;
      if (!정보[키]) {
        정보[키] = { supplier: 업체, item: String(r[4]), at: rowHHMM_(r[0]),
                     device: String(r[7] || ''), phone: '' };
      }
    }
  }

  // 확정이 안 된 품목은 출처별 값을 합한 것이 곧 합계입니다
  Object.keys(더했나).forEach(function (키) {
    if (합계[키] === undefined && 계속[키] !== false) 합계[키] = 출처합_(더한것[키]);
  });

  Object.keys(합계).forEach(function (키) {
    const i = 정보[키];
    if (!i) return;
    담긴것.push({ supplier: i.supplier, item: i.item,
                  qty: 합계[키] > 0 ? String(합계[키]) : '',
                  at: i.at, device: i.device, src: '' });
  });

  담긴것.reverse();   // 담은 순서대로
  return { ok: true, date: date, items: 담긴것, sent: 보냄,
           notified: 알림, alerted: 발주알림, alertedTwice: 발주알림두번,
           deadlines: cartDeadlines_(biz) };
}

// ══════════════════════════════════════════════════════════
//  [v5.0] 체크를 서버에 둡니다   2026-09-27
//
//  ⚠️ 왜 또 바꿨나 — v4.0 을 쓰자마자 나온 문제
//    「흡수」는 먼저 연 폰이 바구니를 독점했습니다.
//      a폰이 열면 → 가져가고 바구니를 비움 → b폰은 빈손
//    그리고 체크 자체(ST)는 여전히 localStorage 라 폰끼리 안 보였습니다.
//      a폰에서 사장님 체크, b폰에서 네이버 체크 → 서로 모름
//
//  ⚠️ 뿌리는 늘 같습니다 — 같은 것을 두 곳에 두었습니다.
//     체크(폰)와 바구니(서버)를 하나로 합칩니다. 바구니가 유일한 진실입니다.
//
//  두 가지 쓰기가 있습니다
//    cart_add   더하기   마감체크 🛒 가 씁니다. 대파 5 담고 1 더 담으면 6
//    cart_set   확정     발주앱에서 사람이 숫자를 정한 것. 앞의 것을 대체합니다
//
//  읽을 때 (getCart)
//    품목마다 뒤에서부터 봅니다.
//    'set' 을 만나면 그 값에서 멈추고, 그 뒤에 온 'add' 들만 더합니다.
//      add 5, add 1        → 6
//      add 5, add 1, set 13 → 13        사람이 정한 값이 이깁니다
//      add 5, set 13, add 2 → 15        그 뒤에 새로 필요해진 것만 더합니다
// ══════════════════════════════════════════════════════════
function cartSet(data) {
  return cartLock_(function () {
    const items = data.items || [];
    if (!items.length) return jsonResponse({ ok: false, message: '정할 것이 없습니다' });

    const now = new Date();
    const biz = getBusinessDate(now);
    const 지점 = (typeof BRANCH !== 'undefined') ? BRANCH : '백석점';
    const rows = [];

    items.forEach(function (it) {
      const 업체 = String(it.supplier || '');
      if (!업체 || CART_SKIP.indexOf(업체) >= 0) return;   // 주류는 바구니를 안 씁니다
      rows.push([now, formatDate(biz), 지점, 업체, String(it.item || ''),
                 String(it.qty === undefined || it.qty === null ? '' : it.qty),
                 it.off ? '끔' : '정함',              // ⚠️ 체크를 끈 것도 기록입니다
                 String(data.device || ''), '']);
    });

    if (rows.length) {
      const sheet = getCartSheet_();
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 9).setValues(rows);
    }
    return jsonResponse({ ok: true, set: rows.length });
  });
}

// ══════════════════════════════════════════════════════════
//  [v4.0] 흡수 — ⚠️ v5.0 부터 쓰지 않습니다
//
//  옛 화면이 캐시된 폰이 부를 수 있어 남겨둡니다.
//  ⚠️ 새로 부르지 마십시오. 먼저 연 폰이 바구니를 독점합니다.
//
//  발주앱을 열면 바구니에 있는 것을 화면 체크로 옮깁니다.
//  ⚠️ 옮긴 줄은 '흡수' 로 표시해 바구니에서 뺍니다.
//     안 그러면 화면과 바구니에 같은 것이 둘 다 남아 두 배로 나갑니다.
//
//  ⚠️ 같은 품목은 출처가 달라도 합칩니다 — 그건 화면 쪽에서 합니다.
//     여기서는 「가져갔다」는 사실만 기록합니다.
// ══════════════════════════════════════════════════════════
function cartAbsorb(data) {
  return cartLock_(function () {
    const now  = new Date();
    const biz  = getBusinessDate(now);
    const 오늘  = formatDate(biz);
    const cart = getCart(오늘);

    if (!cart.items.length) return jsonResponse({ ok: true, absorbed: 0, items: [] });

    // 주류는 바구니를 안 쓰므로 여기 올 일이 없지만, 혹시 섞이면 남겨둡니다
    const 가져갈것 = cart.items.filter(function (it) {
      return CART_SKIP.indexOf(it.supplier) < 0;
    });
    if (!가져갈것.length) return jsonResponse({ ok: true, absorbed: 0, items: [] });

    const sheet = getCartSheet_();
    const rows = 가져갈것.map(function (it) {
      return [now, 오늘, '백석점', it.supplier, it.item, it.qty,
              '흡수', String(data.device || ''), it.src];
    });
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 9).setValues(rows);

    console.log('바구니 흡수: ' + rows.length + '건 → ' + String(data.device || ''));
    return jsonResponse({ ok: true, absorbed: rows.length, items: 가져갈것 });
  });
}

// ══════════════════════════════════════════════════════════
//  [v4.0] 사람이 보내기   2026-09-27
//
//  ⚠️ 시간 제한이 없습니다. 사장님: 「굳이 업체별로 시간 제한을 둘 필요 없을 것 같아」
//  ⚠️ 화면이 보내준 목록을 그대로 믿습니다. 사람이 보고 확정한 것이기 때문입니다.
//     자동 발송 때와 달리 바구니를 다시 읽어 합치지 않습니다 — 그러면 또 두 배가 됩니다.
// ══════════════════════════════════════════════════════════
function cartSend(data) {
  const items = data.items || [];
  if (!items.length) return jsonResponse({ ok: false, message: '보낼 것이 없습니다' });

  const now = new Date();
  const biz = getBusinessDate(now);
  const 오늘 = formatDate(biz);

  // 업체별로 묶습니다
  const 업체별 = {};
  const 순서   = [];
  items.forEach(function (it) {
    const 업체 = String(it.supplier || '');
    if (!업체) return;
    if (!업체별[업체]) { 업체별[업체] = []; 순서.push(업체); }
    업체별[업체].push(it);
  });

  const 결과 = [];
  const 실패 = [];
  const 요약 = [];

  순서.forEach(function (업체) {
    const r = sendCartFor_(업체, 업체별[업체], 오늘, biz, String(data.device || ''));
    결과.push({ supplier: 업체, ok: r.ok });
    if (!r.ok) 실패.push(업체 + ': ' + (r.message || '알 수 없음'));
    else 요약.push(r.body);
  });

  // ── 사장님께 카톡 요약 (사장님 요청 2026-09-27) ──
  //    ⚠️ 문자가 진짜 나간 것만 넣습니다. 실패한 것을 「보냈다」고 하면 안 됩니다.
  if (요약.length) 사장님요약_(오늘, 요약, 실패);

  return jsonResponse({ ok: !실패.length, results: 결과, failed: 실패 });
}

// ── 사장님께 「오늘 무엇이 나갔나」 ───────────────────────
//
//  사장님 말: 「문자가 솔라피를 통해 정확히 보내졌으면 이를 다 정리해서
//              몇월 몇일 발주목록을 정리한 것들이 카톡으로 오게끔」
//
//  ⚠️ 알림톡 템플릿(ORDER_REPORT)은 고기 발주용 변수를 요구합니다.
//     식자재에는 안 맞아서 LMS 로 보냅니다. 「가져갈 것」 알림이 쓰는 길과 같습니다.
function 사장님요약_(오늘, 보낸것들, 실패) {
  try {
    // ⚠️ 제목을 따로 줍니다. 안 그러면 본문 앞부분이 잘려 제목이 됩니다 (26-09-29)
    const 제목 = '백석점 발주 완료 ' + 오늘;
    let body = 보낸것들.join('\n\n');
    if (실패.length) body += '\n\n[실패] ' + 실패.join(' / ');
    const channel = getByteLen(body) > CONFIG.FOOD.SMS_MAX_BYTES ? 'LMS' : 'SMS';
    const r = sendFoodSms(CART_ALERT_PHONE,
                          (channel === 'LMS') ? body : ('[' + 제목 + '] ' + body),
                          channel, 제목);
    if (!r.ok) console.log('사장님 요약 실패: ' + (r.message || ''));
  } catch (err) {
    // ⚠️ 여기서 막혀도 발주는 이미 나갔습니다. 전체를 죽이지 않습니다.
    console.log('사장님 요약 중 오류: ' + err.message);
  }
}

// ══════════════════════════════════════════════════════════
//  💰 마감 시재 부족 알림   ⚠️ 2026-09-29 — 이제 안 씁니다
//
//  처음에는 여기서 보내게 만들었습니다. 솔라피 열쇠가 이 GAS 에만 있어서였습니다.
//  ⚠️ 사장님 지적이 맞았습니다 — 「기능도 마감체크리스트에 있는데 왜 발주에 넣어?」
//     마감 기능은 마감 GAS 안에서 끝나야 합니다.
//     지금은 마감체크리스트 Code.gs 의 시재문자_() 가 직접 보냅니다.
//
//  ⚠️ 부르지 마십시오. 옛 화면이 캐시된 폰이 보낼 수 있어 남겨둘 뿐입니다.
//     열쇠가 두 곳에 생겼지만 괜찮습니다 — 솔라피 열쇠는 거의 안 바뀌고
//     스크립트 속성이라 코드와 무관합니다.
// ══════════════════════════════════════════════════════════
function cashAlert(data) {
  const 부족 = Math.abs(parseInt(data.short, 10) || 0);
  const 지점 = String(data.branch || '백석') === 'wondang' ? '원당' : '백석';
  const 폰   = String(data.device || '');

  if (!부족) return jsonResponse({ ok: false, message: '부족액이 없습니다' });

  const now = new Date();
  const 제목 = '💰 ' + 지점 + ' 시재 부족';
  const body = formatDate(getBusinessDate(now)) + ' 마감\n\n' +
               '부족액 ' + 부족.toLocaleString() + '원\n\n' +
               '채워 넣어주세요.' + (폰 ? '\n(' + 폰 + ' 폰에서 보고했습니다)' : '');

  const channel = getByteLen(body) > CONFIG.FOOD.SMS_MAX_BYTES ? 'LMS' : 'SMS';
  const r = sendFoodSms(CART_ALERT_PHONE,
                        (channel === 'LMS') ? body : ('[' + 제목 + '] ' + body),
                        channel, 제목);

  console.log('시재 부족 알림: ' + 부족 + '원 → ' + (r.ok ? '보냄' : '실패'));

  // ⚠️ 문자가 막혀도 사장님이 알 수 있게 메일도 남깁니다. 돈 이야기입니다.
  if (!r.ok) {
    try {
      MailApp.sendEmail({
        to: CONFIG.OWNER_EMAIL,
        subject: '[문자 실패] ' + 제목,
        body: body + '\n\n문자 발송 실패: ' + (r.message || '알 수 없음'),
      });
    } catch (e) {}
  }
  return jsonResponse({ ok: r.ok });
}

function cartDeadlines_(biz) {
  const out = { '_기본': CART_TIME_DEFAULT.마감 };
  Object.keys(CART_TIME).forEach(function (k) { out[k] = CART_TIME[k].마감; });
  return out;
}

function rowHHMM_(v) {
  return v instanceof Date ? Utilities.formatDate(v, 'Asia/Seoul', 'HH:mm') : String(v || '');
}

function cartLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ②-C 바구니 보내기 — 5분마다 도는 트리거가 부릅니다
//
//  ⚠️ 왜 「매일 22:25 트리거」가 아니라 5분마다인가
//     구글의 시간 트리거는 정확하지 않습니다. 22시로 걸면 22~23시 사이
//     아무 때나 돕니다. 미락은 22:30 이 마감이라 그러면 늦습니다.
//     5분마다 돌면서 「보낼 시각이 지났나」만 보면 오차가 5분 안입니다.
//
//  ⚠️ 그리고 한 번 걸어두면 계속 돕니다. 일회성 트리거는 만들다 실패하면
//     그날 발주가 통째로 빠집니다. 중복보다 누락이 훨씬 아픕니다.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ★ 딱 한 번 실행하세요. 5분마다 도는 트리거를 겁니다.
function 바구니트리거걸기() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sendCartDue') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendCartDue').timeBased().everyMinutes(5).create();
  console.log('✅ 5분마다 바구니를 확인하는 트리거를 걸었습니다');
}

// ══════════════════════════════════════════════════════════
//  [v4.0] 5분마다 도는 트리거 — 🔴 이제 문자를 보내지 않습니다
//
//  ⚠️ 2026-09-27 부터 발주는 사람이 앱에서 「발주하기」를 눌러야 나갑니다.
//     여기는 「넣으세요」를 알리기만 합니다.
//
//  ⚠️ 이 알림이 자동 발송을 대신하는 유일한 안전장치입니다.
//     안 오면 발주가 통째로 빠집니다. 함부로 끄지 마십시오.
//
//  ⚠️ 트리거 이름은 그대로 둡니다 (sendCartDue).
//     바꾸면 이미 걸려 있는 트리거가 죽은 함수를 불러 조용히 아무 일도 안 합니다.
// ══════════════════════════════════════════════════════════
function sendCartDue() {
  const now = new Date();
  const biz = getBusinessDate(now);
  const 오늘 = formatDate(biz);
  const cart = getCart(오늘);
  const 시각 = getBusinessHour(now) * 60 + now.getMinutes();   // 영업일 기준 분

  // ── ① 발주 넣으라는 알림 ──
  CART_ALERTS.forEach(function (a) {
    const 알릴때 = a.hour * 60 + a.min;
    if (시각 < 알릴때) return;

    // 그 알림이 맡은 업체 중 아직 안 보낸 것
    const 대상 = {};
    cart.items.forEach(function (it) {
      if (CART_SKIP.indexOf(it.supplier) >= 0) return;
      if (cart.sent[it.supplier]) return;                       // 이미 보냈습니다
      const 미락인가 = (it.supplier === '미락');
      const 맡았나 = a.업체들 ? (a.업체들.indexOf(it.supplier) >= 0) : !미락인가;
      if (맡았나) {
        if (!대상[it.supplier]) 대상[it.supplier] = 0;
        대상[it.supplier]++;
      }
    });
    const 업체들 = Object.keys(대상);
    if (!업체들.length) return;                                  // 담긴 게 없으면 조용히

    // 이미 알렸나 — 처음이면 보내고, 45분이 지났으면 한 번 더
    const 전에 = cart.alerted && cart.alerted[a.이름];
    if (전에 !== undefined && 전에 !== null) {
      if (시각 - 전에 < CART_ALERT_REPEAT_MIN) return;
      if (cart.alertedTwice && cart.alertedTwice[a.이름]) return;  // 두 번이면 그만
    }

    const 줄 = 업체들.map(function (s) { return s + ' ' + 대상[s] + '건'; }).join(' · ');
    const 제목 = '발주 넣으세요 (' + a.이름 + ')';
    const body = 줄 + '\n\n앱에서 확인하고 「발주하기」를 눌러주세요.' +
                 (a.이름 === '미락' ? '\n미락은 22:30 이 마감입니다.' : '');
    const channel = getByteLen(body) > CONFIG.FOOD.SMS_MAX_BYTES ? 'LMS' : 'SMS';
    const r = sendFoodSms(CART_ALERT_PHONE,
                          (channel === 'LMS') ? body : ('[' + 제목 + '] ' + body),
                          channel, 제목);

    cartLock_(function () {
      getCartSheet_().appendRow([now, 오늘, '백석점', a.이름, body, '',
                                 r.ok ? '알림' : '알림(실패)', 'server', '']);
    });
    console.log('발주 알림(' + a.이름 + '): ' + 줄 + ' → ' + (r.ok ? '보냄' : '실패'));
  });

  // ── ② 가져갈 것 알림 (사장님 탭) ──
  //    ⚠️ 발주 문자가 이미 나간 뒤에만 보냅니다.
  //       안 나간 것을 「가져가세요」 하면 헛걸음입니다.
  const 업체별 = {};
  cart.items.forEach(function (it) {
    if (!업체별[it.supplier]) 업체별[it.supplier] = [];
    업체별[it.supplier].push(it);
  });
  Object.keys(CART_NOTIFY).forEach(function (업체) {
    if (!cart.sent[업체]) return;
    if (cart.notified[업체]) return;
    const 알릴때 = cartNotifyAt_(biz, 업체);
    if (!알릴때 || 알릴때.getTime() > now.getTime()) return;
    // ⚠️ 보낸 뒤라 바구니에서는 빠졌습니다. 보낸 줄에서 내용을 찾습니다.
    sendPickupNotice_(업체, 업체별[업체] || [], 오늘, biz);
  });
}

// ── 「오늘 가져갈 것」 문자 ──────────────────────────────
function sendPickupNotice_(업체, items, 오늘, biz) {
  const c = CART_NOTIFY[업체];
  if (!c) return;

  // 같은 품목은 합칩니다 (발주 문자와 같은 방식)
  const 합 = {}, 순서 = [];
  items.forEach(function (it) {
    if (합[it.item] === undefined) { 합[it.item] = 0; 순서.push(it.item); }
    const n = parseFloat(it.qty);
    합[it.item] += (isFinite(n) && n > 0) ? n : 0;
  });
  const 목록 = 순서.map(function (이름) {
    return 합[이름] > 0 ? (이름 + ' ' + 합[이름]) : 이름;
  }).join(' · ');

  // 문자가 나간 날(영업일+1)을 적습니다 — 오늘 가져갈 것이니까요
  const 발송일 = new Date(biz);
  발송일.setDate(발송일.getDate() + 1);

  const body = '[가져갈 것 ' + formatDateShort_(발송일) + ']\n' + 목록;
  const channel = getByteLen(body) > CONFIG.FOOD.SMS_MAX_BYTES ? 'LMS' : 'SMS';
  const r = sendFoodSms(String(c.번호).replace(/-/g, ''), body, channel);

  // ⚠️ 실패해도 표시를 남깁니다. 안 남기면 5분 뒤에 또 보냅니다.
  cartLock_(function () {
    const sheet = getCartSheet_();
    sheet.appendRow([new Date(), 오늘, '백석점', 업체, body, '',
                     r.ok ? '가져갈알림' : '가져갈알림(실패)', 'server', '']);
  });

  if (!r.ok) alertFailure('가져갈 것 알림 실패 (' + 업체 + ')', body, r.message || '알 수 없음');
  else console.log('가져갈 것 알림 보냄: ' + 업체 + ' / ' + body);
}

// ⚠️ [v4.0] 결과를 돌려줍니다 — cartSend 가 사장님 요약을 만들 때 씁니다.
//    { ok, body, message }
function sendCartFor_(업체, items, 오늘, biz, device) {
  // ⚠️ 같은 품목을 합칩니다. 출처가 달라도 업체에게는 한 줄로 가야 합니다.
  //    라면용대파 1 + 대파김치 5  →  「대파 6」
  const 합 = {};
  const 순서 = [];
  items.forEach(function (it) {
    if (합[it.item] === undefined) { 합[it.item] = 0; 순서.push(it.item); }
    const n = parseFloat(it.qty);
    합[it.item] += (isFinite(n) && n > 0) ? n : 0;
  });

  const 본문조각 = 순서.map(function (이름) {
    return 합[이름] > 0 ? (이름 + ' ' + 합[이름]) : 이름;
  });

  // ⚠️ 2026-09-29 — 머리글을 제목으로 뺍니다.
  //    그전에는 본문 맨 앞에 붙였는데, 솔라피가 제목을 안 받으면
  //    본문 앞부분을 잘라 제목으로 써서 같은 글이 두 번 보였습니다.
  //
  //      [백석점 발주 9/27(일)] 부추 3, 양파, 라        ← 제목
  //      [Web발신]
  //      [백석점 발주 9/27(일)] 부추 3, 양파, 라면, …   ← 본문
  //
  //    ⚠️ SMS 에는 제목이 없습니다. 그래서 짧을 때는 본문에 넣습니다.
  const 제목 = '백석점 발주 ' + formatDateShort_(biz);
  const 품목글 = 본문조각.join(', ');
  const channel = getByteLen('[' + 제목 + '] ' + 품목글) > CONFIG.FOOD.SMS_MAX_BYTES ? 'LMS' : 'SMS';
  const body = (channel === 'LMS') ? 품목글 : ('[' + 제목 + '] ' + 품목글);
  // ⚠️ 앱이 보낸 번호를 먼저 씁니다 (handleFoodOrder 와 같은 규칙).
  //    26-09-27 까지 여기만 CONFIG 를 먼저 봐서 사장님 번호로 나갔습니다.
  const 앱번호 = items.length ? String(items[0].phone || '') : '';
  const phone = (앱번호 || String(CONFIG.FOOD.PHONES[업체] || '')).replace(/-/g, '');

  if (!phone) {
    alertFailure('바구니 발송 실패 — 전화번호 없음', 업체 + ' / ' + body, '전화번호가 비어 있습니다');
    return { ok: false, body: body, message: '전화번호가 비어 있습니다' };
  }

  // ⚠️ 사장님 번호로 나가려 하면 한 번 더 확인합니다.
  //    사장님이 직접 사 오는 셋(원당·네이버·배달관련·사장님) 말고는 사고입니다.
  const 사장님것 = ['원당', '네이버', '배달관련', '사장님'];
  if (phone === CART_ALERT_PHONE && 사장님것.indexOf(업체) < 0) {
    console.log('⚠️ ' + 업체 + ' 발주가 사장님 번호로 나갑니다 — 번호 설정을 확인하세요');
    alertFailure('⚠️ 업체 번호가 사장님 번호입니다 (' + 업체 + ')', body,
                 'CONFIG.FOOD.PHONES 와 food.html CFG.PHONES 를 확인하세요');
  }

  const r = sendFoodSms(phone, body, channel, 제목);

  // ⚠️ 보냈다는 표시를 먼저 남깁니다. 실패했어도 남깁니다.
  //    안 남기면 또 보냅니다 — 그게 바로 막으려던 일입니다.
  cartLock_(function () {
    const sheet = getCartSheet_();
    sheet.appendRow([new Date(), 오늘, '백석점', 업체, body, '',
                     r.ok ? '보냄' : '보냄(실패)', device || 'server', '']);
  });

  logFoodOrderToSheet(오늘, [{ supplier: 업체, body: body, channel: channel,
                              items: 본문조각 }], false);

  if (!r.ok) {
    alertFailure('바구니 발송 실패 (' + 업체 + ')', body, r.message || '알 수 없음');
  } else {
    console.log('바구니 발송 완료: ' + 업체 + ' / ' + body);
  }
  return { ok: r.ok, body: body, message: r.message };
}

function formatDateShort_(d) {
  return Utilities.formatDate(d, 'Asia/Seoul', 'M/d') +
         '(' + ['일','월','화','수','목','금','토'][d.getDay()] + ')';
}

// ── 안 나간 게 남아 있으면 알린다 ────────────────────────
//    ⚠️ 예약 발송의 유일한 약점이 「조용한 누락」입니다.
//       트리거가 안 돌면 아무도 모르게 발주가 빠집니다.
//       그래서 아침에 한 번, 어제 것이 다 나갔는지 확인합니다.
function 바구니누락확인() {
  const now  = new Date();
  const 어제  = new Date(getBusinessDate(now));
  어제.setDate(어제.getDate() - 1);
  const cart = getCart(formatDate(어제));

  const 안나간업체 = {};
  cart.items.forEach(function (it) {
    if (!cart.sent[it.supplier]) 안나간업체[it.supplier] = true;
  });

  const 목록 = Object.keys(안나간업체);
  if (!목록.length) return;

  alertFailure(
    '⚠️ 어제 발주가 안 나갔습니다 (' + 목록.length + '곳)',
    formatDate(어제) + '\n\n' + 목록.join(' · ') + '\n\n담겨는 있는데 문자가 안 나갔습니다.',
    '보낼 시각에 트리거가 안 돈 것으로 보입니다. 지금 업체에 직접 연락하세요.'
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ③ 고기 발주 처리
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function handleOrder(data) {
  const gcUse  = parseFloat(data.gc_use)  || 0;
  const gcDone = parseFloat(data.gc_done) || 0;
  const gcIng  = parseFloat(data.gc_ing)  || 0;
  const dc      = parseFloat(data.dc)      || 0;
  const mc      = parseFloat(data.mc)      || 0;
  const mcMax   = data.mc_max === true;
  const extras  = data.extras || [];

  const now       = new Date();

  // [v2.2] 달력상의 오늘이 아니라 "영업일" 로 판단한다.
  //        화요일 00:35 에 넣은 발주는 월요일 영업분이다. 위 getBusinessDate 설명 참고.
  const bizNow    = getBusinessDate(now);
  const dateStr   = formatDate(bizNow);
  const dayOfWeek = bizNow.getDay();

  // [v2.1 일반화] 화요일 고정휴무 + 공휴일을 모두 반영해서 서버가 직접
  // 지연발송 여부를 판단한다 (프론트가 보내는 monday_delay 값은 더 이상 사용 안 함 —
  // 예전엔 월요일일 때만 이 처리가 됐어서 다른 휴무일 전날 주문은 그냥 나가버렸음).
  const tomorrowCheck = new Date(bizNow);
  tomorrowCheck.setDate(bizNow.getDate() + 1);

  // [v2.2] 영업일이 화요일이면 내일(수요일)이 영업일이라도 저녁까지 모아둔다.
  //        화요일은 가게가 쉬는 날이라 낮에 넣은 발주도 저녁에 한 번에 보내는 게
  //        사장님이 쓰시던 방식이다. (식자재 20:30, 고기 20:00)
  // 고기는 업체 기준으로 본다 — 업체가 쉬면 납품을 못 받으므로 다음 영업일로 미룬다.
  const isMondayDelay = isMeatVendorClosed(tomorrowCheck) || isOurClosedDay(bizNow);

  const currentStock = gcUse + gcDone + gcIng;
  const target       = getTargetWithHoliday(now, dayOfWeek);
  const rawOrder     = target - currentStock;
  const calcOrder    = rawOrder <= 0 ? 0 : Math.round(rawOrder);
  const gcOrder      = Math.min(Math.max(calcOrder, CONFIG.BAESEOK.MIN_ORDER), CONFIG.BAESEOK.MAX_ORDER);

  console.log('발주계산 | 요일:' + dayOfWeek + ' 현재고:' + currentStock + ' 목표:' + target + ' 계산:' + calcOrder + ' 최종:' + gcOrder + ' 지연발송:' + isMondayDelay);

  logOrderToSheet(dateStr, gcUse, gcDone, gcIng, currentStock, target, gcOrder, dc, mc, extras, isMondayDelay);

  const orderParts = ['곱창 ' + gcOrder + '개'];
  if (dc > 0) orderParts.push('대창 ' + dc + '개');
  if (mcMax)       orderParts.push('막창 최대치');
  else if (mc > 0) orderParts.push('막창 ' + mc + '개');
  if (extras.length > 0) orderParts.push(extras.join(' · '));
  const orderSummary = orderParts.join(' / ');

  const baseTarget  = CONFIG.BAESEOK.TARGET_BY_DAY[dayOfWeek];
  const holidayNote = target > baseTarget ? ' (+1 연휴보정)' : '';
  const minNote     = gcOrder === CONFIG.BAESEOK.MIN_ORDER && calcOrder < CONFIG.BAESEOK.MIN_ORDER ? ' (최소' + CONFIG.BAESEOK.MIN_ORDER + '개 적용)' : '';
  const maxNote     = gcOrder === CONFIG.BAESEOK.MAX_ORDER && calcOrder > CONFIG.BAESEOK.MAX_ORDER ? ' (최대' + CONFIG.BAESEOK.MAX_ORDER + '개 적용)' : '';
  const bigoNote    = holidayNote + minNote + maxNote;

  if (isMondayDelay) {
    // [v2.1] 실제 발송 시점(마지막 휴무일 저녁 20시)을 계산 — 휴무일이
    // 연달아 겹쳐도(예: 공휴일+화요일) 정확한 다음 영업일까지 자동으로 건너뜀
    let deliveryDay = new Date(bizNow);
    deliveryDay.setDate(bizNow.getDate() + 1);
    while (isMeatVendorClosed(deliveryDay)) {
      deliveryDay.setDate(deliveryDay.getDate() + 1);
    }
    const sendDay = new Date(deliveryDay);
    sendDay.setDate(deliveryDay.getDate() - 1);
    sendDay.setHours(20, 0, 0, 0);

    const DOW_KR = ['일', '월', '화', '수', '목', '금', '토'];
    const sendDayLabel = DOW_KR[sendDay.getDay()] + '요일';

    // [v2.2] 예약 시각이 이미 지났으면 트리거를 걸 수 없다.
    //        예: 화요일 21시에 발주 → 화요일 20시는 이미 과거.
    //        이 경우 모아둘 이유가 없으므로 바로 보낸다.
    if (sendDay.getTime() <= now.getTime()) {
      console.log('예약 시각이 이미 지남 → 즉시 발송으로 전환 (' + sendDayLabel + ' 20:00)');
      const rn = sendAlimtalk(CONFIG.VENDOR_NUMBER, CONFIG.KAKAO.TEMPLATES.VENDOR_ORDER, {
        '날짜'     : dateStr,
        '발주요약' : orderSummary,
      });
      if (!rn.ok) {
        alertFailure('고기 발주 업체 발송 실패 (예약시각 경과분)', orderSummary, rn.error);
        return jsonResponse({ ok: false, gc_order: gcOrder, target: target, error: rn.error });
      }
      sendAlimtalk(CONFIG.OWNER_NUMBER, CONFIG.KAKAO.TEMPLATES.ORDER_REPORT, {
        '날짜'     : dateStr,
        '쓰는것'   : String(gcUse),
        '연육완료' : String(gcDone),
        '연육중'   : String(gcIng),
        '목표'     : String(target) + (bigoNote ? bigoNote : ''),
        '발주요약' : orderSummary + '\n▶ 예약시각이 지나 바로 발송했습니다',
      });
      return jsonResponse({ ok: true, gc_order: gcOrder, target: target });
    }

    const props = PropertiesService.getScriptProperties();
    props.setProperty('PENDING_MONDAY_ORDER', JSON.stringify({
      dateStr      : dateStr,
      orderSummary : orderSummary,
    }));

    ScriptApp.getProjectTriggers().forEach(function(t) {
      if (t.getHandlerFunction() === 'sendPendingMondayOrder') ScriptApp.deleteTrigger(t);
    });

    ScriptApp.newTrigger('sendPendingMondayOrder').timeBased().at(sendDay).create();

    console.log('휴무 감지 → 발주 예약 완료 → ' + sendDayLabel + ' 20:00 업체 발송 예정: ' + orderSummary);

    const rp = sendAlimtalk(CONFIG.OWNER_NUMBER, CONFIG.KAKAO.TEMPLATES.ORDER_REPORT, {
      '날짜'     : dateStr + ' ⏰예약',
      '쓰는것'   : String(gcUse),
      '연육완료' : String(gcDone),
      '연육중'   : String(gcIng),
      '목표'     : String(target) + (bigoNote ? bigoNote : ''),
      '발주요약' : orderSummary + '\n▶ ' + sendDayLabel + ' 20:00 업체 자동발송',
    });

    // 예약 자체는 저장됐으므로 실패해도 발주는 살아있다.
    // 다만 "예약됐다"는 확인을 못 받으신 상태이므로 알려드린다.
    if (!rp.ok) {
      alertFailure('발주 예약 확인 알림톡 실패 (예약 자체는 정상)',
                   orderSummary + ' → ' + sendDayLabel + ' 20:00 발송 예정', rp.error);
    }

    return jsonResponse({ ok: true, gc_order: gcOrder, target: target, scheduled: true });
  }

  const r1 = sendAlimtalk(CONFIG.OWNER_NUMBER, CONFIG.KAKAO.TEMPLATES.ORDER_REPORT, {
    '날짜'     : dateStr,
    '쓰는것'   : String(gcUse),
    '연육완료' : String(gcDone),
    '연육중'   : String(gcIng),
    '목표'     : String(target) + (bigoNote ? bigoNote : ''),
    '발주요약' : orderSummary,
  });

  const r2 = sendAlimtalk(CONFIG.VENDOR_NUMBER, CONFIG.KAKAO.TEMPLATES.VENDOR_ORDER, {
    '날짜'     : dateStr,
    '발주요약' : orderSummary,
  });

  // 업체 발송(r2)이 진짜다. 사장님 보고(r1)는 못 받아도 발주는 나가야 한다.
  if (!r2.ok) {
    alertFailure('고기 발주 업체 발송 실패', orderSummary, r2.error);
    return jsonResponse({ ok: false, gc_order: gcOrder, target: target, error: r2.error });
  }
  if (!r1.ok) {
    console.log('사장님 보고 알림톡만 실패 (업체 발송은 성공): ' + r1.error);
  }

  return jsonResponse({ ok: true, gc_order: gcOrder, target: target });
}


// ── 휴무일(화요일+공휴일) 20:00 고기 발주 트리거 [v2.1 일반화] ──
function sendPendingMondayOrder() {
  const props      = PropertiesService.getScriptProperties();
  const pendingStr = props.getProperty('PENDING_MONDAY_ORDER');
  if (!pendingStr) { console.log('예약된 발주 없음 → 종료'); return; }

  const pending = JSON.parse(pendingStr);
  props.deleteProperty('PENDING_MONDAY_ORDER');

  const r = sendAlimtalk(CONFIG.VENDOR_NUMBER, CONFIG.KAKAO.TEMPLATES.VENDOR_ORDER, {
    '날짜'     : pending.dateStr,
    '발주요약' : pending.orderSummary,
  });

  // 트리거는 성공·실패와 무관하게 정리한다 (안 지우면 다음 예약과 겹친다)
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'sendPendingMondayOrder') ScriptApp.deleteTrigger(t);
  });

  if (!r.ok) {
    // 예약 발송은 사장님이 화면을 보고 있지 않은 시각(20:00)에 돌아간다.
    // 여기서 놓치면 다음 날 고기가 안 들어온다.
    alertFailure('예약 고기 발주 업체 발송 실패', pending.orderSummary, r.error);
    return;
  }

  console.log('예약 발주 업체 발송 완료: ' + pending.orderSummary);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ④ 입고 처리 (기존 그대로)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function handleStock(data) {
  const gc     = parseInt(data.gc)  || 0;
  const dc     = parseInt(data.dc)  || 0;
  const mc     = parseInt(data.mc)  || 0;
  const bs     = parseInt(data.bs)  || 0;
  const extras = data.extras || [];

  const dateStr = formatDate(new Date());
  logStockToSheet(dateStr, gc, dc, mc, bs, extras);

  const stockParts = [];
  if (gc > 0) stockParts.push('곱창 ' + gc + '개');
  if (dc > 0) stockParts.push('대창 ' + dc + '개');
  if (mc > 0) stockParts.push('막창 ' + mc + '개');
  if (bs > 0) stockParts.push('박스 ' + bs + '개');
  if (extras.length > 0) stockParts.push(extras.join(' · '));
  const stockSummary = stockParts.length > 0 ? stockParts.join(' / ') : '입고 없음';

  const stockVars = { '날짜': dateStr, '입고요약': stockSummary };
  const s1 = sendAlimtalk(CONFIG.OWNER_NUMBER,  CONFIG.KAKAO.TEMPLATES.STOCK_REPORT, stockVars);
  const s2 = sendAlimtalk(CONFIG.VENDOR_NUMBER, CONFIG.KAKAO.TEMPLATES.STOCK_REPORT, stockVars);

  if (!s1.ok || !s2.ok) {
    alertFailure('입고 알림 발송 실패', stockSummary, (s1.error || s2.error));
    return jsonResponse({ ok: false, error: (s1.error || s2.error) });
  }

  return jsonResponse({ ok: true });
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ⑤ [v2.0] 식자재 발주 처리
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function handleFoodOrder(data) {
  const msgs    = data.messages || [];
  const now     = new Date();
  const bizNow  = getBusinessDate(now);
  const dateStr = formatDate(bizNow);

  // [v2.2] 화면이 보내주는 delay_to_tuesday 를 그대로 믿지 않고 서버가 다시 판단한다.
  //
  //   왜 바꿨나 — 2026-08-18
  //     화면(food.html)이 날짜는 영업일로 보면서 시각은 실제 시계로 봤다.
  //     그래서 화요일 00:35 에 넣은 월요일 영업분 발주가 "월요일 0시" 로 판단되어
  //     즉시 발송으로 나가버렸다. 화요일 저녁에 나갔어야 했다.
  //
  //   화면도 같이 고쳤지만, 브라우저에 옛 화면이 캐시돼 있으면 또 틀린 값이 온다.
  //   고기 발주는 이미 서버가 직접 판단하고 있었다. 식자재도 같은 방식으로 맞춘다.
  const delayed  = shouldHoldUntilTuesday(now);
  const 화면판단  = data.delay_to_tuesday === true;
  if (delayed !== 화면판단) {
    console.log('⚠️ 화면과 서버 판단이 다름 → 서버 기준 적용 | 화면:' + 화면판단 +
                ' 서버:' + delayed + ' (영업일 ' + dateStr + ', 실제 ' + now + ')');
  }

  if (msgs.length === 0) return jsonResponse({ ok: false, message: '발주 항목 없음' });

  // 스프레드시트 기록 (즉시 / 예약 모두)
  logFoodOrderToSheet(dateStr, msgs, delayed);

  if (delayed && scheduleFoodTrigger(now)) {
    // 월·화 발주 → 화요일 20:30 예약
    savePendingFoodOrder(msgs, dateStr);

    console.log('식자재 발주 화요일 예약 완료: ' + dateStr);
    return jsonResponse({ ok: true, status: 'scheduled' });

  } else {
    // [v2.2] 예약 시각(화요일 20:30)이 이미 지났으면 모아둘 이유가 없다 → 즉시 발송
    // 즉시 발송
    const results = [];
    const 실패   = [];
    msgs.forEach(function(m) {
      const phone = (m.phone || CONFIG.FOOD.PHONES[m.supplier] || '').replace(/-/g, '');
      if (!phone) {
        console.log(m.supplier + ' 전화번호 없음 → skip');
        results.push({ supplier: m.supplier, ok: false, message: '전화번호 없음' });
        실패.push(m.supplier + ': 전화번호 없음');
        return;
      }
      const r = sendFoodSms(phone, m.body, m.channel);
      results.push({ supplier: m.supplier, ok: r.ok, channel: m.channel });
      if (!r.ok) 실패.push(m.supplier + ': ' + r.message);
    });

    if (실패.length) {
      alertFailure(
        '식자재 발주 발송 실패 (' + 실패.length + '/' + msgs.length + '건)',
        buildFoodOwnerSummary(msgs),
        실패.join(' / ')
      );
      return jsonResponse({ ok: false, results: results, failed: 실패 });
    }

    console.log('식자재 발주 즉시 발송 완료: ' + dateStr);
    return jsonResponse({ ok: true, results: results });
  }
}


// ── 화요일 20:30 식자재 트리거 설정 ──────────────────────────
// Returns: true = 예약 완료 / false = 예약 시각이 이미 지나 예약할 수 없음
function scheduleFoodTrigger(now) {
  // 기존 트리거 중복 제거
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'sendPendingFoodOrder') ScriptApp.deleteTrigger(t);
  });

  // [v2.2] 달력상의 오늘이 아니라 영업일 기준으로 화요일을 찾는다.
  //        화요일 00:35 은 월요일 영업분이므로 "다음 날(화요일) 20:30" 이 맞다.
  //        예전 코드는 now.getDay() 를 써서 이때 화요일(2)로 보고
  //        그날 20:30 으로 잡았는데, 그건 우연히 맞았을 뿐 의미가 달랐다.
  const bizNow      = getBusinessDate(now);
  const triggerTime = new Date(bizNow);
  if (bizNow.getDay() === 1) triggerTime.setDate(bizNow.getDate() + 1); // 월요일 영업분 → 화요일
  triggerTime.setHours(20, 30, 0, 0);

  // 예약 시각이 이미 지났으면 트리거를 걸 수 없다 (예: 화요일 21시 발주).
  if (triggerTime.getTime() <= now.getTime()) {
    console.log('식자재 예약 시각이 이미 지남 → 예약 불가 (' + triggerTime + ')');
    return false;
  }

  ScriptApp.newTrigger('sendPendingFoodOrder').timeBased().at(triggerTime).create();
  console.log('식자재 발주 트리거 설정: ' + triggerTime);
  return true;
}


// ── 식자재 예약 저장 ──────────────────────────────────────────
function savePendingFoodOrder(msgs, dateStr) {
  PropertiesService.getScriptProperties().setProperty(
    'PENDING_FOOD_ORDER',
    JSON.stringify({ msgs: msgs, dateStr: dateStr })
  );
}


// ── 화요일 20:30 자동 실행 (트리거 함수) ─────────────────────
function sendPendingFoodOrder() {
  const props = PropertiesService.getScriptProperties();
  const raw   = props.getProperty('PENDING_FOOD_ORDER');
  if (!raw) { console.log('예약된 식자재 발주 없음'); return; }

  const pending = JSON.parse(raw);
  props.deleteProperty('PENDING_FOOD_ORDER');

  const 실패 = [];
  pending.msgs.forEach(function(m) {
    const phone = (m.phone || CONFIG.FOOD.PHONES[m.supplier] || '').replace(/-/g, '');
    if (!phone) {
      console.log(m.supplier + ' 전화번호 없음 → skip');
      실패.push(m.supplier + ': 전화번호 없음');
      return;
    }
    const r = sendFoodSms(phone, m.body, m.channel);
    if (!r.ok) 실패.push(m.supplier + ': ' + r.message);
  });

  // 실행된 트리거 자체 삭제
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'sendPendingFoodOrder') ScriptApp.deleteTrigger(t);
  });

  if (실패.length) {
    // 업체별로 메일이 쏟아지지 않게 한 통으로 모아서 보낸다
    alertFailure(
      '예약 식자재 발주 발송 실패 (' + 실패.length + '/' + pending.msgs.length + '건)',
      buildFoodOwnerSummary(pending.msgs),
      실패.join(' / ')
    );
    return;
  }

  console.log('화요일 예약 식자재 발주 발송 완료');
}


// ── 식자재 채널별 발송 라우터 ─────────────────────────────────
function sendFoodSms(to, body, channel, subject) {
  // KAKAO 채널은 알림톡 템플릿 없으므로 LMS로 대체
  if (channel === 'KAKAO') return sendSms(to, body, 'LMS', subject);
  return sendSms(to, body, channel || 'SMS', subject);
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ⑥ 목표재고 계산 / 공휴일 보정 (기존 그대로)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getTargetWithHoliday(today, dayOfWeek) {
  const base = CONFIG.BAESEOK.TARGET_BY_DAY[dayOfWeek];
  if (checkUpcomingHoliday(today)) {
    console.log('공휴일 감지 → 목표재고 +1개 보정 (' + base + ' → ' + (base + 1) + ')');
    return base + 1;
  }
  return base;
}

function checkUpcomingHoliday(today) {
  if (CONFIG.HOLIDAY_API_KEY) {
    try {
      const year         = today.getFullYear();
      const month        = today.getMonth() + 1;
      const holidays     = getPublicHolidays(year, month);
      const nextMonth    = month === 12 ? 1 : month + 1;
      const nextYear     = month === 12 ? year + 1 : year;
      const holidaysNext = getPublicHolidays(nextYear, nextMonth);
      const all          = holidays.concat(holidaysNext);
      for (let i = 1; i <= 7; i++) {
        const d   = new Date(today);
        d.setDate(today.getDate() + i);
        const key = String(d.getFullYear()) +
          String(d.getMonth()+1).padStart(2,'0') +
          String(d.getDate()).padStart(2,'0');
        if (all.includes(key)) { console.log('공휴일 감지: ' + key); return true; }
      }
      return false;
    } catch (err) {
      console.log('공휴일 API 오류 → 주말 체크로 대체: ' + err.message);
    }
  }
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dow = tomorrow.getDay();
  return (dow === 5 || dow === 6);
}

function getPublicHolidays(year, month) {
  const url =
    'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo' +
    '?serviceKey=' + encodeURIComponent(CONFIG.HOLIDAY_API_KEY) +
    '&solYear=' + year +
    '&solMonth=' + String(month).padStart(2,'0') +
    '&_type=json&numOfRows=50';
  const res   = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const json  = JSON.parse(res.getContentText());
  const items = json?.response?.body?.items?.item;
  if (!items) return [];
  const list  = Array.isArray(items) ? items : [items];
  return list.map(function(item) { return String(item.locdate); });
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ⑦ 알림 트리거 (기존 그대로)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function sendOrderReminder() {
  const now       = new Date();
  const dayOfWeek = now.getDay();
  if (dayOfWeek === 6) { console.log('토요일 → 발주 알림 skip'); return; }
  if (dayOfWeek === 2) { console.log('화요일 (백석 휴무) → 발주 알림 skip'); return; }
  if (isTomorrowNoDelivery(now)) { console.log('내일 납품 없음 → 발주 알림 skip'); return; }

  const dateStr   = formatDate(now);
  const webAppUrl = ScriptApp.getService().getUrl();
  const r = sendAlimtalk(CONFIG.BAESEOK_ADMIN, CONFIG.KAKAO.TEMPLATES.ORDER_REMINDER, {
    '날짜' : dateStr,
    '링크' : webAppUrl,
  });
  // 알림이 안 오면 발주 자체를 잊어버린다. 이것도 알아야 한다.
  if (!r.ok) alertFailure('발주 알림 발송 실패', dateStr + ' 발주 알림', r.error);
}

function sendStockReminder() {
  const now       = new Date();
  const dayOfWeek = now.getDay();
  if (dayOfWeek === 6) { console.log('토요일 → 입고 알림 skip'); return; }
  if (isTomorrowNoDelivery(now)) { console.log('내일 납품 없음 → 입고 알림 skip'); return; }

  const dateStr   = formatDate(now);
  const webAppUrl = ScriptApp.getService().getUrl();
  const r = sendAlimtalk(CONFIG.BAESEOK_ADMIN, CONFIG.KAKAO.TEMPLATES.ORDER_REMINDER, {
    '날짜' : dateStr,
    '링크' : webAppUrl,
  });
  if (!r.ok) alertFailure('입고 알림 발송 실패', dateStr + ' 입고 알림', r.error);
}

function isTomorrowNoDelivery(today) {
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dow = tomorrow.getDay();
  if (dow === 0) return true;
  if (CONFIG.HOLIDAY_API_KEY) {
    try {
      const year     = tomorrow.getFullYear();
      const month    = tomorrow.getMonth() + 1;
      const holidays = getPublicHolidays(year, month);
      const key      = String(year) + String(month).padStart(2,'0') + String(tomorrow.getDate()).padStart(2,'0');
      if (holidays.includes(key)) { console.log('내일 공휴일: ' + key); return true; }
    } catch (err) { console.log('공휴일 API 오류: ' + err.message); }
  }
  return false;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ⑧ Solapi 카카오 알림톡 발송 (기존 그대로)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// 반환값: { ok: true } 또는 { ok: false, error: '사유' }
//   예전에는 아무것도 돌려주지 않아서, 호출한 쪽이 실패를 알 방법이 없었다.
//   그래서 실패해도 다음 줄에서 "발송 완료" 를 찍어버렸다. (2026-08-11 사고)
//
function sendAlimtalk(to, templateId, variables) {
  if (!CONFIG.SOLAPI_API_KEY || !CONFIG.SOLAPI_API_SECRET) {
    return { ok: false, error: '솔라피 키 미설정 — 프로젝트 설정 > 스크립트 속성 확인' };
  }

  const date      = new Date().toISOString();
  const salt      = Utilities.getUuid();
  const signature = computeHmac(CONFIG.SOLAPI_API_SECRET, date + salt);

  const fv = {};
  Object.keys(variables).forEach(function(k) {
    fv[k.startsWith('#{') ? k : '#{' + k + '}'] = variables[k];
  });
  console.log('전송 변수: ' + JSON.stringify(fv));

  const payload = {
    message: {
      to           : to,
      from         : CONFIG.SENDER_NUMBER,
      kakaoOptions : {
        pfId       : CONFIG.KAKAO.PFID,
        templateId : templateId,
        variables  : fv,
      }
    }
  };

  try {
    const res = UrlFetchApp.fetch('https://api.solapi.com/messages/v4/send', {
      method             : 'post',
      contentType        : 'application/json',
      headers            : {
        'Authorization' : 'HMAC-SHA256 apiKey=' + CONFIG.SOLAPI_API_KEY + ', date=' + date + ', salt=' + salt + ', signature=' + signature
      },
      payload            : JSON.stringify(payload),
      muteHttpExceptions : true,
    });

    const result = JSON.parse(res.getContentText());
    if (result.errorCode) {
      console.log('알림톡 오류: ' + JSON.stringify(result));
      return { ok: false, error: (result.errorMessage || result.errorCode) };
    }
    console.log('알림톡 발송완료 → ' + to + ' | ' + templateId);
    return { ok: true };

  } catch (err) {
    console.log('알림톡 예외: ' + err.message);
    return { ok: false, error: err.message };
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ⑨ [v2.0] Solapi SMS / LMS 발송 (식자재 발주용)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ⚠️ subject(제목) — LMS 에서만 씁니다   2026-09-29
//
//  사장님 지적: 문자가 이렇게 왔습니다
//
//     [백석점 발주 9/27(일)] 부추 3, 양파, 라        ← 제목 (앞부분이 잘림)
//     [Web발신]
//     [백석점 발주 9/27(일)] 부추 3, 양파, 라면, …   ← 본문
//
//  제목을 안 주면 **솔라피가 본문 앞부분을 잘라 제목으로 씁니다.**
//  그래서 같은 글이 두 번 보이고 지저분했습니다.
//
//  ⚠️ 제목은 40바이트까지입니다. 넘으면 솔라피가 거절합니다.
//  ⚠️ SMS 에는 제목이 없습니다. 그래서 SMS 일 때는 본문에 머리글을 넣습니다.
function sendSms(to, text, type, subject) {
  // type 미지정이면 바이트 수로 자동 판단
  if (!type) type = getByteLen(text) > CONFIG.FOOD.SMS_MAX_BYTES ? 'LMS' : 'SMS';

  const date = new Date().toISOString();
  const salt = Utilities.getUuid();
  const sig  = computeHmac(CONFIG.SOLAPI_API_SECRET, date + salt);

  const payload = {
    message: {
      to   : to.replace(/-/g, ''),
      from : CONFIG.SENDER_NUMBER,
      text : text,
      type : type,
    }
  };

  // ⚠️ LMS 일 때만. SMS 에 subject 를 넣으면 솔라피가 거절합니다.
  if (type === 'LMS' && subject) {
    let s = String(subject);
    while (getByteLen(s) > 40) s = s.slice(0, -1);   // 40바이트로 자릅니다
    payload.message.subject = s;
  }

  try {
    const res = UrlFetchApp.fetch('https://api.solapi.com/messages/v4/send', {
      method             : 'post',
      contentType        : 'application/json',
      headers            : {
        'Authorization' : 'HMAC-SHA256 apiKey=' + CONFIG.SOLAPI_API_KEY + ', date=' + date + ', salt=' + salt + ', signature=' + sig
      },
      payload            : JSON.stringify(payload),
      muteHttpExceptions : true,
    });
    const result = JSON.parse(res.getContentText());
    if (result.errorCode) {
      console.log('SMS 오류 [' + to + '] ' + JSON.stringify(result));
      return { ok: false, message: result.errorCode };
    }
    console.log('SMS 발송완료 → ' + to + ' (' + type + ')');
    return { ok: true };
  } catch (err) {
    console.log('SMS 예외: ' + err.message);
    return { ok: false, message: err.message };
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ⑩ 스프레드시트 기록
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function logOrderToSheet(dateStr, gcUse, gcDone, gcIng, total, target, gcOrder, dc, mc, extras, isMondayDelay) {
  const ss    = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_ORDER) || ss.insertSheet(CONFIG.SHEET_ORDER);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['날짜','지점','쓰는것','연육완료','연육중','현재고','목표','발주(곱창)','대창','막창','추가주문','비고']);
  }
  const baseTarget  = CONFIG.BAESEOK.TARGET_BY_DAY[new Date().getDay()];
  const holidayNote = target > baseTarget ? '연휴보정' : '-';
  const delayNote   = isMondayDelay ? ' (휴무 지연발송)' : '';
  sheet.appendRow([dateStr,'백석점',gcUse,gcDone,gcIng,total,target,gcOrder,dc,mc,extras.join(', '),holidayNote+delayNote]);
}

function logStockToSheet(dateStr, gc, dc, mc, bs, extras) {
  const ss    = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_STOCK) || ss.insertSheet(CONFIG.SHEET_STOCK);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['날짜','지점','곱창 입고','대창 입고','막창 입고','박스 입고','기타']);
  }
  sheet.appendRow([dateStr,'백석점',gc,dc,mc,bs,extras.join(', ')]);
}

// [v2.0] 식자재 발주 기록
function logFoodOrderToSheet(dateStr, msgs, delayed) {
  try {
    const ss    = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet   = ss.getSheetByName(CONFIG.FOOD.SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.FOOD.SHEET_NAME);
      sheet.appendRow(['날짜', '지점', '업체', '발주항목', '채널', '즉시/예약']);
      sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#ede9fe');
    }
    msgs.forEach(function(m) {
      sheet.appendRow([
        dateStr, '백석점', m.supplier,
        (m.items ? m.items.join(', ') : m.body), m.channel,
        delayed ? '예약(화20:30)' : '즉시',
      ]);
    });
  } catch (err) {
    console.log('식자재 시트 기록 오류: ' + err.message);
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ⑪ 테스트 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ★ 코드 교체 후 가장 먼저 실행 — 스크립트 속성에 키가 들어있는지 확인
function checkSolapiKeys() {
  const k = CONFIG.SOLAPI_API_KEY;
  const s = CONFIG.SOLAPI_API_SECRET;
  console.log('SOLAPI_API_KEY    : ' + (k ? '설정됨 (' + k.length + '자, 앞4자 ' + k.slice(0, 4) + ')' : '❌ 비어있음'));
  console.log('SOLAPI_API_SECRET : ' + (s ? '설정됨 (' + s.length + '자)' : '❌ 비어있음'));
  if (!k || !s) {
    console.log('\n👉 프로젝트 설정(⚙️) → 맨 아래 스크립트 속성 → 스크립트 속성 추가');
    console.log('   SOLAPI_API_KEY / SOLAPI_API_SECRET 두 개를 등록하세요.');
    return;
  }
  console.log('\n✅ 키 정상. testFailureAlert() 로 실패 알림도 확인해 보세요.');
}

// ★ 실패 알림이 실제로 오는지 테스트 (메일 1통 + 발송실패 시트 1줄)
function testFailureAlert() {
  alertFailure('테스트 알림', '곱창 2개 / 대창 1개 (테스트)', '이건 테스트입니다 — 무시하세요');
  console.log('→ ' + CONFIG.OWNER_EMAIL + ' 메일함과 「발송실패」 시트를 확인하세요.');
}

// 기존 — 카카오 알림톡 테스트
function testAlimtalk() {
  sendAlimtalk(CONFIG.OWNER_NUMBER, CONFIG.KAKAO.TEMPLATES.ORDER_REPORT, {
    '날짜'     : '26.04.26(토)',
    '쓰는것'   : '1.5',
    '연육완료' : '0.5',
    '연육중'   : '0.5',
    '목표'     : '3',
    '발주요약' : '곱창 2개 / 대창 1개',
  });
}

// 기존 — 예약 발주 테스트
function testMondayDelayOrder() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('PENDING_MONDAY_ORDER', JSON.stringify({
    dateStr      : formatDate(new Date()),
    orderSummary : '곱창 2개 (테스트)',
  }));
  console.log('테스트 예약 저장 완료 → sendPendingMondayOrder() 실행하여 확인');
}

// [v2.1] 휴무일 판정 테스트
function testIsClosedDay() {
  const d = new Date();
  console.log('오늘: ' + formatDate(d) + ' / 우리휴무:' + isOurClosedDay(d) + ' 고기업체휴무:' + isMeatVendorClosed(d));
  const t = new Date(d);
  t.setDate(d.getDate() + 1);
  console.log('내일: ' + formatDate(t) + ' / 우리휴무:' + isOurClosedDay(t) + ' 고기업체휴무:' + isMeatVendorClosed(t));
}

// [v2.0] 식자재 SMS 발송 테스트 (사장님 번호로)
function testFoodSms() {
  const r = sendSms(
    CONFIG.OWNER_NUMBER,
    '[테스트] 백석점 식자재발주\n미락: 양파 2, 부추 1\n네이버: 들기름, 쌀'
  );
  console.log('식자재 SMS 테스트 결과: ' + JSON.stringify(r));
}

// [v2.0] 식자재 화요일 예약 발송 시뮬레이션
function testFoodDelayOrder() {
  savePendingFoodOrder([
    { supplier:'미락',   items:['양파 2','부추 1'], body:'[백석점 발주 테스트]\n양파 2, 부추 1', channel:'SMS', phone:'' },
    { supplier:'네이버', items:['들기름','쌀'],     body:'[백석점 발주 테스트]\n들기름, 쌀',    channel:'SMS', phone:'' },
  ], formatDate(new Date()));
  console.log('식자재 예약 저장 완료 → sendPendingFoodOrder() 수동 실행으로 발송 테스트 가능');
}

// [v2.0] 예약 저장 내용 확인
function checkPendingFoodOrder() {
  const raw = PropertiesService.getScriptProperties().getProperty('PENDING_FOOD_ORDER');
  console.log(raw ? '저장된 식자재 발주: ' + raw : '저장된 식자재 발주 없음');
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ⑫ 유틸
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildFoodOwnerSummary(msgs) {
  return msgs.map(function(m) {
    return m.supplier + ': ' + (m.items ? m.items.join(', ') : m.body);
  }).join('\n');
}

// [v2.0] 바이트 길이 계산 (SMS 한글 90바이트 기준)
function getByteLen(str) {
  let n = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    n += c <= 0x7F ? 1 : c <= 0x7FF ? 2 : 3;
  }
  return n;
}

function computeHmac(secret, data) {
  const hash = Utilities.computeHmacSha256Signature(
    Utilities.newBlob(data).getBytes(),
    Utilities.newBlob(secret).getBytes()
  );
  return hash.map(function(b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function formatDate(d) {
  const days = ['일','월','화','수','목','금','토'];
  return String(d.getFullYear()).slice(2) + '.' +
    String(d.getMonth()+1).padStart(2,'0') + '.' +
    String(d.getDate()).padStart(2,'0') + '(' + days[d.getDay()] + ')';
}

function pad(val, len) {
  let s = String(val);
  while (s.length < len) s = ' ' + s;
  return s;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
