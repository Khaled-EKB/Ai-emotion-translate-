package com.emotiontranslate.backend.services;

import com.deepl.api.Translator;
import com.deepl.api.TextResult;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Service
@RequiredArgsConstructor
public class TranslationService {

    @Value("${deepl.api.key}")
    private String apiKey;

    private Translator translator;

    @PostConstruct
    public void init() {
        if (apiKey != null && !apiKey.equals("dummy_key")) {
            translator = new Translator(apiKey);
        }
    }

    public String translateText(String text, String targetLanguageCode) {
        if (translator == null) {
            throw new RuntimeException("DeepL API Key is not configured.");
        }

        try {
            // targetLanguageCode should be a valid DeepL code like "EN-US", "DE", "FR", "ES"
            TextResult result = translator.translateText(text, null, targetLanguageCode);
            return result.getText();
        } catch (Exception e) {
            throw new RuntimeException("Failed to translate text with DeepL: " + e.getMessage());
        }
    }
}
