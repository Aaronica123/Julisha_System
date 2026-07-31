# Julisha Healthcare System

**Julisha System** is a multilingual AI-powered healthcare management platform designed for Primary Healthcare Centers (PHCs) and Community Health Centers (CHCs). Utilizing Gemma and generative AI models, Julisha delivers real-time service tracking, automated client review feedback analysis, and proactive advisory recommendations for healthcare workers and district health administrators.

---

## 🚨 The Problem

The lack of real-time tracking in healthcare service delivery often leads to unnoticed operational decline and staff negligence. Consequently, intervention by healthcare investors and district administrators comes far too late. 

Key impacts of untracked healthcare interactions include:
- **Dissatisfied Patients:** Subpar patient experiences go unaddressed.
- **Delayed Interventions:** District administrators remain unaware of facility degradation until severe failure or closure occurs.
- **Administrative Blame:** District authorities face public blame for lack of oversight and delayed response times despite lacking real-time visibility into day-to-day interactions.

---

## 💡 The Solution

Derived from the Swahili word ***Julisha*** (meaning *"to inform"* or *"to advise"*), the **Julisha Healthcare System** bridges the gap between patient feedback and administrative oversight. 

Julisha utilizes Gemma and custom AI analysis pipelines to:
1. **Provide Advisory Improvements for Healthcare Workers:** Analyzes patient feedback and ratings from medical appointments to generate actionable, personalized recommendations on how doctors and staff can improve patient interactions and service quality.
2. **Deliver Strategic Measures for District Administrators:** Tracks real-time hospital service delivery trends across facilities, flagging declining health centers early so administrators can intervene before issues worsen.
3. **Contextualize Real-Time Data:** Combines individual doctor-patient appointment reviews with overall facility healthcare statistics to deliver context-aware, actionable advice.

---

## ✨ Key Benefits of Julisha

- 👨‍⚕️ **Personalized Doctor Advisory:** Tailored recommendations for individual doctors based on client review feedback.
- 📊 **Real-Time Service Tracking:** Continuous monitoring of healthcare provision across primary and community health centers.
- 🏛️ **Administrative Decision Support:** Actionable implementation steps and policy guidelines for district administrators.
- 🚩 **Early Facility Flagging:** Automated detection and flagging of healthcare facilities exhibiting negative trend shifts.
- 🔍 **Root Cause Diagnostics:** Automated review of underlying drivers causing service quality drops in healthcare facilities.

---

## 🏗️ Architecture

Julisha is built on a robust **Four-Tier Architecture**:

```
+-----------------------------------------------------------------------+
|                             1. FRONTEND                               |
|   (React, Tailwind CSS, Multi-role Dashboard: Patient, Doctor, Admin) |
+-----------------------------------------------------------------------+
                                    │
                                    ▼
+-----------------------------------------------------------------------+
|                             2. BACKEND                                |
|       (Express API, Logic Controllers, Prompt Builder Engine)         |
+-----------------------------------------------------------------------+
                                    │
                                    ▼
+-----------------------------------+-----------------------------------+
|            3. DATABASE            |               4. AI               |
| (Patient Reviews, Doctor Metrics, |  (Gemma Model / AI Recommendation |
|      Facility Statistics)         |   Engine via Prompt Builder)      |
+-----------------------------------+-----------------------------------+
```

1. **Frontend:** Multi-role user interface (Patient, Doctor, District Administrator) where patients submit feedback, doctors review interaction insights, and administrators view district health metrics.
2. **Backend:** Hosts application APIs, analytics controllers, and the Prompt Builder Engine that manages business and recommendation logic.
3. **Database:** Stores structured patient reviews, appointment ratings, doctor performance metrics, and facility healthcare statistics.
4. **AI Layer:** Powered by Gemma. Receives optimized, contextualized prompts from the Prompt Builder Engine and generates tailored advisory recommendations.

---

## 🔄 System Flow & Process Flow

### System Flow
```
[ USER INPUT ] ──► [ AI MODEL ANALYSIS ] ──► [ PROMPT BUILDER ] ──► [ GEMMA ANALYSIS & FEEDBACK ]
```

### Step-by-Step Process Flow
1. **User Input:** The patient rates their experience with a healthcare worker during a medical appointment and submits detailed review feedback.
2. **AI Model Analysis:** The submitted review and ratings are processed by specialized evaluation models to quantify sentiment, sentiment scores, and key interaction topics.
3. **Prompt Builder Construction:** The Prompt Builder Engine aggregates the model outputs with facility context and historical doctor metrics to generate a customized prompt payload.
4. **Gemma Analysis & Advisory Delivery:** Gemma processes the contextual prompt and generates actionable advisory recommendations dispatched directly to the doctor's hub or district administrator dashboard.

---

## 🚀 Key Features in the Applet

- **Multilingual Support:** English, Swahili (Kiswahili), Hindi, Telugu, Tamil, and Kannada.
- **Sanitary & Hygiene Scoring Engine:**
  - Evaluates both **Doctor Personal Hygiene & PPE** (hand sanitization, clean coat, gloves per patient) and **Hospital Sanitation & Disposal** (clean waiting areas, sterilised surfaces, biohazard medical waste disposal).
  - Factors directly into facility overall composite rating with a **25% weighting**.
  - Automatically flags facilities with sub-55% hygiene scores with critical **Sanitation & Hygiene Alerts** for district administrators even if doctor satisfaction or medicine stock appears acceptable.
- **Patient Queue Response Speed & Attendance Metric Engine:**
  - Measures the actual response delay between when a patient is scheduled/checked-in and when the doctor completes the current patient, becomes free, and attends to them.
  - Replaces traditional shift clock-in attendance with real-time consultation response promptness tracking (promptness threshold: $\le$ 10 minutes delay).
  - Factors directly into facility overall composite rating with a **15% weighting** alongside doctor satisfaction (30%), sanitation & hygiene (25%), medicine stock availability (20%), and volume efficiency (10%).
  - Automatically flags **Patient Response Delay Alerts** for district administrators if average response wait times exceed 20 minutes or prompt response rate drops below 60%.
- **Patient Feedback Hub:** Multilingual appointment feedback form with 6 rating criteria (including Doctor Hygiene & Hospital Sanitation), biometric fingerprint verification, offline queue, and AI translation.
- **Doctor Performance Hub:** Individual doctor dashboard showing patient review summaries, 5-domain performance breakdown, real-time patient queue attendance controls, response delay analytics, and AI-driven clinical advice.
- **District Administrator Dashboard:** District-wide performance matrix across all 5 composite factors, stockout correlation engine, Sanitary & Hygiene warning indicators, queue delay alerts, facility trend direction (improving, stable, declining counts), and Gemma AI facility advisory reports.
