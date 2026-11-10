# 사용: python -X utf8 _check.py <docx 경로> <public|installer|internal>
import sys,re,zipfile,xml.dom.minidom as md
f,mode=sys.argv[1],sys.argv[2]
z=zipfile.ZipFile(f); assert z.testzip() is None
for n in ['word/document.xml','word/styles.xml','word/numbering.xml','word/settings.xml']: md.parseString(z.read(n))
d=z.read('word/document.xml').decode('utf8'); t=re.sub(r'<[^>]+>','',d.replace('</w:p>','\n'))
print('구조 OK, 표',d.count('<w:tbl>'),'제목1',d.count('w:val="Heading1"'),'글자',len(t))
bad=['—','–','드립니다','다양한','원활','최적','를 통해','에 대한','TODO','[초안]','[결정]','계약서에 적']
print('금칙어',{b:t.count(b) for b in bad if t.count(b)})
if mode=='public':
    internal=['구상','확인 못함','확인하지 못','법률 검토','협력사','미확인','근거 자료']
    print('공개 문서 내부 용어',{b:t.count(b) for b in internal if t.count(b)})
heads=set(int(x) for x in re.findall(r'^제(\d+)조\(',t,re.M))
refs=set(int(x) for x in re.findall(r'제(\d+)조',t))
print('조항 수',len(heads),'정의 없는 인용(규정 조항을 다른 문서가 인용하면 정상)',sorted(refs-heads)[:30])
