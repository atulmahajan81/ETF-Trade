import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const UserSetupScreen = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    tradingExperience: '',
    investmentAmount: '',
    riskTolerance: '',
    investmentGoals: [],
    preferredSectors: [],
    hasETFTradingExperience: false,
  });

  const steps = [
    {
      id: 0,
      title: 'Trading Experience',
      subtitle: 'Tell us about your trading experience',
    },
    {
      id: 1,
      title: 'Investment Amount',
      subtitle: 'How much do you plan to invest?',
    },
    {
      id: 2,
      title: 'Risk Tolerance',
      subtitle: 'What is your risk tolerance level?',
    },
    {
      id: 3,
      title: 'Investment Goals',
      subtitle: 'What are your investment goals?',
    },
    {
      id: 4,
      title: 'ETF Experience',
      subtitle: 'Do you have existing ETF holdings?',
    },
  ];

  const tradingExperienceOptions = [
    { id: 'beginner', label: 'Beginner', description: 'New to trading' },
    { id: 'intermediate', label: 'Intermediate', description: 'Some trading experience' },
    { id: 'advanced', label: 'Advanced', description: 'Experienced trader' },
  ];

  const investmentAmountOptions = [
    { id: 'small', label: '₹10K - ₹50K', description: 'Small investment' },
    { id: 'medium', label: '₹50K - ₹2L', description: 'Medium investment' },
    { id: 'large', label: '₹2L+', description: 'Large investment' },
  ];

  const riskToleranceOptions = [
    { id: 'conservative', label: 'Conservative', description: 'Low risk, stable returns' },
    { id: 'moderate', label: 'Moderate', description: 'Balanced risk and returns' },
    { id: 'aggressive', label: 'Aggressive', description: 'High risk, high returns' },
  ];

  const investmentGoalsOptions = [
    { id: 'wealth', label: 'Wealth Building', description: 'Long-term wealth accumulation' },
    { id: 'income', label: 'Regular Income', description: 'Generate regular income' },
    { id: 'retirement', label: 'Retirement Planning', description: 'Plan for retirement' },
    { id: 'education', label: 'Education Funding', description: 'Fund education expenses' },
    { id: 'emergency', label: 'Emergency Fund', description: 'Build emergency savings' },
  ];

  const handleOptionSelect = (field, optionId) => {
    if (field === 'investmentGoals') {
      const currentGoals = formData.investmentGoals;
      const updatedGoals = currentGoals.includes(optionId)
        ? currentGoals.filter(id => id !== optionId)
        : [...currentGoals, optionId];
      
      setFormData(prev => ({
        ...prev,
        [field]: updatedGoals,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: optionId,
      }));
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Validate required fields
    if (!formData.tradingExperience || !formData.investmentAmount || !formData.riskTolerance) {
      Alert.alert('Incomplete Setup', 'Please complete all required fields before continuing.');
      return;
    }

    if (formData.investmentGoals.length === 0) {
      Alert.alert('Investment Goals', 'Please select at least one investment goal.');
      return;
    }

    // Call the completion callback
    if (onComplete) {
      onComplete(formData);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.optionsContainer}>
            {tradingExperienceOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  formData.tradingExperience === option.id && styles.optionCardSelected
                ]}
                onPress={() => handleOptionSelect('tradingExperience', option.id)}
              >
                <Text style={[
                  styles.optionLabel,
                  formData.tradingExperience === option.id && styles.optionLabelSelected
                ]}>
                  {option.label}
                </Text>
                <Text style={[
                  styles.optionDescription,
                  formData.tradingExperience === option.id && styles.optionDescriptionSelected
                ]}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 1:
        return (
          <View style={styles.optionsContainer}>
            {investmentAmountOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  formData.investmentAmount === option.id && styles.optionCardSelected
                ]}
                onPress={() => handleOptionSelect('investmentAmount', option.id)}
              >
                <Text style={[
                  styles.optionLabel,
                  formData.investmentAmount === option.id && styles.optionLabelSelected
                ]}>
                  {option.label}
                </Text>
                <Text style={[
                  styles.optionDescription,
                  formData.investmentAmount === option.id && styles.optionDescriptionSelected
                ]}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 2:
        return (
          <View style={styles.optionsContainer}>
            {riskToleranceOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  formData.riskTolerance === option.id && styles.optionCardSelected
                ]}
                onPress={() => handleOptionSelect('riskTolerance', option.id)}
              >
                <Text style={[
                  styles.optionLabel,
                  formData.riskTolerance === option.id && styles.optionLabelSelected
                ]}>
                  {option.label}
                </Text>
                <Text style={[
                  styles.optionDescription,
                  formData.riskTolerance === option.id && styles.optionDescriptionSelected
                ]}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 3:
        return (
          <View style={styles.optionsContainer}>
            <Text style={styles.multiSelectHint}>
              Select all that apply (you can select multiple goals)
            </Text>
            {investmentGoalsOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  formData.investmentGoals.includes(option.id) && styles.optionCardSelected
                ]}
                onPress={() => handleOptionSelect('investmentGoals', option.id)}
              >
                <Text style={[
                  styles.optionLabel,
                  formData.investmentGoals.includes(option.id) && styles.optionLabelSelected
                ]}>
                  {option.label}
                </Text>
                <Text style={[
                  styles.optionDescription,
                  formData.investmentGoals.includes(option.id) && styles.optionDescriptionSelected
                ]}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 4:
        return (
          <View style={styles.optionsContainer}>
            <Text style={styles.questionText}>
              Do you have existing ETF holdings that you'd like to import?
            </Text>
            <TouchableOpacity
              style={[
                styles.optionCard,
                formData.hasETFTradingExperience && styles.optionCardSelected
              ]}
              onPress={() => setFormData(prev => ({ ...prev, hasETFTradingExperience: true }))}
            >
              <Text style={[
                styles.optionLabel,
                formData.hasETFTradingExperience && styles.optionLabelSelected
              ]}>
                Yes, I have ETF holdings
              </Text>
              <Text style={[
                styles.optionDescription,
                formData.hasETFTradingExperience && styles.optionDescriptionSelected
              ]}>
                I want to import my existing portfolio
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionCard,
                !formData.hasETFTradingExperience && styles.optionCardSelected
              ]}
              onPress={() => setFormData(prev => ({ ...prev, hasETFTradingExperience: false }))}
            >
              <Text style={[
                styles.optionLabel,
                !formData.hasETFTradingExperience && styles.optionLabelSelected
              ]}>
                No, I'm starting fresh
              </Text>
              <Text style={[
                styles.optionDescription,
                !formData.hasETFTradingExperience && styles.optionDescriptionSelected
              ]}>
                I want to start with a new portfolio
              </Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d', '#1a1a1a']}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${((currentStep + 1) / steps.length) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              Step {currentStep + 1} of {steps.length}
            </Text>
          </View>

          {/* Step Header */}
          <View style={styles.stepHeader}>
            <Text style={styles.stepTitle}>{currentStepData.title}</Text>
            <Text style={styles.stepSubtitle}>{currentStepData.subtitle}</Text>
          </View>

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation Buttons */}
          <View style={styles.navigationContainer}>
            {currentStep > 0 && (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.nextButton} 
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>
                {isLastStep ? 'Complete Setup' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  progressContainer: {
    padding: 20,
    paddingTop: 40,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  stepHeader: {
    padding: 20,
    paddingTop: 0,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  optionsContainer: {
    padding: 20,
  },
  multiSelectHint: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  questionText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: '#3b82f6',
  },
  optionDescription: {
    fontSize: 14,
    color: '#9ca3af',
  },
  optionDescriptionSelected: {
    color: '#6b7280',
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default UserSetupScreen;
