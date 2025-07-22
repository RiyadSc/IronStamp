interface TemplateData {
  employeeName: string;
  certificationName: string;
  expirationDate: string;
  daysUntilExpiry: number;
  companyName: string;
}

export const getEmailTemplate = (type: '60_days' | '30_days' | '14_days' | '7_days' | 'expired', data: TemplateData) => {
  const { employeeName, certificationName, expirationDate, daysUntilExpiry, companyName } = data;

  const templates = {
    '60_days': {
      subject: `Reminder: ${certificationName} expires in ${daysUntilExpiry} days`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e40af; margin: 0; font-size: 24px;">Certification Reminder</h1>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">Dear ${employeeName},</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">
              This is a friendly reminder that your <strong>${certificationName}</strong> certification will expire in <strong>${daysUntilExpiry} days</strong> on <strong>${expirationDate}</strong>.
            </p>
            
            <div style="background-color: #dbeafe; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #1e40af; font-weight: bold; margin: 0;">📅 Expiration Date: ${expirationDate}</p>
              <p style="color: #1e40af; margin: 5px 0 0 0;">⏰ Days Remaining: ${daysUntilExpiry}</p>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">
              We recommend starting the renewal process now to ensure continuous compliance with Massachusetts HVAC regulations.
            </p>
            
            <p style="color: #374151; font-size: 14px; line-height: 1.5; margin-top: 30px;">
              Best regards,<br>
              ${companyName} Compliance Team
            </p>
          </div>
        </div>
      `
    },

    '30_days': {
      subject: `Important: ${certificationName} expires in ${daysUntilExpiry} days`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fef3c7;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #d97706; margin: 0; font-size: 24px;">⚠️ Certification Expiring Soon</h1>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">Dear ${employeeName},</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">
              Your <strong>${certificationName}</strong> certification will expire in <strong>${daysUntilExpiry} days</strong> on <strong>${expirationDate}</strong>.
            </p>
            
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #d97706;">
              <p style="color: #92400e; font-weight: bold; margin: 0;">📅 Expiration Date: ${expirationDate}</p>
              <p style="color: #92400e; margin: 5px 0 0 0;">⏰ Days Remaining: ${daysUntilExpiry}</p>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">
              <strong>Action Required:</strong> Please begin your certification renewal process immediately to maintain compliance with Massachusetts HVAC licensing requirements.
            </p>
            
            <p style="color: #374151; font-size: 14px; line-height: 1.5; margin-top: 30px;">
              Best regards,<br>
              ${companyName} Compliance Team
            </p>
          </div>
        </div>
      `
    },

    '14_days': {
      subject: `URGENT: ${certificationName} expires in ${daysUntilExpiry} days`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fee2e2;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin: 0; font-size: 24px;">🚨 URGENT: Certification Expires Soon</h1>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">Dear ${employeeName},</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">
              <strong>URGENT:</strong> Your <strong>${certificationName}</strong> certification will expire in only <strong>${daysUntilExpiry} days</strong> on <strong>${expirationDate}</strong>.
            </p>
            
            <div style="background-color: #fee2e2; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <p style="color: #991b1b; font-weight: bold; margin: 0;">📅 Expiration Date: ${expirationDate}</p>
              <p style="color: #991b1b; margin: 5px 0 0 0;">⏰ Days Remaining: ${daysUntilExpiry}</p>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">
              <strong>IMMEDIATE ACTION REQUIRED:</strong> You must complete your certification renewal process within the next ${daysUntilExpiry} days to maintain compliance with Massachusetts HVAC regulations and continue working legally.
            </p>
            
            <p style="color: #374151; font-size: 14px; line-height: 1.5; margin-top: 30px;">
              Best regards,<br>
              ${companyName} Compliance Team
            </p>
          </div>
        </div>
      `
    },

    '7_days': {
      subject: `CRITICAL: ${certificationName} expires in ${daysUntilExpiry} days - IMMEDIATE ACTION REQUIRED`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fee2e2;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin: 0; font-size: 26px;">🚨 CRITICAL: CERTIFICATION EXPIRES IN ${daysUntilExpiry} DAYS</h1>
            </div>
            
            <p style="color: #374151; font-size: 18px; line-height: 1.5; font-weight: bold;">Dear ${employeeName},</p>
            
            <p style="color: #374151; font-size: 18px; line-height: 1.5;">
              <strong style="color: #dc2626;">CRITICAL ALERT:</strong> Your <strong>${certificationName}</strong> certification expires in <strong style="color: #dc2626;">ONLY ${daysUntilExpiry} DAYS</strong> on <strong>${expirationDate}</strong>.
            </p>
            
            <div style="background-color: #fee2e2; padding: 25px; border-radius: 6px; margin: 25px 0; border: 2px solid #dc2626;">
              <p style="color: #991b1b; font-weight: bold; margin: 0; font-size: 18px;">📅 Expiration Date: ${expirationDate}</p>
              <p style="color: #991b1b; margin: 10px 0 0 0; font-size: 18px;">⏰ Days Remaining: ${daysUntilExpiry}</p>
            </div>
            
            <p style="color: #374151; font-size: 18px; line-height: 1.5;">
              <strong style="color: #dc2626;">IMMEDIATE ACTION REQUIRED:</strong> You must renew your certification within the next ${daysUntilExpiry} days to continue working legally in Massachusetts. Failure to maintain valid certification may result in work stoppage and potential fines.
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-top: 30px;">
              Please contact your supervisor immediately if you need assistance with the renewal process.
            </p>
            
            <p style="color: #374151; font-size: 14px; line-height: 1.5; margin-top: 30px;">
              Best regards,<br>
              ${companyName} Compliance Team
            </p>
          </div>
        </div>
      `
    },

    'expired': {
      subject: `🚨 EXPIRED: ${certificationName} - STOP WORK IMMEDIATELY`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fef2f2;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 3px solid #dc2626;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin: 0; font-size: 28px;">🚨 CERTIFICATION EXPIRED - STOP WORK IMMEDIATELY</h1>
            </div>
            
            <p style="color: #374151; font-size: 20px; line-height: 1.5; font-weight: bold;">Dear ${employeeName},</p>
            
            <p style="color: #374151; font-size: 20px; line-height: 1.5;">
              <strong style="color: #dc2626;">ALERT:</strong> Your <strong>${certificationName}</strong> certification <strong style="color: #dc2626;">EXPIRED</strong> on <strong>${expirationDate}</strong>.
            </p>
            
            <div style="background-color: #fef2f2; padding: 30px; border-radius: 6px; margin: 30px 0; border: 3px solid #dc2626;">
              <p style="color: #991b1b; font-weight: bold; margin: 0; font-size: 20px;">📅 Expiration Date: ${expirationDate}</p>
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
              ${companyName} Compliance Team
            </p>
          </div>
        </div>
      `
    }
  };

  return templates[type];
}; 