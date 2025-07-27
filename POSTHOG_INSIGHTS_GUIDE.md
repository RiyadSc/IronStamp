# PostHog Insights Guide for IronStamp

This guide outlines the most valuable PostHog insights to create for your certification management business, along with implementation details.

## 🎯 **Critical Business Metrics to Track**

### 1. **Revenue & Growth Insights**

#### **Monthly Recurring Revenue (MRR)**
- **Query**: Track subscription events and calculate monthly recurring revenue
- **Key Events**: `plan_upgraded`, `plan_downgraded`, `payment_made`
- **Properties**: `revenue_amount`, `subscription_period`, `plan_type`
- **Insight Type**: Trends chart showing MRR growth over time

#### **Customer Acquisition Cost (CAC)**
- **Query**: Marketing spend divided by new customer acquisitions
- **Key Events**: `user_signed_up`, `trial_started`, `trial_converted`
- **Properties**: `signup_method`, `referral_source`, `campaign_name`
- **Insight Type**: Funnel analysis from signup to paid conversion

#### **Churn Rate Analysis**
- **Query**: Users who stop using the platform or downgrade
- **Key Events**: `user_signed_out`, `plan_downgraded`, `dashboard_viewed`
- **Properties**: `last_activity_date`, `plan_type`, `team_size`
- **Insight Type**: Cohort analysis showing retention rates

### 2. **User Engagement & Product-Market Fit**

#### **Daily/Monthly Active Users**
- **Query**: Unique users performing key actions
- **Key Events**: `dashboard_viewed`, `certification_uploaded`, `report_generated`
- **Properties**: `user_id`, `team_size`, `business_type`
- **Insight Type**: Trends chart with DAU/MAU ratio

#### **Feature Adoption Rates**
- **Query**: Which features drive user retention
- **Key Events**: `feature_used`, `certification_uploaded`, `notification_sent`
- **Properties**: `feature_name`, `feature_category`, `user_id`
- **Insight Type**: Funnel analysis of feature usage

#### **Time to First Value**
- **Query**: Time from signup to first certification upload
- **Key Events**: `user_signed_up`, `certification_uploaded`
- **Properties**: `signup_timestamp`, `first_upload_timestamp`
- **Insight Type**: Distribution chart showing time to value

### 3. **Customer Success & Retention**

#### **Onboarding Completion Funnel**
- **Query**: Track completion rates for each onboarding step
- **Key Events**: `onboarding_started`, `onboarding_step_completed`, `onboarding_completed`
- **Properties**: `step_number`, `step_name`, `upload_method`
- **Insight Type**: Funnel analysis with conversion rates

#### **Certification Upload Success Rate**
- **Query**: Success rate of certification uploads
- **Key Events**: `certification_uploaded`, `error_occurred`
- **Properties**: `file_type`, `file_size`, `upload_method`
- **Insight Type**: Success rate trends over time

#### **Notification Engagement**
- **Query**: How users interact with notification features
- **Key Events**: `notification_sent`, `notification_setup`
- **Properties**: `notification_type`, `priority`, `days_left`
- **Insight Type**: Usage patterns and effectiveness

## 📊 **Specific Insight Recommendations**

### **High-Impact Insights to Create:**

#### 1. **Onboarding Funnel Analysis**
```sql
-- Step completion rates
SELECT 
  step_name,
  COUNT(*) as attempts,
  COUNT(CASE WHEN step_number = next_step THEN 1 END) as completions,
  (COUNT(CASE WHEN step_number = next_step THEN 1 END) * 100.0 / COUNT(*)) as completion_rate
FROM onboarding_step_completed
GROUP BY step_name
ORDER BY step_number
```

#### 2. **Feature Usage Heatmap**
```sql
-- Most used features by user type
SELECT 
  feature_name,
  feature_category,
  COUNT(*) as usage_count,
  COUNT(DISTINCT user_id) as unique_users
FROM feature_used
WHERE timestamp >= now() - INTERVAL 30 day
GROUP BY feature_name, feature_category
ORDER BY usage_count DESC
```

#### 3. **Customer Segmentation Analysis**
```sql
-- Usage patterns by team size
SELECT 
  team_size,
  COUNT(DISTINCT user_id) as users,
  AVG(certification_count) as avg_certifications,
  AVG(employee_count) as avg_employees
FROM user_properties
GROUP BY team_size
ORDER BY users DESC
```

#### 4. **Retention Cohort Analysis**
```sql
-- 7-day, 30-day, 90-day retention
SELECT 
  DATE_TRUNC('week', first_event) as cohort_week,
  COUNT(DISTINCT user_id) as cohort_size,
  COUNT(DISTINCT CASE WHEN days_since_first <= 7 THEN user_id END) as retained_7d,
  COUNT(DISTINCT CASE WHEN days_since_first <= 30 THEN user_id END) as retained_30d,
  COUNT(DISTINCT CASE WHEN days_since_first <= 90 THEN user_id END) as retained_90d
FROM user_cohorts
GROUP BY cohort_week
ORDER BY cohort_week DESC
```

#### 5. **Revenue Optimization**
```sql
-- Free-to-paid conversion funnel
SELECT 
  'signup' as step,
  COUNT(DISTINCT user_id) as users
FROM user_signed_up
WHERE timestamp >= now() - INTERVAL 30 day

UNION ALL

SELECT 
  'onboarding_complete' as step,
  COUNT(DISTINCT user_id) as users
FROM onboarding_completed
WHERE timestamp >= now() - INTERVAL 30 day

UNION ALL

SELECT 
  'first_upload' as step,
  COUNT(DISTINCT user_id) as users
FROM certification_uploaded
WHERE timestamp >= now() - INTERVAL 30 day

UNION ALL

SELECT 
  'plan_upgrade' as step,
  COUNT(DISTINCT user_id) as users
FROM plan_upgraded
WHERE timestamp >= now() - INTERVAL 30 day
```

## 🔧 **Implementation Status**

### ✅ **Completed Tracking Events:**
- `user_signed_up` - User registration
- `user_signed_in` - User login
- `user_signed_out` - User logout
- `onboarding_started` - Onboarding initiation
- `onboarding_step_completed` - Individual step completion
- `onboarding_completed` - Full onboarding completion
- `dashboard_viewed` - Dashboard visits
- `certification_uploaded` - Certification uploads
- `report_generated` - Report downloads
- `notification_sent` - Notification sending

### 🚧 **Next Steps to Implement:**

#### 1. **Add Missing Events:**
- `plan_upgraded` / `plan_downgraded` - Subscription changes
- `payment_made` - Payment processing
- `trial_started` / `trial_converted` - Trial management
- `error_occurred` - Error tracking
- `feature_used` - General feature usage
- `page_viewed` - Page navigation

#### 2. **Enhanced User Properties:**
- Set user properties after onboarding completion
- Track team size, business type, plan type
- Monitor certification and employee counts

#### 3. **Business Event Tracking:**
- Implement subscription management tracking
- Add payment processing events
- Track support interactions

## 📈 **Recommended Dashboard Setup**

### **Executive Dashboard:**
1. **Revenue Metrics** - MRR, CAC, Churn Rate
2. **User Growth** - Signups, DAU/MAU, Retention
3. **Product Usage** - Feature adoption, Time to value
4. **Customer Health** - Onboarding completion, Support tickets

### **Product Dashboard:**
1. **Onboarding Funnel** - Step completion rates
2. **Feature Usage** - Most/least used features
3. **Error Tracking** - Common issues and resolutions
4. **User Journey** - Path analysis and optimization

### **Customer Success Dashboard:**
1. **Retention Cohorts** - 7/30/90 day retention
2. **Engagement Metrics** - Session duration, frequency
3. **Support Analytics** - Ticket volume, resolution time
4. **Health Scores** - Customer risk assessment

## 🎯 **Key Performance Indicators (KPIs)**

### **Growth KPIs:**
- Monthly Signup Rate
- Trial-to-Paid Conversion Rate
- Customer Acquisition Cost
- Monthly Recurring Revenue Growth

### **Engagement KPIs:**
- Daily Active Users
- Feature Adoption Rate
- Time to First Value
- Session Duration

### **Retention KPIs:**
- 7-day Retention Rate
- 30-day Retention Rate
- Churn Rate
- Net Promoter Score

### **Business KPIs:**
- Average Revenue Per User
- Customer Lifetime Value
- Support Ticket Volume
- Onboarding Completion Rate

## 🔍 **Advanced Analytics Opportunities**

### **Predictive Analytics:**
- Churn prediction based on usage patterns
- Revenue forecasting from user behavior
- Feature adoption prediction
- Customer health scoring

### **A/B Testing:**
- Onboarding flow optimization
- Feature placement testing
- Pricing page experiments
- Email notification timing

### **Cohort Analysis:**
- User behavior by signup month
- Feature usage by user type
- Revenue patterns by cohort
- Support needs by user segment

This comprehensive tracking setup will provide deep insights into user behavior, product performance, and business growth, enabling data-driven decisions for your certification management platform. 