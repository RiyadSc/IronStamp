"use strict";(()=>{var e={};e.id=157,e.ids=[157],e.modules={3480:(e,t,i)=>{e.exports=i(5600)},3939:e=>{e.exports=require("@supabase/supabase-js")},4442:e=>{e.exports=import("@sparticuz/chromium")},5600:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},6435:(e,t)=>{Object.defineProperty(t,"M",{enumerable:!0,get:function(){return function e(t,i){return i in t?t[i]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,i)):"function"==typeof t&&"default"===i?t:void 0}}})},7037:(e,t,i)=>{i.r(t),i.d(t,{config:()=>f,default:()=>m,routeModule:()=>g});var o={};i.r(o),i.d(o,{default:()=>u});var a=i(3480),r=i(8667),s=i(6435),n=i(3939);let l=process.env.SUPABASE_SERVICE_ROLE_KEY,d=new Map,c=(e,t)=>{let i=new Date(e),o=t?new Date(t):new Date;return Math.ceil((i.getTime()-o.getTime())/864e5)};function p(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;")}async function u(e,t){let o;if(function(e){let t=Date.now(),i=d.get(e);return!i||t>i.resetTime?(d.set(e,{count:1,resetTime:t+6e4}),!1):i.count>=10||(i.count++,!1)}(e.headers["x-forwarded-for"]||e.connection.remoteAddress||"unknown"))return t.status(429).json({error:"Too many requests"});if("GET"!==e.method)return t.status(405).json({error:"Method not allowed"});try{let a=function(e){if(!e||"string"!=typeof e||!e.startsWith("Bearer "))return null;let t=e.slice(7);return/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(t)?t:null}(e.headers.authorization);if(!a)return t.status(401).json({error:"Invalid authorization format"});let r=(0,n.createClient)("https://ugpdxevfjegpviskdzix.supabase.co",l,{auth:{persistSession:!1,detectSessionInUrl:!1}}),{data:{user:s},error:d}=await r.auth.getUser(a);if(d||!s)return t.status(401).json({error:"Authentication failed"});let{data:u}=await r.from("profiles").select("company_name").eq("id",s.id).single(),m=u?.company_name||"Your Company",{data:f,error:g}=await r.from("certifications").select("id, employee_name, certification_name, issue_date, expiration_date, priority, notes").eq("user_id",s.id).order("employee_name",{ascending:!0});if(g)return console.error("Database error:",g.message),t.status(500).json({error:"Database error occurred"});if(!f||0===f.length)return t.status(404).json({error:"No certification data found"});let h=new Map;f.forEach(e=>{let t=c(e.expiration_date),i="Active";t<0?i="Expired":t<=30&&(i="Expiring Soon");let o={id:e.id,employee:e.employee_name,type:e.certification_name,issueDate:e.issue_date||"",expirationDate:e.expiration_date,status:i,daysLeft:t,priority:e.priority||"medium",notes:e.notes||void 0},a=e.employee_name||"Unknown Employee";h.has(a)||h.set(a,{employeeName:e.employee_name||"Unknown Employee",totalCertifications:0,activeCertifications:0,expiringSoonCertifications:0,expiredCertifications:0,certifications:[]});let r=h.get(a);r.certifications.push(o),r.totalCertifications++,"Active"===o.status?r.activeCertifications++:"Expiring Soon"===o.status?r.expiringSoonCertifications++:"Expired"===o.status&&r.expiredCertifications++});let x=Array.from(h.values()),b={totalEmployees:x.length,totalCertifications:x.reduce((e,t)=>e+t.totalCertifications,0),activeCertifications:x.reduce((e,t)=>e+t.activeCertifications,0),expiredCertifications:x.reduce((e,t)=>e+t.expiredCertifications,0)},v=function(e,t,i){let o=p(e),a=new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});return`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Team Certification Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            color: #333;
            background: white;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
        }
        
        .title {
            font-size: 24px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 10px;
        }
        
        .subtitle {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 5px;
        }
        
        .summary {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }
        
        .summary h3 {
            font-size: 18px;
            margin-bottom: 15px;
            color: #1e293b;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-top: 15px;
        }
        
        .stat-item {
            text-align: center;
            padding: 15px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
        }
        
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            display: block;
        }
        
        .stat-label {
            font-size: 12px;
            color: #64748b;
            margin-top: 5px;
        }
        
        .employee-section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .employee-header {
            background-color: #2563eb;
            color: white;
            padding: 12px 16px;
            font-size: 16px;
            font-weight: bold;
            border-radius: 6px 6px 0 0;
        }
        
        .employee-stats {
            background-color: #e5e7eb;
            padding: 10px 16px;
            font-size: 12px;
            border-radius: 0 0 6px 6px;
            margin-bottom: 10px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 20px;
        }
        
        th, td {
            border: 1px solid #d1d5db;
            padding: 8px 10px;
            text-align: left;
            font-size: 11px;
        }
        
        th {
            background-color: #f9fafb;
            font-weight: 600;
            font-size: 12px;
        }
        
        .status-active {
            color: #059669;
            font-weight: 600;
        }
        
        .status-expiring-soon {
            color: #d97706;
            font-weight: 600;
        }
        
        .status-expired {
            color: #dc2626;
            font-weight: 600;
        }
        
        @media print {
            .employee-section {
                page-break-inside: avoid;
            }
            
            @page {
                margin: 1cm;
                size: A4;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">Team Certification Report</div>
            <div class="subtitle">Company: ${o}</div>
            <div class="subtitle">Generated: ${a}</div>
        </div>
        
        <div class="summary">
            <h3>Summary</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-value">${i.totalEmployees}</span>
                    <div class="stat-label">Total Employees</div>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${i.totalCertifications}</span>
                    <div class="stat-label">Total Certifications</div>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${i.activeCertifications}</span>
                    <div class="stat-label">Active Certifications</div>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${i.expiredCertifications}</span>
                    <div class="stat-label">Expired Certifications</div>
                </div>
            </div>
        </div>
        
        ${t.map(e=>`
            <div class="employee-section">
                <div class="employee-header">
                    ${p(e.employeeName)}
                </div>
                <div class="employee-stats">
                    Total: ${e.totalCertifications} | 
                    Active: ${e.activeCertifications} | 
                    Expiring Soon: ${e.expiringSoonCertifications} | 
                    Expired: ${e.expiredCertifications}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Certification</th>
                            <th>Issue Date</th>
                            <th>Expiration Date</th>
                            <th>Status</th>
                            <th>Days Left</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${e.certifications.map(e=>`
                            <tr>
                                <td>${p(e.type)}</td>
                                <td>${e.issueDate||"N/A"}</td>
                                <td>${e.expirationDate}</td>
                                <td class="status-${e.status.toLowerCase().replace(" ","-")}">${e.status}</td>
                                <td>${e.daysLeft>=0?`${e.daysLeft} days`:`Expired ${Math.abs(e.daysLeft)} days ago`}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `).join("")}
    </div>
</body>
</html>`}(m,x,b);console.log("\uD83D\uDD0D Environment check:",{NODE_ENV:"production",VERCEL:process.env.VERCEL,platform:process.platform}),console.log("\uD83D\uDE80 Using serverless chromium for production");try{let e=(await Promise.resolve().then(i.bind(i,8856))).default;console.log("✅ Puppeteer-core imported successfully");let t=(await Promise.resolve().then(i.bind(i,4442))).default;console.log("✅ Chromium imported successfully"),await t.font("https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf");let a=await t.executablePath();console.log("\uD83D\uDCCD Chromium executable path:",a),o=await e.launch({args:[...t.args,"--disable-gpu","--disable-dev-shm-usage","--disable-setuid-sandbox","--no-first-run","--no-sandbox","--no-zygote","--single-process","--disable-extensions"],defaultViewport:{width:1920,height:1080},executablePath:a,headless:!0}),console.log("✅ Browser launched successfully")}catch(e){throw console.error("❌ Import or launch error:",e),Error(`Browser setup failed: ${e?.message||"Unknown error"}`)}let y=await o.newPage();await y.setDefaultTimeout(3e4),await y.setContent(v,{waitUntil:["load","domcontentloaded"],timeout:3e4}),await new Promise(e=>setTimeout(e,1e3));let w=await y.pdf({format:"A4",printBackground:!0,margin:{top:"0.8cm",right:"0.8cm",bottom:"0.8cm",left:"0.8cm"},displayHeaderFooter:!1,preferCSSPageSize:!1,scale:.8});if(await o.close(),o=null,!w||0===w.length)throw Error("Generated PDF is empty");if(console.log("Generated PDF size:",w.length,"bytes"),w.length>3670016)return console.error("PDF size exceeds limit:",w.length,"bytes (max:",3670016,"bytes)"),t.status(413).json({error:"Report is too large to generate. Try filtering your data or contact support for a custom report.",size:w.length,maxSize:3670016});t.setHeader("Content-Type","application/pdf"),t.setHeader("Content-Disposition",`attachment; filename="team-certification-report-${new Date().toISOString().split("T")[0]}.pdf"`),t.setHeader("Cache-Control","private, no-store"),t.setHeader("X-Content-Type-Options","nosniff"),t.setHeader("Content-Length",w.length.toString());let C=Buffer.isBuffer(w)?w:Buffer.from(w);t.status(200),t.write(C),t.end();return}catch(e){if(console.error("Report generation error:",e),o)try{await o.close()}catch(e){console.error("Error closing browser:",e)}return t.status(500).json({error:"Report generation failed"})}}let m=(0,s.M)(o,"default"),f=(0,s.M)(o,"config"),g=new a.PagesAPIRouteModule({definition:{kind:r.A.PAGES_API,page:"/api/reports/team-certification",pathname:"/api/reports/team-certification",bundlePath:"",filename:""},userland:o})},8667:(e,t)=>{Object.defineProperty(t,"A",{enumerable:!0,get:function(){return i}});var i=function(e){return e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE",e.IMAGE="IMAGE",e}({})},8856:e=>{e.exports=import("puppeteer-core")}};var t=require("../../../webpack-api-runtime.js");t.C(e);var i=t(t.s=7037);module.exports=i})();