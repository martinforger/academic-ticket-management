const fs = require('fs');
let code = fs.readFileSync('shortcodes/enrollment-recommendations.html', 'utf8');

const ids = [
    'er-container', 'er-projection-controls', 'er-ssn-search-frm', 'er-ssn-search', 'er-ssn-search-btn',
    'er-semester-controls', 'er-projection-mode-btn', 'er-loader', 'er-details-container', 'er-details',
    'er-student-summary', 'er-projection-intro', 'total-projected-uc', 'er-view-schedules-container',
    'er-view-schedules-btn', 'er-recommendations-wrapper', 'recommendations', 'max-recommended-uc',
    'optional-subject-warn', 'optional-subject-record', 'report-error-link', 'er-schedule-modal',
    'er-close-modal-btn', 'subject-schedules-container', 'er-semester-mode-prompt', 'er-semester-mode-btn',
    'er-minor-banner', 'er-minor-banner-text', 'er-error-message', 'subject-schedules-content', 'schedules-container',
    'er-semester-tabs'
];

ids.forEach(id => {
    // replace CSS selectors
    // Matches #id followed by space, comma, colon, curly brace, dot, or newline
    code = code.replace(new RegExp('#' + id + '([ \\\\,\\\\:\\\\{\\\\.\\n])', 'g'), '#' + id + '-%%careerName%%$1');

    // replace HTML id attribute defs (we know they are double quotes from previous checks)
    code = code.replace(new RegExp('id=\"' + id + '\"', 'g'), 'id=\"' + id + '-%%careerName%%\"');

    // JS references to these IDs
    // Instead of replacing the call site, replace the string literal '#id'
    const searchStrDouble = '\"#' + id + '\"';
    const replaceStrVal = '\"#' + id + '-\" + CAREER_SHORT_CODE';
    code = code.split(searchStrDouble).join(replaceStrVal);

    const searchStrSingle = \"'#\" + id + \"'\";
    const replaceStrSingle = '\"#' + id + '-\" + CAREER_SHORT_CODE';
    code = code.split(searchStrSingle).join(replaceStrSingle);
});

fs.writeFileSync('shortcodes/enrollment-recommendations-mod.html', code);
console.log('Done replacement');
