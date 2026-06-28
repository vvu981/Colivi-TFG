import xml.etree.ElementTree as ET
import os

xml_path = 'Colivi-backend/target/site/jacoco/jacoco.xml'
if not os.path.exists(xml_path):
    print('jacoco.xml report not found.')
    exit(0)

tree = ET.parse(xml_path)
root = tree.getroot()

translations = {
    'INSTRUCTION': 'Instructions',
    'BRANCH': 'Branches',
    'LINE': 'Lines',
    'COMPLEXITY': 'Complexity',
    'METHOD': 'Methods',
    'CLASS': 'Classes'
}

summary = []
summary.append('# 📊 Code Coverage (JaCoCo)')
summary.append('| Metric | Covered | Missed | Percentage |')
summary.append('| --- | --- | --- | --- |')

for counter in root.findall('counter'):
    c_type = counter.get('type')
    display_name = translations.get(c_type, c_type)
    missed = int(counter.get('missed'))
    covered = int(counter.get('covered'))
    total = missed + covered
    percentage = (covered / total * 100) if total > 0 else 0
    summary.append(f'| {display_name} | {covered} | {missed} | {percentage:.2f}% |')

with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as f:
    f.write('\n'.join(summary))
