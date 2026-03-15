const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak, ImageRun
} = require("docx");

const vizDir = path.join(__dirname, "outputs", "visualizations");
const imgScenarioSummary = fs.readFileSync(path.join(vizDir, "scenario_summary.png"));
const imgLaneDistribution = fs.readFileSync(path.join(vizDir, "lane_distribution.png"));
const imgSpeedDistributions = fs.readFileSync(path.join(vizDir, "speed_distributions.png"));
const imgCarFollowing = fs.readFileSync(path.join(vizDir, "car_following_example.png"));
const imgStopAndGo = fs.readFileSync(path.join(vizDir, "stop_and_go_example.png"));
const imgLaneChange = fs.readFileSync(path.join(vizDir, "lane_change_example.png"));

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const headerBorder = { style: BorderStyle.SINGLE, size: 1, color: "1F4E79" };
const headerBorders = { top: headerBorder, bottom: headerBorder, left: headerBorder, right: headerBorder };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function headerCell(text, width) {
  return new TableCell({
    borders: headerBorders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: "1F4E79", type: ShadingType.CLEAR },
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", font: "Arial", size: 20 })] })],
  });
}

function cell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 20 })] })],
  });
}

function codeCell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    margins: cellMargins,
    shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
    children: [new Paragraph({ children: [new TextRun({ text, font: "Consolas", size: 18 })] })],
  });
}

// Result table cells
function resultRow(label, value) {
  return new TableRow({
    children: [
      new TableCell({
        borders,
        width: { size: 5000, type: WidthType.DXA },
        margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text: label, font: "Arial", size: 20 })] })],
      }),
      new TableCell({
        borders,
        width: { size: 4360, type: WidthType.DXA },
        margins: cellMargins,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: value, bold: true, font: "Arial", size: 20 })] })],
      }),
    ],
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "1F4E79" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "2E75B6" },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "2E75B6" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  sections: [
    // ========== TITLE PAGE ==========
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        new Paragraph({ spacing: { before: 2400 }, alignment: AlignmentType.CENTER, children: [] }),
        new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "Ontario Tech University", size: 36, bold: true, font: "Arial", color: "003C71" }),
        ]}),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "Faculty of Engineering and Applied Science", size: 24, font: "Arial", color: "555555" }),
        ]}),
        new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2E75B6", space: 1 } }, children: [] }),
        new Paragraph({ spacing: { before: 400, after: 120 }, alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "SOFE 4630U Cloud Computing", size: 28, bold: true, font: "Arial", color: "2E75B6" }),
        ]}),
        new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "Phase 1 Report: Modular Monolithic System", size: 36, bold: true, font: "Arial", color: "1F4E79" }),
        ]}),
        new Paragraph({ spacing: { after: 120 }, alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "Cloud-based Scenario Extraction from NGSIM Dataset", size: 24, italics: true, font: "Arial", color: "555555" }),
        ]}),
        new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.CENTER, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2E75B6", space: 1 } }, children: [] }),
        new Paragraph({ spacing: { before: 600, after: 120 }, alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "Group 11", size: 28, bold: true, font: "Arial" }),
        ]}),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [
          new TextRun({ text: "Alexy Pichette (100822470)", size: 22, font: "Arial" }),
        ]}),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [
          new TextRun({ text: "Malyka Sardar (100752640)", size: 22, font: "Arial" }),
        ]}),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [
          new TextRun({ text: "Mohammad Al-Lozy (100829387)", size: 22, font: "Arial" }),
        ]}),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [
          new TextRun({ text: "Abdullah Hanoosh (100749026)", size: 22, font: "Arial" }),
        ]}),
        new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "Date: March 15, 2026", size: 22, font: "Arial", color: "555555" }),
        ]}),
      ],
    },
    // ========== MAIN CONTENT ==========
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "2E75B6", space: 4 } },
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "SOFE 4630U Cloud Computing \u2014 Phase 1 Report \u2014 Group 11", size: 16, font: "Arial", color: "888888" }),
            ],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: "2E75B6", space: 4 } },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Page ", size: 16, font: "Arial", color: "888888" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: "888888" }),
            ],
          })],
        }),
      },
      children: [
        // ===== SECTION 1: INTRODUCTION =====
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Introduction")] }),
        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun("This project implements a cloud-based system to process vehicle trajectory data from the NGSIM US-101 dataset. The system identifies three driving scenarios from raw traffic data and produces labeled 5-second samples. Phase 1 uses a modular monolithic architecture deployed on Microsoft Azure."),
        ]}),
        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun("The three driving scenarios identified are:"),
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [
          new TextRun({ text: "Car-Following: ", bold: true }), new TextRun("An ego vehicle maintains a consistent gap with the vehicle ahead in the same lane."),
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [
          new TextRun({ text: "Stop-and-Go: ", bold: true }), new TextRun("A vehicle decelerates sharply, nearly stops, then re-accelerates, typical of congested traffic."),
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 200 }, children: [
          new TextRun({ text: "Lane Change: ", bold: true }), new TextRun("A vehicle transitions from one lane to an adjacent lane."),
        ]}),
        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun("The system processes raw NGSIM data through a four-stage pipeline: ingestion, preprocessing, scenario detection, and output generation. All data is stored and managed using Azure Blob Storage."),
        ]}),

        // ===== SECTION 2: SYSTEM ARCHITECTURE =====
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. System Architecture")] }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.1 Overview")] }),
        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun("Phase 1 adopts a "),
          new TextRun({ text: "modular monolithic architecture", bold: true }),
          new TextRun(" \u2014 a single deployable application with clearly separated internal modules, each responsible for a specific stage of the processing pipeline. The application is designed to run on Microsoft Azure cloud infrastructure."),
        ]}),
        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun("Key design principles:"),
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [
          new TextRun({ text: "Separation of concerns: ", bold: true }), new TextRun("Each module handles one pipeline stage."),
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [
          new TextRun({ text: "Single deployment: ", bold: true }), new TextRun("All modules run in one process, simplifying deployment and debugging."),
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 200 }, children: [
          new TextRun({ text: "Azure-native: ", bold: true }), new TextRun("Uses Azure Blob Storage for data persistence and can be deployed on Azure VM or Container Instances."),
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.2 Module Breakdown")] }),
        new Paragraph({ spacing: { after: 120 }, children: [
          new TextRun("The system is composed of the following modules:"),
        ]}),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [1800, 3200, 4360],
          rows: [
            new TableRow({ children: [headerCell("Module", 1800), headerCell("File", 3200), headerCell("Responsibility", 4360)] }),
            new TableRow({ children: [cell("Config", 1800), codeCell("config.py", 3200), cell("Centralized configuration, thresholds, Azure settings", 4360)] }),
            new TableRow({ children: [cell("Ingestion", 1800), codeCell("modules/ingestion.py", 3200), cell("Load NGSIM data locally or upload/download via Azure Blob Storage", 4360)] }),
            new TableRow({ children: [cell("Storage", 1800), codeCell("modules/storage.py", 3200), cell("Azure Blob Storage operations, local file I/O", 4360)] }),
            new TableRow({ children: [cell("Preprocessing", 1800), codeCell("modules/preprocessing.py", 3200), cell("Data cleaning, type enforcement, derived features", 4360)] }),
            new TableRow({ children: [cell("Car-Following", 1800), codeCell("modules/scenarios/car_following.py", 3200), cell("Detect car-following scenarios", 4360)] }),
            new TableRow({ children: [cell("Stop-and-Go", 1800), codeCell("modules/scenarios/stop_and_go.py", 3200), cell("Detect stop-and-go scenarios", 4360)] }),
            new TableRow({ children: [cell("Lane Change", 1800), codeCell("modules/scenarios/lane_change.py", 3200), cell("Detect lane change scenarios", 4360)] }),
            new TableRow({ children: [cell("Output", 1800), codeCell("modules/output.py", 3200), cell("Format, combine, and export results", 4360)] }),
            new TableRow({ children: [cell("Main", 1800), codeCell("main.py", 3200), cell("Pipeline orchestrator", 4360)] }),
          ],
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 360 }, children: [new TextRun("2.3 Architecture Diagram")] }),
        new Paragraph({ spacing: { after: 120 }, children: [
          new TextRun("The main orchestrator (main.py) coordinates four pipeline stages:"),
        ]}),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 60 }, children: [
          new TextRun({ text: "Ingestion Module ", bold: true }), new TextRun("reads CSV data and uploads to Azure Blob Storage (batch ingestion)."),
        ]}),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 60 }, children: [
          new TextRun({ text: "Preprocessing Module ", bold: true }), new TextRun("cleans data, enforces types, filters to mainline lanes (1\u20135), and computes derived features."),
        ]}),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 60 }, children: [
          new TextRun({ text: "Scenario Detection ", bold: true }), new TextRun("runs three detection algorithms (car-following, stop-and-go, lane change) using 5-second sliding windows."),
        ]}),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 200 }, children: [
          new TextRun({ text: "Output Module ", bold: true }), new TextRun("saves JSON and CSV results locally and uploads to Azure Blob Storage."),
        ]}),

        // ===== SECTION 3: DATA FLOW =====
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Data Flow")] }),
        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun("The processing pipeline transforms raw NGSIM trajectory data into labeled 5-second scenario samples through four sequential stages:"),
        ]}),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2000, 7360],
          rows: [
            new TableRow({ children: [headerCell("Stage", 2000), headerCell("Description", 7360)] }),
            new TableRow({ children: [cell("1. Ingestion", 2000), cell("Load raw NGSIM CSV data from local file; upload to Azure Blob Storage (ngsim-raw container) via batch upload.", 7360)] }),
            new TableRow({ children: [cell("2. Preprocessing", 2000), cell("Validate column types, filter to mainline lanes (1\u20135), remove invalid records and noise (|acceleration| > 40 ft/s\u00B2), compute derived features.", 7360)] }),
            new TableRow({ children: [cell("3. Detection", 2000), cell("Apply three scenario detection algorithms using 5-second (50-record) sliding windows across all vehicle trajectories.", 7360)] }),
            new TableRow({ children: [cell("4. Output", 2000), cell("Assign unique scenario IDs, merge results, save JSON (detailed) and CSV (summary) files, upload to Azure Blob (ngsim-output).", 7360)] }),
          ],
        }),
        new Paragraph({ spacing: { before: 240 }, heading: HeadingLevel.HEADING_2, children: [new TextRun("3.1 Data Volume")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [
          new TextRun({ text: "Input: ", bold: true }), new TextRun("189,541 raw NGSIM trajectory records (2,847 vehicles, US-101 Hollywood Freeway)"),
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 200 }, children: [
          new TextRun({ text: "Output: ", bold: true }), new TextRun("1,923 labeled 5-second scenario samples (JSON + CSV)"),
        ]}),

        // ===== SECTION 4: CLOUD INFRASTRUCTURE =====
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Cloud Infrastructure (Azure)")] }),
        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun("The system is built on Microsoft Azure cloud services. The following table summarizes the Azure services used and their purpose:"),
        ]}),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2800, 2800, 3760],
          rows: [
            new TableRow({ children: [headerCell("Azure Service", 2800), headerCell("Purpose", 2800), headerCell("Justification", 3760)] }),
            new TableRow({ children: [
              cell("Azure Blob Storage", 2800),
              cell("Store raw NGSIM data and processed outputs", 2800),
              cell("Cost-effective object storage; supports batch upload/download; Python SDK (azure-storage-blob)", 3760),
            ]}),
            new TableRow({ children: [
              cell("Azure VM / Container Instances", 2800),
              cell("Execute the monolithic application", 2800),
              cell("Single-instance compute sufficient for monolithic architecture; containerized via Docker", 3760),
            ]}),
            new TableRow({ children: [
              cell("Azure Container Registry", 2800),
              cell("Store Docker image (optional)", 2800),
              cell("Enables reproducible deployment of the containerized application", 3760),
            ]}),
          ],
        }),
        new Paragraph({ spacing: { before: 240 }, heading: HeadingLevel.HEADING_2, children: [new TextRun("4.1 Why Azure Blob Storage")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [
          new TextRun({ text: "Scalability: ", bold: true }), new TextRun("Handles files from KB to TB without configuration changes."),
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [
          new TextRun({ text: "Cost: ", bold: true }), new TextRun("Pay-per-use model with storage tiers (Hot/Cool/Archive)."),
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [
          new TextRun({ text: "Separation: ", bold: true }), new TextRun("Raw data and processed outputs stored in separate containers (ngsim-raw, ngsim-output)."),
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 200 }, children: [
          new TextRun({ text: "Reliability: ", bold: true }), new TextRun("Built-in redundancy (LRS/GRS) ensures data durability."),
        ]}),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.2 Ingestion Strategy")] }),
        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun("The NGSIM dataset is static historical data, so "),
          new TextRun({ text: "batch ingestion", bold: true }),
          new TextRun(" is the appropriate strategy. The entire CSV file is uploaded to Azure Blob Storage in one operation. This supports reprocessing by re-downloading from Blob Storage without re-uploading."),
        ]}),

        // ===== SECTION 5: SCENARIO DETECTION =====
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. Scenario Detection Logic")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5.1 Car-Following")] }),
        new Paragraph({ spacing: { after: 120 }, children: [
          new TextRun({ text: "Definition: ", bold: true }),
          new TextRun("A car-following scenario occurs when an ego vehicle maintains a consistent gap with the vehicle directly ahead in the same lane over a 5-second window."),
        ]}),
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Detection Conditions:", bold: true })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun("Ego and lead vehicle remain in the same lane (same Lane_ID, no lane changes)")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun("Space headway is between 0 and 200 feet")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun("Both vehicles are moving (velocity > 5 ft/s)")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun("Speed difference between ego and lead is less than 15 ft/s")] }),
        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun({ text: "Data Features Used: ", bold: true }),
          new TextRun("Lane_ID, Space_Hdwy, v_Vel, Preceding, Local_Y"),
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5.2 Stop-and-Go")] }),
        new Paragraph({ spacing: { after: 120 }, children: [
          new TextRun({ text: "Definition: ", bold: true }),
          new TextRun("A stop-and-go scenario is identified when a vehicle undergoes significant deceleration, reaches a near-stop speed, and then re-accelerates within a 5-second window."),
        ]}),
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Detection Conditions:", bold: true })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun("Vehicle decelerates below \u22125 ft/s\u00B2")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun("Speed drops below 10 ft/s (near-stop)")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun("Vehicle then accelerates above +3 ft/s\u00B2")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun("Deceleration occurs before acceleration (temporal ordering)")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun("At least one nearby vehicle also shows congestion signs (low speed or deceleration)")] }),
        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun({ text: "Data Features Used: ", bold: true }),
          new TextRun("v_Vel, v_Acc, Lane_ID, Local_Y"),
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5.3 Lane Change")] }),
        new Paragraph({ spacing: { after: 120 }, children: [
          new TextRun({ text: "Definition: ", bold: true }),
          new TextRun("A lane change scenario occurs when a vehicle transitions from one mainline lane to an adjacent lane within a 5-second window."),
        ]}),
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Detection Conditions:", bold: true })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun("Vehicle\u2019s Lane_ID changes during the window")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun("Change is between adjacent lanes (lane difference = 1)")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun("Both source and destination are mainline lanes (1\u20135)")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun("Surrounding vehicles tracked in both source and destination lanes for context")] }),
        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun({ text: "Data Features Used: ", bold: true }),
          new TextRun("Lane_ID, Local_X, Local_Y"),
        ]}),

        // ===== SECTION 6: RESULTS =====
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. Results")] }),
        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun("The system was run on real NGSIM US-101 trajectory data (189,541 records, 2,847 vehicles). The following scenarios were detected:"),
        ]}),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [5000, 4360],
          rows: [
            new TableRow({ children: [
              new TableCell({ borders: headerBorders, width: { size: 5000, type: WidthType.DXA }, shading: { fill: "1F4E79", type: ShadingType.CLEAR }, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Scenario Type", bold: true, color: "FFFFFF", font: "Arial", size: 20 })] })] }),
              new TableCell({ borders: headerBorders, width: { size: 4360, type: WidthType.DXA }, shading: { fill: "1F4E79", type: ShadingType.CLEAR }, margins: cellMargins, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Count", bold: true, color: "FFFFFF", font: "Arial", size: 20 })] })] }),
            ]}),
            resultRow("Car-Following", "340"),
            resultRow("Stop-and-Go", "408"),
            resultRow("Lane Change", "1,175"),
            new TableRow({ children: [
              new TableCell({ borders, width: { size: 5000, type: WidthType.DXA }, shading: { fill: "E8F0FE", type: ShadingType.CLEAR }, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Total Scenarios", bold: true, font: "Arial", size: 20 })] })] }),
              new TableCell({ borders, width: { size: 4360, type: WidthType.DXA }, shading: { fill: "E8F0FE", type: ShadingType.CLEAR }, margins: cellMargins, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "1,923", bold: true, font: "Arial", size: 22, color: "1F4E79" })] })] }),
            ]}),
          ],
        }),

        new Paragraph({ spacing: { before: 240 }, alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "Figure 1: Detected Driving Scenarios Summary", italics: true, font: "Arial", size: 20, color: "555555" }),
        ]}),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [
          new ImageRun({ data: imgScenarioSummary, transformation: { width: 500, height: 330 }, type: "png" }),
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("6.1 Scenario Distribution Across Lanes")] }),
        new Paragraph({ spacing: { after: 120 }, children: [
          new TextRun("The following chart shows how detected scenarios are distributed across the five mainline lanes:"),
        ]}),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new ImageRun({ data: imgLaneDistribution, transformation: { width: 520, height: 280 }, type: "png" }),
        ]}),
        new Paragraph({ spacing: { before: 60 }, alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "Figure 2: Scenario Distribution Across Lanes", italics: true, font: "Arial", size: 20, color: "555555" }),
        ]}),

        new Paragraph({ spacing: { before: 240 }, heading: HeadingLevel.HEADING_2, children: [new TextRun("6.2 Speed Distribution by Scenario Type")] }),
        new Paragraph({ spacing: { after: 120 }, children: [
          new TextRun("The box plot below compares average vehicle speeds across the three scenario types:"),
        ]}),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new ImageRun({ data: imgSpeedDistributions, transformation: { width: 500, height: 330 }, type: "png" }),
        ]}),
        new Paragraph({ spacing: { before: 60 }, alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "Figure 3: Speed Distribution by Scenario Type", italics: true, font: "Arial", size: 20, color: "555555" }),
        ]}),

        new Paragraph({ spacing: { before: 360 }, heading: HeadingLevel.HEADING_2, children: [new TextRun("6.3 Example Outputs")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Car-Following Example")] }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3500, 5860],
          rows: [
            new TableRow({ children: [cell("Scenario ID", 3500), cell("CF-0001", 5860)] }),
            new TableRow({ children: [cell("Ego Vehicle", 3500), cell("103", 5860)] }),
            new TableRow({ children: [cell("Lead Vehicle", 3500), cell("96", 5860)] }),
            new TableRow({ children: [cell("Lane", 3500), cell("3", 5860)] }),
            new TableRow({ children: [cell("Avg Space Headway", 3500), cell("76.45 ft", 5860)] }),
            new TableRow({ children: [cell("Ego Avg Speed", 3500), cell("31.67 ft/s", 5860)] }),
            new TableRow({ children: [cell("Lead Avg Speed", 3500), cell("33.57 ft/s", 5860)] }),
          ],
        }),

        new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.CENTER, children: [
          new ImageRun({ data: imgCarFollowing, transformation: { width: 520, height: 360 }, type: "png" }),
        ]}),
        new Paragraph({ spacing: { before: 60, after: 200 }, alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "Figure 4: Car-Following Verification (CF-0001) \u2014 Speed comparison and space headway", italics: true, font: "Arial", size: 20, color: "555555" }),
        ]}),

        new Paragraph({ spacing: { before: 240 }, heading: HeadingLevel.HEADING_3, children: [new TextRun("Stop-and-Go Example")] }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3500, 5860],
          rows: [
            new TableRow({ children: [cell("Scenario ID", 3500), cell("SG-0341", 5860)] }),
            new TableRow({ children: [cell("Ego Vehicle", 3500), cell("41", 5860)] }),
            new TableRow({ children: [cell("Lane", 3500), cell("1", 5860)] }),
            new TableRow({ children: [cell("Min Speed", 3500), cell("5.0 ft/s", 5860)] }),
            new TableRow({ children: [cell("Max Deceleration", 3500), cell("\u221210.38 ft/s\u00B2", 5860)] }),
            new TableRow({ children: [cell("Max Acceleration", 3500), cell("11.2 ft/s\u00B2", 5860)] }),
          ],
        }),

        new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.CENTER, children: [
          new ImageRun({ data: imgStopAndGo, transformation: { width: 520, height: 360 }, type: "png" }),
        ]}),
        new Paragraph({ spacing: { before: 60, after: 200 }, alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "Figure 5: Stop-and-Go Verification (SG-0341) \u2014 Speed drop and acceleration profile", italics: true, font: "Arial", size: 20, color: "555555" }),
        ]}),

        new Paragraph({ spacing: { before: 240 }, heading: HeadingLevel.HEADING_3, children: [new TextRun("Lane Change Example")] }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3500, 5860],
          rows: [
            new TableRow({ children: [cell("Scenario ID", 3500), cell("LC-0759", 5860)] }),
            new TableRow({ children: [cell("Ego Vehicle", 3500), cell("26", 5860)] }),
            new TableRow({ children: [cell("Source Lane", 3500), cell("2", 5860)] }),
            new TableRow({ children: [cell("Destination Lane", 3500), cell("3", 5860)] }),
            new TableRow({ children: [cell("Direction", 3500), cell("Right", 5860)] }),
            new TableRow({ children: [cell("Avg Speed", 3500), cell("30.54 ft/s", 5860)] }),
          ],
        }),

        new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.CENTER, children: [
          new ImageRun({ data: imgLaneChange, transformation: { width: 520, height: 400 }, type: "png" }),
        ]}),
        new Paragraph({ spacing: { before: 60, after: 200 }, alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "Figure 6: Lane Change Verification (LC-0759) \u2014 Lane ID, lateral position, and speed", italics: true, font: "Arial", size: 20, color: "555555" }),
        ]}),

        // ===== SECTION 7: DEPLOYMENT =====
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("7. Deployment")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("7.1 Local Development")] }),
        new Paragraph({ spacing: { after: 120 }, shading: { fill: "F5F5F5", type: ShadingType.CLEAR }, children: [
          new TextRun({ text: "pip install -r requirements.txt", font: "Consolas", size: 20 }),
        ]}),
        new Paragraph({ spacing: { after: 200 }, shading: { fill: "F5F5F5", type: ShadingType.CLEAR }, children: [
          new TextRun({ text: "python main.py --data data/ngsim_us101.csv", font: "Consolas", size: 20 }),
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("7.2 With Azure Integration")] }),
        new Paragraph({ spacing: { after: 120 }, shading: { fill: "F5F5F5", type: ShadingType.CLEAR }, children: [
          new TextRun({ text: 'set AZURE_STORAGE_CONNECTION_STRING="your-connection-string"', font: "Consolas", size: 20 }),
        ]}),
        new Paragraph({ spacing: { after: 200 }, shading: { fill: "F5F5F5", type: ShadingType.CLEAR }, children: [
          new TextRun({ text: "python main.py --data data/ngsim_us101.csv --azure", font: "Consolas", size: 20 }),
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("7.3 Docker Deployment")] }),
        new Paragraph({ spacing: { after: 120 }, shading: { fill: "F5F5F5", type: ShadingType.CLEAR }, children: [
          new TextRun({ text: "docker build -t ngsim-scenario-extractor .", font: "Consolas", size: 20 }),
        ]}),
        new Paragraph({ spacing: { after: 200 }, shading: { fill: "F5F5F5", type: ShadingType.CLEAR }, children: [
          new TextRun({ text: "docker run ngsim-scenario-extractor", font: "Consolas", size: 20 }),
        ]}),
        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun("The Docker image can be pushed to Azure Container Registry and deployed to Azure Container Instances for cloud execution."),
        ]}),

        // ===== SECTION 8: DATASET =====
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("8. Dataset")] }),
        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun("The NGSIM US-101 dataset was collected on June 15, 2005, on the southbound US-101 (Hollywood Freeway) in Los Angeles, California. The study section spans approximately 2,100 feet (0.4 miles) with 5 mainline lanes. Data was collected at a 10 Hz sampling rate (one record per vehicle per 0.1 seconds)."),
        ]}),
        new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Key Data Fields:", bold: true })] }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2200, 1400, 5760],
          rows: [
            new TableRow({ children: [headerCell("Field", 2200), headerCell("Unit", 1400), headerCell("Description", 5760)] }),
            new TableRow({ children: [codeCell("Vehicle_ID", 2200), cell("\u2014", 1400), cell("Unique vehicle identifier", 5760)] }),
            new TableRow({ children: [codeCell("Frame_ID", 2200), cell("\u2014", 1400), cell("Frame number (ascending by time)", 5760)] }),
            new TableRow({ children: [codeCell("Local_X / Local_Y", 2200), cell("feet", 1400), cell("Position relative to road segment", 5760)] }),
            new TableRow({ children: [codeCell("v_Vel", 2200), cell("ft/s", 1400), cell("Instantaneous velocity", 5760)] }),
            new TableRow({ children: [codeCell("v_Acc", 2200), cell("ft/s\u00B2", 1400), cell("Instantaneous acceleration", 5760)] }),
            new TableRow({ children: [codeCell("Lane_ID", 2200), cell("\u2014", 1400), cell("Lane number (1=leftmost, 5=rightmost mainline)", 5760)] }),
            new TableRow({ children: [codeCell("Preceding", 2200), cell("\u2014", 1400), cell("Vehicle ID of lead vehicle in same lane", 5760)] }),
            new TableRow({ children: [codeCell("Space_Hdwy", 2200), cell("feet", 1400), cell("Bumper-to-bumper gap to preceding vehicle", 5760)] }),
          ],
        }),

        new Paragraph({ spacing: { before: 240 }, heading: HeadingLevel.HEADING_2, children: [new TextRun("8.1 Assumptions and Limitations")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun("Only mainline lanes (1\u20135) are processed; ramp and auxiliary lanes (6\u20138) are excluded.")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun("Records with extreme acceleration (|a| > 40 ft/s\u00B2) are filtered as sensor noise.")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: [new TextRun("Each scenario window is non-overlapping (windows advance after each detection).")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 200 }, children: [new TextRun("Data sourced from data.transportation.gov (US Department of Transportation open data).")] }),

        // ===== SECTION 9: CONCLUSION =====
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("9. Conclusion")] }),
        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun("Phase 1 successfully implements a modular monolithic cloud-based system for NGSIM scenario extraction using Microsoft Azure. The system processes 189,541 trajectory records from the US-101 dataset and identifies 1,923 driving scenarios across three categories: car-following (340), stop-and-go (408), and lane change (1,175)."),
        ]}),
        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun("The modular monolithic architecture provides a clean separation of concerns while maintaining the simplicity of a single deployable unit. Azure Blob Storage serves as the cloud storage layer for both raw data and processed outputs, with batch ingestion appropriate for the static NGSIM dataset."),
        ]}),
        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun("In Phase 2, the same system will be redeveloped as a microservices-driven application, where each module becomes an independent service communicating through well-defined interfaces. This will allow a direct comparison between monolithic and microservices architectures applied to the same problem."),
        ]}),
      ],
    },
  ],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("C:/Users/Abduh/OneDrive/Desktop/Cloud/phase1-monolithic/Phase1_Report.docx", buffer);
  console.log("Report created successfully!");
});
