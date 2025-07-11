"use strict";(()=>{var e={};e.id=935,e.ids=[935],e.modules={2404:(e,t,r)=>{r.r(t),r.d(t,{config:()=>g,default:()=>m,routeModule:()=>x});var o={};r.r(o),r.d(o,{default:()=>f});var a=r(3480),i=r(8667),n=r(6435),d=r(3939);let s="https://ugpdxevfjegpviskdzix.supabase.co",l=process.env.SUPABASE_SERVICE_ROLE_KEY;s&&l||(console.error("❌ Missing environment variables:"),console.error("- NEXT_PUBLIC_SUPABASE_URL:",!!s),console.error("- SUPABASE_SERVICE_ROLE_KEY:",!!l));let c=new Map,p=(e,t)=>{let r=new Date(e),o=t?new Date(t):new Date;return Math.ceil((r.getTime()-o.getTime())/864e5)};function u(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;")}async function f(e,t){let o;if(function(e){let t=Date.now(),r=c.get(e);return!r||t>r.resetTime?(c.set(e,{count:1,resetTime:t+6e4}),!1):r.count>=10||(r.count++,!1)}(e.headers["x-forwarded-for"]||e.connection.remoteAddress||"unknown"))return t.status(429).json({error:"Too many requests"});if("GET"!==e.method)return t.status(405).json({error:"Method not allowed"});try{let a=function(e){if(!e||"string"!=typeof e||!e.startsWith("Bearer "))return null;let t=e.slice(7);return/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(t)?t:null}(e.headers.authorization);if(!a)return t.status(401).json({error:"Invalid authorization format"});let i=(0,d.createClient)(s,l,{auth:{persistSession:!1,detectSessionInUrl:!1}}),{data:{user:n},error:c}=await i.auth.getUser(a);if(c||!n)return t.status(401).json({error:"Authentication failed"});let{data:f}=await i.from("profiles").select("company_name").eq("id",n.id).single(),m=f?.company_name||"Your Company",g=new Date;g.setMonth(g.getMonth()+12);let{data:x,error:h}=await i.from("certifications").select("id, employee_name, certification_name, expiration_date, priority").eq("user_id",n.id).lte("expiration_date",g.toISOString().split("T")[0]).order("expiration_date",{ascending:!0});if(h)return console.error("Database error:",h.message),t.status(500).json({error:"Database error occurred"});if(!x||0===x.length)return t.status(404).json({error:"No expiring certifications found"});let b=new Date,v=new Date(b);v.setDate(v.getDate()-30);let w=x.filter(e=>new Date(e.expiration_date)>=v);if(0===w.length)return t.status(404).json({error:"No relevant certifications found in the date range"});let y=function(e,t){let r=u(e),o=new Date,a=o.getFullYear(),i=o.getMonth(),n=new Map;t.forEach(e=>{let t=e.expiration_date;n.has(t)||n.set(t,[]),n.get(t).push(e)});let d=[];for(let e=0;e<6;e++){let t=new Date(a,i+e,1),r=t.getFullYear(),o=t.getMonth();d.push(function(e,t,r){let o=["January","February","March","April","May","June","July","August","September","October","November","December"][t],a=new Date(e,t+1,0).getDate(),i=new Date(e,t,1).getDay(),n=`
    <div class="calendar-month">
      <div class="month-header">
        <h2>${o} ${e}</h2>
      </div>
      <div class="calendar-grid">
        <div class="day-headers">
          ${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(e=>`<div class="day-header">${e}</div>`).join("")}
        </div>
        <div class="calendar-days">
  `;for(let e=0;e<i;e++)n+='<div class="calendar-day empty"></div>';for(let o=1;o<=a;o++){let a=`${e}-${String(t+1).padStart(2,"0")}-${String(o).padStart(2,"0")}`,i=r.get(a)||[],d="calendar-day";if(i.length>0){let e=i.some(e=>0>p(e.expiration_date)),t=i.some(e=>{let t=p(e.expiration_date);return t>=0&&t<=30});e?d+=" has-expired":t&&(d+=" has-expiring")}n+=`
      <div class="${d}">
        <div class="day-number">${o}</div>
        <div class="day-content">
          ${i.map(e=>{let t=p(e.expiration_date),r=t<0,o=e.priority||"medium";return`
              <div class="expiration-item priority-${o} ${r?"expired":""}">
                <div class="cert-name">${u(e.certification_name)}</div>
                <div class="employee-name">${u(e.employee_name)}</div>
                ${r?'<div class="status expired">EXPIRED</div>':`<div class="status expiring">${0===t?"Today":`${t}d left`}</div>`}
              </div>
            `}).join("")}
        </div>
      </div>
    `}return n+=`
        </div>
      </div>
    </div>
  `}(r,o,n))}return`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certification Expiration Calendar</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 10px; /* Reduced from 12px */
            line-height: 1.1; /* Reduced from 1.2 */
            color: #333;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 15px; /* Reduced from 20px */
            padding: 10px; /* Reduced from 15px */
            border-bottom: 2px solid #2563eb;
        }
        
        .title {
            font-size: 20px; /* Reduced from 24px */
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 5px;
        }
        
        .subtitle {
            font-size: 12px; /* Reduced from 14px */
            color: #64748b;
        }
        
        .calendar-month {
            page-break-before: always;
            width: 100%;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .calendar-month:first-child {
            page-break-before: avoid;
        }
        
        .month-header {
            text-align: center;
            padding: 15px 0; /* Reduced from 20px */
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            margin-bottom: 8px; /* Reduced from 10px */
        }
        
        .month-header h2 {
            font-size: 24px; /* Reduced from 28px */
            font-weight: bold;
        }
        
        .calendar-grid {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        .day-headers {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 1px; /* Reduced from 2px */
            margin-bottom: 1px; /* Reduced from 2px */
        }
        
        .day-header {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 6px 3px; /* Reduced from 8px 4px */
            text-align: center;
            font-weight: bold;
            font-size: 12px; /* Reduced from 14px */
            color: #475569;
        }
        
        .calendar-days {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            grid-template-rows: repeat(6, 1fr);
            gap: 1px; /* Reduced from 2px */
            flex: 1;
        }
        
        .calendar-day {
            border: 1px solid #e2e8f0;
            background: white;
            position: relative;
            display: flex;
            flex-direction: column;
            min-height: 100px; /* Reduced from 120px */
        }
        
        .calendar-day.empty {
            background: #f9fafb;
            border-color: #f1f5f9;
        }
        
        .calendar-day.has-expiring {
            background: #fef3c7;
            border-color: #f59e0b;
        }
        
        .calendar-day.has-expired {
            background: #fecaca;
            border-color: #dc2626;
        }
        
        .day-number {
            position: absolute;
            top: 3px; /* Reduced from 4px */
            left: 5px; /* Reduced from 6px */
            font-weight: bold;
            font-size: 14px; /* Reduced from 16px */
            color: #374151;
            z-index: 1;
        }
        
        .has-expiring .day-number {
            color: #92400e;
        }
        
        .has-expired .day-number {
            color: #991b1b;
        }
        
        .day-content {
            padding: 18px 3px 3px 3px; /* Reduced padding */
            overflow: hidden;
            flex: 1;
        }
        
        .expiration-item {
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 3px; /* Reduced from 4px */
            padding: 2px; /* Reduced from 3px */
            margin-bottom: 1px; /* Reduced from 2px */
            font-size: 8px; /* Reduced from 9px */
            line-height: 1.0; /* Reduced from 1.1 */
        }
        
        .expiration-item.priority-high {
            border-color: #dc2626;
            background: #fef2f2;
        }
        
        .expiration-item.priority-medium {
            border-color: #f59e0b;
            background: #fffbeb;
        }
        
        .expiration-item.priority-low {
            border-color: #059669;
            background: #f0fdf4;
        }
        
        .expiration-item.expired {
            border-color: #991b1b;
            background: #fecaca;
        }
        
        .cert-name {
            font-weight: bold;
            color: #374151;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%; /* Limit text width */
        }
        
        .employee-name {
            color: #6b7280;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%; /* Limit text width */
        }
        
        .status {
            font-size: 7px; /* Reduced from 8px */
            font-weight: bold;
            text-align: center;
            padding: 1px;
            border-radius: 2px;
            margin-top: 1px;
        }
        
        .status.expired {
            background: #dc2626;
            color: white;
        }
        
        .status.expiring {
            background: #f59e0b;
            color: white;
        }
        
        .legend {
            position: fixed;
            bottom: 8px; /* Reduced from 10px */
            right: 8px; /* Reduced from 10px */
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 5px; /* Reduced from 6px */
            padding: 6px; /* Reduced from 8px */
            font-size: 9px; /* Reduced from 10px */
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            margin-bottom: 1px; /* Reduced from 2px */
        }
        
        .legend-color {
            width: 10px; /* Reduced from 12px */
            height: 10px; /* Reduced from 12px */
            border-radius: 2px;
            margin-right: 3px; /* Reduced from 4px */
            border: 1px solid #d1d5db;
        }
        
        .legend-expired { background: #fecaca; }
        .legend-expiring { background: #fef3c7; }
        .legend-normal { background: white; }
        
        @page {
            size: A4 landscape;
            margin: 0.8cm; /* Reduced from 1cm */
        }
        
        @media print {
            .calendar-month {
                page-break-before: always;
                height: 100vh;
            }
            
            .calendar-month:first-child {
                page-break-before: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Certification Expiration Calendar</div>
        <div class="subtitle">Company: ${r}</div>
        <div class="subtitle">Generated: ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</div>
        <div class="subtitle">Showing Next 6 Months</div>
    </div>
    
    ${d.join("")}
    
    <div class="legend">
        <div class="legend-item">
            <div class="legend-color legend-expired"></div>
            <span>Expired</span>
        </div>
        <div class="legend-item">
            <div class="legend-color legend-expiring"></div>
            <span>Expiring Soon</span>
        </div>
        <div class="legend-item">
            <div class="legend-color legend-normal"></div>
            <span>Normal</span>
        </div>
    </div>
</body>
</html>`}(m,w);console.log("\uD83D\uDD0D Environment check:",{NODE_ENV:"production",VERCEL:process.env.VERCEL,platform:process.platform}),console.log("\uD83D\uDE80 Using serverless chromium for production");try{let e=(await Promise.resolve().then(r.bind(r,8856))).default;console.log("✅ Puppeteer-core imported successfully");let t=(await Promise.resolve().then(r.bind(r,4442))).default;console.log("✅ Chromium imported successfully"),await t.font("https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf");let a=await t.executablePath();console.log("\uD83D\uDCCD Chromium executable path:",a),o=await e.launch({args:[...t.args,"--disable-gpu","--disable-dev-shm-usage","--disable-setuid-sandbox","--no-first-run","--no-sandbox","--no-zygote","--single-process","--disable-extensions"],defaultViewport:{width:1920,height:1080},executablePath:a,headless:!0}),console.log("✅ Browser launched successfully")}catch(e){throw console.error("❌ Import or launch error:",e),Error(`Browser setup failed: ${e?.message||"Unknown error"}`)}let R=await o.newPage();await R.setDefaultTimeout(3e4),await R.setContent(y,{waitUntil:["load","domcontentloaded"],timeout:3e4}),await new Promise(e=>setTimeout(e,1e3));let E=await R.pdf({format:"A4",landscape:!0,printBackground:!0,margin:{top:"0.8cm",right:"0.8cm",bottom:"0.8cm",left:"0.8cm"},displayHeaderFooter:!1,preferCSSPageSize:!0,scale:.8});if(await o.close(),o=null,!E||0===E.length)throw Error("Generated PDF is empty");if(console.log("Generated Calendar PDF size:",E.length,"bytes"),E.length>3670016)return console.error("PDF size exceeds limit:",E.length,"bytes (max:",3670016,"bytes)"),t.status(413).json({error:"Calendar is too large to generate. Please contact support for a custom report.",size:E.length,maxSize:3670016});t.setHeader("Content-Type","application/pdf"),t.setHeader("Content-Disposition",`attachment; filename="certification-expiration-calendar-${new Date().toISOString().split("T")[0]}.pdf"`),t.setHeader("Cache-Control","private, no-store"),t.setHeader("X-Content-Type-Options","nosniff"),t.setHeader("Content-Length",E.length.toString());let P=Buffer.isBuffer(E)?E:Buffer.from(E);t.status(200),t.write(P),t.end();return}catch(e){if(console.error("Calendar generation error:",e),o)try{await o.close()}catch(e){console.error("Error closing browser:",e)}return t.status(500).json({error:"Calendar generation failed"})}}let m=(0,n.M)(o,"default"),g=(0,n.M)(o,"config"),x=new a.PagesAPIRouteModule({definition:{kind:i.A.PAGES_API,page:"/api/reports/expiration-calendar",pathname:"/api/reports/expiration-calendar",bundlePath:"",filename:""},userland:o})},3480:(e,t,r)=>{e.exports=r(5600)},3939:e=>{e.exports=require("@supabase/supabase-js")},4442:e=>{e.exports=import("@sparticuz/chromium")},5600:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},6435:(e,t)=>{Object.defineProperty(t,"M",{enumerable:!0,get:function(){return function e(t,r){return r in t?t[r]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,r)):"function"==typeof t&&"default"===r?t:void 0}}})},8667:(e,t)=>{Object.defineProperty(t,"A",{enumerable:!0,get:function(){return r}});var r=function(e){return e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE",e.IMAGE="IMAGE",e}({})},8856:e=>{e.exports=import("puppeteer-core")}};var t=require("../../../webpack-api-runtime.js");t.C(e);var r=t(t.s=2404);module.exports=r})();