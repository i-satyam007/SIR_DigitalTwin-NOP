const fs = require('fs');
let code = fs.readFileSync('app.jsx', 'utf-8');

const helpersStr = `
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const formatDateShort = (dStr) => {
  if (!dStr) return '';
  const [y, m, d] = dStr.split('-');
  return \`\${parseInt(d, 10)} \${MONTHS[parseInt(m, 10)-1]}\`;
};
const formatDateFull = (dStr) => {
  if (!dStr) return '';
  const [y, m, d] = dStr.split('-');
  return \`\${parseInt(d, 10)} \${MONTHS[parseInt(m, 10)-1]} \${y}\`;
};
const Tex = ({ math }) => <span dangerouslySetInnerHTML={{ __html: window.katex.renderToString(math, { throwOnError: false }) }} />;
const fmtSciTex = (num) => {
  if (num == null) return '';
  const [base, exp] = Number(num).toExponential(1).split('e');
  return \`\${base} \\\\times 10^{\${parseInt(exp, 10)}}\`;
};
`;
if (!code.includes('formatDateShort')) {
    code = code.replace('const fmtMil', helpersStr.trim() + '\nconst fmtMil');
}

// Global text size
code = code.replace(/text-\[10px\]/g, 'text-xs');

// Dates 
code = code.replace(/\{wave\.dates\[di\]\}/g, '{formatDateFull(wave.dates[di])}');
code = code.replace(/\{wave\?\.peak_I_date\}/g, '{formatDateFull(wave?.peak_I_date)}');
code = code.replace(/\(d\)=>d\.slice\(5\)/g, '(d)=>formatDateShort(d)');

// KaTeX GlanceCard & text
code = code.replace(/value=\{summary\.scipy\.agreement_rel\.toExponential\(1\)\}/g, 'value={<Tex math={fmtSciTex(summary.scipy.agreement_rel)} />}');
code = code.replace(/label="Fitted R₀"/g, 'label={<span>Fitted <Tex math="R_0"/></span>}');
code = code.replace(/sub="\(Delta: 1\.5 – 2\.8\)"/g, 'sub={<span>(<Tex math="\\\\Delta"/>: 1.5 – 2.8)</span>}');
code = code.replace(/the Delta variant/g, 'the <Tex math="\\\\Delta"/> variant');
code = code.replace(/R₀ = β\/γ ≈ \{fmt\(gnFit\.R0,2\)\}/g, '<Tex math={`R_0 = \\\\beta/\\\\gamma \\\\approx ${fmt(gnFit.R0,2)}`} />');
code = code.replace(/label="R₀ = β\/γ"/g, 'label={<Tex math="R_0 = \\\\beta/\\\\gamma" />}');
code = code.replace(/<span className="text-faint">R₀<\/span>/g, '<span className="text-faint"><Tex math="R_0" /></span>');

// Badges
code = code.replace(/label="β \(infection rate\)"/g, 'label={<span><Tex math="\\\\beta"/> (infection rate)</span>}');
code = code.replace(/label="γ \(recovery rate\)"/g, 'label={<span><Tex math="\\\\gamma"/> (recovery rate)</span>}');
code = code.replace(/label="β \(infection\)"/g, 'label={<span><Tex math="\\\\beta"/> (infection)</span>}');
code = code.replace(/label="γ \(recovery\)"/g, 'label={<span><Tex math="\\\\gamma"/> (recovery)</span>}');
code = code.replace(/label="N_eff"/g, 'label={<Tex math="N_{\\\\text{eff}}"/>}');

// Equations
code = code.replace(/lhs="dS\/dt"/g, 'lhs={<Tex math="\\\\frac{dS}{dt}"/>}');
code = code.replace(/rhs="−β · S · I \/ N"/g, 'rhs={<Tex math="-\\\\frac{\\\\beta S I}{N}"/>}');
code = code.replace(/lhs="dI\/dt"/g, 'lhs={<Tex math="\\\\frac{dI}{dt}"/>}');
code = code.replace(/rhs="\+β · S · I \/ N − γ · I"/g, 'rhs={<Tex math="+\\\\frac{\\\\beta S I}{N} - \\\\gamma I"/>}');
code = code.replace(/lhs="dR\/dt"/g, 'lhs={<Tex math="\\\\frac{dR}{dt}"/>}');
code = code.replace(/rhs="\+γ · I"/g, 'rhs={<Tex math="+\\\\gamma I"/>}');

fs.writeFileSync('app.jsx', code);
console.log('Update complete');
