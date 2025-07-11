"use strict";exports.id=693,exports.ids=[693],exports.modules={146:(e,i,t)=>{t.a(e,async(e,o)=>{try{t.d(i,{J:()=>c});var r=t(6373),n=t(7997),s=t(9447),a=e([r]);let l=new(r=(a.then?(await a)():a)[0]).Resend(process.env.RESEND_API_KEY);class c{static async sendEmailNotification(e,i){try{if(!process.env.RESEND_API_KEY)throw Error("RESEND_API_KEY is not configured");let t=(0,n.R)(e,{employeeName:i.employeeName,certificationName:i.certificationName,expirationDate:i.expirationDate,daysUntilExpiry:i.daysUntilExpiry,companyName:i.companyName}),o=await l.emails.send({from:"notifications@certkeeper.com",to:i.employeeEmail,subject:t.subject,html:t.html});if(o.error)return console.error("Resend error:",o.error),{success:!1,error:o.error.message};return await this.logNotification({userId:i.userId,employeeId:i.employeeId,certificationId:i.certificationId,notificationType:e,channel:"email",recipient:i.employeeEmail,messageId:o.data?.id,status:"sent",sentAt:new Date().toISOString()}),{success:!0,messageId:o.data?.id}}catch(t){return console.error("Email notification error:",t),await this.logNotification({userId:i.userId,employeeId:i.employeeId,certificationId:i.certificationId,notificationType:e,channel:"email",recipient:i.employeeEmail,status:"failed",errorMessage:t instanceof Error?t.message:"Unknown error",sentAt:new Date().toISOString()}),{success:!1,error:t instanceof Error?t.message:"Unknown error"}}}static async logNotification(e){try{let{error:i}=await s.N.from("notification_logs").insert([e]);i&&console.error("Failed to log notification:",i)}catch(e){console.error("Database logging error:",e)}}static async wasNotificationSent(e,i,t,o,r){try{let{data:n,error:a}=await s.N.from("notification_logs").select("id").eq("user_id",e).eq("employee_id",i).eq("certification_id",t).eq("notification_type",o).eq("status","sent").gte("sent_at",`${r}T00:00:00`).lt("sent_at",`${r}T23:59:59`).limit(1);if(a)return console.error("Error checking notification history:",a),!1;return n&&n.length>0}catch(e){return console.error("Database check error:",e),!1}}static async getCertificationsForNotification(e){try{let i=new Date,t=i.toISOString().split("T")[0],{data:o,error:r}=await s.N.from("certifications").select(`
          id,
          employee_name,
          employee_email,
          certification_name,
          expiration_date,
          user_id,
          employee_id
        `).eq("user_id",e);if(r)return console.error("Error fetching certifications:",r),[];if(!o)return[];let n=[];for(let r of o){let o=new Date(r.expiration_date).getTime()-i.getTime(),s=Math.ceil(o/864e5);for(let i of[{type:"60_days",days:60},{type:"30_days",days:30},{type:"14_days",days:14},{type:"7_days",days:7},{type:"expired",days:0}])(i.days>0&&s===i.days||0===i.days&&s<=0)&&(await this.wasNotificationSent(e,r.employee_id||r.id,r.id,i.type,t)||n.push({employeeId:r.employee_id||r.id,employeeName:r.employee_name,employeeEmail:r.employee_email,certificationId:r.id,certificationName:r.certification_name,expirationDate:r.expiration_date,daysUntilExpiry:s,notificationType:i.type,userId:r.user_id}))}return n}catch(e){return console.error("Error getting certifications for notification:",e),[]}}static async processNotifications(e,i){try{let t=await this.getCertificationsForNotification(e);if(0===t.length)return console.log(`No notifications needed for user ${e}`),{processed:0,successful:0,failed:0};let o=0,r=0;for(let e of t){let t=await this.sendEmailNotification(e.notificationType,{...e,companyName:i});t.success?(o++,console.log(`Sent ${e.notificationType} notification to ${e.employeeEmail}`)):(r++,console.error(`Failed to send notification to ${e.employeeEmail}:`,t.error)),await new Promise(e=>setTimeout(e,100))}return{processed:t.length,successful:o,failed:r}}catch(e){return console.error("Error processing notifications:",e),{processed:0,successful:0,failed:0}}}}o()}catch(e){o(e)}})},3480:(e,i,t)=>{e.exports=t(5600)},6435:(e,i)=>{Object.defineProperty(i,"M",{enumerable:!0,get:function(){return function e(i,t){return t in i?i[t]:"then"in i&&"function"==typeof i.then?i.then(i=>e(i,t)):"function"==typeof i&&"default"===t?i:void 0}}})},7997:(e,i,t)=>{t.d(i,{R:()=>o});let o=(e,i)=>{let{employeeName:t,certificationName:o,expirationDate:r,daysUntilExpiry:n,companyName:s}=i;return({"60_days":{subject:`Reminder: ${o} expires in 60 days`,html:`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e40af; margin: 0; font-size: 24px;">Certification Reminder</h1>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">Dear ${t},</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">
              This is a friendly reminder that your <strong>${o}</strong> certification will expire in <strong>60 days</strong> on <strong>${r}</strong>.
            </p>
            
            <div style="background-color: #dbeafe; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #1e40af; font-weight: bold; margin: 0;">📅 Expiration Date: ${r}</p>
              <p style="color: #1e40af; margin: 5px 0 0 0;">⏰ Days Remaining: ${n}</p>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">
              We recommend starting the renewal process now to ensure continuous compliance with Massachusetts HVAC regulations.
            </p>
            
            <p style="color: #374151; font-size: 14px; line-height: 1.5; margin-top: 30px;">
              Best regards,<br>
              ${s} Compliance Team
            </p>
          </div>
        </div>
      `},"30_days":{subject:`Important: ${o} expires in 30 days`,html:`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fef3c7;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #d97706; margin: 0; font-size: 24px;">⚠️ Certification Expiring Soon</h1>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">Dear ${t},</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">
              Your <strong>${o}</strong> certification will expire in <strong>30 days</strong> on <strong>${r}</strong>.
            </p>
            
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #d97706;">
              <p style="color: #92400e; font-weight: bold; margin: 0;">📅 Expiration Date: ${r}</p>
              <p style="color: #92400e; margin: 5px 0 0 0;">⏰ Days Remaining: ${n}</p>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">
              <strong>Action Required:</strong> Please begin your certification renewal process immediately to maintain compliance with Massachusetts HVAC licensing requirements.
            </p>
            
            <p style="color: #374151; font-size: 14px; line-height: 1.5; margin-top: 30px;">
              Best regards,<br>
              ${s} Compliance Team
            </p>
          </div>
        </div>
      `},"14_days":{subject:`URGENT: ${o} expires in 14 days`,html:`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fee2e2;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin: 0; font-size: 24px;">🚨 URGENT: Certification Expires Soon</h1>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">Dear ${t},</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">
              <strong>URGENT:</strong> Your <strong>${o}</strong> certification will expire in only <strong>14 days</strong> on <strong>${r}</strong>.
            </p>
            
            <div style="background-color: #fee2e2; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <p style="color: #991b1b; font-weight: bold; margin: 0;">📅 Expiration Date: ${r}</p>
              <p style="color: #991b1b; margin: 5px 0 0 0;">⏰ Days Remaining: ${n}</p>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">
              <strong>IMMEDIATE ACTION REQUIRED:</strong> You must complete your certification renewal process within the next 14 days to maintain compliance with Massachusetts HVAC regulations and continue working legally.
            </p>
            
            <p style="color: #374151; font-size: 14px; line-height: 1.5; margin-top: 30px;">
              Best regards,<br>
              ${s} Compliance Team
            </p>
          </div>
        </div>
      `},"7_days":{subject:`CRITICAL: ${o} expires in 7 days - IMMEDIATE ACTION REQUIRED`,html:`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fee2e2;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin: 0; font-size: 26px;">🚨 CRITICAL: CERTIFICATION EXPIRES IN 7 DAYS</h1>
            </div>
            
            <p style="color: #374151; font-size: 18px; line-height: 1.5; font-weight: bold;">Dear ${t},</p>
            
            <p style="color: #374151; font-size: 18px; line-height: 1.5;">
              <strong style="color: #dc2626;">CRITICAL ALERT:</strong> Your <strong>${o}</strong> certification expires in <strong style="color: #dc2626;">ONLY 7 DAYS</strong> on <strong>${r}</strong>.
            </p>
            
            <div style="background-color: #fee2e2; padding: 25px; border-radius: 6px; margin: 25px 0; border: 2px solid #dc2626;">
              <p style="color: #991b1b; font-weight: bold; margin: 0; font-size: 18px;">📅 Expiration Date: ${r}</p>
              <p style="color: #991b1b; margin: 10px 0 0 0; font-size: 18px;">⏰ Days Remaining: ${n}</p>
            </div>
            
            <p style="color: #374151; font-size: 18px; line-height: 1.5;">
              <strong style="color: #dc2626;">IMMEDIATE ACTION REQUIRED:</strong> You must renew your certification within the next 7 days to continue working legally in Massachusetts. Failure to maintain valid certification may result in work stoppage and potential fines.
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-top: 30px;">
              Please contact your supervisor immediately if you need assistance with the renewal process.
            </p>
            
            <p style="color: #374151; font-size: 14px; line-height: 1.5; margin-top: 30px;">
              Best regards,<br>
              ${s} Compliance Team
            </p>
          </div>
        </div>
      `},expired:{subject:`🚨 EXPIRED: ${o} - STOP WORK IMMEDIATELY`,html:`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fef2f2;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 3px solid #dc2626;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin: 0; font-size: 28px;">🚨 CERTIFICATION EXPIRED - STOP WORK IMMEDIATELY</h1>
            </div>
            
            <p style="color: #374151; font-size: 20px; line-height: 1.5; font-weight: bold;">Dear ${t},</p>
            
            <p style="color: #374151; font-size: 20px; line-height: 1.5;">
              <strong style="color: #dc2626;">ALERT:</strong> Your <strong>${o}</strong> certification <strong style="color: #dc2626;">EXPIRED</strong> on <strong>${r}</strong>.
            </p>
            
            <div style="background-color: #fef2f2; padding: 30px; border-radius: 6px; margin: 30px 0; border: 3px solid #dc2626;">
              <p style="color: #991b1b; font-weight: bold; margin: 0; font-size: 20px;">📅 Expiration Date: ${r}</p>
              <p style="color: #991b1b; margin: 15px 0 0 0; font-size: 20px;">❌ Status: EXPIRED</p>
            </div>
            
            <div style="background-color: #fee2e2; padding: 25px; border-radius: 8px; margin: 30px 0;">
              <h2 style="color: #dc2626; margin: 0 0 15px 0; font-size: 22px;">⚠️ MASSACHUSETTS LAW COMPLIANCE WARNING</h2>
              <p style="color: #374151; font-size: 18px; line-height: 1.5; margin: 0;">
                <strong>You must STOP all HVAC work immediately.</strong> Working without valid certification in Massachusetts may result in:
              </p>
              <ul style="color: #374151; font-size: 18px; line-height: 1.6; margin: 15px 0;">
                <li><strong>Fines and penalties</strong> for you and your employer</li>
                <li><strong>Legal liability</strong> for any work performed</li>
                <li><strong>License suspension</strong> or revocation</li>
                <li><strong>Criminal charges</strong> in severe cases</li>
              </ul>
            </div>
            
            <p style="color: #374151; font-size: 18px; line-height: 1.5;">
              <strong style="color: #dc2626;">IMMEDIATE ACTION REQUIRED:</strong>
            </p>
            <ol style="color: #374151; font-size: 18px; line-height: 1.6;">
              <li>Stop all HVAC work immediately</li>
              <li>Contact your supervisor</li>
              <li>Begin certification renewal process immediately</li>
              <li>Do not resume work until certification is renewed</li>
            </ol>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-top: 30px;">
              Contact your supervisor or HR department immediately for guidance on the renewal process.
            </p>
            
            <p style="color: #374151; font-size: 14px; line-height: 1.5; margin-top: 30px;">
              Best regards,<br>
              ${s} Compliance Team
            </p>
          </div>
        </div>
      `}})[e]}},8667:(e,i)=>{Object.defineProperty(i,"A",{enumerable:!0,get:function(){return t}});var t=function(e){return e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE",e.IMAGE="IMAGE",e}({})},9447:(e,i,t)=>{t.d(i,{N:()=>o});let o=(0,t(3939).createClient)("https://ugpdxevfjegpviskdzix.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVncGR4ZXZmamVncHZpc2tkeml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNzI4MjQsImV4cCI6MjA2NTg0ODgyNH0.8mL5TXTT57ImEHlQ4G8Vp1Mh2d3I2NIo_IdInj7S8dI",{auth:{autoRefreshToken:!0,persistSession:!0,detectSessionInUrl:!0,storageKey:"cert-keeper-auth",storage:void 0,flowType:"pkce"},global:{headers:{"x-application-name":"cert-keeper"}},realtime:{params:{eventsPerSecond:10}}})}};