# Medical template sources and data

Pulse Chamber and Slide Atlas are fictional service proposals. All counts, intervals, budgets, targets and percentages are synthetic examples. They are authored for layout demonstration and carry no claim of measured clinical performance.

## Workflow references

- Leeds Teaching Hospitals, Cardiac Ultrasound Transthoracic Echocardiogram. Supports the general relationship between sonographer, scan, report and referring clinician. Accessed 18 November 2026. https://www.leedsth.nhs.uk/patients/resources/cardiac-ultrasound-transthoracic-echocardiogram/
- NHS Scientist Training Programme curriculum, Histopathology training activity S-H-R1-2/4. Describes following a sample from receipt to authorization of the report. Accessed 18 November 2026 through the indexed source. https://curriculumlibrary.nshcs.org.uk/stp/review/competency/S-H-R1-2/4/
- Manchester University NHS Foundation Trust, Requesting investigations. Provides background on specimen tracking and reconciliation on arrival. Accessed 18 November 2026 through the indexed source. https://mft.nhs.uk/the-trust/other-departments/laboratory-medicine/histopathology/adult-histopathology/requesting-investigations/

The proposed service arrangements, staffing plans and timings are fictional. Clinical prioritization, specimen processing and reporting permissions must be replaced with the presenting organization's approved practices.

## Data definitions

Pulse Chamber uses a 100-referral status snapshot with 78 booked, 14 awaiting contact and 8 requiring clarification. Planned capacity is eight sessions of eight slots, totaling 64. Audit figures use separate stated denominators. Budget allocation is £90k + £54k + £36k = £180k.

Slide Atlas uses 200 open cases split into 70 preparation, 84 reporting, 30 further work and 16 awaiting information. Stage medians are separate distributions and are not added to infer end-to-end median turnaround. The lineage diagram illustrates one case, two blocks and six slides. Budget allocation is £96k + £84k + £60k = £240k.

## Artwork and editability

The four images in this folder were generated specifically for these templates using ImageGen. They are conceptual illustrations. The heart and tissue imagery have no diagnostic interpretation and are not anatomical teaching references. Each cover object is one raster image with transparency. Titles, supporting text, diagrams, grid cells and chart data remain editable in PowerPoint. Depth is static.

The generator is scripts/generate-medical-depth.ts. Rebuild from the backend directory with node -r ts-node/register/transpile-only scripts/generate-medical-depth.ts.
