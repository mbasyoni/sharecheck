'use strict';
const $=id=>document.getElementById(id),api=ShareCheck;
const example='Volunteer,Email,Shift,Phone,Notes\r\nAvery Example,avery@example.invalid,Morning,+1 202 555 0142,Bring signs\r\nSam Fiction,sam@example.invalid,Evening,+1 202 555 0193,"=HYPERLINK(""https://example.invalid"")"\r\nنور Test,nour@example.invalid,Morning,,"Prefers email, not calls"\r\n';
let rows=null,source=null,hash='',omitted=new Set(),version=0;
function reset(message='Session cleared.'){
  version++;
  rows=null;
  source=null;
  hash='';
  omitted.clear();
  $('review').hidden=true;
  $('columns').replaceChildren();
  $('preview').replaceChildren();
  $('confirm').checked=false;
  $('download').disabled=true;
  $('report').disabled=true;
  $('status').textContent=message;
}
function invalidate(){
  $('confirm').checked=false;
  $('download').disabled=true;
  $('report').disabled=true;
}
function draw(){
  invalidate();
  $('preview').replaceChildren();
  try{
    const output=api.exportReview(rows,[...omitted]);
    const previewRows=output.previewRows;
    previewRows.slice(0,9).forEach((row,i)=>{
      const tr=document.createElement('tr');
      row.forEach(value=>{
        const el=document.createElement(i?'td':'th');
        if(!i)el.scope='col';
        el.textContent=value;
        tr.append(el);
      });
      $('preview').append(tr);
    });
    $('summary').textContent=`${rows.length-1} rows · ${output.kept.length} columns kept · ${omitted.size} omitted · ${output.escaped} formula-like fields escaped.`;
    $('confirm').disabled=false;
  }catch(e){
    $('summary').textContent=e.message;
    $('confirm').disabled=true;
  }
}
async function load(bytes){
  reset('Reading locally…');
  const token=version;
  try{
    if(bytes.byteLength>api.LIMITS.bytes)throw Error('Maximum CSV size is 250,000 bytes.');
    const text=new TextDecoder('utf-8',{
      fatal:true
    }).decode(bytes);
    const parsed=api.parseCSV(text);
    const digest=await crypto.subtle.digest('SHA-256',bytes);
    if(token!==version)return;
    rows=parsed;
    source=bytes;
    hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
    for(const col of api.inspect(rows)){
      const wrap=document.createElement('div');
      wrap.className='column';
      const label=document.createElement('label'),check=document.createElement('input');
      check.type='checkbox';
      check.dataset.column=col.index;
      check.addEventListener('change',()=>{
        check.checked?omitted.add(col.index):omitted.delete(col.index);
        draw();
      });
      label.append(check,document.createTextNode(`Omit column ${col.index+1}: ${rows[0][col.index]}`));
      const p=document.createElement('p');
      p.className=col.reasons.length?'reasons':'quiet';
      p.textContent=col.reasons.join(' · ')||'No matching pattern. Still review this column.';
      wrap.append(label,p);
      $('columns').append(wrap);
    }$('review').hidden=false;
    draw();
    $('status').textContent=`Loaded ${rows.length-1} rows locally. No selections made.`;
  }catch(e){
    if(token===version)reset(`Cannot review: ${e.message}`);
  }
}
function save(data,name,type){
  const url=URL.createObjectURL(new Blob([data],{
    type
  }));
  const a=document.createElement('a');
  a.href=url;
  a.download=name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
}
$('file').addEventListener('change',async e=>{
  const file=e.target.files[0];
  reset('Reading locally…');
  const token=version;
  if(!file)return;
  if(file.size>api.LIMITS.bytes){
    reset('Cannot review: Maximum CSV size is 250,000 bytes.');
    return;
  }try{
    const bytes=await file.arrayBuffer();
    if(token===version)await load(bytes);
  }catch{
    if(token===version)reset('Cannot read file.');
  }
});
$('example').onclick=()=>{
  $('file').value='';
  load(new TextEncoder().encode(example));
};
$('clear').onclick=()=>{
  $('file').value='';
  reset();
};
$('undo').onclick=()=>{
  omitted.clear();
  $('columns').querySelectorAll('input').forEach(c=>c.checked=false);
  draw();
};
$('confirm').onchange=()=>{
  $('download').disabled=!$('confirm').checked;
  $('report').disabled=!$('confirm').checked;
};
$('download').onclick=()=>{
  if(rows&&$('confirm').checked)save(api.exportReview(rows,[...omitted]).csv,'sharecheck-reviewed.csv','text/csv;charset=utf-8');
};
$('report').onclick=()=>{
  if(!rows||!$('confirm').checked)return;
  const out=api.exportReview(rows,[...omitted]);
  save(JSON.stringify({
    tool:'ShareCheck',version:'0.1.0',createdAt:new Date().toISOString(),sourceSHA256:hash,rowCount:rows.length-1,sourceColumnCount:rows[0].length,omittedColumnNumbers:[...omitted].sort((a,b)=>a-b).map(i=>i+1),keptColumnNumbers:out.kept.map(i=>i+1),formulaLikeFieldsEscaped:out.escaped,escapeMethod:'Apostrophe prefix; all fields double-quoted',reviewAcknowledged:true,limitations:'Heuristic assistance, not comprehensive detection, anonymization, permission verification or security guarantee. Inspect receiving application before sharing.'
  },null,2),'sharecheck-decision.json','application/json');
};
$('original').onclick=()=>{
  if(source)save(source,'sharecheck-original.csv','text/csv');
};
