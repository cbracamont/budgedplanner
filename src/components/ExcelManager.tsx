import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Upload, Download } from "lucide-react";
import { Language } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { z } from 'zod';

const incomeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  amount: z.number().positive("Amount must be positive").max(1000000, "Amount is too large"),
  payment_day: z.number().int().min(1).max(31)
});

const debtSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  bank: z.string().max(100).nullable(),
  balance: z.number().nonnegative("Balance cannot be negative").max(10000000, "Balance is too large"),
  apr: z.number().min(0).max(100, "APR must be between 0 and 100"),
  minimum_payment: z.number().nonnegative("Minimum payment cannot be negative").max(100000, "Payment is too large"),
  payment_day: z.number().int().min(1).max(31)
});

const fixedExpenseSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  amount: z.number().positive("Amount must be positive").max(100000, "Amount is too large"),
  frequency_type: z.enum(['monthly', 'weekly', 'yearly']),
  payment_day: z.number().int().min(1).max(31)
});

const variableExpenseSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  amount: z.number().positive("Amount must be positive").max(100000, "Amount is too large")
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface ExcelManagerProps {
  language: Language;
  onDataImported: () => void;
}

export const ExcelManager = ({ language, onDataImported }: ExcelManagerProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportToExcel = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch all financial data
      const [income, debts, fixedExp, variableExp, savings] = await Promise.all([
        supabase.from('income_sources').select('*').eq('user_id', user.id),
        supabase.from('debts').select('*').eq('user_id', user.id),
        supabase.from('fixed_expenses').select('*').eq('user_id', user.id),
        supabase.from('variable_expenses').select('*').eq('user_id', user.id),
        supabase.from('savings').select('*').eq('user_id', user.id),
      ]);

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Add sheets
      if (income.data) {
        const ws1 = XLSX.utils.json_to_sheet(income.data.map(i => ({
          [language === 'en' ? 'Name' : 'Nombre']: i.name,
          [language === 'en' ? 'Amount' : 'Monto']: i.amount,
          [language === 'en' ? 'Payment Day' : 'Día de Pago']: i.payment_day
        })));
        XLSX.utils.book_append_sheet(wb, ws1, language === 'en' ? 'Income' : 'Ingresos');
      }

      if (debts.data) {
        const ws2 = XLSX.utils.json_to_sheet(debts.data.map(d => ({
          [language === 'en' ? 'Name' : 'Nombre']: d.name,
          [language === 'en' ? 'Bank' : 'Banco']: d.bank,
          [language === 'en' ? 'Balance' : 'Balance']: d.balance,
          [language === 'en' ? 'APR %' : 'APR %']: d.apr,
          [language === 'en' ? 'Minimum Payment' : 'Pago Mínimo']: d.minimum_payment,
          [language === 'en' ? 'Payment Day' : 'Día de Pago']: d.payment_day
        })));
        XLSX.utils.book_append_sheet(wb, ws2, language === 'en' ? 'Debts' : 'Deudas');
      }

      if (fixedExp.data) {
        const ws3 = XLSX.utils.json_to_sheet(fixedExp.data.map(e => ({
          [language === 'en' ? 'Name' : 'Nombre']: e.name,
          [language === 'en' ? 'Amount' : 'Monto']: e.amount,
          [language === 'en' ? 'Frequency' : 'Frecuencia']: e.frequency_type,
          [language === 'en' ? 'Payment Day' : 'Día de Pago']: e.payment_day
        })));
        XLSX.utils.book_append_sheet(wb, ws3, language === 'en' ? 'Fixed Expenses' : 'Gastos Fijos');
      }

      if (variableExp.data) {
        const ws4 = XLSX.utils.json_to_sheet(variableExp.data.map(e => ({
          [language === 'en' ? 'Name' : 'Nombre']: e.name,
          [language === 'en' ? 'Amount' : 'Monto']: e.amount
        })));
        XLSX.utils.book_append_sheet(wb, ws4, language === 'en' ? 'Variable Expenses' : 'Gastos Variables');
      }

      if (savings.data) {
        const ws5 = XLSX.utils.json_to_sheet([{
          [language === 'en' ? 'Monthly Goal' : 'Meta Mensual']: savings.data[0]?.monthly_goal || 0,
          [language === 'en' ? 'Total Accumulated' : 'Total Acumulado']: savings.data[0]?.total_accumulated || 0
        }]);
        XLSX.utils.book_append_sheet(wb, ws5, language === 'en' ? 'Savings' : 'Ahorros');
      }

      // Generate and download
      XLSX.writeFile(wb, `finanzas_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: language === 'en' ? 'Success' : 'Éxito',
        description: language === 'en' ? 'Data exported successfully' : 'Datos exportados exitosamente'
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: language === 'en' ? 'Failed to export data' : 'Error al exportar datos',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const importFromExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Error",
        description: language === 'en' ? 'File size must be less than 5MB' : 'El archivo debe ser menor a 5MB',
        variant: "destructive"
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete existing data before importing
      await Promise.all([
        supabase.from('income_sources').delete().eq('user_id', user.id),
        supabase.from('debts').delete().eq('user_id', user.id),
        supabase.from('fixed_expenses').delete().eq('user_id', user.id),
        supabase.from('variable_expenses').delete().eq('user_id', user.id),
      ]);

      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);

      let validationErrors: string[] = [];

      // Process each sheet
      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(ws);

        if ((sheetName === 'Ingresos' || sheetName === 'Income') && jsonData.length > 0) {
          const validatedData = [];
          for (let i = 0; i < jsonData.length; i++) {
            const row: any = jsonData[i];
            try {
              const validated = incomeSchema.parse({
                name: (row.Nombre || row.Name || '').toString().trim(),
                amount: Number(row.Monto || row.Amount),
                payment_day: Number(row['Día de Pago'] || row['Payment Day']) || 1
              });
              validatedData.push({ ...validated, user_id: user.id });
            } catch (error) {
              if (error instanceof z.ZodError) {
                validationErrors.push(`Income row ${i + 1}: ${error.errors[0].message}`);
              }
            }
          }
          if (validatedData.length > 0) {
            await supabase.from('income_sources').insert(validatedData);
          }
        }

        if ((sheetName === 'Deudas' || sheetName === 'Debts') && jsonData.length > 0) {
          const validatedData = [];
          for (let i = 0; i < jsonData.length; i++) {
            const row: any = jsonData[i];
            try {
              const validated = debtSchema.parse({
                name: (row.Nombre || row.Name || '').toString().trim(),
                bank: row.Banco || row.Bank || null,
                balance: Number(row.Balance) || 0,
                apr: Number(row['APR %']) || 0,
                minimum_payment: Number(row['Pago Mínimo'] || row['Minimum Payment']) || 0,
                payment_day: Number(row['Día de Pago'] || row['Payment Day']) || 1
              });
              validatedData.push({ ...validated, user_id: user.id });
            } catch (error) {
              if (error instanceof z.ZodError) {
                validationErrors.push(`Debt row ${i + 1}: ${error.errors[0].message}`);
              }
            }
          }
          if (validatedData.length > 0) {
            await supabase.from('debts').insert(validatedData);
          }
        }

        if ((sheetName === 'Gastos Fijos' || sheetName === 'Fixed Expenses') && jsonData.length > 0) {
          const validatedData = [];
          for (let i = 0; i < jsonData.length; i++) {
            const row: any = jsonData[i];
            try {
              const validated = fixedExpenseSchema.parse({
                name: (row.Nombre || row.Name || '').toString().trim(),
                amount: Number(row.Monto || row.Amount),
                frequency_type: row.Frecuencia || row.Frequency || 'monthly',
                payment_day: Number(row['Día de Pago'] || row['Payment Day']) || 1
              });
              validatedData.push({ ...validated, user_id: user.id });
            } catch (error) {
              if (error instanceof z.ZodError) {
                validationErrors.push(`Fixed expense row ${i + 1}: ${error.errors[0].message}`);
              }
            }
          }
          if (validatedData.length > 0) {
            await supabase.from('fixed_expenses').insert(validatedData);
          }
        }

        if ((sheetName === 'Gastos Variables' || sheetName === 'Variable Expenses') && jsonData.length > 0) {
          const validatedData = [];
          for (let i = 0; i < jsonData.length; i++) {
            const row: any = jsonData[i];
            try {
              const validated = variableExpenseSchema.parse({
                name: (row.Nombre || row.Name || '').toString().trim(),
                amount: Number(row.Monto || row.Amount)
              });
              validatedData.push({ ...validated, user_id: user.id });
            } catch (error) {
              if (error instanceof z.ZodError) {
                validationErrors.push(`Variable expense row ${i + 1}: ${error.errors[0].message}`);
              }
            }
          }
          if (validatedData.length > 0) {
            await supabase.from('variable_expenses').insert(validatedData);
          }
        }
      }

      if (validationErrors.length > 0) {
        toast({
          title: language === 'en' ? 'Partial Import' : 'Importación Parcial',
          description: language === 'en' 
            ? `Some rows had errors: ${validationErrors.slice(0, 3).join(', ')}${validationErrors.length > 3 ? '...' : ''}` 
            : `Algunos registros tuvieron errores: ${validationErrors.slice(0, 3).join(', ')}${validationErrors.length > 3 ? '...' : ''}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: language === 'en' ? 'Success' : 'Éxito',
          description: language === 'en' ? 'Data imported successfully' : 'Datos importados exitosamente'
        });
      }
      
      onDataImported();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Error",
        description: language === 'en' ? 'Failed to import data' : 'Error al importar datos',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <CardTitle>
            {language === 'en' ? 'Excel Import/Export' : 'Importar/Exportar Excel'}
          </CardTitle>
        </div>
        <CardDescription>
          {language === 'en' 
            ? 'Import or export your financial data to Excel' 
            : 'Importa o exporta tus datos financieros a Excel'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={importFromExcel}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          variant="outline"
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          {isProcessing 
            ? (language === 'en' ? 'Importing...' : 'Importando...') 
            : (language === 'en' ? 'Import from Excel' : 'Importar desde Excel')}
        </Button>
        <Button
          onClick={exportToExcel}
          disabled={isProcessing}
          className="w-full"
        >
          <Download className="mr-2 h-4 w-4" />
          {isProcessing 
            ? (language === 'en' ? 'Exporting...' : 'Exportando...') 
            : (language === 'en' ? 'Export to Excel' : 'Exportar a Excel')}
        </Button>
      </CardContent>
    </Card>
  );
};