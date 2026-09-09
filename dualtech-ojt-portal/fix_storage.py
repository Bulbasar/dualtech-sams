
with open("C:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/Login.jsx", "r", encoding="utf-8") as f:
    text = f.read()
import re
text = re.sub(r"localStorage\.setItem\(.*?\);", "localStorage.setItem(`bio_${email.toLowerCase()}`, bioId);", text)
with open("C:/Users/rober/dualtech-ojt-portal/trainee-portal/src/pages/Login.jsx", "w", encoding="utf-8") as f:
    f.write(text)

