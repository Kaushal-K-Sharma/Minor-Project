
import jsPDF from "jspdf";
import "svg2pdf.js";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "base",
  securityLevel: "strict",
  flowchart: {
    htmlLabels: false,
    curve: "linear",
  },
  themeVariables: {
    fontFamily: "Arial",
    fontSize: "14px",
  },
});

function calculateReadiness(notes) {
  const checks = [
    Boolean(notes.summary?.trim()),
    (notes.keyPoints || []).length >= 4,
    (notes.sections || []).length >= 3,
    (notes.sections || []).some((s) => s.definition?.trim()),
    (notes.sections || []).some((s) => s.examples?.length),
    (notes.sections || []).some((s) => s.bullets?.length),
    (notes.conceptExamples || []).length >= 2,
    (notes.keywords || []).length >= 5,
    (notes.revision || []).length >= 4,
    (notes.questions || []).length >= 3,
  ];

  return Math.round(
    (checks.filter(Boolean).length / checks.length) * 100
  );
}

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

function addListToText(lines, title, items) {
  if (!Array.isArray(items) || !items.length) return;

  lines.push("");
  lines.push(title);

  items.forEach((item) => {
    lines.push(`- ${item}`);
  });
}

function buildNotesText(notes, metadata = {}) {
  const lines = [];
  const isGuided =
    (notes.learningStyle || metadata.learning_style) === "guided";

  lines.push(notes.title || metadata.topic || "Study Notes");
  lines.push("=".repeat(55));

  if (metadata.mode) {
    lines.push(`Mode: ${metadata.mode}`);
  }

  if (metadata.fileName) {
    lines.push(`Source: ${metadata.fileName}`);
  }

  if (metadata.level) {
    lines.push(`Learning Level: ${metadata.level}`);
  }

  lines.push(
    `Learning Style: ${isGuided ? "Guided Explanation" : "Structured Notes"}`
  );

  lines.push(`Revision Readiness: ${calculateReadiness(notes)}%`);
  lines.push(
    "Note: This score measures content completeness, not actual exam readiness."
  );
  lines.push("");

  if (isGuided && notes.introduction) {
    lines.push("INTRODUCTION");
    lines.push(notes.introduction);
    lines.push("");
  }

  addListToText(
    lines,
    "WHAT YOU WILL LEARN",
    notes.learningObjectives
  );

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
    lines.push(
      isGuided ? "GUIDED TEACHING SECTIONS" : "DETAILED STUDY NOTES"
    );

    notes.sections.forEach((section, index) => {
      lines.push("");
      lines.push(`${index + 1}. ${section.heading || "Section"}`);
      lines.push("-".repeat(45));

      if (section.purpose) {
        lines.push(`Why this matters: ${section.purpose}`);
      }

      if (section.definition) {
        lines.push("");
        lines.push("DEFINITION");
        lines.push(section.definition);
      }

      if (section.content) {
        lines.push("");
        lines.push(section.content);
      }

      if (section.analogy) {
        lines.push("");
        lines.push("THINK OF IT THIS WAY");
        lines.push(section.analogy);
      }

      if (section.workedExample) {
        lines.push("");
        lines.push("WORKED EXAMPLE");
        lines.push(section.workedExample);
      }

      addListToText(lines, "FORMAL DETAILS AND NOTATION", section.formalDetails);
      addListToText(lines, "KEY CHARACTERISTICS", section.bullets);
      addListToText(lines, "TYPES / CLASSIFICATION", section.types);
      addListToText(lines, "WORKING / STEPS", section.working);
      addListToText(lines, "EXAMPLES", section.examples);
      addListToText(lines, "ADVANTAGES", section.advantages);
      addListToText(lines, "LIMITATIONS", section.disadvantages);
      addListToText(lines, "APPLICATIONS", section.applications);
      addListToText(lines, "FORMULAS", section.formula);

      if (section.comparison?.columns?.length) {
        lines.push("");
        lines.push(section.comparison.title || "COMPARISON");
        lines.push(section.comparison.columns.join(" | "));

        (section.comparison.rows || []).forEach((row) => {
          lines.push(row.join(" | "));
        });
      }

      if (section.takeaway) {
        lines.push("");
        lines.push("KEY TAKEAWAY");
        lines.push(section.takeaway);
      }
    });

    lines.push("");
  }

  if (isGuided && notes.recap) {
    lines.push("BRINGING IT ALL TOGETHER");
    lines.push(notes.recap);
    lines.push("");
  }

  if (notes.glossary?.length) {
    lines.push("IMPORTANT TERMINOLOGY");

    notes.glossary.forEach((item) => {
      lines.push(`${item.term}: ${item.meaning}`);
    });

    lines.push("");
  }

  if (notes.conceptExamples?.length) {
    lines.push("CONCEPT–EXAMPLE PAIRING");

    notes.conceptExamples.forEach((item, index) => {
      lines.push("");
      lines.push(`${index + 1}. ${item.concept}`);
      lines.push(item.explanation || "");
      lines.push(`Example: ${item.example || ""}`);

      if (item.connection) {
        lines.push(`Why it fits: ${item.connection}`);
      }
    });

    lines.push("");
  }

  if (notes.diagrams?.length) {
    lines.push("VISUAL DIAGRAMS");
    lines.push(
      "Diagrams are included in the PDF version. They are omitted from this text-only file."
    );
    lines.push("");
  }

  if (notes.keywords?.length) {
    lines.push("IMPORTANT KEYWORDS");
    lines.push(notes.keywords.join(", "));
    lines.push("");
  }

  if (notes.revision) {
    lines.push("QUICK REVISION");

    const revision = Array.isArray(notes.revision)
      ? notes.revision
      : [notes.revision];

    revision.forEach((point) => lines.push(`- ${point}`));
    lines.push("");
  }

  if (notes.questions?.length) {
    lines.push("SELF-ASSESSMENT QUESTIONS");

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

function convertForeignObjectsToSvgText(svgElement) {
  const namespace = "http://www.w3.org/2000/svg";

  const foreignObjects = [
    ...svgElement.querySelectorAll("foreignObject"),
  ];

  foreignObjects.forEach((fo) => {
    const x = parseFloat(fo.getAttribute("x")) || 0;
    const y = parseFloat(fo.getAttribute("y")) || 0;
    const width = parseFloat(fo.getAttribute("width")) || 100;
    const height = parseFloat(fo.getAttribute("height")) || 30;

    const rawText = fo.textContent.replace(/\s+/g, " ").trim();

    if (!rawText) {
      fo.remove();
      return;
    }

    const fontSize = 14;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const maxChars = Math.max(8, Math.floor(width / (fontSize * 0.55)));

    const words = rawText.split(" ");
    const lines = [];
    let currentLine = "";

    words.forEach((word) => {
      const testLine = currentLine
        ? `${currentLine} ${word}`
        : word;

      if (testLine.length > maxChars && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) lines.push(currentLine);

    const textElement = document.createElementNS(namespace, "text");

    textElement.setAttribute("x", centerX);
    textElement.setAttribute("y", centerY);
    textElement.setAttribute("text-anchor", "middle");
    textElement.setAttribute("dominant-baseline", "middle");
    textElement.setAttribute("font-family", "Arial, sans-serif");
    textElement.setAttribute("font-size", fontSize);
    textElement.setAttribute("fill", "#222222");

    const lineHeight = fontSize * 1.2;
    const startOffset = -((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, index) => {
      const tspan = document.createElementNS(namespace, "tspan");

      tspan.setAttribute("x", centerX);
      tspan.setAttribute(
        "dy",
        index === 0 ? startOffset : lineHeight
      );

      tspan.textContent = line;
      textElement.appendChild(tspan);
    });

    fo.parentNode.replaceChild(textElement, fo);
  });

  return svgElement;
}

export async function exportNotesPDF(notes, metadata = {}) {
  const pdf = new jsPDF();
  const margin = 15;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;

  let y = 20;

  const isGuided =
    (notes.learningStyle || metadata.learning_style) === "guided";

  function checkPage(height = 8) {
    if (y + height > pageHeight - margin) {
      pdf.addPage();
      y = 20;
    }
  }

  function addText(text, options = {}) {
    if (text === undefined || text === null || text === "") return;

    const {
      size = 10,
      bold = false,
      gap = 4,
      color = [45, 55, 72],
    } = options;

    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    pdf.setTextColor(...color);

    const lines = pdf.splitTextToSize(String(text), maxWidth);
    const lineHeight = size * 0.48;

    lines.forEach((line) => {
      checkPage(lineHeight);
      pdf.text(line, margin, y);
      y += lineHeight;
    });

    y += gap;
  }

  function addHeading(text) {
    checkPage(18);
    y += 3;
    addText(text, {
      size: 14,
      bold: true,
      gap: 6,
      color: [30, 64, 175],
    });
  }

  function addSubheading(text) {
    addText(text, {
      size: 10,
      bold: true,
      gap: 3,
      color: [55, 65, 81],
    });
  }

  function addItems(title, items) {
    if (!Array.isArray(items) || !items.length) return;

    addSubheading(title);
    items.forEach((item) => addText(`- ${item}`, { gap: 2 }));
    y += 2;
  }

  async function addDiagram(diagram, index) {
    if (!diagram?.mermaid) return;

    try {
      const result = await mermaid.render(
        `pdf-diagram-${index}-${Date.now()}`,
        diagram.mermaid
      );

      const parser = new DOMParser();
      const parsed = parser.parseFromString(result.svg, "image/svg+xml");

      if (parsed.querySelector("parsererror")) {
        throw new Error("Invalid Mermaid SVG.");
      }

      const svgElement = convertForeignObjectsToSvgText(
        parsed.documentElement
      );

      svgElement.setAttribute(
        "xmlns",
        "http://www.w3.org/2000/svg"
      );

      const viewBox = svgElement.getAttribute("viewBox");
      const values = viewBox
        ? viewBox.split(/[\s,]+/).map(Number)
        : [];

      let width = parseFloat(svgElement.getAttribute("width"));
      let height = parseFloat(svgElement.getAttribute("height"));

      if ((!width || !height) && values.length === 4) {
        width = values[2];
        height = values[3];
      }

      width = width || 1000;
      height = height || 600;

      svgElement.setAttribute("width", width);
      svgElement.setAttribute("height", height);

      const imageWidth = maxWidth;
      const imageHeight = Math.min(
        125,
        imageWidth * (height / width)
      );

      addSubheading(diagram.title || `Diagram ${index + 1}`);
      checkPage(imageHeight + 15);

      await pdf.svg(svgElement, {
        x: margin,
        y,
        width: imageWidth,
        height: imageHeight,
      });

      y += imageHeight + 5;

      if (diagram.caption) {
        addText(diagram.caption, {
          size: 9,
          gap: 8,
        });
      }
    } catch (error) {
      console.error("Could not add diagram to PDF:", error);
      addText(
        `${diagram.title || "Diagram"} could not be rendered in this PDF.`,
        { size: 9 }
      );
    }
  }

  // Document title and metadata.
  addText(notes.title || metadata.topic || "Study Notes", {
    size: 21,
    bold: true,
    gap: 8,
    color: [30, 41, 59],
  });

  addText(
    isGuided ? "GUIDED TEACHING NOTES" : "STRUCTURED NOTES",
    {
      size: 10,
      bold: true,
      color: isGuided ? [4, 120, 87] : [37, 99, 235],
    }
  );

  if (metadata.mode) {
    addText(`Mode: ${metadata.mode}`, { size: 9, gap: 2 });
  }

  if (metadata.fileName) {
    addText(`Source: ${metadata.fileName}`, { size: 9, gap: 2 });
  }

  if (metadata.level) {
    addText(`Learning Level: ${metadata.level}`, { size: 9, gap: 2 });
  }

  addText(`Revision Readiness: ${calculateReadiness(notes)}%`, {
    size: 11,
    bold: true,
    gap: 3,
  });

  addText(
    "This score represents generated content completeness, not actual exam readiness.",
    { size: 8, gap: 8 }
  );

  // Guided introduction and objectives.
  if (isGuided && notes.introduction) {
    addHeading("Introduction");
    addText(notes.introduction);
  }

  if (notes.learningObjectives?.length) {
    addHeading("What You Will Learn");
    notes.learningObjectives.forEach((item) => addText(`- ${item}`));
  }

  // Summary and key points.
  if (notes.summary) {
    addHeading(isGuided ? "At a Glance" : "Summary");
    addText(notes.summary);
  }

  if (notes.keyPoints?.length) {
    addHeading(isGuided ? "Key Ideas" : "Key Points");
    notes.keyPoints.forEach((point) => addText(`- ${point}`));
  }

  // Main sections.
  if (notes.sections?.length) {
    addHeading(
      isGuided ? "Guided Teaching Sections" : "Detailed Study Notes"
    );

    for (let index = 0; index < notes.sections.length; index++) {
      const section = notes.sections[index];

      addText(`${index + 1}. ${section.heading || "Section"}`, {
        size: 12,
        bold: true,
        gap: 5,
        color: [30, 64, 175],
      });

      if (section.purpose) {
        addText(`Why this matters: ${section.purpose}`, {
          size: 9,
          gap: 4,
        });
      }

      if (section.definition) {
        addSubheading("Definition");
        addText(section.definition);
      }

      if (section.content) {
        addText(section.content, {
          size: isGuided ? 10.5 : 10,
          gap: 5,
        });
      }

      if (section.analogy) {
        addSubheading("Think of it this way");
        addText(section.analogy);
      }

      if (section.workedExample) {
        addSubheading("Worked Example");
        addText(section.workedExample);
      }

      addItems("Formal Details and Notation", section.formalDetails);
      addItems("Key Characteristics", section.bullets);
      addItems("Types / Classification", section.types);
      addItems("Working / Steps", section.working);
      addItems("Examples", section.examples);
      addItems("Advantages", section.advantages);
      addItems("Limitations", section.disadvantages);
      addItems("Applications", section.applications);
      addItems("Formulas", section.formula);

      if (section.comparison?.columns?.length) {
        addSubheading(section.comparison.title || "Comparison");

        addText(section.comparison.columns.join(" | "), {
          size: 9,
          bold: true,
        });

        (section.comparison.rows || []).forEach((row) => {
          addText(row.join(" | "), { size: 9 });
        });
      }

      if (section.takeaway) {
        addSubheading("Key Takeaway");
        addText(section.takeaway);
      }

      y += 5;
    }
  }

  // Guided recap.
  if (isGuided && notes.recap) {
    addHeading("Bringing It All Together");
    addText(notes.recap);
  }

  // Glossary.
  if (notes.glossary?.length) {
    addHeading("Important Terminology");

    notes.glossary.forEach((item) => {
      addText(item.term, {
        size: 10,
        bold: true,
        gap: 2,
      });
      addText(item.meaning, { gap: 5 });
    });
  }

  // Concept examples.
  if (notes.conceptExamples?.length) {
    addHeading("Concept–Example Pairing");

    notes.conceptExamples.forEach((item, index) => {
      addText(`${index + 1}. ${item.concept}`, {
        size: 11,
        bold: true,
      });

      addText(item.explanation);
      addText(`Example: ${item.example || ""}`);

      if (item.connection) {
        addText(`Why it fits: ${item.connection}`);
      }
    });
  }

  // Diagrams.
  if (notes.diagrams?.length) {
    addHeading("Diagrams and Visual Explanations");

    for (let index = 0; index < notes.diagrams.length; index++) {
      await addDiagram(notes.diagrams[index], index);
    }
  }

  // Keywords.
  if (notes.keywords?.length) {
    addHeading("Important Keywords");
    addText(notes.keywords.join(", "));
  }

  // Revision.
  if (notes.revision) {
    addHeading("Quick Revision");

    const revision = Array.isArray(notes.revision)
      ? notes.revision
      : [notes.revision];

    revision.forEach((point) => addText(`- ${point}`));
  }

  // Questions.
  if (notes.questions?.length) {
    addHeading("Self-Assessment Questions");

    notes.questions.forEach((item, index) => {
      addText(`${index + 1}. ${item.question}`, {
        bold: true,
      });
      addText(`Answer: ${item.answer}`);
    });
  }

  pdf.save("SmartNotes.pdf");
}
