import React, { useState } from 'react';
import './SymptomChatbot.css';

const symptomQuestions = [
  { key: 'fever', question: 'Do you have a fever?' },
  { key: 'cough', question: 'Are you experiencing a cough?' },
  { key: 'breath', question: 'Do you have difficulty breathing?' },
  { key: 'pain', question: 'Are you feeling any pain?' },
  { key: 'vomit', question: 'Are you vomiting or feeling nauseous' },
 
];

function getAdvice(answers) {
  if (answers.breath === 'yes') {
    return 'You should seek immediate medical attention for difficulty breathing.';
  }
  if (answers.fever === 'yes' && answers.cough === 'yes') {
    return 'Monitor your symptoms. If you feel worse or have trouble breathing, contact a doctor.';
  }
  if (answers.pain === 'yes' && answers.vomit === 'yes') {
    return 'Stay hydrated and rest. If symptoms persist, consult a healthcare provider.';
  }
  return 'Your symptoms do not indicate an emergency. If you feel unwell, please consult a doctor.';
}

export default function SymptomChatbot() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showAdvice, setShowAdvice] = useState(false);

  const handleAnswer = (answer) => {
    const key = symptomQuestions[step].key;
    setAnswers((prev) => ({ ...prev, [key]: answer }));
    if (step < symptomQuestions.length - 1) {
      setStep(step + 1);
    } else {
      setShowAdvice(true);
    }
  };

  const restart = () => {
    setStep(0);
    setAnswers({});
    setShowAdvice(false);
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">AI Health Assistant</div>
      <div className="chatbot-body">
        {!showAdvice ? (
          <>
            <div className="chatbot-question">{symptomQuestions[step].question}</div>
            <div className="chatbot-actions">
              <button onClick={() => handleAnswer('yes')}>Yes</button>
              <button onClick={() => handleAnswer('no')}>No</button>
            </div>
          </>
        ) : (
          <>
            <div className="chatbot-advice">{getAdvice(answers)}</div>
            <button className="chatbot-restart" onClick={restart}>Restart</button>
          </>
        )}
      </div>
    </div>
  );
}
