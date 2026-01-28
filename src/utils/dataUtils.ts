import type { Request, StudentSummary, GlobalStatus } from '../types';

export function groupRequestsByStudent(requests: Request[]): StudentSummary[] {
    const groups: Record<string, Request[]> = {};
    requests.forEach(r => {
        if (!groups[r.studentId]) groups[r.studentId] = [];
        groups[r.studentId].push(r);
    });

    return Object.values(groups).map(studentRequests => {
        const student = studentRequests[0];
        const totalRequests = studentRequests.length;
        // Count pending reviews (POR REVISAR or EN REVISIÓN)
        const pendingCount = studentRequests.filter(r => r.status === 'POR REVISAR' || r.status === 'EN REVISIÓN').length;

        let globalStatus: GlobalStatus = 'Clear';
        const hasError = studentRequests.some(r => r.status === 'NO PROCEDE');
        const hasPending = studentRequests.some(r => r.status === 'POR REVISAR');
        const hasInReview = studentRequests.some(r => r.status === 'EN REVISIÓN');

        if (hasError) {
            globalStatus = 'Error';
        } else if (hasPending) {
             if (student.studentName === 'Alex Johnson') globalStatus = 'Needs Attention';
             else globalStatus = 'Processing';
        } else if (hasInReview) {
            globalStatus = 'Processing';
        }

        // Mock semester and avatar
        let semester = 'Semestre 1';
        let avatarUrl = '';
        const email = student.studentName.toLowerCase().replace(' ', '.') + '@university.edu';
        const totalCredits = Math.floor(student.gpa * 25); // Mock credits based on GPA roughly

        if (student.studentName.includes('Alex')) {
            semester = 'Semestre 7';
            avatarUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuApRrCZzhsXP6EIM4RXv0NA_X2fkOmVYVIu7PhyW8_GBD0pR-WU4nRRR7ipxbenV2-Oo1J4kRFBAVIF-Qh86zX1XMzVbIVx0GDXQY1nCc9A03Lc8T8UATXtDA4O93uu3vUfbJmfkQe809XoppLzZ6FIVrzmKFV9VF30C9z2Qai-GuUUWpklPlPQv9G8gduAjdSC9MG-uU1EN1cqgwP23fTnB4i97AzPVW7RiGfUMOOmNHOqfR2s0Z8LbVJh5XFFOPxQqTivV4FdyODs";
        } else if (student.studentName.includes('Sarah')) {
            semester = 'Semestre 5';
        } else if (student.studentName.includes('Michael')) {
            semester = 'Semestre 3';
            avatarUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuAY487eQ_d1QRQmfWEhE6sZZx7ghkm37jIBfD74fIwwvREeCENw1-EWPJwZSqvxe4Qa3aCNYKY0FCiKD4rr0SYEixp4R4FPTRs0-plcrMMkodbCvXaXjKwm2FFIEoR19hj3VhjGg7eKim96pUbnbO-BQhqE7y7ZwEVsFW4N_YPavUwL4t3J6Pn0VJAlEcs90dllMxg7F4DCSu0uDyqCoeTESMKuauT-doIX6dgsMsaiAxyhUR5vP7A5ocGudE-Q0kFzXzcMRzrSJ-iF";
        } else if (student.studentName.includes('David')) {
            semester = 'Semestre 8';
        } else if (student.studentName.includes('Emma')) {
            semester = 'Semestre 2';
            avatarUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuB9Y23uk1xhPgf4zAPGwZcdKCB-RpbZo-UKE_iuyB5IgzMB2OjFkZUajSqVx8IPj3sLNtWG8e5eNc8jglzPCsS8EcB3e4CKBJ_uWB_zkoiitN9KDZbymVVOhaHTYLlyaiEaojzFcnTO02zaOW7TMcgmhp3_b9iSmLytp3HTAVIFtatXP7q2kUrhTnDHqSW6JQkn-TlF9wdVr-ptsdDkhPSnvnM6xsEmVnXaR3RXsgROLro3nBTBCPeTOJ7CF9xHvk0WvtpKL-8JO56U";
        }

        return {
            studentId: student.studentId,
            studentName: student.studentName,
            department: student.classification,
            semester,
            gpa: student.gpa,
            avatarUrl,
            email,
            totalCredits,
            totalRequests,
            pendingReviewCount: pendingCount,
            globalStatus,
            requests: studentRequests
        };
    });
}
