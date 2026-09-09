import re

def main():
    try:
        with open('mentoring.html', 'r', encoding='utf-8') as f:
            content = f.read()
        
        with open('absence_disputes_tab.js', 'r', encoding='utf-8') as f:
            disputes_tab = f.read()

        with open('app_recovery.txt', 'r', encoding='utf-8') as f:
            app_recovery = f.read()

        # Step 1: Inject AbsenceDisputesTab
        # We find 'function App() {'
        app_idx = content.find('function App() {')
        if app_idx == -1:
            print("Could not find function App()")
            return

        # Insert before App
        content = content[:app_idx] + "\n" + disputes_tab + "\n\n        " + content[app_idx:]
        
        # Step 2: Replace App() { ... } with app_recovery.txt
        # The app_recovery.txt starts with '        function App() {' and goes until the end of the file '</html>'
        
        # We need to find where App() starts in the new content
        app_idx_new = content.find('function App() {')
        
        content = content[:app_idx_new] + app_recovery

        with open('mentoring.html', 'w', encoding='utf-8') as f:
            f.write(content)
            
        print("Successfully recovered and updated mentoring.html")
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
