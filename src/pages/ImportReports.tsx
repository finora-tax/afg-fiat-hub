import { useState, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Upload, FileSpreadsheet, Download, X, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { analyzeRows, type ReportAnalysis } from "@/lib/fastbooks";
import { AnalysisReport, ReconciliationCard } from "@/components/reports/AnalysisReport";

interface SheetReport {
  fileName: string;
  sheetName: string;
  rows: Record<string, string | number>[];
  columns: string[];
  csv: string;
  analysis: ReportAnalysis;
}

const cleanDate = (value: unknown) => {
  if (!value) return "";
  return String(value).replace(/\s+\d{2}:\d{2}:\d{2}\s*(am|pm)/i, "").trim();
};

const buildReport = (fileName: string, workbook: XLSX.WorkBook): SheetReport => {
  const sheetName = workbook.SheetNames.includes("Sheet1")
    ? "Sheet1"
    : workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const columns = raw.length ? Object.keys(raw[0]) : [];

  const rows = raw.map((row) => {
    const out: Record<string, string | number> = {};
    Object.keys(row).forEach((key) => {
      const value = row[key];
      out[key] =
        key.includes("تاریخ") || key.toLowerCase().includes("date")
          ? cleanDate(value)
          : (value as string | number);
    });
    return out;
  });

  return {
    fileName,
    sheetName,
    rows,
    columns,
    csv: XLSX.utils.sheet_to_csv(sheet),
    analysis: analyzeRows(raw, columns),
  };
};

const downloadCsv = (report: SheetReport) => {
  const blob = new Blob(["\uFEFF" + report.csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = report.fileName.replace(/\.(xlsx|xls)$/i, "") + ".csv";
  link.click();
  URL.revokeObjectURL(url);
};

const ImportReports = () => {
  const [reports, setReports] = useState<SheetReport[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const analyses = useMemo(() => reports.map((r) => r.analysis), [reports]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    setIsParsing(true);
    try {
      const parsed: SheetReport[] = [];
      for (const file of Array.from(files)) {
        try {
          const buffer = await file.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: "array" });
          parsed.push(buildReport(file.name, workbook));
        } catch {
          toast.error(`خطا در خواندن فایل ${file.name}`);
        }
      }
      if (parsed.length) {
        setReports((prev) => [...prev, ...parsed]);
        toast.success(`${parsed.length} فایل تحلیل شد`);
      }
    } finally {
      setIsParsing(false);
    }
  }, []);

  const exportPdf = () => {
    if (!reports.length) {
      toast.error("ابتدا فایل اکسل را بارگذاری کنید");
      return;
    }
    toast.info("در پنجره چاپ، مقصد را روی «ذخیره به‌صورت PDF» بگذارید");
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="no-print">
        <Header />
      </div>
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">تحلیل گزارش‌های FastBooks</h1>
              <p className="text-muted-foreground">
                حواله دریافتی، حواله ارسالی و تبادلات اسعار — تحلیل ۹ بخشی و خروجی PDF
              </p>
            </div>
          </div>
          <Button onClick={exportPdf} disabled={!reports.length}>
            <Printer className="h-4 w-4 ml-2" />
            خروجی PDF یکپارچه
          </Button>
        </div>

        <Card className="bg-card border-border no-print">
          <CardContent className="p-6">
            <label
              className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-xl py-12 cursor-pointer hover:border-primary/60 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
              }}
            >
              {isParsing ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <Upload className="h-8 w-8 text-primary" />
              )}
              <span className="font-semibold text-foreground">
                فایل‌های XLSX را اینجا رها کنید یا کلیک کنید
              </span>
              <span className="text-sm text-muted-foreground">پشتیبانی از چند فایل هم‌زمان</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </CardContent>
        </Card>

        <div id="print-area" className="space-y-8 mt-6" dir="rtl">
          {reports.length > 0 && (
            <div className="hidden print:block">
              <h1 className="text-2xl font-bold">گزارش تحلیلی صرافی سرای شهزاده</h1>
              <p className="text-sm">
                تاریخ تولید گزارش: {new Date().toLocaleDateString("fa-IR")} — تعداد فایل:{" "}
                {reports.length.toLocaleString("fa-IR")}
              </p>
            </div>
          )}

          {reports.length > 1 && <ReconciliationCard analyses={analyses} />}

          {reports.map((report, index) => (
            <div key={`${report.fileName}-${index}`} className="space-y-4">
              <Card className="bg-card border-border break-inside-avoid">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle className="text-base truncate">
                    {report.fileName}
                    <span className="text-xs text-muted-foreground font-normal mr-2">
                      ({report.analysis.kindLabel} — {report.sheetName})
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-2 shrink-0 no-print">
                    <Button size="sm" variant="outline" onClick={() => downloadCsv(report)}>
                      <Download className="h-4 w-4 ml-1" />
                      خروجی CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setReports((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              <AnalysisReport analysis={report.analysis} />

              {report.columns.length > 0 && (
                <Card className="bg-card border-border no-print">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">پیش‌نمایش داده خام</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          {report.columns.map((col) => (
                            <TableHead key={col} className="text-right whitespace-nowrap">
                              {col}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.rows.slice(0, 20).map((row, i) => (
                          <TableRow key={i} className="border-border">
                            {report.columns.map((col) => (
                              <TableCell key={col} className="whitespace-nowrap text-sm">
                                {String(row[col] ?? "")}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {report.rows.length > 20 && (
                      <p className="text-xs text-muted-foreground mt-3">
                        نمایش ۲۰ ردیف اول از {report.rows.length.toLocaleString("fa-IR")} ردیف —
                        برای دیدن همه، خروجی CSV بگیرید.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ImportReports;
