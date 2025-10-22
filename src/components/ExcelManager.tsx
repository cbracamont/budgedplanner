import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Upload, Download } from "lucide-react";
import { Language } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

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
          Nombre: i.name,
          Monto: i.amount,
          'Día de Pago': i.payment_day
        })));
        XLSX.utils.book_append_sheet(wb, ws1, "Ingresos");
      }

      if (debts.data) {
        const ws2 = XLSX.utils.json_to_sheet(debts.data.map(d => ({
          Nombre: d.name,
          Banco: d.bank,
          Balance: d.balance,
          'APR %': d.apr,
          'Pago Mínimo': d.minimum_payment,
          'Día de Pago': d.payment_day
        })));
        XLSX.utils.book_append_sheet(wb, ws2, "Deudas");
      }

      if (fixedExp.data) {
        const ws3 = XLSX.utils.json_to_sheet(fixedExp.data.map(e => ({
          Nombre: e.name,
          Monto: e.amount,
          Frecuencia: e.frequency_type,
          'Día de Pago': e.payment_day
        })));
        XLSX.utils.book_append_sheet(wb, ws3, "Gastos Fijos");
      }

      if (variableExp.data) {
        const ws4 = XLSX.utils.json_to_sheet(variableExp.data.map(e => ({
          Nombre: e.name,
          Monto: e.amount
        })));
        XLSX.utils.book_append_sheet(wb, ws4, "Gastos Variables");
      }

      if (savings.data) {
        const ws5 = XLSX.utils.json_to_sheet([{
          'Meta Mensual': savings.data[0]?.monthly_goal || 0,
          'Total Acumulado': savings.data[0]?.total_accumulated || 0
        }]);
        XLSX.utils.book_append_sheet(wb, ws5, "Ahorros");
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

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);

      // Process each sheet
      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(ws);

        if (sheetName === 'Ingresos' && jsonData.length > 0) {
          const incomeData = jsonData.map((row: any) => ({
            user_id: user.id,
            name: row.Nombre || 'Sin nombre',
            amount: Number(row.Monto) || 0,
            payment_day: Number(row['Día de Pago']) || 1
          }));
          await supabase.from('income_sources').insert(incomeData);
        }

        if (sheetName === 'Deudas' && jsonData.length > 0) {
          const debtsData = jsonData.map((row: any) => ({
            user_id: user.id,
            name: row.Nombre || 'Sin nombre',
            bank: row.Banco || null,
            balance: Number(row.Balance) || 0,
            apr: Number(row['APR %']) || 0,
            minimum_payment: Number(row['Pago Mínimo']) || 0,
            payment_day: Number(row['Día de Pago']) || 1
          }));
          await supabase.from('debts').insert(debtsData);
        }

        if (sheetName === 'Gastos Fijos' && jsonData.length > 0) {
          const fixedData = jsonData.map((row: any) => ({
            user_id: user.id,
            name: row.Nombre || 'Sin nombre',
            amount: Number(row.Monto) || 0,
            frequency_type: row.Frecuencia || 'monthly',
            payment_day: Number(row['Día de Pago']) || 1
          }));
          await supabase.from('fixed_expenses').insert(fixedData);
        }

        if (sheetName === 'Gastos Variables' && jsonData.length > 0) {
          const variableData = jsonData.map((row: any) => ({
            user_id: user.id,
            name: row.Nombre || 'Sin nombre',
            amount: Number(row.Monto) || 0
          }));
          await supabase.from('variable_expenses').insert(variableData);
        }
      }

      toast({
        title: language === 'en' ? 'Success' : 'Éxito',
        description: language === 'en' ? 'Data imported successfully' : 'Datos importados exitosamente'
      });
      
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