const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun,
  HeadingLevel, BorderStyle, AlignmentType,
  Header, Footer, PageNumber, ShadingType
} = require("docx");

function codeParagraph(text) {
  return new Paragraph({
    spacing: { after: 60 },
    shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
    children: [new TextRun({ text, font: "Consolas", size: 20 })],
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "1F4E79" },
        paragraph: { spacing: { before: 360, after: 200 } },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "2E75B6" },
        paragraph: { spacing: { before: 240, after: 160 } },
      },
    ],
  },
  sections: [{
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
          children: [new TextRun({ text: "SOFE 4630U \u2014 Phase 1 Setup Guide \u2014 Group 11", size: 16, font: "Arial", color: "888888" })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Page ", size: 16, font: "Arial", color: "888888" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: "888888" }),
          ],
        })],
      }),
    },
    children: [
      // Title
      new Paragraph({ spacing: { after: 400 }, alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "Phase 1 \u2014 Setup Guide for Group Members", size: 36, bold: true, font: "Arial", color: "1F4E79" }),
      ]}),
      new Paragraph({ spacing: { after: 300 }, alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "How to get the project running on your machine", size: 24, italics: true, font: "Arial", color: "555555" }),
      ]}),

      // Prerequisites
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Prerequisites")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun("Make sure you have the following installed:")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "\u2022 Python 3.10+ ", bold: true }), new TextRun("(check with: python --version)")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "\u2022 pip ", bold: true }), new TextRun("(comes with Python)")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "\u2022 Git ", bold: true }), new TextRun("(to clone the repo)")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "\u2022 Docker ", bold: true }), new TextRun("(optional, for containerized deployment)")] }),

      // Clone
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. Clone the Repository")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun("Open a terminal and run:")] }),
      codeParagraph("git clone https://github.com/abduh3131/CloudFinalProj.git"),
      codeParagraph("cd CloudFinalProj"),
      new Paragraph({ spacing: { after: 200 }, children: [] }),

      // Install Dependencies
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Install Python Dependencies")] }),
      codeParagraph("pip install -r requirements.txt"),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("This installs: pandas, numpy, azure-storage-blob, python-dotenv, matplotlib")] }),

      // Dataset
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Get the NGSIM Dataset")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun("The dataset is too large for GitHub (50MB), so you need to get it separately.")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Option A: Use the sample data (easiest)")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun("A sample dataset (sample_ngsim.csv) is included in the repo under data/. You can also generate fresh sample data:")] }),
      codeParagraph("python main.py --generate-sample"),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("This will generate sample data and run the full pipeline automatically.")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Option B: Use real NGSIM data")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun("Download the NGSIM US-101 dataset from the US DOT:")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "1. ", bold: true }), new TextRun("Go to data.transportation.gov and search for \"NGSIM US-101\"")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "2. ", bold: true }), new TextRun("Download the trajectory CSV file for the 7:50\u20138:05 AM time period")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "3. ", bold: true }), new TextRun("Place it in the data/ folder")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "4. ", bold: true }), new TextRun("Run: python main.py --data data/your_file.csv")] }),

      // Azure Setup
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. Azure Setup (for Cloud Integration)")] }),
      new Paragraph({ spacing: { after: 100 }, children: [
        new TextRun("The system works fully in "),
        new TextRun({ text: "local mode", bold: true }),
        new TextRun(" without Azure. But if you want to test the cloud features:"),
      ]}),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "1. ", bold: true }), new TextRun("Create a .env file in the project root (copy from .env.example)")] }),
      codeParagraph("cp .env.example .env"),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "2. ", bold: true }), new TextRun("Fill in your Azure Storage connection string in .env:")] }),
      codeParagraph("AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=YOUR_ACCOUNT;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net"),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "3. ", bold: true }), new TextRun("Ask the group for the shared Azure credentials if you need them")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "4. ", bold: true }), new TextRun("Run with --azure flag: python main.py --data data/sample_ngsim.csv --azure")] }),
      new Paragraph({ spacing: { after: 100 }, children: [
        new TextRun({ text: "IMPORTANT: ", bold: true, color: "CC0000" }),
        new TextRun("Never commit the .env file to GitHub. It contains secret keys. The .gitignore already excludes it."),
      ]}),

      // Running the System
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. Running the System")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Quick start (local mode, sample data):")] }),
      codeParagraph("python main.py --generate-sample"),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("This runs the full pipeline: ingestion \u2192 preprocessing \u2192 scenario detection \u2192 output + visualizations")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("With real data (local mode):")] }),
      codeParagraph("python main.py --data data/ngsim_us101.csv"),

      new Paragraph({ spacing: { before: 200 }, heading: HeadingLevel.HEADING_2, children: [new TextRun("With Azure cloud storage:")] }),
      codeParagraph("python main.py --data data/ngsim_us101.csv --azure"),

      new Paragraph({ spacing: { before: 200 }, heading: HeadingLevel.HEADING_2, children: [new TextRun("With Docker:")] }),
      codeParagraph("docker build -t ngsim-scenario-extractor ."),
      codeParagraph("docker run -v $(pwd)/outputs:/app/outputs ngsim-scenario-extractor"),

      // Output
      new Paragraph({ spacing: { before: 200 }, heading: HeadingLevel.HEADING_1, children: [new TextRun("7. Output Files")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun("After running, check the outputs/ folder:")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "\u2022 outputs/scenarios_output.json ", bold: true }), new TextRun("\u2014 Full detailed results (all detected scenarios with trajectories)")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "\u2022 outputs/scenarios_summary.csv ", bold: true }), new TextRun("\u2014 Summary table (one row per scenario)")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "\u2022 outputs/visualizations/ ", bold: true }), new TextRun("\u2014 Charts and graphs (scenario summary, lane distribution, speed box plot, verification plots)")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("The terminal will also print a summary and example outputs.")] }),

      // Generating the Report
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("8. Regenerating the Report (Optional)")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun("The Phase1_Report.docx is already in the repo. If you need to regenerate it:")] }),
      codeParagraph("npm install"),
      codeParagraph("node create_report.js"),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("This requires Node.js and will rebuild the .docx file with all screenshots.")] }),

      // Troubleshooting
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("9. Troubleshooting")] }),
      new Paragraph({ spacing: { after: 60 }, children: [
        new TextRun({ text: "\"ModuleNotFoundError\": ", bold: true }),
        new TextRun("Run pip install -r requirements.txt again"),
      ]}),
      new Paragraph({ spacing: { after: 60 }, children: [
        new TextRun({ text: "\"Azure connection failed\": ", bold: true }),
        new TextRun("Check your .env file has the correct connection string, or just run without --azure"),
      ]}),
      new Paragraph({ spacing: { after: 60 }, children: [
        new TextRun({ text: "\"File not found\" for data: ", bold: true }),
        new TextRun("Use --generate-sample to create sample data, or download the NGSIM dataset"),
      ]}),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun({ text: "Large CSV takes too long: ", bold: true }),
        new TextRun("Use sample data for testing; the full dataset (189K records) takes a few minutes"),
      ]}),
    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("C:/Users/Abduh/OneDrive/Desktop/Cloud/phase1-monolithic/Setup_Guide.docx", buffer);
  console.log("Setup guide created successfully!");
});
