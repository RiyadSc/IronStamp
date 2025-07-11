"use strict";(()=>{var e={};e.id=321,e.ids=[321],e.modules={3480:(e,t,i)=>{e.exports=i(5600)},3939:e=>{e.exports=require("@supabase/supabase-js")},4442:e=>{e.exports=import("@sparticuz/chromium")},5600:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},6435:(e,t)=>{Object.defineProperty(t,"M",{enumerable:!0,get:function(){return function e(t,i){return i in t?t[i]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,i)):"function"==typeof t&&"default"===i?t:void 0}}})},8667:(e,t)=>{Object.defineProperty(t,"A",{enumerable:!0,get:function(){return i}});var i=function(e){return e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE",e.IMAGE="IMAGE",e}({})},8856:e=>{e.exports=import("puppeteer-core")},9967:(e,t,i)=>{i.r(t),i.d(t,{config:()=>f,default:()=>u,routeModule:()=>g});var r={};i.r(r),i.d(r,{default:()=>m});var o=i(3480),a=i(8667),n=i(6435),s=i(3939);let l=process.env.SUPABASE_SERVICE_ROLE_KEY,d=new Map,c=(e,t)=>{let i=new Date(e),r=t?new Date(t):new Date;return Math.ceil((i.getTime()-r.getTime())/864e5)};function p(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;")}async function m(e,t){let r;if(function(e){let t=Date.now(),i=d.get(e);return!i||t>i.resetTime?(d.set(e,{count:1,resetTime:t+6e4}),!1):i.count>=10||(i.count++,!1)}(e.headers["x-forwarded-for"]||e.connection.remoteAddress||"unknown"))return t.status(429).json({error:"Too many requests"});if("GET"!==e.method)return t.status(405).json({error:"Method not allowed"});try{let o=function(e){if(!e||"string"!=typeof e||!e.startsWith("Bearer "))return null;let t=e.slice(7);return/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(t)?t:null}(e.headers.authorization);if(!o)return t.status(401).json({error:"Invalid authorization format"});let a=(0,s.createClient)("https://ugpdxevfjegpviskdzix.supabase.co",l,{auth:{persistSession:!1,detectSessionInUrl:!1}}),{data:{user:n},error:d}=await a.auth.getUser(o);if(d||!n)return t.status(401).json({error:"Authentication failed"});let{data:m}=await a.from("profiles").select("company_name").eq("id",n.id).single(),u=m?.company_name||"Your Company",[f,g]=await Promise.all([a.from("employees").select("*",{count:"exact"}).eq("user_id",n.id),a.from("certifications").select("id, employee_name, certification_name, issue_date, expiration_date, priority, notes").eq("user_id",n.id)]);if(f.error||g.error)return console.error("Database error:",f.error||g.error),t.status(500).json({error:"Database error occurred"});let h=g.data||[],x=f.count||0,b=0,v=0,y=0,w=[],C=new Map;h.forEach(e=>{let t=c(e.expiration_date),i="Active";if(t<0?(i="Expired",v++):t<=30?(i="Expiring Soon",y++,t<=7&&b++):b++,t<0||t<=30){let i="low",r="expiring";t<0?(r="expired",i="high"):t<=7?(r="expiring",i="high"):t<=30&&(r="expiring",i="medium"),("high"===i||"medium"===i)&&w.push({id:e.id,type:r,employee:e.employee_name,certification:e.certification_name,daysLeft:t>=0?t:void 0,priority:i,expirationDate:e.expiration_date})}let r=e.employee_name||"Unknown Employee";C.has(r)||C.set(r,{employeeName:e.employee_name||"Unknown Employee",totalCertifications:0,activeCertifications:0,expiringSoonCertifications:0,expiredCertifications:0});let o=C.get(r);o.totalCertifications++,"Active"===i?o.activeCertifications++:"Expiring Soon"===i?o.expiringSoonCertifications++:"Expired"===i&&o.expiredCertifications++});let E={totalEmployees:x,activeCertifications:b,expiredCertifications:v,expiringSoon:y},P=Array.from(C.values());w.sort((e,t)=>"high"===e.priority&&"high"!==t.priority?-1:"high"!==e.priority&&"high"===t.priority?1:"expired"===e.type&&"expired"!==t.type?-1:"expired"!==e.type&&"expired"===t.type?1:(e.daysLeft||-999)-(t.daysLeft||-999));let $=function(e,t,i,r){let o=t.activeCertifications>0?Math.round(t.activeCertifications/(t.activeCertifications+t.expiredCertifications)*100):0,a=p(e),n=new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});return`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Compliance Summary Report</title>
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
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
        }
        
        .title {
            font-size: 28px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 10px;
        }
        
        .subtitle {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 5px;
        }
        
        .section {
            margin-bottom: 35px;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 15px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
        }
        
        .summary-box {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 25px;
        }
        
        .summary-text {
            font-size: 16px;
            line-height: 1.6;
        }
        
        .compliance-meter {
            background: #e5e7eb;
            border-radius: 10px;
            height: 30px;
            margin: 15px 0;
            position: relative;
            overflow: hidden;
        }
        
        .compliance-fill {
            background: linear-gradient(90deg, #dc2626, #f59e0b, #10b981);
            height: 100%;
            border-radius: 10px;
            width: ${o}%;
        }
        
        .compliance-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-weight: bold;
            color: white;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 20px 0;
        }
        
        .stat-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
            display: block;
        }
        
        .stat-label {
            font-size: 14px;
            color: #64748b;
        }
        
        .priority-high {
            color: #dc2626;
            font-weight: bold;
        }
        
        .priority-medium {
            color: #f59e0b;
            font-weight: bold;
        }
        
        .priority-low {
            color: #059669;
            font-weight: bold;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        
        th, td {
            border: 1px solid #d1d5db;
            padding: 10px;
            text-align: left;
            font-size: 12px;
        }
        
        th {
            background: #f9fafb;
            font-weight: 600;
        }
        
        .recommendations {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin-top: 25px;
        }
        
        .recommendations h4 {
            margin-top: 0;
            color: #92400e;
        }
        
        .rec-list {
            list-style-type: none;
            padding: 0;
        }
        
        .rec-list li {
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
        }
        
        .rec-list li::before {
            content: "→";
            position: absolute;
            left: 0;
            color: #f59e0b;
            font-weight: bold;
        }
        
        @media print {
            .section {
                page-break-inside: avoid;
            }
            
            @page {
                margin: 2cm;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">Compliance Summary Report</div>
            <div class="subtitle">Company: ${a}</div>
            <div class="subtitle">Generated: ${n}</div>
            <div class="subtitle">Reporting Period: Current Status</div>
        </div>
        
        <div class="section">
            <div class="summary-box">
                <div class="summary-text">
                    <strong>Executive Summary:</strong><br>
                    Your organization maintains ${t.totalEmployees} active employees with ${t.activeCertifications+t.expiredCertifications} total certifications. 
                    Current compliance rate is <strong>${o}%</strong> with ${t.expiredCertifications} expired certifications requiring immediate attention.
                </div>
            </div>
            
            <div class="compliance-meter">
                <div class="compliance-fill"></div>
                <div class="compliance-text">${o}% Compliance Rate</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Key Metrics</div>
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-value">${t.totalEmployees}</span>
                    <div class="stat-label">Active Employees</div>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${t.activeCertifications+t.expiredCertifications}</span>
                    <div class="stat-label">Total Certifications</div>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${t.activeCertifications}</span>
                    <div class="stat-label">Active Certifications</div>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${t.expiredCertifications}</span>
                    <div class="stat-label">Expired Certifications</div>
                </div>
            </div>
        </div>

        ${i.length>0?`
            <div class="section">
                <div class="section-title">Priority Actions Required</div>
                <table>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Certification</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Action Required</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${i.slice(0,15).map(e=>`
                            <tr>
                                <td>${p(e.employee)}</td>
                                <td>${p(e.certification)}</td>
                                <td>${"expired"===e.type?"EXPIRED":`Expires in ${e.daysLeft} days`}</td>
                                <td class="priority-${e.priority}">${e.priority.toUpperCase()}</td>
                                <td>${"expired"===e.type?"Immediate renewal required":"Schedule renewal"}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
                ${i.length>15?`<p><em>Showing top 15 priority actions. Total: ${i.length}</em></p>`:""}
            </div>
        `:""}

        <div class="section">
            <div class="section-title">Employee Breakdown</div>
            <table>
                <thead>
                    <tr>
                        <th>Employee Name</th>
                        <th>Total Certs</th>
                        <th>Active</th>
                        <th>Expiring Soon</th>
                        <th>Expired</th>
                        <th>Compliance Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${r.map(e=>{let t=e.totalCertifications>0?Math.round(e.activeCertifications/e.totalCertifications*100):0;return`
                        <tr>
                            <td>${p(e.employeeName)}</td>
                            <td>${e.totalCertifications}</td>
                            <td>${e.activeCertifications}</td>
                            <td>${e.expiringSoonCertifications}</td>
                            <td>${e.expiredCertifications}</td>
                            <td class="${t>=80?"priority-low":t>=60?"priority-medium":"priority-high"}">${t}%</td>
                        </tr>
                      `}).join("")}
                </tbody>
            </table>
        </div>

        <div class="recommendations">
            <h4>Recommended Actions</h4>
            <ul class="rec-list">
                ${t.expiredCertifications>0?`<li>Immediate attention required for ${t.expiredCertifications} expired certifications</li>`:""}
                ${t.expiringSoon>0?`<li>Schedule renewal for ${t.expiringSoon} certifications expiring within 30 days</li>`:""}
                ${o<80?"<li>Implement proactive renewal tracking to improve compliance rate above 80%</li>":""}
                <li>Set up automated notifications for certifications expiring in 60, 30, and 7 days</li>
                <li>Review and update certification requirements for each role</li>
                <li>Consider bulk renewal for multiple employees with similar certification types</li>
            </ul>
        </div>
    </div>
</body>
</html>`}(u,E,w,P);console.log("\uD83D\uDD0D Environment check:",{NODE_ENV:"production",VERCEL:process.env.VERCEL,platform:process.platform}),console.log("\uD83D\uDE80 Using serverless chromium for production");try{let e=(await Promise.resolve().then(i.bind(i,8856))).default;console.log("✅ Puppeteer-core imported successfully");let t=(await Promise.resolve().then(i.bind(i,4442))).default;console.log("✅ Chromium imported successfully"),await t.font("https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf");let o=await t.executablePath();console.log("\uD83D\uDCCD Chromium executable path:",o),r=await e.launch({args:[...t.args,"--disable-gpu","--disable-dev-shm-usage","--disable-setuid-sandbox","--no-first-run","--no-sandbox","--no-zygote","--single-process","--disable-extensions"],defaultViewport:{width:1920,height:1080},executablePath:o,headless:!0}),console.log("✅ Browser launched successfully")}catch(e){throw console.error("❌ Import or launch error:",e),Error(`Browser setup failed: ${e?.message||"Unknown error"}`)}let A=await r.newPage();await A.setDefaultTimeout(3e4),await A.setContent($,{waitUntil:["load","domcontentloaded"],timeout:3e4}),await new Promise(e=>setTimeout(e,1e3));let S=await A.pdf({format:"A4",printBackground:!0,margin:{top:"0.8cm",right:"0.8cm",bottom:"0.8cm",left:"0.8cm"},displayHeaderFooter:!1,preferCSSPageSize:!1,scale:.8});if(await r.close(),r=null,!S||0===S.length)throw Error("Generated PDF is empty");if(console.log("Generated PDF size:",S.length,"bytes"),S.length>3670016)return console.error("PDF size exceeds limit:",S.length,"bytes (max:",3670016,"bytes)"),t.status(413).json({error:"Report is too large to generate. Try filtering your data or contact support for a custom report.",size:S.length,maxSize:3670016});t.setHeader("Content-Type","application/pdf"),t.setHeader("Content-Disposition",`attachment; filename="compliance-summary-${new Date().toISOString().split("T")[0]}.pdf"`),t.setHeader("Cache-Control","private, no-store"),t.setHeader("X-Content-Type-Options","nosniff"),t.setHeader("Content-Length",S.length.toString());let _=Buffer.isBuffer(S)?S:Buffer.from(S);t.status(200),t.write(_),t.end();return}catch(e){if(console.error("Report generation error:",e),r)try{await r.close()}catch(e){console.error("Error closing browser:",e)}return t.status(500).json({error:"Report generation failed"})}}let u=(0,n.M)(r,"default"),f=(0,n.M)(r,"config"),g=new o.PagesAPIRouteModule({definition:{kind:a.A.PAGES_API,page:"/api/reports/compliance-summary",pathname:"/api/reports/compliance-summary",bundlePath:"",filename:""},userland:r})}};var t=require("../../../webpack-api-runtime.js");t.C(e);var i=t(t.s=9967);module.exports=i})();