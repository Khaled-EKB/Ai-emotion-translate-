package com.emotiontranslate.backend.services;

import com.github.pemistahl.lingua.api.Language;
import com.github.pemistahl.lingua.api.LanguageDetector;
import com.github.pemistahl.lingua.api.LanguageDetectorBuilder;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Service
public class LanguageDetectionService {

    private LanguageDetector detector;

    @PostConstruct
    public void init() {
        // Build the detector to support all languages available in lingua
        detector = LanguageDetectorBuilder.fromAllLanguages().build();
    }

    public String detectLanguage(String text) {
        Language detectedLanguage = detector.detectLanguageOf(text);
        return detectedLanguage.name();
    }
}
