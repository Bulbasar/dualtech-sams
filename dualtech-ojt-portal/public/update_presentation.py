import re

with open('c:\\Users\\rober\\dualtech-ojt-portal\\public\\presentation.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Trainee Portal (Module 1)
# Add link and updates to Slide 1 (Trainee Auth)
trainee_addition = r'''                <p class="slide-subtitle">
                    Secure, multi-factor onboarding that verifies trainees against the official masterlist
                    before account creation — with biometric enrollment and GPS pre-checks.<br><br>
                    <strong>Portal Link:</strong> <a href="https://dualtech-ojt-portal.web.app/trainee" style="color:var(--emerald)">https://dualtech-ojt-portal.web.app/trainee</a><br>
                    <strong>Updates:</strong> 631 registered trainees, 65 partner companies. Created GC to address rollout and implementation concerns.
                </p>'''
content = re.sub(
    r'<p class="slide-subtitle">\s*Secure, multi-factor onboarding.*?GPS pre-checks\.\s*</p>',
    trainee_addition,
    content,
    flags=re.DOTALL
)

# 2. Update IC Portal (Module 3) & IC Management
# Insert IC Management feature card into Slide 5 (IC Dashboard)
ic_management_card = r'''                    <div class="feat-card amber" onclick="toggleCard(this)">
                        <div class="feat-head">
                            <div class="feat-icon">🏢</div>
                            <div class="feat-name">IC Management Portal</div>
                        </div>
                        <span class="feat-toggle">+</span>
                        <div class="feat-body">
                            <p class="feat-desc">Dedicated <strong>IC Management (ic-management.html)</strong> module to view all partner companies, manage assignments, and oversee global IC engagement.</p>
                        </div>
                    </div>'''
content = re.sub(
    r'(<div class="slide" data-label="IC Dashboard">.*?)(</div\s*>\s*</div\s*>\s*</div\s*>\s*<!-- SLIDE 6)',
    r'\1' + ic_management_card + r'\n                \2',
    content,
    flags=re.DOTALL
)

# 3. Update TSD Portal (Module 2)
# Add link and uses
tsd_addition = r'''                <p class="slide-subtitle">
                    The organization-wide administrative dashboard providing visibility
                    into trainee performance, company engagement, surveys, concerns, and announcements.<br><br>
                    <strong>Portal Link:</strong> <a href="https://dualtech-ojt-portal.web.app/tsdportal" style="color:var(--indigo)">https://dualtech-ojt-portal.web.app/tsdportal</a><br>
                    <strong>Uses:</strong> Monitor global performance, track portal adoption, analyze company engagement, distribute surveys, and broadcast announcements.
                </p>'''
content = re.sub(
    r'<p class="slide-subtitle">\s*The organization-wide administrative dashboard.*?and announcements\.\s*</p>',
    tsd_addition,
    content,
    flags=re.DOTALL
)

# 4. Update Student ID Card Printing System (Module 4)
id_printing_addition = r'''                <p class="slide-subtitle">
                    Batch processing and layout generation for the official Dualtech OJT ID Cards. Fully optimized
                    for A4 photo paper printing.<br><br>
                    <strong>Portal Link:</strong> <a href="https://dualtech-ojt-portal.web.app/idprinting" style="color:var(--sky)">https://dualtech-ojt-portal.web.app/idprinting</a><br>
                    <strong>Problem Statement:</strong> Current set-up takes 2 to 3 weeks to print ID, with 3 to 5 days with manual checking and verification prior meeting.<br>
                    <strong>Proposed Solution:</strong> Revised ID Printing System Interface.<br>
                    <strong>Timeline:</strong> W1 August 2026 (For Approval ETDC, LMC, RVSA).
                </p>'''
content = re.sub(
    r'<p class="slide-subtitle">\s*Batch processing and layout generation.*?photo paper printing\.\s*</p>',
    id_printing_addition,
    content,
    flags=re.DOTALL
)

# 5. Update Mentoring Portal
# Let's replace the subtitle in Mentoring Admin Console
mentoring_addition = r'''                <p class="slide-subtitle">
                    Provides Mentoring Managers the tools to track online schooling, manage mentor assignments,
                    and generate compliance reports.<br><br>
                    <strong>Mentoring Manager:</strong> <a href="https://dualtech-ojt-portal.web.app/mentoring" style="color:var(--teal)">https://dualtech-ojt-portal.web.app/mentoring</a><br>
                    <strong>Mentors' Portal:</strong> <a href="https://dualtech-ojt-portal.web.app/schooling" style="color:var(--teal)">https://dualtech-ojt-portal.web.app/schooling</a><br>
                    <strong>Problem:</strong> Unreliable QR Data (mentors forget to scan, students lack codes) & Bulk Submissions by trainees.<br>
                    <strong>Solution:</strong> Submissions in trainee portal. Admin sets activities with automated deadlines. Trainees scan mentor QR.<br>
                    <strong>Timeline:</strong> August 1, 2026 for online schooling activities.
                </p>'''
content = re.sub(
    r'<p class="slide-subtitle">\s*Provides Mentoring Managers the tools.*?compliance reports\.\s*</p>',
    mentoring_addition,
    content,
    flags=re.DOTALL
)

with open('c:\\Users\\rober\\dualtech-ojt-portal\\public\\presentation.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
