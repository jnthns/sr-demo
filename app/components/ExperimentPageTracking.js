'use client'

import { useEffect } from "react";
import { logEvent, trackExposure } from "../../lib/amplitude";

export default function ExperimentPageTracking() {
  useEffect(() => {
    const handleButtonClick = (event) => {
      const button = event.target;
      const buttonText = button.textContent.trim();
      const buttonType = button.type || 'button';
      const buttonId = button.id || '';
      const isFormSubmit = buttonType === 'submit';

      logEvent("Button Clicked", {
        button_text: buttonText,
        button_id: buttonId,
        button_type: buttonType,
        is_submit: isFormSubmit,
        button_class: button.className,
        form_id: button.form?.id || ''
      });

      if (buttonId === 'track-exposure-btn') {
        trackExposure();
      }
    };

    const handleInputFocus = (event) => {
      logEvent("Form Field Focused", { 
        field: event.target.name,
        field_type: event.target.type,
        label: event.target.labels?.[0]?.textContent?.trim()
      });
    };

    const handleInputBlur = (event) => {
      logEvent("Form Input Entered", { 
        field: event.target.name,
        field_type: event.target.type,
        value: event.target.type === 'password' ? '[REDACTED]' : event.target.value,
        label: event.target.labels?.[0]?.textContent?.trim()
      });
    };
    
    const handleFormSubmit = (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const formFields = {};
      formData.forEach((value, key) => {
        formFields[key] = key.includes('password') || key.includes('credit') ? '[REDACTED]' : value;
      });
      
      logEvent("Form Submitted", {
        form_id: event.target.id || 'main-form',
        fields: formFields
      });
    };

    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      button.addEventListener('click', handleButtonClick);
    });

    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', handleInputFocus);
      input.addEventListener('blur', handleInputBlur);
    });

    const form = document.querySelector('form');
    if (form) {
      form.addEventListener('submit', handleFormSubmit);
    }

    return () => {
      buttons.forEach(button => {
        button.removeEventListener('click', handleButtonClick);
      });
      inputs.forEach(input => {
        input.removeEventListener('focus', handleInputFocus);
        input.removeEventListener('blur', handleInputBlur);
      });

      const form = document.querySelector('form');
      if (form) {
        form.removeEventListener('submit', handleFormSubmit);
      }
    };
  }, []);

  return null;
}
