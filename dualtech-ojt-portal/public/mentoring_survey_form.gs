/**
 * ======================================================================================
 * DUALTECH TRAINING CENTER - MENTORING PORTAL (mentoring.html) SURVEY GENERATOR
 * ======================================================================================
 * This Google Apps Script automatically creates the comprehensive feedback survey form 
 * and connects it directly to a Google Sheet to record all responses.
 *
 * HOW TO USE:
 * 1. Open Google Sheets (create a new blank spreadsheet or use an existing one).
 * 2. Click "Extensions" > "Apps Script".
 * 3. Delete any code in the editor and paste this entire script.
 * 4. Click the "Save" (disk icon) button.
 * 5. Run the function: `createMentoringSurvey()`.
 * 6. Authorize the permissions when prompted.
 * 7. Check the Execution Log (View > Execution log) for the Form and Sheet URLs!
 * ======================================================================================
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📋 Mentoring Survey')
    .addItem('Generate Survey Form', 'createMentoringSurvey')
    .addToUi();
}

function createMentoringSurvey() {
  // 1. Get or Create Spreadsheet Destination
  let ss;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    ss = null;
  }
  
  if (!ss) {
    ss = SpreadsheetApp.create('Dualtech Mentoring Portal Survey Responses');
  }

  // 2. Create the Google Form
  const formTitle = 'Dualtech Mentoring Portal (mentoring.html) Usability & Feedback Survey';
  const form = FormApp.create(formTitle);

  form.setDescription(
    'Dear Mentors, Learning Facilitators, and Coordinators:\n\n' +
    'This survey evaluates the usability, reliability, and effectiveness of the Dualtech Mentoring Admin Console (mentoring.html). ' +
    'Your feedback will guide ongoing feature improvements, bug resolutions, and workflow optimizations.\n\n' +
    'Estimated completion time: 5-7 minutes. Thank you for your dedicated service!'
  );

  form.setConfirmationMessage(
    'Thank you for completing the Mentoring Portal Feedback Survey!\n\n' +
    'Your responses have been recorded and will be reviewed by the OJT & Mentoring Portal Committee.'
  );

  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(false);

  // Link Form to Google Sheet
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // ====================================================================================
  // SECTION 1: RESPONDENT PROFILE
  // ====================================================================================
  const s1 = form.addPageBreakItem().setTitle('Section 1: Respondent Profile');
  s1.setHelpText('Please provide your background information to help us categorize feedback.');

  // Role
  form.addMultipleChoiceItem()
    .setTitle('1. What is your primary role in using the Mentoring Portal?')
    .setChoiceValues([
      'Learning Facilitator (LF) / Batch Adviser',
      'Industrial / Company Mentor',
      'Values / Spiritual / Personal Mentor',
      'OJT / ASTP Coordinator',
      'Administrative / Registrar Staff'
    ])
    .showOtherOption(true)
    .setRequired(true);

  // Usage Frequency
  form.addMultipleChoiceItem()
    .setTitle('2. How frequently do you access or interact with the Mentoring Portal?')
    .setChoiceValues([
      'Daily',
      '2–3 times a week',
      'Once a week',
      'Bi-weekly / Monthly',
      'Only when prompted / Rarely'
    ])
    .setRequired(true);

  // Primary Device
  form.addMultipleChoiceItem()
    .setTitle('3. What device do you primarily use to access the portal?')
    .setChoiceValues([
      'Desktop / Laptop computer (Office or Home)',
      'Tablet / iPad',
      'Smartphone / Mobile browser'
    ])
    .setRequired(true);

  // ====================================================================================
  // SECTION 2: MODULE-SPECIFIC USAGE & EVALUATION
  // ====================================================================================
  const s2 = form.addPageBreakItem().setTitle('Section 2: Module-Specific Usage & Functionality');
  s2.setHelpText('Rate and evaluate the modules of the Mentoring Portal based on your day-to-day experience.');

  // Module A: ASTP Schooling Dashboard
  form.addScaleItem()
    .setTitle('A1. ASTP Schooling Dashboard - Overall Effectiveness')
    .setHelpText('Tenure buckets (Months 1-3 up to Month 18+), sub-graphs, credits progress, and trainee modal.')
    .setBounds(1, 5)
    .setLabels('1 = Ineffective / Unused', '5 = Highly Effective')
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('A2. ASTP Dashboard features you find beneficial:')
    .setChoiceValues([
      'Month grouping (Months 1-3 up to Month 18+) accurately reflects IPT duration',
      'Breakdown of credits (Schooling vs. Mentoring vs. Retreats) helps spot at-risk trainees',
      'Trainee profile modal provides complete schooling history and contact details',
      'Excel export functionality generates clean reports'
    ]);

  form.addParagraphTextItem()
    .setTitle('A3. ASTP Dashboard: Comments or suggested enhancements:')
    .setHelpText('Optional: Enter any issues or features you would like added to the dashboard.');

  // Module B: Calendar of Schedules
  form.addScaleItem()
    .setTitle('B1. Calendar of Schedules - Overall Effectiveness')
    .setHelpText('Activity types, viewable windows, meeting dates, topics, and video conference links.')
    .setBounds(1, 5)
    .setLabels('1 = Ineffective / Unused', '5 = Highly Effective')
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('B2. Is it easy to find upcoming schooling schedules and video meeting links (Zoom/Google Meet)?')
    .setChoiceValues([
      'Yes, very easy and clear',
      'Acceptable, but sometimes confusing',
      'Difficult to find or links are frequently missing',
      'I do not use this feature'
    ])
    .setRequired(false);

  // Module C: Schooling Attendance & QR
  form.addScaleItem()
    .setTitle('C1. Schooling Attendance & QR/Manual Logging - Overall Effectiveness')
    .setHelpText('Recording attendance, real-time Student ID/Name search, viewing logs, and exporting data.')
    .setBounds(1, 5)
    .setLabels('1 = Ineffective / Unused', '5 = Highly Effective')
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('C2. Schooling Attendance features that work well for you:')
    .setChoiceValues([
      'Real-time student search is fast and accurate',
      'Attendance history modal shows complete activity records',
      'Exporting attendance to Excel is convenient',
      'Status indicators (Present, Late, Absent) are clear'
    ]);

  form.addParagraphTextItem()
    .setTitle('C3. Schooling Attendance: What difficulties (if any) have you experienced?')
    .setHelpText('Optional: Mention any issues with recording attendance or incorrect counts.');

  // Module D: Schooling Assignment
  form.addScaleItem()
    .setTitle('D1. Schooling Assignment & Hub Allocation - Overall Effectiveness')
    .setHelpText('Assigning trainees to schooling days, specific mentors, and hubs/venues.')
    .setBounds(1, 5)
    .setLabels('1 = Ineffective / Unused', '5 = Highly Effective')
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('D2. How smooth is the process of assigning trainees to schooling days and venues?')
    .setChoiceValues([
      'Very smooth and fast',
      'Acceptable',
      'Cumbersome / Takes too many steps',
      'I do not assign schooling days'
    ]);

  // Module E: Mentor Clock Records & GPS
  form.addScaleItem()
    .setTitle('E1. Mentor Clock Records & Location Verification - Overall Effectiveness')
    .setHelpText('Logging clock-in/out times and verifying mentor venue locations via the map modal.')
    .setBounds(1, 5)
    .setLabels('1 = Ineffective / Unused', '5 = Highly Effective')
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('E2. Does the location verification / map modal accurately identify the mentor venue?')
    .setChoiceValues([
      'Always accurate',
      'Accurate most of the time',
      'Often inaccurate or GPS pin is misplaced',
      'Not applicable / I do not monitor clock records'
    ]);

  // Module F: Online Schooling Submissions
  form.addScaleItem()
    .setTitle('F1. Online Schooling Submissions (Review & Verification) - Overall Effectiveness')
    .setHelpText('Reviewing submitted online schooling proofs, assignments, and approving/rejecting with remarks.')
    .setBounds(1, 5)
    .setLabels('1 = Ineffective / Unused', '5 = Highly Effective')
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('F2. Online Submissions workflow feedback:')
    .setChoiceValues([
      'Pending verification counter helps keep track of unreviewed items',
      'Reviewing attached links and photos is smooth',
      'Providing feedback remarks to trainees is clear and quick',
      'Approval/Rejection updates the trainee records promptly'
    ]);

  // Module G: Absence Disputes & Submitted Requests
  form.addScaleItem()
    .setTitle('G1. Absence Disputes, Extended Schooling & Credit Applications - Overall Effectiveness')
    .setHelpText('Resolving absence appeals, granting IPT schooling extensions, and crediting external activities.')
    .setBounds(1, 5)
    .setLabels('1 = Ineffective / Unused', '5 = Highly Effective')
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('G2. How would you rate the dispute resolution and request approval workflow?')
    .setChoiceValues([
      'Clear, responsive, and easy to process',
      'Acceptable, but needs clearer status tracking',
      'Too complex or causes delays in resolution',
      'I do not process disputes or requests'
    ]);

  // Module H: Import Records
  form.addScaleItem()
    .setTitle('H1. Import Records (CSV/Spreadsheet Batch Uploads) - Overall Effectiveness')
    .setHelpText('Batch uploading attendance sheets, trainee rosters, and historical data.')
    .setBounds(1, 5)
    .setLabels('1 = Ineffective / Unused', '5 = Highly Effective')
    .setRequired(true);

  // ====================================================================================
  // SECTION 3: SYSTEM PERFORMANCE, UI & USABILITY
  // ====================================================================================
  const s3 = form.addPageBreakItem().setTitle('Section 3: System Usability, Performance & Design');
  s3.setHelpText('Rate your level of agreement with each statement regarding portal performance.');

  const usabilityGrid = form.addGridItem();
  usabilityGrid.setTitle('System Experience & Usability Ratings')
    .setRows([
      'Navigation: Left sidebar, global search, and tab switching are intuitive and smooth.',
      'Speed & Stability: The portal loads data promptly without freezing or crashing.',
      'Alerts & Badges: Notification badges alert me effectively to items needing action.',
      'Visual Comfort: The Dark Mode / Light Mode options provide good contrast and readability.',
      'Data Integrity: Trainee counts, credits, and logs shown on screen are reliable and accurate.'
    ])
    .setColumns([
      '1 - Strongly Disagree',
      '2 - Disagree',
      '3 - Neutral',
      '4 - Agree',
      '5 - Strongly Agree'
    ])
    .setRequired(true);

  // ====================================================================================
  // SECTION 4: IMPACT & FEEDBACK
  // ====================================================================================
  const s4 = form.addPageBreakItem().setTitle('Section 4: Operational Impact & Future Improvements');
  s4.setHelpText('Share your overall thoughts and help us shape the next version of the Mentoring Portal.');

  // Efficiency Impact
  form.addMultipleChoiceItem()
    .setTitle('1. Compared to manual spreadsheets or paper records, how much has the portal improved your work efficiency?')
    .setChoiceValues([
      'Significantly improved (saves substantial time and effort)',
      'Moderately improved',
      'Neutral / About the same',
      'Made processes more complicated',
      'Not applicable / New user'
    ])
    .setRequired(true);

  // Most useful feature
  form.addTextItem()
    .setTitle('2. What single feature in the Mentoring Portal do you find the MOST useful in your routine work?')
    .setRequired(false);

  // Biggest pain point
  form.addParagraphTextItem()
    .setTitle('3. What is the single biggest pain point, inconvenience, or frustration you experience?')
    .setHelpText('Please specify any bottlenecks, confusing buttons, or recurring errors.')
    .setRequired(false);

  // Wishlist
  form.addParagraphTextItem()
    .setTitle('4. What new features, reports, or tools would you like to see in future portal updates?')
    .setHelpText('e.g., automated email alerts, PDF printable summary cards, batch dispute approvals, mobile app version, etc.')
    .setRequired(false);

  // Open comments
  form.addParagraphTextItem()
    .setTitle('5. Any other general comments, suggestions, or words of feedback for the development team?')
    .setRequired(false);

  // ====================================================================================
  // LOG OUTPUT DETAILS
  // ====================================================================================
  const publishedUrl = form.getPublishedUrl();
  const editUrl = form.getEditUrl();
  const sheetUrl = ss.getUrl();

  Logger.log('======================================================================');
  Logger.log('🎉 SURVEY FORM SUCCESSFULLY CREATED & CONNECTED TO SPREADSHEET!');
  Logger.log('======================================================================');
  Logger.log('1. Google Form Published URL (Share this with respondents): \n' + publishedUrl);
  Logger.log('2. Google Form Edit URL (To modify questions): \n' + editUrl);
  Logger.log('3. Google Sheet URL (Where responses are recorded): \n' + sheetUrl);
  Logger.log('======================================================================');

  // If run from a spreadsheet UI, show an alert box with links
  try {
    const htmlOutput = HtmlService.createHtmlOutput(
      '<div style="font-family: sans-serif; padding: 10px; line-height: 1.6;">' +
      '<h2 style="color: #1a73e8; margin-top:0;">Survey Form Created!</h2>' +
      '<p>The Google Form was successfully built and linked to this spreadsheet.</p>' +
      '<p><b>1. Form Link to Send to Users:</b><br>' +
      '<a href="' + publishedUrl + '" target="_blank" style="color: #1a73e8; word-break: break-all;">' + publishedUrl + '</a></p>' +
      '<p><b>2. Form Edit URL (Admin):</b><br>' +
      '<a href="' + editUrl + '" target="_blank" style="color: #1a73e8; word-break: break-all;">' + editUrl + '</a></p>' +
      '<hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">' +
      '<p style="color: #555; font-size: 12px;">Responses will automatically populate a new sheet tab in this spreadsheet.</p>' +
      '</div>'
    ).setWidth(500).setHeight(320);

    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Survey Form Ready');
  } catch (e) {
    // Standalone execution, UI alert skipped
  }
}
