import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Info } from "lucide-react";
import { Language } from "@/lib/i18n";

interface DisclaimerBannerProps {
  language: Language;
}

export const DisclaimerBanner = ({ language }: DisclaimerBannerProps) => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem("disclaimer-accepted");
    if (!hasAccepted) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("disclaimer-accepted", "true");
    setShowBanner(false);
  };

  const disclaimerContent = {
    en: {
      title: "Important Legal Disclaimer",
      banner: "This tool does not provide financial advice. Please read our full disclaimer.",
      fullDisclaimer: `**IMPORTANT LEGAL NOTICE - PLEASE READ CAREFULLY**

This application ("Family Budget UK") is provided for informational and educational purposes only. By using this application, you acknowledge and agree to the following:

**1. NOT FINANCIAL ADVICE**
This tool does not provide financial, investment, tax, or legal advice. The information, calculations, recommendations, and AI-generated content provided by this application are for general informational purposes only and should not be construed as professional financial advice.

**2. NO REGULATED FINANCIAL SERVICE**
This application is not regulated by the Financial Conduct Authority (FCA) or any other regulatory body in the United Kingdom or elsewhere. We are not authorized to provide regulated financial advice or services.

**3. USER RESPONSIBILITY**
You are solely responsible for your financial decisions. Before making any financial decisions, you should:
- Consult with a qualified and FCA-regulated financial advisor
- Conduct your own research and due diligence
- Consider your individual circumstances, risk tolerance, and financial goals

**4. NO GUARANTEE OF ACCURACY**
While we strive for accuracy, we make no representations or warranties regarding the accuracy, completeness, or reliability of:
- Calculations and projections
- AI-generated recommendations
- Budget suggestions
- Debt management strategies
- Savings projections

**5. AI LIMITATIONS**
The AI advisor feature uses automated algorithms and may:
- Provide incomplete or inaccurate information
- Not consider all relevant factors in your situation
- Generate responses that are not suitable for your circumstances
- Make errors in calculations or recommendations

**6. NO LIABILITY**
To the fullest extent permitted by law, we disclaim all liability for any losses, damages, or adverse consequences arising from:
- Your use of this application
- Reliance on any information or recommendations provided
- Financial decisions made based on this tool
- Any errors, omissions, or technical issues

**7. DATA SECURITY**
While we implement security measures, you use this application at your own risk. We are not liable for any data breaches or unauthorized access to your information.

**8. THIRD-PARTY SERVICES**
This application uses third-party services (including AI models). We are not responsible for the performance, availability, or content provided by third parties.

**9. UK REGULATIONS**
This disclaimer is governed by the laws of England and Wales. If you reside outside the UK, you should ensure compliance with your local financial regulations.

**10. CHANGES TO SERVICE**
We reserve the right to modify, suspend, or discontinue this service at any time without notice.

**SEEK PROFESSIONAL ADVICE**
For personalized financial advice, please consult with an FCA-authorized financial advisor. You can find regulated advisors at: https://register.fca.org.uk/

By clicking "I Understand and Accept", you confirm that you have read, understood, and agree to this disclaimer.`,
      accept: "I Understand and Accept",
      viewFull: "View Full Disclaimer",
      close: "Close"
    },
    es: {
      title: "Aviso Legal Importante",
      banner: "Esta herramienta no proporciona asesoramiento financiero. Por favor lee nuestro aviso legal completo.",
      fullDisclaimer: `**AVISO LEGAL IMPORTANTE - POR FAVOR LEA DETENIDAMENTE**

Esta aplicación ("Family Budget UK") se proporciona únicamente con fines informativos y educativos. Al utilizar esta aplicación, usted reconoce y acepta lo siguiente:

**1. NO ES ASESORAMIENTO FINANCIERO**
Esta herramienta no proporciona asesoramiento financiero, de inversión, fiscal o legal. La información, cálculos, recomendaciones y contenido generado por IA proporcionados por esta aplicación son solo para fines informativos generales y no deben interpretarse como asesoramiento financiero profesional.

**2. NO ES UN SERVICIO FINANCIERO REGULADO**
Esta aplicación no está regulada por la Financial Conduct Authority (FCA) ni ningún otro organismo regulador en el Reino Unido o en otro lugar. No estamos autorizados para proporcionar asesoramiento o servicios financieros regulados.

**3. RESPONSABILIDAD DEL USUARIO**
Usted es el único responsable de sus decisiones financieras. Antes de tomar cualquier decisión financiera, debe:
- Consultar con un asesor financiero cualificado y regulado por la FCA
- Realizar su propia investigación y debida diligencia
- Considerar sus circunstancias individuales, tolerancia al riesgo y objetivos financieros

**4. NO HAY GARANTÍA DE EXACTITUD**
Si bien nos esforzamos por la precisión, no hacemos representaciones ni garantías con respecto a la exactitud, integridad o confiabilidad de:
- Cálculos y proyecciones
- Recomendaciones generadas por IA
- Sugerencias de presupuesto
- Estrategias de gestión de deudas
- Proyecciones de ahorro

**5. LIMITACIONES DE LA IA**
La función de asesor de IA utiliza algoritmos automatizados y puede:
- Proporcionar información incompleta o inexacta
- No considerar todos los factores relevantes en su situación
- Generar respuestas que no son adecuadas para sus circunstancias
- Cometer errores en cálculos o recomendaciones

**6. SIN RESPONSABILIDAD**
En la medida máxima permitida por la ley, rechazamos toda responsabilidad por cualquier pérdida, daño o consecuencia adversa que surja de:
- Su uso de esta aplicación
- Dependencia de cualquier información o recomendación proporcionada
- Decisiones financieras tomadas en base a esta herramienta
- Cualquier error, omisión o problema técnico

**7. SEGURIDAD DE DATOS**
Si bien implementamos medidas de seguridad, usted utiliza esta aplicación bajo su propio riesgo. No somos responsables de ninguna violación de datos o acceso no autorizado a su información.

**8. SERVICIOS DE TERCEROS**
Esta aplicación utiliza servicios de terceros (incluidos modelos de IA). No somos responsables del rendimiento, disponibilidad o contenido proporcionado por terceros.

**9. REGULACIONES DEL REINO UNIDO**
Este aviso legal se rige por las leyes de Inglaterra y Gales. Si reside fuera del Reino Unido, debe asegurarse del cumplimiento de sus regulaciones financieras locales.

**10. CAMBIOS EN EL SERVICIO**
Nos reservamos el derecho de modificar, suspender o descontinuar este servicio en cualquier momento sin previo aviso.

**BUSQUE ASESORAMIENTO PROFESIONAL**
Para asesoramiento financiero personalizado, consulte con un asesor financiero autorizado por la FCA. Puede encontrar asesores regulados en: https://register.fca.org.uk/

Al hacer clic en "Entiendo y Acepto", confirma que ha leído, comprendido y acepta este aviso legal.`,
      accept: "Entiendo y Acepto",
      viewFull: "Ver Aviso Legal Completo",
      close: "Cerrar"
    }
  };

  const content = disclaimerContent[language];

  if (!showBanner) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Info className="h-4 w-4 mr-2" />
              {content.viewFull}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                {content.title}
              </DialogTitle>
              <DialogDescription className="text-left whitespace-pre-line pt-4">
                {content.fullDisclaimer}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button variant="outline">{content.close}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="font-semibold mb-2">{content.title}</p>
            <p className="text-sm">{content.banner}</p>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  {content.viewFull}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    {content.title}
                  </DialogTitle>
                  <DialogDescription className="text-left whitespace-pre-line pt-4">
                    {content.fullDisclaimer}
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
            <Button onClick={handleAccept} size="sm">
              {content.accept}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};
