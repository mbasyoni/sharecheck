(function(root){
  'use strict';
  const LIMITS={
    bytes:250000,rows:1000,columns:50,cell:10000
  };
  function parseCSV(text){
    if(new TextEncoder().encode(text).length>LIMITS.bytes)throw Error('Maximum CSV size is 250,000 bytes.');
    if(text.charCodeAt(0)===0xfeff)text=text.slice(1);
    if(!text.trim())throw Error('Choose a CSV containing a header and at least one data row.');
    let rows=[],row=[],cell='',quoted=false,closed=false;
    function field(){
      if(cell.length>LIMITS.cell)throw Error('Cell exceeds 10,000 characters.');
      row.push(cell);
      cell='';
      closed=false;
      if(row.length>LIMITS.columns)throw Error('Maximum 50 columns.');
    }
    function end(){
      field();
      rows.push(row);
      row=[];
      if(rows.length>LIMITS.rows+1)throw Error('Maximum 1,000 data rows.');
    }
    for(let i=0;
    i<text.length;
    i++){
      const c=text[i];
      if(quoted){
        if(c==='"'){
          if(text[i+1]==='"'){
            cell+='"';
            i++;
          }else{
            quoted=false;
            closed=true;
          }
        }else cell+=c;
      }
      else if(c===',')field();
      else if(c==='\r'||c==='\n'){
        if(c==='\r'&&text[i+1]==='\n')i++;
        end();
      }
      else if(c==='"'){
        if(cell||closed)throw Error('Unexpected quote in CSV.');
        quoted=true;
      }
      else {
        if(closed)throw Error('Unexpected text after closing quote.');
        cell+=c;
      }
      if(cell.length>LIMITS.cell)throw Error('Cell exceeds 10,000 characters.');
    }
    if(quoted)throw Error('Unclosed quoted field.');
    if(cell||row.length||closed)end();
    if(rows.length<2)throw Error('At least one data row is required.');
    const width=rows[0].length;
    if(rows.some(r=>r.length!==width))throw Error('Rows must have the same number of fields as the header.');
    if(rows[0].some(h=>!h.trim()))throw Error('Every column needs a non-empty header.');
    if(new Set(rows[0]).size!==width)throw Error('Duplicate column headers are ambiguous. Rename them first.');
    return rows;
  }
  function formula(value){
    return /^[\s\u0000-\u001f\u007f-\u009f]*[=+@-]/u.test(value)||/^[\t\r\n]/u.test(value);
  }
  function inspect(rows){
    return rows[0].map((header,index)=>{
      const reasons=[];
      if(/(?:name|email|e-mail|phone|mobile|address|dob|birth|passport|ssn|social.?security|password|secret|token|patient|medical|health)/iu.test(header))reasons.push('Column name suggests personal or secret information');
      let email=0,phone=0,formulaCount=0;
      for(const row of rows.slice(1)){
        const v=row[index];
        if(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu.test(v))email++;
        if(/(?:\+?\d[\d ()-]{7,}\d)/u.test(v))phone++;
        if(formula(v))formulaCount++;
      }
      if(email)reasons.push(`${email} cell(s) contain an email-like pattern`);
      if(phone)reasons.push(`${phone} cell(s) contain a phone/long-number-like pattern`);
      if(formulaCount||formula(header))reasons.push('Spreadsheet formula-like content will be escaped in reviewed export');
      return {
        index,reasons,email,phone,formulaCount
      };
    });
  }
  function exportReview(rows,omitted){
    const set=new Set(omitted);
    if([...set].some(i=>!Number.isInteger(i)||i<0||i>=rows[0].length))throw Error('Invalid column selection.');
    const kept=rows[0].map((_,i)=>i).filter(i=>!set.has(i));
    if(!kept.length)throw Error('Keep at least one column.');
    let escaped=0;
    const output=rows.map(row=>kept.map(i=>{
      let v=row[i];
      if(formula(v)){
        v="'"+v;
        escaped++;
      }return '"'+v.replaceAll('"','""')+'"';
    }).join(',')).join('\r\n')+'\r\n';
    const previewRows=rows.slice(0,9).map(row=>kept.map(i=>formula(row[i])?"'"+row[i]:row[i]));
    return {
      csv:output,kept,escaped,previewRows
    };
  }
  const api={
    LIMITS,parseCSV,inspect,formula,exportReview
  };
  if(typeof module!=='undefined')module.exports=api;
  else root.ShareCheck=api;
})(globalThis);
