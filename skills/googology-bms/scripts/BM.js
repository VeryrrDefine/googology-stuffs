;var matrix_compare = (m1,m2)=>{
   if(m1.length===0){
      if(m2.length===0) return 0
      else return -1
   }else{
      if(m2.length===0) return 1
      else{
         var col1=m1[0],col2=m2[0]
         lenDiff = col1.length-col2.length
         if(lenDiff>0) col2 = col2.concat(Array(lenDiff).fill(0))
         else if(lenDiff<0) col1 = col1.concat(Array(-lenDiff).fill(0))
         var cmp = sequence_compare(col1,col2)
         if(cmp) return cmp
         else return matrix_compare(m1.slice(1),m2.slice(1))
      }
   }
}
,matrix_display = expr=>''+expr==='Infinity'?'Limit':expr.map(col=>'('+col+')').join('')
,matrix_limit = m=>m.length>0&&m[m.length-1][0]>0
,res = ({
   id:'bm4'
   ,name:'Bashicu matrix'
   ,display:matrix_display
   ,able:matrix_limit
   ,compare:matrix_compare
   ,FS:(()=>{
      var data={}
      ,BM4 = (m,FSterm)=>{
         var parent = (x,y)=>{
            var str=x+','+y
            if(parent_cache[str]!==undefined) return parent_cache[str]
            for(var p=x;(p=y?parent(p,y-1):p-1)>=0;){
               if(m[p][y]<m[x][y]) break
            }
            return parent_cache[str]=p
         }
         ,ascending = (r,x,y)=>{
            var str=r+','+x+','+y
            if(ascending_cache[str]!==undefined) return ascending_cache[str]
            return ascending_cache[str] = r<=x&&(r===x||ascending(r,parent(x,y),y))
         }
         ,parent_cache={},ascending_cache={}
         ,endcol = m.length-1
         ,result = m.slice(0,endcol)
         ,child = m[endcol]
         ,ymax = child.length-1
         ,LNZ
         for(LNZ=ymax;LNZ>=0;--LNZ){
            if(child[LNZ]>0) break
         }
         if(LNZ<0) return result
         var BR = parent(endcol,LNZ)
         ,BRcolumn = m[BR]
         ,offset = child.map((value,y)=>y<LNZ?value-BRcolumn[y]:0)
         ,offset_asc = Array(endcol).fill(0,BR).map((t,x)=>offset.map((value,y)=>ascending(BR,x,y)?value:0))
         ,col,n
         for(n=0;++n<=FSterm;){
            for(col=BR;col<endcol;++col){
               result.push(m[col].map((value,y)=>value+offset_asc[col][y]*n))
            }
         }
         if(ymax>0&&result.every(column=>column[ymax]===0)) result = result.map(column=>column.slice(0,ymax))
         return result
      }
      return (m,FSterm)=>{
         if(''+m==='Infinity') return [Array(FSterm+1).fill(0),Array(FSterm+1).fill(1)]
         if(m.length===0) return []
         var datakey=matrix_display(m)
         if(!data[datakey]) data[datakey] = []
         else if(data[datakey][FSterm]!==undefined) return data[datakey][FSterm]
         return data[datakey][FSterm] = BM4(m,FSterm)
      }
   })()
   ,init:()=>([
      {expr:[[Infinity]],low:[[]],subitems:[]}
      ,{expr:[],low:[[]],subitems:[]}
   ])
})
//上面从别人的展开器里抄过来的，不用管
if (process.argv.length < 4) {
  console.error("用法: node BM.js \"(0,0)(1,1)\" <n>");
  process.exit(1);
}
if (!/^\([\d,]+\)(\([\d,]+\))*$/.test(process.argv[2])) {
  console.error("矩阵格式无效，应形如 (0,0)(1,1)(2,2)");
  process.exit(1);
}
if (!(process.argv[2] && typeof process.argv[3] === "string" && !isNaN(process.argv[3]))) {
  console.error('用法: node BM.js "<matrix>" <n>');
  console.error('示例: node BM.js "(0,0)(1,1)(2,2)" 4');
  process.exit(1);
}

const matrixStr = process.argv[2];
const expands = Number(process.argv[3]);

// 1. 解析
const cols = (matrixStr.match(/\([^)]*\)/g) || []).map(col =>
  col.slice(1, -1).split(",").map(s => Number(s.trim()))
);

if (cols.length === 0) {
  console.error("未识别到任何列，请检查矩阵格式，例如 (0,0)(1,1)(2,2)");
  process.exit(1);
}
if (cols.some(c => c.some(Number.isNaN))) {
  console.error("矩阵中含有非数字项，请检查输入");
  process.exit(1);
}
if (cols[0].some(v => v !== 0)) {
  console.error("非法 BMS：首列必须全为 0，例如 (0,0)(1,1)");
  process.exit(1);
}

// 2. 补齐
const maxLen = Math.max(...cols.map(c => c.length));
const matrix = cols.map(c => [...c, ...Array(maxLen - c.length).fill(0)]);

// 3. 分类输出
try {
  if (matrix.length === 0) {
    console.log("矩阵为 0");
  } else if (matrix_limit(matrix)) {
    console.log(`矩阵为极限序数，其基本列第 ${expands} 项为 ${matrix_display(res.FS(matrix, expands))}`);
  } else {
    const pred = matrix.slice(0, -1);
    console.log(`矩阵为后继序数，其前驱为 ${pred.length ? matrix_display(pred) : "0（空矩阵）"}`);
  }
} catch (e) {
  console.error("展开失败：" + e.message);
  process.exit(1);
}