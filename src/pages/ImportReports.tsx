import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Upload, FileSpreadsheet, Download, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SheetReport {
  fileName: string;
  sheetName: string;
  rows: Record<string, string | number>[];
  columns: string[];
  totalAmount: number;
  averageAmount: number;
  maxAmount: number;
  minAmount: number;
  amountCount: number;
  csv: string;
}

const cleanDate = (value: unknown) => {
  if (!value) return "";
  return String(value).replace(/\s+\d{2}:\d{2}:\d{2}\s*(am|pm)/i, "").trim();
};

const parseAmount = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const match = String(value ?? "").match(/(\d+[,\d]*(?:\.\d+)?)/);
  if (!match) return null;
  const num = parseFloat(match[1].replace(/,/g, ""));
  return Number.isFinite(num) ? num : null;
};

const fmt = (n: number) =>
  n.toLocaleString("fa-IR", { maximumFractionDigits: 2 });

const buildReport = (fileName: string, workbook: XLSX.WorkBook): SheetReport => {
  const sheetName = workbook.SheetNames.includes("Sheet1")
    ? "Sheet1"
    : workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  const amounts: number[] = [];
  const rows = raw.map((row) => {
    const out: Record<string, string | number> = {};
    Object.keys(row).forEach((key) => {
      const value = row[key];
      if (key.includes("تاریخ") || key.toLowerCase().includes("date")) {
        out[key] = cleanDate(value);
      } else {
        out[key] = value as string | number;
      }
      if (key.includes("مبلغ") || key.includes("مقدار")) {
        const amount = parseAmount(value);
        if (amount !== null) amounts.push(amount);
      }
    });
    return out;
  });

  const total = amounts.reduce((a, b) => a + b, 0);

  return {
    fileName,
    sheetName,
    rows,
    columns: rows.length ? Object.keys(rows[0]) : [],
    totalAmount: total,
    averageAmount: amounts.length ? total / amounts.length : 0,
    maxAmount: amounts.length ? Math.max(...amounts) : 0,
    minAmount: amounts.length ? Math.min(...amounts) : 0,
    amountCount: amounts.length,
    csv: XLSX.utils.sheet_to_csv(sheet),
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
        toast.success(`${parsed.length} فایل پردازش شد`);
      }
    } finally {
      setIsParsing(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8 flex items-center gap-3">
          <FileSpreadsheet className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">ایمپورت گزارش‌های FastBooks</h1>
            <p className="text-muted-foreground">
              فایل اکسل حواله دریافتی، حواله ارسالی یا تبادلات اسعار را بارگذاری کنید
            </p>
          </div>
        </div>

        <Card className="bg-card border-border">
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

        <div className="space-y-6 mt-6">
          {reports.map((report, index) => (
            <Card key={`${report.fileName}-${index}`} className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="text-base truncate">
                  {report.fileName}
                  <span className="text-xs text-muted-foreground font-normal mr-2">
                    ({report.sheetName})
                  </span>
                </CardTitle>
                <div className="flex items-center gap-2 shrink-0">
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
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { label: "تعداد رکورد", value: report.rows.length.toLocaleString("fa-IR") },
                    { label: "مجموع مبالغ", value: fmt(report.totalAmount) },
                    { label: "میانگین", value: fmt(report.averageAmount) },
                    { label: "بیشترین", value: fmt(report.maxAmount) },
                    { label: "کمترین", value: fmt(report.minAmount) },
                  ].map((stat) => (
                    <div key={stat.label} className="p-4 rounded-lg bg-secondary/40">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-lg font-bold font-mono text-foreground mt-1">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {report.columns.length > 0 && (
                  <div className="overflow-x-auto">
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
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ImportReports;
