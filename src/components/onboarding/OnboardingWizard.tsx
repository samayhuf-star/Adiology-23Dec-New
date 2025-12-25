import React, { useState } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  X, 
  CheckCircle, 
  User, 
  Settings, 
  MapPin, 
  Sparkles,
  Rocket,
  Skip,
  Play
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { WelcomeStep } from './steps/WelcomeStep';
import { ProfileStep } from './steps/ProfileStep';
import { PreferencesStep } from './steps/PreferencesStep';
import { TourStep } from './steps/TourStep';
import { FirstCampaignStep } from './steps/FirstCampaignStep';

export const OnboardingWizard: React.FC = () => {
  const { state, nextStep, prevStep, skipOnboarding, completeOnboarding } = useOnboarding();
  const [isAnimating, setIsAnimating] = useState(false);

  const currentStepData = state.steps[state.currentStep];
  const progress = ((state.currentStep + 1) / state.steps.length) * 100;

  const handleNext = () => {
    setIsAnimating(true);
    setTimeout(() => {
      nextStep();
      setIsAnimating(false);
    }, 150);
  };

  const handlePrev = () => {
    setIsAnimating(true);
    setTimeout(() => {
      prevStep();
      setIsAnimating(false);
    }, 150);
  };

  const handleComplete = () => {
    completeOnboarding();
  };

  const getStepIcon = (stepId: string) => {
    switch (stepId) {
      case 'welcome':
        return <Rocket className="w-6 h-6" />;
      case 'profile':
        return <User className="w-6 h-6" />;
      case 'preferences':
        return <Settings className="w-6 h-6" />;
      case 'tour':
        return <MapPin className="w-6 h-6" />;
      case 'first-campaign':
        return <Sparkles className="w-6 h-6" />;
      default:
        return <CheckCircle className="w-6 h-6" />;
    }
  };

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case 'welcome':
        return <WelcomeStep />;
      case 'profile':
        return <ProfileStep />;
      case 'preferences':
        return <PreferencesStep />;
      case 'tour':
        return <TourStep />;
      case 'first-campaign':
        return <FirstCampaignStep />;
      default:
        return <div>Step not found</div>;
    }
  };

  const isLastStep = state.currentStep === state.steps.length - 1;
  const isFirstStep = state.currentStep === 0;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 z-50 overflow-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome to Adiology</h1>
            </div>
            <p className="text-gray-600 mb-6">Let's get you set up in just a few steps</p>
            
            {/* Progress Bar */}
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Step {state.currentStep + 1} of {state.steps.length}</span>
                <span className="text-sm text-gray-500">{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-4">
              {state.steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                      ${index === state.currentStep
                        ? 'bg-indigo-600 text-white shadow-lg scale-110'
                        : step.completed
                        ? 'bg-green-500 text-white'
                        : index < state.currentStep
                        ? 'bg-indigo-200 text-indigo-600'
                        : 'bg-gray-200 text-gray-400'
                      }
                    `}
                  >
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      getStepIcon(step.id)
                    )}
                  </div>
                  {index < state.steps.length - 1 && (
                    <div
                      className={`
                        w-12 h-0.5 mx-2 transition-colors duration-300
                        ${index < state.currentStep ? 'bg-indigo-600' : 'bg-gray-200'}
                      `}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  {getStepIcon(currentStepData.id)}
                </div>
                <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
              </div>
              <p className="text-gray-600">{currentStepData.description}</p>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div
                className={`
                  transition-all duration-300 ease-in-out
                  ${isAnimating ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'}
                `}
              >
                {renderStepContent()}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center gap-3">
              {!isFirstStep && (
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </Button>
              )}
              
              <Button
                variant="ghost"
                onClick={skipOnboarding}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4 mr-2" />
                Skip Setup
              </Button>
            </div>

            <div className="flex items-center gap-3">
              {!currentStepData.required && !isLastStep && (
                <Button
                  variant="outline"
                  onClick={handleNext}
                  className="flex items-center gap-2"
                >
                  <Skip className="w-4 h-4" />
                  Skip This Step
                </Button>
              )}
              
              <Button
                onClick={isLastStep ? handleComplete : handleNext}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {isLastStep ? (
                  <>
                    <Play className="w-4 h-4" />
                    Get Started
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Help Text */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Need help? Contact our support team at{' '}
              <a href="mailto:support@adiology.io" className="text-indigo-600 hover:underline">
                support@adiology.io
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};