# -*- coding: utf-8 -*-
"""생성된 .docx의 구조(압축·XML), 핵심 수치 포함 여부, 표 폭 일관성, 개인정보 패턴을 점검한다."""
import os, re, zipfile, xml.dom.minidom as md

HERE = os.path.dirname(os.path.abspath(__file__))
p = os.environ.get('DOCX_PATH') or os.path.join(os.path.dirname(HERE), 'thereum_쇼핑몰_분석보고서.docx')
z = zipfile.ZipFile(p)
ok = True


def check(name, cond, detail=''):
    global ok
    print(('PASS ' if cond else 'FAIL ') + name + (' — ' + detail if detail else ''))
    ok = ok and cond


check('zip 무결성', z.testzip() is None)
for n in ['word/document.xml', 'word/styles.xml', 'word/numbering.xml', 'word/settings.xml']:
    try:
        md.parseString(z.read(n)); check('XML 형식 ' + n, True)
    except Exception as e:
        check('XML 형식 ' + n, False, str(e))
doc = z.read('word/document.xml').decode('utf8')
text = re.sub(r'<[^>]+>', '', doc.replace('</w:p>', '\n'))
check('표 22개(설계 수)', doc.count('<w:tbl>') == 22, str(doc.count('<w:tbl>')))
check('제목1 15개 이상', doc.count('w:val="Heading1"') >= 15, str(doc.count('w:val="Heading1"')))
check('목차 필드 + 열 때 갱신', 'TOC' in doc and 'updateFields' in z.read('word/settings.xml').decode('utf8'))
for must in ['880', '11,318', '24,189', '19,278', '2,869', '3,347,000', '1.028', '0.99991', '미확인 사항과 후속 작업', '합계', '개인결제창', '정식 상품명', '1x2(1단오픈) 수납 모듈', '상품명 규칙', '운영 방식·서비스·마케팅 조사', 'Assemblee', '43.5%', '광고 투명성 센터']:
    check('본문에 "' + must + '" 포함', must in text)
mism = 0
for m in re.finditer(r'<w:tbl>.*?</w:tbl>', doc, re.S):
    t = m.group(0)
    grid = sum(int(x) for x in re.findall(r'<w:gridCol w:w="(\d+)"', t))
    tw = int(re.search(r'<w:tblW[^>]*w:w="(\d+)"', t).group(1))
    if grid != tw:
        mism += 1
check('모든 표의 열 폭 합 = 표 폭', mism == 0, str(mism) + '개 불일치')
pat = re.compile(r'[가-힣]{1,3}\*{1,2}|\b01[016789]-?\d{3,4}-?\d{4}\b|[\w.]+@[\w.]+\.\w+')
hits = pat.findall(text)
# 회사 공개 연락처(help@thereum.co.kr 등)는 본문에 넣지 않았으므로 0건이어야 한다
check('개인정보 패턴 0건', not hits, str(hits[:5]))
print('\n문서 글자 수', len(text))
raise SystemExit(0 if ok else 1)
