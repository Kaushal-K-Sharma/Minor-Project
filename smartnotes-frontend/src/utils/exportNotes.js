
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

function buildNotesText(notes, metadata = {}) {
  const lines = [];

  lines.push(notes.title || metadata.topic || "Study Notes");
  lines.push("=".repeat(55));

  if (metadata.fileName) lines.push(`Source: ${metadata.fileName}`);
  if (metadata.level) lines.push(`Level: ${metadata.level}`);

  lines.push(`Revision Readiness: ${calculateReadiness(notes)}%`);
  lines.push("Note: This score measures content completeness, not actual exam readiness.");
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
    lines.push("DETAILED STUDY NOTES");

    notes.sections.forEach((section) => {
      lines.push("");
      lines.push(section.heading || "Section");
      lines.push("-".repeat(40));

      if (section.definition) {
        lines.push("DEFINITION");
        lines.push(section.definition);
      }

      if (section.content) {
        lines.push("");
        lines.push(section.content);
      }

      const groups = [
        ["KEY CHARACTERISTICS", section.bullets],
        ["TYPES / CLASSIFICATION", section.types],
        ["WORKING / STEPS", section.working],
        ["EXAMPLES", section.examples],
        ["ADVANTAGES", section.advantages],
        ["DISADVANTAGES", section.disadvantages],
        ["APPLICATIONS", section.applications],
        ["FORMULAS",(section.formula || []).map(latexToReadable),],
      ];

      groups.forEach(([title, items]) => {
        if (items?.length) {
          lines.push("");
          lines.push(title);
          items.forEach((item) => lines.push(`- ${item}`));
        }
      });

      if (section.comparison?.columns?.length) {
        lines.push("");
        lines.push(section.comparison.title || "COMPARISON");
        lines.push(section.comparison.columns.join(" | "));

        (section.comparison.rows || []).forEach((row) => {
          lines.push(row.join(" | "));
        });
      }
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

  if (notes.diagrams?.length) {
    lines.push("VISUAL DIAGRAMS");
    lines.push(
      "Diagrams are included in the PDF version. They are omitted from this text-only file."
    );
  }

  return lines.join("\n");
}

export function exportNotesTXT(notes, metadata = {}) {
  const content = buildNotesText(notes, metadata);
  downloadTextFile(content, "SmartNotes.txt");
}



// function svgToPng(svg, maxWidth = 1700) {
//   return new Promise((resolve, reject) => {
//     let objectUrl;

//     try {
//       const parser = new DOMParser();
//       const parsed = parser.parseFromString(svg, "image/svg+xml");

//       if (parsed.querySelector("parsererror")) {
//         throw new Error("Invalid Mermaid SVG.");
//       }

//       const svgElement = parsed.documentElement;

//       svgElement.setAttribute(
//         "xmlns",
//         "http://www.w3.org/2000/svg"
//       );

      

//       const viewBox = svgElement.getAttribute("viewBox");
//       const values = viewBox
//         ? viewBox.split(/[\s,]+/).map(Number)
//         : [];

//       let width = parseFloat(svgElement.getAttribute("width"));
//       let height = parseFloat(svgElement.getAttribute("height"));

//       if ((!width || !height) && values.length === 4) {
//         width = values[2];
//         height = values[3];
//       }

//       width = width || 1000;
//       height = height || 600;

//       svgElement.setAttribute("width", width);
//       svgElement.setAttribute("height", height);

//       const scale = Math.min(2, maxWidth / width);

//       const serialized = new XMLSerializer().serializeToString(
//         svgElement
//       );

//       const blob = new Blob([serialized], {
//         type: "image/svg+xml;charset=utf-8",
//       });

//       objectUrl = URL.createObjectURL(blob);

//       const image = new Image();

//       image.onload = () => {
//         try {
//           // Create a real HTML canvas element.
//           const canvas = document.createElement("canvas");

//           canvas.width = Math.ceil(width * scale);
//           canvas.height = Math.ceil(height * scale);

//           const context = canvas.getContext("2d");

//           if (!context) {
//             throw new Error("Unable to create 2D canvas context.");
//           }

//           context.fillStyle = "#ffffff";
//           context.fillRect(0, 0, canvas.width, canvas.height);

//           context.drawImage(
//             image,
//             0,
//             0,
//             canvas.width,
//             canvas.height
//           );

//           canvas.toBlob((pngBlob) => {
//             if (!pngBlob) {
//               reject(new Error("PNG conversion failed."));
//               return;
//             }

//             const reader = new FileReader();

//             reader.onloadend = () => resolve(reader.result);
//             reader.onerror = () => reject(
//               new Error("Could not read converted PNG.")
//             );

//             reader.readAsDataURL(pngBlob);
//           }, "image/png");
//         } catch (error) {
//           reject(error);
//         } finally {
//           URL.revokeObjectURL(objectUrl);
//         }
//       };

//       image.onerror = () => {
//         URL.revokeObjectURL(objectUrl);
//         reject(new Error("Could not load Mermaid SVG."));
//       };

//       image.src = objectUrl;
//     } catch (error) {
//       if (objectUrl) URL.revokeObjectURL(objectUrl);
//       reject(error);
//     }
//   });
// }



function latexToReadable(value) {
  if (!value) return "";

  let text = String(value);

  const replacements = [
    [/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "($1)/($2)"],
    [/\\sum_\{([^{}]*)\}\^\{([^{}]*)\}/g, "SUM[$1 to $2]"],
    [/\\sum_\{([^{}]*)\}/g, "SUM[$1]"],
    [/\\sum/g, "SUM"],
    [/\\theta/g, "theta"],
    [/\\lambda/g, "lambda"],
    [/\\alpha/g, "alpha"],
    [/\\beta/g, "beta"],
    [/\\gamma/g, "gamma"],
    [/\\pi/g, "pi"],
    [/\\infty/g, "infinity"],
    [/\\times/g, "x"],
    [/\\cdot/g, "*"],
    [/\\left/g, ""],
    [/\\right/g, ""],
    [/\\text\s*\{([^{}]*)\}/g, "$1"],
    [/\\mathrm\s*\{([^{}]*)\}/g, "$1"],
    [/\\mathbf\s*\{([^{}]*)\}/g, "$1"],
    [/\\,/g, " "],
    [/\\;/g, " "],
    [/\\!/g, ""],
    [/\\ /g, " "],
    [/\\{/g, "{"],
    [/\\}/g, "}"],
  ];

  replacements.forEach(([pattern, replacement]) => {
    text = text.replace(pattern, replacement);
  });

  // Convert common LaTeX superscripts and subscripts.
  text = text
    .replace(/\^\{([^{}]*)\}/g, "^($1)")
    .replace(/_\{([^{}]*)\}/g, "_($1)")
    .replace(/\^([a-zA-Z0-9])/g, "^$1")
    .replace(/_([a-zA-Z0-9])/g, "_$1");

  // Remove remaining LaTeX command markers and braces.
  text = text
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return text;
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

    const rawText = fo.textContent
      .replace(/\s+/g, " ")
      .trim();

    if (!rawText) {
      fo.remove();
      return;
    }

    const fontSize = 14;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Wrap text to fit inside the original label area.
    const maxChars = Math.max(
      8,
      Math.floor(width / (fontSize * 0.55))
    );

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

    const textElement = document.createElementNS(
      namespace,
      "text"
    );

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
      const tspan = document.createElementNS(
        namespace,
        "tspan"
      );

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

  function checkPage(height = 8) {
    if (y + height > pageHeight - margin) {
      pdf.addPage();
      y = 20;
    }
  }

  function addText(text, options = {}) {
    if (text === undefined || text === null || text === "") return;

    const { size = 10, bold = false, gap = 4 } = options;

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
    checkPage(16);
    y += 3;
    addText(text, { size: 14, bold: true, gap: 6 });
  }





async function addDiagram(diagram, index) {
  if (!diagram.mermaid) return;

  try {
    const result = await mermaid.render(
      `pdf-diagram-${index}-${Date.now()}`,
      diagram.mermaid
    );

    const parser = new DOMParser();

    const parsed = parser.parseFromString(
      result.svg,
      "image/svg+xml"
    );

    if (parsed.querySelector("parsererror")) {
      throw new Error("Invalid Mermaid SVG.");
    }

    let svgElement = parsed.documentElement;

    // Convert HTML labels into SVG text.
    svgElement = convertForeignObjectsToSvgText(
      svgElement
    );

    svgElement.setAttribute(
      "xmlns",
      "http://www.w3.org/2000/svg"
    );

    const viewBox = svgElement.getAttribute("viewBox");

    const values = viewBox
      ? viewBox.split(/[\s,]+/).map(Number)
      : [];

    let width = parseFloat(
      svgElement.getAttribute("width")
    );

    let height = parseFloat(
      svgElement.getAttribute("height")
    );

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
      110,
      imageWidth * (height / width)
    );

    addText(
      diagram.title || `Diagram ${index + 1}`,
      {
        size: 12,
        bold: true,
        gap: 3,
      }
    );

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
    console.error(
      "Could not add diagram to PDF:",
      error
    );

    addText(
      `${diagram.title || "Diagram"} could not be rendered in this PDF.`,
      { size: 9 }
    );
  }
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
    addText(`Learning Level: ${metadata.level}`, { size: 9 });
  }

  addText(`Revision Readiness: ${calculateReadiness(notes)}%`, {
    size: 12,
    bold: true,
    gap: 3,
  });

  addText(
    "This score represents generated content completeness, not actual exam readiness.",
    { size: 8, gap: 8 }
  );

  if (notes.summary) {
    addHeading("Summary");
    addText(notes.summary);
  }

  if (notes.keyPoints?.length) {
    addHeading("Key Points");
    notes.keyPoints.forEach((point) => addText(`• ${point}`));
  }

  if (notes.sections?.length) {
    addHeading("Detailed Study Notes");

    for (const section of notes.sections) {
      addText(section.heading || "Section", {
        size: 12,
        bold: true,
        gap: 5,
      });

      if (section.definition) {
        addText("Definition", { size: 10, bold: true, gap: 2 });
        addText(section.definition);
      }

      if (section.content) addText(section.content);

      const groups = [
        ["Key Characteristics", section.bullets],
        ["Types / Classification", section.types],
        ["Working / Steps", section.working],
        ["Examples", section.examples],
        ["Advantages", section.advantages],
        ["Disadvantages", section.disadvantages],
        ["Applications", section.applications],
        ["Formulas",(section.formula || []).map(latexToReadable),],
      ];

      groups.forEach(([title, items]) => {
        if (items?.length) {
          addText(title, { size: 10, bold: true, gap: 2 });
          items.forEach((item) => addText(`• ${item}`));
        }
      });

      if (section.comparison?.columns?.length) {
        addText(section.comparison.title || "Comparison", {
          size: 10,
          bold: true,
        });

        addText(section.comparison.columns.join(" | "), {
          bold: true,
          size: 9,
        });

        (section.comparison.rows || []).forEach((row) => {
          addText(row.join(" | "), { size: 9 });
        });
      }

      y += 5;
    }
  }

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

  if (notes.diagrams?.length) {
    addHeading("Diagrams and Visual Explanations");

    for (let index = 0; index < notes.diagrams.length; index++) {
      await addDiagram(notes.diagrams[index], index);
    }
  }

  if (notes.keywords?.length) {
    addHeading("Important Keywords");
    addText(notes.keywords.join(", "));
  }

  if (notes.revision) {
    addHeading("Quick Revision");

    const revision = Array.isArray(notes.revision)
      ? notes.revision
      : [notes.revision];

    revision.forEach((point) => addText(`• ${point}`));
  }

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
