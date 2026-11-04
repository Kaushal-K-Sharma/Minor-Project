
import jsPDF from "jspdf";

function downloadTextFile(content, filename) {
  const blob = new Blob([content], {
    type: "text/plain;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function buildNotesText(notes, metadata = {}) {
  const lines = [];

  lines.push(notes.title || metadata.topic || "Study Notes");
  lines.push("=".repeat(50));

  if (metadata.fileName) {
    lines.push(`Source: ${metadata.fileName}`);
  }

  if (metadata.level) {
    lines.push(`Level: ${metadata.level}`);
  }

  lines.push("");

  if (notes.summary) {
    lines.push("SUMMARY");
    lines.push(notes.summary);
    lines.push("");
  }

  if (notes.keyPoints?.length) {
    lines.push("KEY POINTS");
    notes.keyPoints.forEach((point) => lines.push(`- ${point}`));
    lines.push("");
  }

  if (notes.sections?.length) {
    lines.push("DETAILED NOTES");

    notes.sections.forEach((section) => {
      lines.push("");
      lines.push(section.heading || "Section");

      if (section.content) lines.push(section.content);

      section.bullets?.forEach((bullet) => {
        lines.push(`- ${bullet}`);
      });

      section.examples?.forEach((example) => {
        lines.push(`Example: ${example}`);
      });
    });

    lines.push("");
  }

  if (notes.keywords?.length) {
    lines.push("KEYWORDS");
    lines.push(notes.keywords.join(", "));
    lines.push("");
  }

  if (notes.revision) {
    lines.push("QUICK REVISION");
    lines.push(notes.revision);
    lines.push("");
  }

  if (notes.questions?.length) {
    lines.push("PRACTICE QUESTIONS");

    notes.questions.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.question}`);
      lines.push(`Answer: ${item.answer}`);
      lines.push("");
    });
  }

  return lines.join("\n");
}

export function exportNotesTXT(notes, metadata = {}) {
  const content = buildNotesText(notes, metadata);
  downloadTextFile(content, "SmartNotes.txt");
}

export function exportNotesPDF(notes, metadata = {}) {
  const pdf = new jsPDF();
  const margin = 15;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;

  let y = 20;

  function checkPage(height = 8) {
    if (y + height > pageHeight - margin) {
      pdf.addPage();
      y = 20;
    }
  }

  function addText(text, options = {}) {
    if (!text) return;

    const {
      size = 10,
      bold = false,
      gap = 5,
    } = options;

    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);

    const lines = pdf.splitTextToSize(String(text), maxWidth);
    const lineHeight = size * 0.45;

    lines.forEach((line) => {
      checkPage(lineHeight);
      pdf.text(line, margin, y);
      y += lineHeight;
    });

    y += gap;
  }

  function addHeading(text) {
    checkPage(14);
    addText(text, { size: 14, bold: true, gap: 5 });
  }

  addText(notes.title || metadata.topic || "Study Notes", {
    size: 20,
    bold: true,
    gap: 8,
  });

  if (metadata.fileName) {
    addText(`Source: ${metadata.fileName}`, { size: 9 });
  }

  if (metadata.level) {
    addText(`Level: ${metadata.level}`, { size: 9 });
  }

  if (notes.summary) {
    addHeading("Summary");
    addText(notes.summary);
  }

  if (notes.keyPoints?.length) {
    addHeading("Key Points");
    notes.keyPoints.forEach((point) => addText(`- ${point}`));
  }

  if (notes.sections?.length) {
    addHeading("Detailed Notes");

    notes.sections.forEach((section) => {
      addText(section.heading || "Section", {
        size: 12,
        bold: true,
      });

      if (section.content) addText(section.content);

      section.bullets?.forEach((bullet) => {
        addText(`- ${bullet}`);
      });

      section.examples?.forEach((example) => {
        addText(`Example: ${example}`);
      });
    });
  }

  if (notes.keywords?.length) {
    addHeading("Keywords");
    addText(notes.keywords.join(", "));
  }

  if (notes.revision) {
    addHeading("Quick Revision");
    addText(notes.revision);
  }

  if (notes.questions?.length) {
    addHeading("Practice Questions");

    notes.questions.forEach((item, index) => {
      addText(`${index + 1}. ${item.question}`, { bold: true });
      addText(`Answer: ${item.answer}`);
    });
  }

  pdf.save("SmartNotes.pdf");
}
