import type { Request, StudentSummary } from "../types";

export function groupRequestsByStudent(requests: Request[]): StudentSummary[] {
  const groups: Record<string, Request[]> = {};
  requests.forEach((r) => {
    if (!groups[r.studentId]) groups[r.studentId] = [];
    groups[r.studentId].push(r);
  });

  return Object.values(groups).map((studentRequests) => {
    const student = studentRequests[0];
    const totalRequests = studentRequests.length;

    // Count pending reviews (POR REVISAR or EN REVISIÓN)
    const pendingCount = studentRequests.filter(
      (r) => r.status === "POR REVISAR" || r.status === "EN REVISIÓN",
    ).length;

    // Use real data where possible
    const semester = student.semester || "N/A";
    const totalCredits = student.credits || 0;

    const email = student.studentName
      ? student.studentName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, ".") + "@correo.unimet.edu.ve"
      : "sin.correo@unimet.edu.ve";

    return {
      studentId: student.studentId,
      studentName: student.studentName,
      semester,
      gpa: student.gpa,
      email,
      totalCredits,
      totalRequests,
      pendingReviewCount: pendingCount,
      requests: studentRequests,
    };
  });
}
