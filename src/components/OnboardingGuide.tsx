import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  CreditCard, 
  Home, 
  ShoppingCart, 
  PiggyBank,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import { Language, getTranslation } from "@/lib/i18n";

interface OnboardingGuideProps {
  language: Language;
  onComplete: () => void;
}

const onboardingSteps = [
  {
    icon: DollarSign,
    titleKey: "onboardingStep1Title",
    descriptionKey: "onboardingStep1Description",
    color: "text-green-500"
  },
  {
    icon: CreditCard,
    titleKey: "onboardingStep2Title",
    descriptionKey: "onboardingStep2Description",
    color: "text-red-500"
  },
  {
    icon: Home,
    titleKey: "onboardingStep3Title",
    descriptionKey: "onboardingStep3Description",
    color: "text-blue-500"
  },
  {
    icon: ShoppingCart,
    titleKey: "onboardingStep4Title",
    descriptionKey: "onboardingStep4Description",
    color: "text-orange-500"
  },
  {
    icon: PiggyBank,
    titleKey: "onboardingStep5Title",
    descriptionKey: "onboardingStep5Description",
    color: "text-purple-500"
  }
];

export const OnboardingGuide = ({ language, onComplete }: OnboardingGuideProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeenOnboarding) {
      setIsOpen(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setIsOpen(false);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setIsOpen(false);
    onComplete();
  };

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;
  const currentStepData = onboardingSteps[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">
              {getTranslation(language, "welcomeToApp")}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            {getTranslation(language, "onboardingGetStarted")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Progress value={progress} className="h-2" />

          <Card className="border-2">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`p-4 rounded-full bg-background/50 ${currentStepData.color}`}>
                  <StepIcon className="h-12 w-12" />
                </div>
                
                <h3 className="text-xl font-semibold">
                  {getTranslation(language, currentStepData.titleKey)}
                </h3>
                
                <p className="text-muted-foreground max-w-md">
                  {getTranslation(language, currentStepData.descriptionKey)}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {getTranslation(language, "onboardingPrevious")}
            </Button>

            <div className="flex gap-2">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index === currentStep
                      ? "bg-primary w-8"
                      : index < currentStep
                      ? "bg-primary/50"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>

            <Button onClick={handleNext}>
              {currentStep === onboardingSteps.length - 1
                ? getTranslation(language, "onboardingFinish")
                : getTranslation(language, "onboardingNext")}
              {currentStep < onboardingSteps.length - 1 && (
                <ChevronRight className="h-4 w-4 ml-2" />
              )}
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              {getTranslation(language, "onboardingSkip")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
