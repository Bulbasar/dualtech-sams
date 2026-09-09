const fs = require('fs');

function patchFile(path, replacerFn) {
    if (!fs.existsSync(path)) {
        console.log("File not found: " + path);
        return;
    }
    let c = fs.readFileSync(path, 'utf8');
    const newC = replacerFn(c);
    if (newC !== c) {
        fs.writeFileSync(path, newC);
        console.log("Patched: " + path);
    } else {
        console.log("String not found in " + path + ". Already patched?");
    }
}

const loginPath = 'c:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/Login.jsx';

patchFile(loginPath, (c) => {
    // Replace Step 3 Continue Button
    let newC = c.replace(
        /onClick=\{\(\) => \{\s*if \(!regContact\.email \|\| !regContact\.email\.includes\('@'\)\) return setError\("Valid email required\."\);\s*if \(!regContact\.phone \|\| regContact\.phone\.length < 10\) return setError\("Valid phone required\."\);\s*if \(!regContact\.emergencyName\) return setError\("Emergency contact name required\."\);\s*if \(!regContact\.emergencyPhone \|\| regContact\.emergencyPhone\.length < 10\) return setError\("Valid emergency phone required\."\);\s*setError\(""\); setRegStep\(4\);\s*\}\} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-md shadow-blue-200 hover:bg-blue-700">Continue<\/button>/,
        'onClick={async () => {\n' +
        '                          if (!regContact.email || !regContact.email.includes(\'@\')) return setError("Valid email required.");\n' +
        '                          if (!regContact.phone || regContact.phone.length < 10) return setError("Valid phone required.");\n' +
        '                          if (!regContact.emergencyName) return setError("Emergency contact name required.");\n' +
        '                          if (!regContact.emergencyPhone || regContact.emergencyPhone.length < 10) return setError("Valid emergency phone required.");\n' +
        '                          \n' +
        '                          try {\n' +
        '                              setLoading(true);\n' +
        '                              const methods = await fetchSignInMethodsForEmail(primaryAuth, regContact.email.trim());\n' +
        '                              if (methods.length > 0) {\n' +
        '                                  setLoading(false);\n' +
        '                                  return setError("This email is already registered to another account.");\n' +
        '                              }\n' +
        '                          } catch (err) {\n' +
        '                              console.warn("Could not verify email:", err);\n' +
        '                          }\n' +
        '                          setLoading(false);\n' +
        '                          setError(""); setRegStep(4);\n' +
        '                      }} disabled={loading} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-50">\n' +
        '                          {loading ? "Checking..." : "Continue"}\n' +
        '                      </button>'
    );

    // Replace Catch Block in submitRegistration
    newC = newC.replace(
        /\} catch \(err\) \{\s*setError\(err\.message\);\s*\} finally \{/,
        '} catch (err) {\n' +
        '          if (err.code === \'auth/email-already-in-use\') {\n' +
        '              setError("This email is already registered to another account. Please log in or use a different email.");\n' +
        '          } else {\n' +
        '              setError(err.message);\n' +
        '          }\n' +
        '      } finally {'
    );

    return newC;
});

console.log("Done.");
