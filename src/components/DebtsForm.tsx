import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Car, Banknote } from "lucide-react";
import { getTranslation, Language, ukBanks } from "@/lib/i18n";

interface DebtsFormProps {
  onDebtsChange: (
    personalLoan: number, 
    carFinance: number, 
    creditCards: number,
    debtsDetails?: {
      personalLoan: { bank: string; apr: number };
      carFinance: { bank: string; apr: number };
      creditCards: { bank: string; apr: number };
    }
  ) => void;
  language: Language;
}

export const DebtsForm = ({ onDebtsChange, language }: DebtsFormProps) => {
  const t = (key: string) => getTranslation(language, key);
  
  const [personalLoan, setPersonalLoan] = useState<string>("");
  const [personalLoanBank, setPersonalLoanBank] = useState<string>("");
  const [personalLoanAPR, setPersonalLoanAPR] = useState<string>("");
  
  const [carFinance, setCarFinance] = useState<string>("");
  const [carFinanceBank, setCarFinanceBank] = useState<string>("");
  const [carFinanceAPR, setCarFinanceAPR] = useState<string>("");
  
  const [creditCards, setCreditCards] = useState<string>("");
  const [creditCardsBank, setCreditCardsBank] = useState<string>("");
  const [creditCardsAPR, setCreditCardsAPR] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDebtsChange(
      parseFloat(personalLoan) || 0,
      parseFloat(carFinance) || 0,
      parseFloat(creditCards) || 0,
      {
        personalLoan: {
          bank: personalLoanBank,
          apr: parseFloat(personalLoanAPR) || 0
        },
        carFinance: {
          bank: carFinanceBank,
          apr: parseFloat(carFinanceAPR) || 0
        },
        creditCards: {
          bank: creditCardsBank,
          apr: parseFloat(creditCardsAPR) || 0
        }
      }
    );
  };

  return (
    <Card className="shadow-medium border-debt/20">
      <CardHeader className="bg-debt/10 border-b border-debt/20">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-debt" />
          <CardTitle>{t('debts')}</CardTitle>
        </div>
        <CardDescription>
          {language === 'en' ? 'Enter your monthly debt payments and details' : 'Ingresa tus pagos mensuales de deudas y detalles'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Loan */}
          <div className="space-y-3 p-4 bg-secondary/50 rounded-lg">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <Banknote className="h-5 w-5 text-debt" />
              {t('personalLoan')}
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="personalLoan" className="text-sm">{t('minimumPayment')}</Label>
                <Input
                  id="personalLoan"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={personalLoan}
                  onChange={(e) => setPersonalLoan(e.target.value)}
                  className="text-lg font-medium"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="personalLoanBank" className="text-sm">{t('bank')}</Label>
                <Select value={personalLoanBank} onValueChange={setPersonalLoanBank}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectBank')} />
                  </SelectTrigger>
                  <SelectContent>
                    {ukBanks.map(bank => (
                      <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="personalLoanAPR" className="text-sm">{t('interestRate')}</Label>
                <Input
                  id="personalLoanAPR"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={personalLoanAPR}
                  onChange={(e) => setPersonalLoanAPR(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Car Finance */}
          <div className="space-y-3 p-4 bg-secondary/50 rounded-lg">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <Car className="h-5 w-5 text-debt" />
              {t('carFinance')}
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="carFinance" className="text-sm">{t('minimumPayment')}</Label>
                <Input
                  id="carFinance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={carFinance}
                  onChange={(e) => setCarFinance(e.target.value)}
                  className="text-lg font-medium"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="carFinanceBank" className="text-sm">{t('bank')}</Label>
                <Select value={carFinanceBank} onValueChange={setCarFinanceBank}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectBank')} />
                  </SelectTrigger>
                  <SelectContent>
                    {ukBanks.map(bank => (
                      <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="carFinanceAPR" className="text-sm">{t('interestRate')}</Label>
                <Input
                  id="carFinanceAPR"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={carFinanceAPR}
                  onChange={(e) => setCarFinanceAPR(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Credit Cards */}
          <div className="space-y-3 p-4 bg-secondary/50 rounded-lg">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <CreditCard className="h-5 w-5 text-debt" />
              {t('creditCards')}
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="creditCards" className="text-sm">{t('minimumPayment')}</Label>
                <Input
                  id="creditCards"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={creditCards}
                  onChange={(e) => setCreditCards(e.target.value)}
                  className="text-lg font-medium"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="creditCardsBank" className="text-sm">{t('bank')}</Label>
                <Select value={creditCardsBank} onValueChange={setCreditCardsBank}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectBank')} />
                  </SelectTrigger>
                  <SelectContent>
                    {ukBanks.map(bank => (
                      <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="creditCardsAPR" className="text-sm">{t('interestRate')}</Label>
                <Input
                  id="creditCardsAPR"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={creditCardsAPR}
                  onChange={(e) => setCreditCardsAPR(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full">
            {t('updateDebts')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
