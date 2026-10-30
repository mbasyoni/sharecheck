const test=require('node:test'),assert=require('node:assert/strict');const {parseCSV,inspect,formula,exportReview}=require('../core.js');
for(const [name,text,expected] of [
 ['simple','a,b\n1,2',[['a','b'],['1','2']]],['CRLF','a,b\r\n1,2\r\n',[['a','b'],['1','2']]],['unicode','اسم,note\nنور,🙂',[['اسم','note'],['نور','🙂']]],['quoted comma','a,b\n"a,b",x',[['a','b'],['a,b','x']]],['escaped quote','a\n"say ""hi"""',[['a'],['say "hi"']]],['multiline','a\n"one\ntwo"',[['a'],['one\ntwo']]],['empty cell','a,b\n,',[['a','b'],['','']]],['BOM','\ufeffa\n1',[['a'],['1']]]])test(name,()=>assert.deepEqual(parseCSV(text),expected));
for(const [name,text]of [['empty',''],['header only','a'],['unclosed','a\n"x'],['quote injection','a\nx"y'],['after quote','a\n"x"z'],['ragged','a,b\n1'],['duplicate','a,a\n1,2'],['blank header',',b\n1,2'],['bytes','x'.repeat(250001)],['columns',Array(51).fill('x').join(',')+'\n'+Array(51).fill('y').join(',')],['rows','a\n'+Array(1001).fill('1').join('\n')],['cell','a\n'+'x'.repeat(10001)]])test('reject '+name,()=>assert.throws(()=>parseCSV(text)));
for(const x of ['=1',' +1','@SUM(A1)','-1','\ttext','\rtext','\u0001=1','\u00a0=1'])test('formula '+JSON.stringify(x),()=>assert.equal(formula(x),true));
test('ordinary strings',()=>['hello','12','a=b',''].forEach(v=>assert.equal(formula(v),false)));
test('all columns preserved by default',()=>assert.deepEqual(parseCSV(exportReview(parseCSV('a,b\n1,2'),[]).csv),[['a','b'],['1','2']]));
test('omission is explicit',()=>assert.deepEqual(parseCSV(exportReview([['a','b'],['x','y']],[0]).csv),[['b'],['y']]));
test('all omitted rejected',()=>assert.throws(()=>exportReview([['a'],['x']],[0])));
test('bad index rejected',()=>assert.throws(()=>exportReview([['a'],['x']],[5])));
test('escape header and data',()=>{let o=exportReview([['=a','b'],['+1','x']],[]);assert.equal(o.escaped,2);assert.deepEqual(parseCSV(o.csv),[["'=a",'b'],["'+1",'x']]);});
test('no mutation',()=>{let r=[['name','note'],['Test','=1']],s=JSON.stringify(r);inspect(r);exportReview(r,[0]);assert.equal(JSON.stringify(r),s);});
test('explainable matches',()=>{const a=inspect([['Email','misc'],['test@example.invalid','+1 202 555 0199']]);assert.equal(a[0].email,1);assert.equal(a[1].phone,1);assert.ok(a[0].reasons.length>1);});
test('no match not a guarantee',()=>assert.deepEqual(inspect([['misc'],['Avery Example']])[0].reasons,[]));
test('preview supports maximum-length escaped field',()=>{const rows=parseCSV('note\n'+'='+ 'x'.repeat(9999));const out=exportReview(rows,[]);assert.equal(out.previewRows[1][0].length,10001);assert.equal(out.escaped,1);});
test('preview bounded independently of export',()=>{const rows=[['a'],...Array.from({length:20},(_,i)=>[String(i)])];assert.equal(exportReview(rows,[]).previewRows.length,9);assert.equal(parseCSV(exportReview(rows,[]).csv).length,21);});
