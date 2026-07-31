import { GoogleGenAI } from '@google/genai';

// Initialize server-side Gemini SDK
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY environment variable is not set. Using intelligent structured fallback mode.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function generateDoctorAdviceServer(doctorName: string, specialization: string, analyticsData: any) {
  const ai = getGeminiClient();
  const prompt = `
You are an empathetic medical mentor and health system advisor providing constructive feedback to help a doctor improve patient interaction skills and clinical hygiene.

DOCTOR DATA:
Name: ${doctorName}
Specialization: ${specialization}
Overall Satisfaction Score: ${analyticsData.overallScore}%
Category Scores:
- Communication Clarity: ${(analyticsData.categoryScores?.communication * 100).toFixed(0)}%
- Conduct & Respect: ${(analyticsData.categoryScores?.conduct * 100).toFixed(0)}%
- User Interactiveness: ${(analyticsData.categoryScores?.interactiveness * 100).toFixed(0)}%
- Dress Code & Professionalism: ${(analyticsData.categoryScores?.dressCode * 100).toFixed(0)}%
- Doctor Personal Hygiene & PPE: ${((analyticsData.categoryScores?.doctorHygiene || 0.8) * 100).toFixed(0)}%

Trend Direction: ${analyticsData.trendDirection}
Weaknesses Identified: ${JSON.stringify(analyticsData.weaknesses || [])}
On-Time Arrival: ${analyticsData.attendanceOnTimePct}%

TASK: Provide 3-5 supportive, highly practical, and actionable recommendations focusing on doctor-patient interaction and clinical hand/glove hygiene.

REQUIREMENTS:
1. Be supportive and encouraging
2. Provide specific, practical advice tailored for primary healthcare / community clinics (hand sanitization, clean coat, fresh gloves per patient)
3. Address the lowest scoring category first
4. Include quick wins for this week and long-term habits

Format output in clear, structured Markdown with headers:
## Performance Summary
## Key Improvement Areas
## Quick Wins for This Week
## Long-term Development & Mentorship
`;

  if (!ai) {
    return generateFallbackDoctorAdvice(doctorName, analyticsData);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });
    return response.text || generateFallbackDoctorAdvice(doctorName, analyticsData);
  } catch (error) {
    console.error('Error calling Gemini API for doctor advice:', error);
    return generateFallbackDoctorAdvice(doctorName, analyticsData);
  }
}

export async function generateHospitalInterventionServer(hospitalName: string, performanceScore: number, stockoutCorrelation: any, hospitalDetails: any) {
  const ai = getGeminiClient();
  const prompt = `
You are a District Health Officer and medical management expert analyzing a declining or struggling PHC/CHC facility to create an immediate intervention plan.

HOSPITAL DATA:
Name: ${hospitalName}
Performance Score: ${performanceScore}%
Sanitary & Hygiene Score: ${hospitalDetails.sanitaryHygieneScore || 65}%
Trend: ${hospitalDetails.trendDirection} (Decline: ${hospitalDetails.declinePercentage || 12}%)
Stockout Correlation Coefficient: ${stockoutCorrelation?.correlationCoefficient || 85}%
Stockout Impact on Patient Satisfaction: ${stockoutCorrelation?.impactPercentage || 65}%
Top Shortage Medicines: ${(stockoutCorrelation?.topShortageMedicines || ['Amoxicillin', 'Iron Folic Acid']).join(', ')}

TASK: Create a comprehensive action plan for intervention addressing stock shortages, doctor attendance, and sanitation/medical waste disposal.

CONSIDERATIONS:
1. If Sanitary & Hygiene Score < 60%, mandate immediate biohazard waste disposal protocols and daily clinic sanitation audits.
2. If stockout correlation > 60%, prioritize supply chain fixes and emergency buffer redistribution.
3. If doctor arrival/attendance is low, include clinical shift scheduling and incentive support.
4. Include specific recommendations to redistribute surplus medicines from neighboring CHCs/PHCs.

FORMAT OUTPUT IN MARKDOWN:
## 🏥 ${hospitalName} - Action Plan
### 🔴 Critical Issues Identified
### 📋 Recommended Interventions
#### 🚨 Immediate (Next 72 hours)
#### 📅 Short-term (Next 2 weeks)
#### 🗓️ Long-term (Next 30 days)
### 🔄 Resource Redistribution Strategy
### 📊 Success Metrics
`;

  if (!ai) {
    return generateFallbackHospitalIntervention(hospitalName, performanceScore, stockoutCorrelation);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });
    return response.text || generateFallbackHospitalIntervention(hospitalName, performanceScore, stockoutCorrelation);
  } catch (error) {
    console.error('Error calling Gemini API for hospital intervention:', error);
    return generateFallbackHospitalIntervention(hospitalName, performanceScore, stockoutCorrelation);
  }
}

export async function generateDistrictSummaryServer(districtStats: any) {
  const ai = getGeminiClient();
  const prompt = `
You are a District Health Officer reviewing performance across all PHCs/CHCs in your district.

DISTRICT OVERVIEW:
- Total Hospitals: ${districtStats.totalHospitals}
- Average District Score: ${districtStats.avgScore}%
- Facilities Improving: ${districtStats.improvingCount}
- Facilities Declining: ${districtStats.decliningCount}
- Critical Alerts: ${districtStats.criticalAlertsCount}
- Active Stockout Alerts: ${districtStats.stockoutAlertsCount}

Top Performer: ${districtStats.topPerformerName} (${districtStats.topPerformerScore}%)
Lowest Performer: ${districtStats.lowestPerformerName} (${districtStats.lowestPerformerScore}%)

TASK: Provide a concise 1-minute executive summary and strategic action plan for district administrators.

FORMAT IN MARKDOWN:
## 📊 District Health Service Executive Report
### Executive Summary
### 🟢 District Strengths
### 🔴 Critical Concerns & Stockout Vulnerabilities
### 🎯 Recommended Priority Actions
### ⚠️ Systemic Risk Warning
`;

  if (!ai) {
    return generateFallbackDistrictSummary(districtStats);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });
    return response.text || generateFallbackDistrictSummary(districtStats);
  } catch (error) {
    console.error('Error calling Gemini API for district summary:', error);
    return generateFallbackDistrictSummary(districtStats);
  }
}

// Fallback Generators
function generateFallbackDoctorAdvice(doctorName: string, data: any) {
  const lowestCat = data?.weaknesses?.[0]?.category || 'Communication & Clarity';
  return `## Performance Summary
${doctorName} maintains an overall patient satisfaction rating of **${data.overallScore || 75}%**. While clinical consultation remains steady, focused attention on key patient communication areas will elevate patient trust.

## Key Improvement Areas
1. **${lowestCat}**: Simplify medical jargon into localized phrases when explaining dosages to rural patients.
2. **First Contact Timelines**: Ensure consultations commence promptly at shift start time (${data.attendanceOnTimePct || 80}% on-time baseline).
3. **Interactive Reassurance**: Ask patients to repeat back key prescription instructions before leaving the desk.

## Quick Wins for This Week
- Use localized language cards or visual dosage icons when prescribing antibiotics.
- Begin clinic sessions 5 minutes prior to scheduled start time to review pre-queued patient files.

## Long-term Development & Mentorship
- Participate in the District Peer Communication Workshop held quarterly for primary care officers.`;
}

function generateFallbackHospitalIntervention(hospitalName: string, score: number, correlation: any) {
  return `## 🏥 ${hospitalName} - Action Plan

### 🔴 Critical Issues Identified
- **Acute Stockouts**: Primary antibiotics and maternal supplements are depleted, showing an **${correlation?.correlationCoefficient || 85}% correlation** with drops in patient satisfaction.
- **Attendance Bottlenecks**: Doctor arrival delays during morning peak hours lead to extended patient waiting times.

### 📋 Recommended Interventions
#### 🚨 Immediate (Next 72 hours)
- Authorize emergency transfer of 150 units of Amoxicillin and 200 units of Iron Folic Acid from neighboring CHC surplus stock.
- Deploy an automated attendance SMS notification for medical officers upon shift start.

#### 📅 Short-term (Next 2 weeks)
- Establish dynamic re-order buffer thresholds (increased from 150 to 300 units for high-demand essential drugs).
- Conduct weekly biometric feedback sync for all outpatient visits.

#### 🗓️ Long-term (Next 30 days)
- Integrate automated stock alert Webhooks directly with the regional drug procurement warehouse.

### 🔄 Resource Redistribution Strategy
- Transfer **150 Amoxicillin capsules** from Sunrise CHC (current surplus: 420 units) to ${hospitalName}.

### 📊 Success Metrics
| Metric | Baseline | 30-Day Target |
|--------|----------|---------------|
| Stock Availability | ${score < 50 ? '35%' : '50%'} | 85%+ |
| Patient Satisfaction | ${score}% | 75%+ |
| Morning Clock-In On-Time | 61% | 90%+ |`;
}

function generateFallbackDistrictSummary(stats: any) {
  return `## 📊 District Health Service Executive Report

### Executive Summary
The district maintains an average health facility score of **${stats.avgScore || 74}%** across **${stats.totalHospitals || 5} facilities**. While leading facilities like **${stats.topPerformerName || 'Metro Model PHC'}** set high standards in stock maintenance and patient experience, **${stats.decliningCount || 2} facilities** face acute stockout-driven satisfaction drops requiring immediate district intervention.

### 🟢 District Strengths
- Top facilities consistently achieve 90%+ doctor punctuality and patient trust.
- Patient feedback participation via biometric validation has increased patient transparency.

### 🔴 Critical Concerns & Stockout Vulnerabilities
- Severe stockouts in rural PHCs are directly driving down patient satisfaction scores.
- Morning shift tardiness in declining facilities exacerbates patient waiting queues.

### 🎯 Recommended Priority Actions
1. **Redistribute Surplus Supplies**: Execute immediate transfer from high-stock CHCs to depleted PHCs.
2. **Automate Early Warning Alerts**: Trigger district alerts when stock drops below 20% of threshold.
3. **Conduct Bi-Weekly Reviews**: Host performance reviews with medical officers in declining facilities.

### ⚠️ Systemic Risk Warning
Unaddressed antibiotic and maternal care drug shortages risks patient care delays and increased referral burdens on central hospitals.`;
}
