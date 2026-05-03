package com.emotiontranslate.backend.dto;

import lombok.Data;

@Data
public class AnalyzeRequest {
    private String text;
    // Human-readable target language (e.g. "English", "Arabic")
    private String targetLanguage = "English";
    // DeepL language code (e.g. "EN-US", "AR", "FR", "DE", "ES")
    private String targetLanguageCode = "EN-US";
}
