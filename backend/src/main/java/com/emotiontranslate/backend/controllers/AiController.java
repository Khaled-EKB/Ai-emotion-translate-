package com.emotiontranslate.backend.controllers;

import com.emotiontranslate.backend.dto.AnalyzeRequest;
import com.emotiontranslate.backend.dto.RewriteRequest;
import com.emotiontranslate.backend.models.TranslationHistory;
import com.emotiontranslate.backend.models.User;
import com.emotiontranslate.backend.repositories.HistoryRepository;
import com.emotiontranslate.backend.repositories.UserRepository;
import com.emotiontranslate.backend.services.AnthropicService;
import com.emotiontranslate.backend.services.LanguageDetectionService;
import com.emotiontranslate.backend.services.TranslationService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/")
@RequiredArgsConstructor
@Tag(name = "AI Processing", description = "Emotion analysis, language detection and translation")
public class AiController {

    private final AnthropicService anthropicService;
    private final TranslationService translationService;
    private final LanguageDetectionService languageDetectionService;
    private final HistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private User getCurrentUser() {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    /**
     * POST /analyze
     * Pipeline: Lingua (detect language) → Anthropic (extract emotions) → DeepL (translate)
     */
    @PostMapping("/analyze")
    @Operation(summary = "Analyze text emotions and translate",
               description = "Detects language via Lingua, extracts emotions via Anthropic, then translates via DeepL")
    public ResponseEntity<Map<String, Object>> analyze(@RequestBody AnalyzeRequest request) throws JsonProcessingException {
        if (request.getText() == null || request.getText().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Text field is required"));
        }

        // ── Step 1: Language Detection (Lingua) ──────────────────────────────
        String detectedLanguage = languageDetectionService.detectLanguage(request.getText());

        // ── Step 2: Emotion Extraction (Anthropic Claude) ────────────────────
        String emotionsJsonStr = anthropicService.analyzeEmotions(request.getText());
        JsonNode emotionsNode;
        try {
            emotionsNode = objectMapper.readTree(emotionsJsonStr);
        } catch (JsonProcessingException e) {
            // Anthropic may return plain text instead of JSON; wrap it gracefully
            emotionsNode = objectMapper.readTree("[\"" + emotionsJsonStr.replace("\"", "'") + "\"]");
        }

        // ── Step 3: Translation (DeepL) ───────────────────────────────────────
        String targetCode = request.getTargetLanguageCode();
        if (targetCode == null || targetCode.isBlank()) targetCode = "EN-US";

        String translatedText = translationService.translateText(request.getText(), targetCode.toUpperCase());

        // ── Step 4: Persist to MySQL ──────────────────────────────────────────
        User currentUser = getCurrentUser();
        TranslationHistory history = new TranslationHistory();
        history.setUser(currentUser);
        history.setOriginalText(request.getText());
        history.setTranslatedText(translatedText);
        history.setEmotions(emotionsNode.toString());
        history.setDetectedLanguage(detectedLanguage);
        history.setTargetLanguage(request.getTargetLanguage());

        TranslationHistory saved = historyRepository.save(history);

        // ── Step 5: Build Response ────────────────────────────────────────────
        Map<String, Object> response = new HashMap<>();
        response.put("historyId", saved.getId());
        response.put("detectedLanguage", detectedLanguage);
        response.put("targetLanguage", request.getTargetLanguage());
        response.put("emotions", emotionsNode);
        response.put("originalText", request.getText());
        response.put("translatedText", translatedText);

        return ResponseEntity.ok(response);
    }

    /**
     * POST /rewrite
     * Pipeline: Anthropic (rewrite text with target emotion)
     */
    @PostMapping("/rewrite")
    @Operation(summary = "Rewrite text with a target emotion",
               description = "Uses Anthropic Claude to paraphrase the text to match the requested emotion")
    public ResponseEntity<Map<String, Object>> rewrite(@RequestBody RewriteRequest request) {
        if (request.getText() == null || request.getText().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Text field is required"));
        }
        if (request.getTargetEmotion() == null || request.getTargetEmotion().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "targetEmotion field is required"));
        }

        // ── Step 1: Rewrite (Anthropic Claude) ───────────────────────────────
        String rewrittenText = anthropicService.rewriteWithEmotion(request.getText(), request.getTargetEmotion());

        // ── Step 2: Persist to MySQL ──────────────────────────────────────────
        User currentUser = getCurrentUser();
        TranslationHistory history = new TranslationHistory();
        history.setUser(currentUser);
        history.setOriginalText(request.getText());
        history.setTranslatedText(rewrittenText);
        history.setEmotions("[]");
        history.setTargetEmotion(request.getTargetEmotion());

        TranslationHistory saved = historyRepository.save(history);

        // ── Step 3: Build Response ────────────────────────────────────────────
        Map<String, Object> response = new HashMap<>();
        response.put("historyId", saved.getId());
        response.put("originalText", request.getText());
        response.put("targetEmotion", request.getTargetEmotion());
        response.put("rewrittenText", rewrittenText);

        return ResponseEntity.ok(response);
    }
}
